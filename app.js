const { MongoClient } = require('mongodb');
const uri = 'mongodb://172.19.34.242:27017';
//const uri = 'mongodb+srv://b122310369:2Afd0TSjEvW5GtV9@cluster0.twmimog.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';


async function delay(seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

async function main() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db('labDB');
    const users = db.collection('users');

    // ===== CREATE =====
    const insertResult = await users.insertOne({
      name: 'Chiew',
      age: 22,
      role: 'user'
    });
    console.log('CREATE: Document inserted');
    
    // READ after Create
    let doc = await users.findOne({ _id: insertResult.insertedId });
    console.log('READ: Created Document:', doc);
    await delay(30); 

    // ===== UPDATE =====
    await users.updateOne(
      { _id: insertResult.insertedId },
      { $set: { age: 23, role: 'admin' } }
    );
    console.log('UPDATE: Document modified');
    
    // READ after Update
    doc = await users.findOne({ _id: insertResult.insertedId });
    console.log('READ: Updated Document:', doc);
    await delay(30);

    // ===== DELETE =====
    await users.deleteOne({ _id: insertResult.insertedId });
    console.log('DELETE: Document removed');
    
    // Final READ after Delete
    doc = await users.findOne({ _id: insertResult.insertedId });
    console.log('READ: Post-deletion Result:', doc);
    await delay(10);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.close();
    console.log('Connection closed');
  }
}

main();