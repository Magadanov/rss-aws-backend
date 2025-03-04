const { v4: uuidv4 } = require("uuid");
const AWS = require("aws-sdk");
const { getCorsHeaders } = require("./httpHeader");
const dynamoDB = new AWS.DynamoDB.DocumentClient();

function validateProduct(body) {
    const errors = [];

    if (
        !body.title ||
        typeof body.title !== "string" ||
        body.title.trim() === ""
    ) {
        errors.push("Title is required and should not be empty.");
    }

    if (typeof body.description !== "string") {
        errors.push("Description should be a string.");
    }

    if (typeof body.price !== "number" || body.price <= 0) {
        errors.push("Price should be a positive number greater than 0.");
    }

    if (typeof body.count !== "number" || body.count <= 0) {
        errors.push("Count should be a positive number greater than 0.");
    }

    return errors;
}

exports.handler = async (event) => {
    console.log("createProductEvent:", JSON.stringify(event, null, 2));

    const origin = event?.headers?.origin || "";
    const headers = getCorsHeaders(origin);
    try {
        const body =
            typeof event?.body === "string"
                ? JSON.parse(event?.body)
                : event?.body;

        const errors = validateProduct(body);

        if (errors.length > 0) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ message: errors.join(" ") }),
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
