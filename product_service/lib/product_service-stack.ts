import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const getProductsListFunction = new lambda.Function(this, 'ProductsListFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('lambda'), 
      handler: 'getProductsList.handler', 
    });

    const getProductsByIdFunction = new lambda.Function(this, 'ProductsByIdFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('lambda'), 
      handler: 'getProductsById.handler', 
    });


    const productsApi = new apigateway.RestApi(this, 'ProductsListApi', {
      restApiName: 'Product Service',
      defaultCorsPreflightOptions: {
        allowOrigins: [
          'https://d199avi2jaj1jp.cloudfront.net',
          'http://localhost:3000',
          'https://editor.swagger.io',
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
      }
    });

    const productsResource = productsApi.root.addResource('products');
    productsResource.addMethod('GET', new apigateway.LambdaIntegration(getProductsListFunction));

    const productByIdResource = productsResource.addResource('{productId}');
    productByIdResource.addMethod('GET', new apigateway.LambdaIntegration(getProductsByIdFunction));
  }
}
