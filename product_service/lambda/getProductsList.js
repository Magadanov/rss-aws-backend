const { products } = require('./data/products.js');
const { getCorsHeaders } = require('./httpHeader.js');

exports.handler = async (event) => {
    const origin = event.headers.origin || "";
    const headers = getCorsHeaders(origin)
    return {
        statusCode: 200,
        headers,
        body: JSON.stringify(products),
    };
};
