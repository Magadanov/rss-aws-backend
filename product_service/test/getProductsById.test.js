const { handler } = require("../lambda/getProductsById");
const { products } = require("../lambda/data/products");
const { getCorsHeaders } = require("../lambda/httpHeader");

jest.mock("../lambda/httpHeader", () => ({
  getCorsHeaders: jest.fn(() => ({
    'Access-Control-Allow-Credentials': true,
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'
  })),
}));

describe("getProductsById Lambda Function", () => {
  it("should return 200 and the correct product when ID is found", async () => {
    const mockProduct = products[0]; 
    const mockEvent = {
      headers: { origin: "http://localhost:3000" },
      pathParameters: { productId: mockProduct.id },
    };

    const response = await handler(mockEvent);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBe(JSON.stringify(mockProduct));
  });

  it("should return 404 when product ID is not found", async () => {
    const mockEvent = {
      headers: { origin: "http://localhost:3000" },
      pathParameters: { productId: "non-existing-id" },
    };

    const response = await handler(mockEvent);

    expect(response.statusCode).toBe(404);
    expect(response.body).toBe(JSON.stringify({ message: "Product not found" }));
  });

  it("should return 404 if no productId is provided", async () => {
    const mockEvent = {
      headers: { origin: "http://localhost:3000" },
      pathParameters: {},
    };

    const response = await handler(mockEvent);

    expect(response.statusCode).toBe(404);
    expect(response.body).toBe(JSON.stringify({ message: "Product not found" }));
  });
});
