const { getCorsHeaders } = require("./httpHeader");
const AWS = require("aws-sdk");

const dynamoDB = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    console.log("getProductsListEvent:", JSON.stringify(event, null, 2));

    const origin = event?.headers?.origin || "";
    const headers = getCorsHeaders(origin);

    try {
        const products = await dynamoDB
            .scan({ TableName: process.env.TABLE_NAME_PRODUCTS })
            .promise();
        const stocks = await dynamoDB
            .scan({ TableName: process.env.TABLE_NAME_STOCKS })
            .promise();

        const response = products.Items.map((product) => {
            const stock = stocks.Items.find(
                (stock) => stock.product_id === product.id
            );
            return {
                ...product,
                count: stock ? stock.count : 0,
            };
        });
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(response),
        };
    } catch {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ message: "Internal server error" }),
        };
    }
};
