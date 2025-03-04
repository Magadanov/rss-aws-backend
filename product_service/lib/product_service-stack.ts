import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";

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

        const getProductsListFunction = new NodejsFunction(
            this,
            "ProductsListFunction",
            {
                functionName: "getProductsList",
                runtime: lambda.Runtime.NODEJS_18_X,
                entry: "lambda/getProductsList.js",
                handler: "handler",
                environment: {
                    TABLE_NAME_PRODUCTS: productsTable.tableName,
                    TABLE_NAME_STOCKS: stocksTable.tableName,
                },
            }
        );

        const getProductsByIdFunction = new NodejsFunction(
            this,
            "ProductsByIdFunction",
            {
                functionName: "getProductsById",
                runtime: lambda.Runtime.NODEJS_18_X,
                entry: "lambda/getProductsById.js",
                handler: "handler",
                environment: {
                    TABLE_NAME_PRODUCTS: productsTable.tableName,
                    TABLE_NAME_STOCKS: stocksTable.tableName,
                },
            }
        );

        const createProductFunction = new NodejsFunction(
            this,
            "CreateProductFunction",
            {
                functionName: "createProduct",
                runtime: lambda.Runtime.NODEJS_18_X,
                entry: "lambda/createProduct.js",
                handler: "handler",
                environment: {
                    TABLE_NAME_PRODUCTS: productsTable.tableName,
                    TABLE_NAME_STOCKS: stocksTable.tableName,
                },
            }
        );

        productsTable.grantReadData(getProductsListFunction);
        productsTable.grantReadData(getProductsByIdFunction);
        productsTable.grantReadWriteData(createProductFunction);

        stocksTable.grantReadData(getProductsListFunction);
        stocksTable.grantReadData(getProductsByIdFunction);
        stocksTable.grantReadWriteData(createProductFunction);

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
