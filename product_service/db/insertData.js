const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");

AWS.config.update({ region: "eu-west-2" });

const dynamoDB = new AWS.DynamoDB.DocumentClient();

const products = [
    {
        id: uuidv4(),
        title: "Laptop",
        description: "High-performance laptop",
        price: 1200,
    },
    {
        id: uuidv4(),
        title: "Smartphone",
        description: "Latest model smartphone",
        price: 800,
    },
];

const stocks = [
    {
        product_id: products[0].id,
        count: 10,
    },
    {
        product_id: products[1].id,
        count: 5,
    },
];

const insertData = async () => {
    try {
        for (const product of products) {
            await dynamoDB
                .put({ TableName: "products", Item: product })
                .promise();
            console.log(`Inserted product: ${product.title}`);
        }

        for (const stock of stocks) {
            await dynamoDB.put({ TableName: "stocks", Item: stock }).promise();
            console.log(`Inserted stock for product ID: ${stock.product_id}`);
        }

        console.log("Data inserted successfully!");
    } catch (error) {
        console.error("Error inserting data:", error);
    }
};

insertData();
