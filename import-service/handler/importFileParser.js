import { Transform } from "node:stream";
import * as AWS from "aws-sdk";
import csvParser from "csv-parser";

const bucket = new AWS.S3({ region: "eu-west-2" });
const sqs = new AWS.SQS();

exports.handler = async function (event) {
    console.log("ImportFileParser:", JSON.stringify(event));
    for (const record of event?.Records) {
        const s3ReadableStream = bucket
            .getObject({
                Bucket: record.s3.bucket.name,
                Key: record.s3.object.key,
            })
            .createReadStream();

        console.log(`File is processing key: ${record.s3.object.key}`);

        await processReadableStream(s3ReadableStream, record);
    }
};

async function processReadableStream(stream, record) {
    return new Promise((res, rej) => {
        const transformStream = new Transform({
            objectMode: true,
            transform(chunk, encoding, callback) {
                console.log("csv file is parsing: ", JSON.stringify(chunk));
                sendMessageToSQS(chunk);
                callback();
            },
        });

        stream
            .pipe(csvParser())
            .pipe(transformStream)
            .on("finish", async () => {
                console.log(`${record.s3.object.key} has finished to process`);

                const bucketName = record.s3.bucket.name;
                const key = decodeURIComponent(
                    record.s3.object.key.replace(/\+/g, " ")
                );

                const sourceKey = key.replace("uploaded", "parsed");

                if (key === sourceKey) {
                    console.log("This file is already in the 'parsed' folder");
                    return res(true);
                }

                try {
                    await bucket
                        .copyObject({
                            CopySource: `${bucketName}/${key}`,
                            Bucket: bucketName,
                            Key: sourceKey,
                        })
                        .promise();

                    await bucket
                        .deleteObject({
                            Bucket: bucketName,
                            Key: key,
                        })
                        .promise();
                    res(true);
                } catch (error) {
                    console.error(
                        "Error occurred during file moving: ",
                        error.message
                    );
                }
            })
            .on("error", rej);
    });
}

function sendMessageToSQS(data) {
    try {
        const sendData = {
            title: data.title,
            description: data.description,
            price: Number(data.price),
            count: Number(data.count),
        };
        const params = {
            QueueUrl: process.env.QUEUE_URL,
            MessageBody: JSON.stringify(sendData),
        };
        sqs.sendMessage(params, (err, data) => {
            if (err) {
                console.error("Error while sending the message", err);
            } else {
                console.log("Message sent successfully", data.MessageId);
            }
        });
    } catch {
        console.error("Something error");
    }
}
