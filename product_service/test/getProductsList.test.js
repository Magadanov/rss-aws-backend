const { handler } = require("../lambda/getProductsList");
const { products } = require("../lambda/data/products");
const { getCorsHeaders } = require("../lambda/httpHeader");

jest.mock("../lambda/httpHeader", () => ({
  getCorsHeaders: jest.fn(() => ({
    'Access-Control-Allow-Credentials': true,
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'
  })),
}));

describe("getProductsList Lambda Function", () => {
  it("should return 200 status code and product list", async () => {
    const mockEvent = {
      headers: {
        origin: "http://localhost:3000",
      },
    };

    const response = await handler(mockEvent);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBe(JSON.stringify(products));
  });

  it("should return default headers when origin is missing", async () => {
    const mockEvent = { headers: {} };

    const response = await handler(mockEvent);

    expect(response.statusCode).toBe(200);
    expect(response.headers).toEqual({
      "Access-Control-Allow-Origin": "",
      "Access-Control-Allow-Methods": "GET,OPTIONS",
      "Access-Control-Allow-Credentials": true,
      "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
    });
  });
});
