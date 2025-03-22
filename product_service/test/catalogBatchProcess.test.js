const AWS = require("aws-sdk");
const { handler } = require("../lambda/catalogBatchProcess");
const createProduct = require("../lambda/createProduct");
const { getCorsHeaders } = require("../lambda/httpHeader");

jest.mock("aws-sdk", () => {
    const mockSNS = {
        publish: jest
            .fn()
            .mockReturnValue({ promise: jest.fn().mockResolvedValue({}) }),
    };
    return { SNS: jest.fn(() => mockSNS) };
});

jest.mock("../lambda/createProduct", () => ({
    handler: jest.fn(),
}));

jest.mock("../lambda/httpHeader", () => ({
    getCorsHeaders: jest.fn(() => ({ "Access-Control-Allow-Origin": "*" })),
}));

describe("SQS Lambda Function", () => {
    let sns;
    let mockCreateProduct;

    beforeEach(() => {
        sns = new AWS.SNS();
        mockCreateProduct = createProduct;
        jest.clearAllMocks();
    });

    it("should process SQS messages and publish an SNS notification", async () => {
        process.env.SNS_TOPIC_ARN = "1dsd";
        mockCreateProduct.mockReturnValue(() => ({
            handler: async () => ({
                body: {
                    id: "123",
                    title: "Test Product",
                    description: "test",
                    price: 200,
                    count: 10,
                },
            }),
        }));

        const mockEvent = {
            headers: { origin: "http://localhost:3000" },
            Records: [
                {
                    body: JSON.stringify({
                        title: "Test Product",
                        description: "test",
                        price: 200,
                        count: 10,
                    }),
                },
            ],
        };

        const response = await handler(mockEvent);

        expect(response.statusCode).toBe(200);
        expect(JSON.parse(response.body)).toEqual({
            message: "message is delivered",
        });
    });
});
