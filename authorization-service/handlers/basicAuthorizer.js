const generatePolicy = (principalId, effect, resource) => {
  return {
    principalId,
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        { Action: "execute-api:Invoke", Effect: effect, Resource: resource },
      ],
    },
  };
};

exports.handler = async function (event, _context, callback) {
  console.log("Event:", JSON.stringify(event));
  try {
    const authorizationToken = event.authorizationToken;
    if (typeof authorizationToken !== "string" || !authorizationToken) {
      callback("Unauthorized");
      return;
    }
    const encodedCreds = authorizationToken?.split(" ")[1];
    const buffer = Buffer.from(encodedCreds, "base64");
    const [username, password] = buffer.toString("utf-8").split(":");

    const storedUserPassword = process.env[username];
    const effect =
      !storedUserPassword || storedUserPassword !== password ? "Deny" : "Allow";

    if (effect === "Deny") {
      callback(null, generatePolicy("user", effect, "*"));
      return;
    }

    return callback(null, generatePolicy("user", "Allow", event.methodArn));
  } catch (err) {
    console.error("Error occurred during authorization: ", err);
    callback("Unauthorized");
  }
};
