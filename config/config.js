
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = process.env.MONGODB_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function connect() {
    try {
        client.db(process.env.MONGODB_DATABASE);
    } catch (error) {
        await client.close();
    }
}

async function getDB() {
    return client.db(process.env.MONGODB_DATABASE);
}

module.exports = {
    connect, getDB
}
