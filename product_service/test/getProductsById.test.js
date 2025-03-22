// const AWS = require("aws-sdk");
// const { handler } = require("../lambda/getProductsById");
// const { getCorsHeaders } = require("../lambda/httpHeader");

// jest.mock("../lambda/httpHeader", () => ({
//     getCorsHeaders: jest.fn(() => ({
//         "Access-Control-Allow-Credentials": true,
//         "Access-Control-Allow-Methods": "GET,OPTIONS",
//         "Access-Control-Allow-Headers":
//             "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
//     })),
// }));

// const mockGet = jest.fn();
// const mockQuery = jest.fn();

// jest.mock("aws-sdk", () => {
//     return {
//         DynamoDB: {
//             DocumentClient: jest.fn(() => ({
//                 get: mockGet,
//                 query: mockQuery,
//             })),
//         },
//     };
// });

// describe("getProductsById Lambda Function", () => {
//     beforeEach(() => {
//         jest.clearAllMocks();
//     });

//     it("should return 200 and the correct product when ID is found", async () => {
//         const mockProduct = { productId: "123", name: "Test Product" };
//         const mockStock = { productId: "123", count: 10 };

//         mockGet.mockReturnValueOnce({
//             promise: async () => ({ Item: mockProduct }),
//         });

//         mockQuery.mockReturnValueOnce({
//             promise: async () => ({ Items: [mockStock] }),
//         });

//         const mockEvent = {
//             headers: { origin: "http://localhost:3000" },
//             pathParameters: { productId: "123" },
//         };

//         const response = await handler(mockEvent);

//         expect(response.statusCode).toBe(200);
//         expect(JSON.parse(response.body)).toEqual({
//             ...mockProduct,
//             count: 10,
//         });
//     });

//     it("should return 500 when product ID is not found", async () => {
//         mockGet.mockReturnValueOnce({
//             promise: jest.fn().mockResolvedValue({}),
//         });

//         const mockEvent = {
//             headers: { origin: "http://localhost:3000" },
//             pathParameters: { productId: "non-existing-id" },
//         };

//         const response = await handler(mockEvent);

//         expect(response.statusCode).toBe(500);
//         expect(JSON.parse(response.body).message).toBe("Internal server error");
//     });

//     it("should return 500 if no productId is provided", async () => {
//         const mockEvent = {
//             headers: { origin: "http://localhost:3000" },
//             pathParameters: {},
//         };

//         const response = await handler(mockEvent);

//         expect(response.statusCode).toBe(500);
//         expect(JSON.parse(response.body).message).toBe("Internal server error");
//     });
// });
