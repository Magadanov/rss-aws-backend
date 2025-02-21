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
    });

    const productsResource = productsApi.root.addResource('products');
    productsResource.addMethod('GET', new apigateway.LambdaIntegration(getProductsListFunction));

    const productByIdResource = productsResource.addResource('{productId}');
    productByIdResource.addMethod('GET', new apigateway.LambdaIntegration(getProductsByIdFunction));

  }
}
