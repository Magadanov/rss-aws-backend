import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as dotenv from "dotenv";

dotenv.config();

export class AuthorizationServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const sharedLambdaProps: NodejsFunctionProps = {
      handler: "handler",
      environment: { magadanov: process.env.magadanov as string },
      runtime: lambda.Runtime.NODEJS_18_X,
      bundling: {
        minify: true,
        externalModules: ["aws-sdk"],
      },
    };

    const basicAuthorizer = new NodejsFunction(this, "basicAuthorizer", {
      entry: "handlers/basicAuthorizer.js",
      functionName: "basicAuthorizer",
      ...sharedLambdaProps,
    });
  }
}
