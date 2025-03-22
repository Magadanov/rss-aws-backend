import { handler } from "../handler/importFileParser";
import * as AWS from "aws-sdk";
import { Readable } from "stream";
import csvParser from "csv-parser";

jest.mock("aws-sdk", () => {
    const mockS3 = {
        getObject: jest.fn(),
        copyObject: jest.fn().mockReturnValue({ promise: jest.fn() }),
        deleteObject: jest.fn().mockReturnValue({ promise: jest.fn() }),
    };
    return {
        S3: jest.fn(() => mockS3),
    };
});

describe("importFileParser Lambda", () => {
    let mockS3Instance;
    let mockGetObject;
    let mockCopyObject;
    let mockDeleteObject;

    beforeEach(() => {
        mockS3Instance = new AWS.S3();
        mockGetObject = mockS3Instance.getObject;
        mockCopyObject = mockS3Instance.copyObject;
        mockDeleteObject = mockS3Instance.deleteObject;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should process a CSV file and move it to parsed folder", async () => {
        const mockCSVData = "name,age\nJohn,30\nJane,25";
        const mockReadableStream = Readable.from(mockCSVData.split("\n"));

        mockGetObject.mockReturnValue({
            createReadStream: jest.fn(() => mockReadableStream),
        });

        const event = {
            Records: [
                {
                    s3: {
                        bucket: { name: "test-bucket" },
                        object: { key: "uploaded/test.csv" },
                    },
                },
            ],
        };

        await handler(event);

        expect(mockCopyObject).toHaveBeenCalledWith({
            CopySource: "test-bucket/uploaded/test.csv",
            Bucket: "test-bucket",
            Key: "parsed/test.csv",
        });

        expect(mockDeleteObject).toHaveBeenCalledWith({
            Bucket: "test-bucket",
            Key: "uploaded/test.csv",
        });
    });

    it("should not process files in parsed folder", async () => {
        const event = {
            Records: [
                {
                    s3: {
                        bucket: { name: "test-bucket" },
                        object: { key: "parsed/test.csv" },
                    },
                },
            ],
        };

        await handler(event);

        expect(mockCopyObject).not.toHaveBeenCalled();
        expect(mockDeleteObject).not.toHaveBeenCalled();
    });
});
