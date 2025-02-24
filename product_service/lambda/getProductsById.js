const { products } = require('./data/products.js');
const { getCorsHeaders } = require('./httpHeader.js');

exports.handler = async (event) => {
    const origin = event.headers.origin || "";
    const headers = getCorsHeaders(origin)

    const productID = event.pathParameters.productId;

    const product = products.find(item => item.id == productID)

    if (product) {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(product),
        };
    } else {
        return {
            statusCode: 404,
            headers,
            body: JSON.stringify({message: 'Product not found'}),
        }
    }

};
