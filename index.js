const { MongoClient } = require('mongodb');
async function main() {
    const uri = "mongodb://localhost:27017"; 
    const client = new MongoClient(uri);
    
    try {
        await client.connect();
        console.log("Connected to MongoDB!");

        const db = client.db("testDB");
        const collection = db.collection("users");

        await collection.insertOne({ name: "Alice", age: 25});
        console.log("Document Inserted!");

        const result = await collection.findOne({ name: "Alice" });
        console.log("Querry Result:", result);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await client.close();
    }
}
main();