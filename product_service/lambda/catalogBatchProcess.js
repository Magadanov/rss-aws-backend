const AWS = require("aws-sdk");
const { SQSEvent } = require("aws-lambda");
const { getCorsHeaders } = require("./httpHeader");
const createProduct = require("./createProduct");

const sns = new AWS.SNS();

exports.handler = async (event) => {
    const origin = event?.headers?.origin || "";
    const headers = getCorsHeaders(origin);

    try {
        const newProducts = [];
        for (const record of event.Records) {
            try {
                const body = JSON.parse(record.body);
                const { body: eventBody, ...recordEvent } = event;
                console.log("event", {
                    ...recordEvent,
                    body,
                });
                const { body: newProduct } = await createProduct.handler({
                    ...recordEvent,
                    body,
                });
                console.log("Product created:", newProduct);
                newProducts.push(newProduct);
            } catch (e) {
                console.error("Error while processing record:", e);
            }
        }

        const SNSParams = {
            Message: `The new products have been created.\r\n${JSON.stringify(
                newProducts
            )}`,
            Subject: "Creation of batch products is completed",
            TopicArn: process.env.SNS_TOPIC_ARN,
        };

        await sns.publish(SNSParams).promise();

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ message: "message is delivered" }),
        };
    } catch {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ message: "Internal server error" }),
        };
    }
};
