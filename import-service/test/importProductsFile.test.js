import { handler } from "../handler/importProductsFile";
import * as AWS from "aws-sdk";

jest.mock("aws-sdk", () => {
    const mockS3 = {
        getSignedUrlPromise: jest.fn(),
    };
    return {
        S3: jest.fn(() => mockS3),
    };
});

describe("importProductsFile", () => {
    let mockS3Instance;
    let mockGetSignedUrlPromise;

    beforeEach(() => {
        mockS3Instance = new AWS.S3();
        mockGetSignedUrlPromise = mockS3Instance.getSignedUrlPromise;
        process.env.BUCKET_NAME = "test-bucket";
    });

    afterEach(() => {
        jest.clearAllMocks();
        delete process.env.BUCKET_NAME;
    });

    it("should return a signed URL when a valid file name is provided", async () => {
        const mockSignedUrl = "https://example.com/signed-url";
        mockGetSignedUrlPromise.mockResolvedValue(mockSignedUrl);

        const event = {
            queryStringParameters: { name: "test.csv" },
        };

        const response = await handler(event);

        expect(response.statusCode).toBe(200);
        expect(JSON.parse(response.body)).toEqual(mockSignedUrl);
    });

    it("should return 400 if no file name is provided", async () => {
        const event = { queryStringParameters: {} };

        const response = await handler(event);

        expect(response.statusCode).toBe(400);
        expect(JSON.parse(response.body)).toEqual({
            message: "File name is required",
        });
    });

    it("should return 500 if S3 fails", async () => {
        mockGetSignedUrlPromise.mockRejectedValue(new Error("S3 error"));

        const event = {
            queryStringParameters: { name: "test.csv" },
        };

        const response = await handler(event);

        expect(response.statusCode).toBe(500);
        expect(JSON.parse(response.body)).toEqual({ message: "S3 error" });
    });
});
