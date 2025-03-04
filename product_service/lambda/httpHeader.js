const origins = [
    'https://d3636glrblu0ej.cloudfront.net',
    'http://localhost:3000',
    'https://editor.swagger.io',
];

const headers = {
    'Access-Control-Allow-Credentials': true,
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'
};


exports.getCorsHeaders = (origin) => {
    return {
    ...headers,
    'Access-Control-Allow-Origin':origins.includes(origin) ? origin : ''
    };
};