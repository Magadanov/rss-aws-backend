const { v4: uuidv4 } = require("uuid");
const AWS = require("aws-sdk");
const { getCorsHeaders } = require("./httpHeader");
const dynamoDB = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    console.log("createProductEvent:", JSON.stringify(event, null, 2));

    const origin = event?.headers?.origin || "";
    const headers = getCorsHeaders(origin);
    try {
        const body =
            typeof event?.body === "string"
                ? JSON.parse(event?.body)
                : event?.body;

        if (
            !body.title ||
            !body.price ||
            !body.description ||
            body.count === undefined
        ) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    message:
                        "Missing required fields: title, price, description, count",
                }),
            };
        }

        const productId = uuidv4();

        const transactParams = {
            TransactItems: [
                {
                    Put: {
                        TableName: process.env.TABLE_NAME_PRODUCTS,
                        Item: {
                            id: productId,
                            title: body.title,
                            price: body.price,
                            description: body.description,
                        },
                        ConditionExpression: "attribute_not_exists(id)",
                    },
                },
                {
                    Put: {
                        TableName: process.env.TABLE_NAME_STOCKS,
                        Item: {
                            product_id: productId,
                            count: body.count,
                        },
                        ConditionExpression: "attribute_not_exists(product_id)",
                    },
                },
            ],
        };

        await dynamoDB.transactWrite(transactParams).promise();

        return {
            statusCode: 201,
            headers,
            body: JSON.stringify({
                id: productId,
                title: body.title,
                description: body.description,
                price: body.price,
                count: body.count,
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
