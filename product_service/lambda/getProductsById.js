const { getCorsHeaders } = require("./httpHeader");
const AWS = require("aws-sdk");
const dynamoDB = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    console.log("getProductsByIdEvent:", JSON.stringify(event, null, 2));

    const origin = event?.headers?.origin || "";
    const headers = getCorsHeaders(origin);
    try {
        const productID = event?.pathParameters?.productId;

        const product = await dynamoDB
            .get({
                TableName: process.env.TABLE_NAME_PRODUCTS,
                Key: { id: productID },
            })
            .promise();

        if (!product.Item) {
            return { statusCode: 404, headers, body: "Product not found" };
        }

        const stockData = await dynamoDB
            .query({
                TableName: process.env.TABLE_NAME_STOCKS,
                KeyConditionExpression: "product_id = :p_id",
                ExpressionAttributeValues: {
                    ":p_id": productID,
                },
            })
            .promise();

        const stock = stockData.Items.length > 0 ? stockData.Items[0].count : 0;

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                ...product.Item,
                count: stock,
            }),
        };
    } catch {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ message: "Internal server error" }),
        };
    }
};
