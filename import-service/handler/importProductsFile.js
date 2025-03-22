import * as AWS from "aws-sdk";
import { headers } from "./httpHeader";

const bucket = new AWS.S3({ region: "eu-west-2" });

exports.handler = async function (event) {
    const filename = event?.queryStringParameters?.name;

    if (!filename) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ message: "File name is required" }),
        };
    }

    const bucketParams = {
        Bucket: process.env.BUCKET_NAME,
        Key: `uploaded/${filename}`,
        Expires: 60,
        ContentType: "text/csv",
    };

    try {
        const signedUrl = await bucket.getSignedUrlPromise(
            "putObject",
            bucketParams
        );
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(signedUrl),
        };
    } catch (err) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ message: err.message }),
        };
    }
};
