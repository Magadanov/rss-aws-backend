const AWS = require("aws-sdk");
const { handler } = require("../lambda/catalogBatchProcess");
const createProduct = require("../lambda/createProduct");
const { getCorsHeaders } = require("../lambda/httpHeader");

jest.mock("aws-sdk", () => {
    return {
        SNS: jest.fn(() => ({
            publish: jest.fn().mockReturnThis(),
        })),
    };
});

const mockedItem = {
    id: "1",
    title: "Mck",
    description: "",
    price: 100,
    count: 10,
};

jest.mock("../lambda/createProduct", () => ({
    handler: jest.fn(() => ({ statusCode: 200, body: mockedItem })),
}));

jest.mock("../lambda/httpHeader", () => ({
    getCorsHeaders: jest.fn(() => ({
        "Access-Control-Allow-Credentials": true,
        "Access-Control-Allow-Methods": "GET,OPTIONS",
        "Access-Control-Allow-Headers":
            "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
    })),
}));

describe("catalogBatchProcess", () => {
    let mockEvent;
    let sns;

    beforeEach(() => {
        sns = new AWS.SNS();

        mockEvent = {
            Records: [
                {
                    body: mockedItem,
                },
            ],
            headers: {
                origin: "https://example.com",
            },
        };
    });

    it("should process records and send SNS notification", async () => {
        const response = await handler(mockEvent);

        expect(response.statusCode).toBe(200);
        expect(JSON.parse(response.body).message).toBe("message is delivered");
    });

    it("should return 500 if an unexpected error occurs", async () => {
        jest.spyOn(JSON, "stringify").mockImplementation(() => {
            throw new Error("Unexpected error");
        });

        const response = await handler(mockEvent);

        expect(response.statusCode).toBe(500);
        expect(JSON.parse(response.body).message).toBe("Internal server error");
    });
});
