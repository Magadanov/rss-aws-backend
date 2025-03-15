import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as sns from "aws-cdk-lib/aws-sns";
import * as subscriptions from "aws-cdk-lib/aws-sns-subscriptions";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";
import {
    NodejsFunction,
    NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import * as dotenv from "dotenv";

dotenv.config();

export class ProductServiceStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);
        const productsTable = dynamodb.Table.fromTableName(
            this,
            "productsTable",
            "products"
        );

        const stocksTable = dynamodb.Table.fromTableName(
            this,
            "stocksTable",
            "stocks"
        );

        const catalogItemsQueue = new sqs.Queue(this, "CatalogItemsQueue", {
            queueName: "catalogItemsQueue",
            visibilityTimeout: cdk.Duration.seconds(10),
        });

        const createProductTopic = new sns.Topic(this, "CreateProductTopic", {
            topicName: "createProductTopic",
            displayName: "product-creation-topic",
        });

        createProductTopic.addSubscription(
            new subscriptions.EmailSubscription(process.env.EMAIL as string)
        );

        const sharedLambdaProps: NodejsFunctionProps = {
            handler: "handler",
            environment: {
                TABLE_NAME_PRODUCTS: productsTable.tableName,
                TABLE_NAME_STOCKS: stocksTable.tableName,
                SNS_TOPIC_ARN: createProductTopic.topicArn,
            },
            runtime: lambda.Runtime.NODEJS_18_X,
        };

        const getProductsListFunction = new NodejsFunction(
            this,
            "ProductsListFunction",
            {
                functionName: "getProductsList",
                entry: "lambda/getProductsList.js",
                ...sharedLambdaProps,
            }
        );

        const getProductsByIdFunction = new NodejsFunction(
            this,
            "ProductsByIdFunction",
            {
                functionName: "getProductsById",
                entry: "lambda/getProductsById.js",
                ...sharedLambdaProps,
            }
        );

        const createProductFunction = new NodejsFunction(
            this,
            "CreateProductFunction",
            {
                functionName: "createProduct",
                entry: "lambda/createProduct.js",
                ...sharedLambdaProps,
            }
        );

        const catalogBatchProcessFunction = new NodejsFunction(
            this,
            "catalogBatchProcess",
            {
                functionName: "catalogBatchProcess",
                entry: "lambda/catalogBatchProcess.js",
                ...sharedLambdaProps,
                timeout: cdk.Duration.seconds(5),
            }
        );

        productsTable.grantReadData(getProductsListFunction);
        productsTable.grantReadData(getProductsByIdFunction);
        productsTable.grantReadWriteData(createProductFunction);

        stocksTable.grantReadData(getProductsListFunction);
        stocksTable.grantReadData(getProductsByIdFunction);
        stocksTable.grantReadWriteData(createProductFunction);

        catalogItemsQueue.grantConsumeMessages(catalogBatchProcessFunction);

        catalogBatchProcessFunction.role?.addManagedPolicy(
            iam.ManagedPolicy.fromAwsManagedPolicyName(
                "AmazonDynamoDBFullAccess"
            )
        );
        catalogBatchProcessFunction.addEventSource(
            new lambdaEventSources.SqsEventSource(catalogItemsQueue, {
                batchSize: 5,
            })
        );

        createProductTopic.grantPublish(catalogBatchProcessFunction);

        const productsApi = new apigateway.RestApi(this, "ProductsListApi", {
            restApiName: "Product Service",
            defaultCorsPreflightOptions: {
                allowOrigins: [
                    "https://d3636glrblu0ej.cloudfront.net",
                    "http://localhost:3000",
                    "https://editor.swagger.io",
                ],
                allowMethods: ["GET", "OPTIONS"],
                allowHeaders: [
                    "Content-Type",
                    "X-Amz-Date",
                    "Authorization",
                    "X-Api-Key",
                    "X-Amz-Security-Token",
                ],
                allowCredentials: true,
            },
        });

        const productsResource = productsApi.root.addResource("products");
        productsResource.addMethod(
            "GET",
            new apigateway.LambdaIntegration(getProductsListFunction)
        );
        productsResource.addMethod(
            "POST",
            new apigateway.LambdaIntegration(createProductFunction)
        );

        const productByIdResource = productsResource.addResource("{productId}");
        productByIdResource.addMethod(
            "GET",
            new apigateway.LambdaIntegration(getProductsByIdFunction)
        );
    }
}
