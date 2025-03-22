import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

import * as s3 from "aws-cdk-lib/aws-s3";
import * as apigateway from "aws-cdk-lib/aws-apigatewayv2";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as dotenv from "dotenv";
import {
    NodejsFunction,
    NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import {
    HttpLambdaAuthorizer,
    HttpLambdaResponseType,
} from "aws-cdk-lib/aws-apigatewayv2-authorizers";

dotenv.config();

export class ImportServiceStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const bucket = s3.Bucket.fromBucketName(
            this,
            "ImportBucket",
            process.env.BUCKET_NAME as string
        );

        const catalogItemsQueue = sqs.Queue.fromQueueArn(
            this,
            process.env.QUEUE_ID as string,
            process.env.QUEUE_ARN as string
        );

        const api = new apigateway.HttpApi(this, "ImportHttpApi", {
            corsPreflight: {
                allowHeaders: ["Authorization"],
                allowOrigins: ["*"],
                allowMethods: [
                    apigateway.CorsHttpMethod.GET,
                    apigateway.CorsHttpMethod.OPTIONS,
                ],
            },
        });

        const sharedLambdaProps: NodejsFunctionProps = {
            environment: {
                BUCKET_NAME: bucket.bucketName,
                QUEUE_URL: catalogItemsQueue.queueUrl,
            },
            handler: "handler",
            runtime: lambda.Runtime.NODEJS_18_X,
        };

        const importFileParsePolicy = new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ["s3:CopyObject", "s3:DeleteObject"],
            resources: [`${bucket.bucketArn}/*`],
        });

        const importProductsFileFunction = new NodejsFunction(
            this,
            "ImportProductsFile",
            {
                entry: "handler/importProductsFile.js",
                functionName: "importProductsFileFunction",
                ...sharedLambdaProps,
            }
        );

        const importFileParserFunction = new NodejsFunction(
            this,
            "ImportFileParser",
            {
                entry: "handler/importFileParser.js",
                functionName: "importFileParserFunction",
                ...sharedLambdaProps,
            }
        );

        const basicAuthorizerLambda = lambda.Function.fromFunctionArn(
            this,
            "BasicAuthorizer",
            process.env.BASIC_AUTH_LAMBDA_ARN as string
        );

        const lambdaAuthorizer = new HttpLambdaAuthorizer(
            "BasicAuthorizer",
            basicAuthorizerLambda,
            {
                responseTypes: [HttpLambdaResponseType.IAM],
            }
        );

        importFileParserFunction.addToRolePolicy(importFileParsePolicy);

        bucket.grantReadWrite(importProductsFileFunction);
        bucket.grantReadWrite(importFileParserFunction);
        catalogItemsQueue.grantSendMessages(importFileParserFunction);

        bucket.addEventNotification(
            s3.EventType.OBJECT_CREATED,
            new cdk.aws_s3_notifications.LambdaDestination(
                importFileParserFunction
            ),
            { prefix: "uploaded/" }
        );

        const importProductsIntegration = new HttpLambdaIntegration(
            "ImportProductsIntegration",
            importProductsFileFunction
        );

        api.addRoutes({
            path: "/import",
            methods: [apigateway.HttpMethod.GET],
            integration: importProductsIntegration,
            authorizer: lambdaAuthorizer,
        });
    }
}
