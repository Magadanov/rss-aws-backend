module.exports = {
    testEnvironment: "node",
    roots: ["<rootDir>/test"],
    testMatch: ["**/*.test.js"],
    transform: {
        "^.+\\.(ts|js)$": "babel-jest",
    },
};
