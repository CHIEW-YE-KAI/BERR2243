const { MongoClient } = require('mongodb');

// Connection URIs
const localUri = 'mongodb://172.19.34.242:27017'; // Local MongoDB
const atlasUri = 'mongodb+srv://b122310369:2Afd0TSjEvW5GtV9@cluster0.twmimog.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'; // Atlas

// Delay utility (already defined in your original code)
async function delay(seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

async function compareDocuments(localDoc, atlasDoc) {
  const { _id: localId, ...localData } = localDoc;
  const { _id: atlasId, ...atlasData } = atlasDoc;
  return JSON.stringify(localData) === JSON.stringify(atlasData);
}

async function main() {
  const localClient = new MongoClient(localUri);
  const atlasClient = new MongoClient(atlasUri);

  try {
    await Promise.all([localClient.connect(), atlasClient.connect()]);
    const localDb = localClient.db('labDB');
    const atlasDb = atlasClient.db('labDB');
    const localUsers = localDb.collection('users');
    const atlasUsers = atlasDb.collection('users');

    // ===== CREATE =====
    const localInsert = await localUsers.insertOne({ name: 'Chiew', age: 22, role: 'user' });
    const atlasInsert = await atlasUsers.insertOne({ name: 'Chiew', age: 22, role: 'user' });
    console.log('CREATE: Documents inserted in both databases');

    // Verify CREATE
    const localDoc = await localUsers.findOne({ _id: localInsert.insertedId });
    const atlasDoc = await atlasUsers.findOne({ _id: atlasInsert.insertedId });
    if (await compareDocuments(localDoc, atlasDoc)) {
      console.log('✅ CREATE Verification Passed');
    } else {
      console.log('❌ CREATE Verification Failed');
    }
    await delay(30); // 30-second delay after CREATE

    // ===== UPDATE =====
    await localUsers.updateOne({ _id: localInsert.insertedId }, { $set: { age: 23, role: 'admin' } });
    await atlasUsers.updateOne({ _id: atlasInsert.insertedId }, { $set: { age: 23, role: 'admin' } });
    console.log('UPDATE: Documents modified in both databases');

    // Verify UPDATE
    const updatedLocalDoc = await localUsers.findOne({ _id: localInsert.insertedId });
    const updatedAtlasDoc = await atlasUsers.findOne({ _id: atlasInsert.insertedId });
    if (await compareDocuments(updatedLocalDoc, updatedAtlasDoc)) {
      console.log('✅ UPDATE Verification Passed');
    } else {
      console.log('❌ UPDATE Verification Failed');
    }
    await delay(30); // 30-second delay after UPDATE

    // ===== DELETE =====
    await localUsers.deleteOne({ _id: localInsert.insertedId });
    await atlasUsers.deleteOne({ _id: atlasInsert.insertedId });
    console.log('DELETE: Documents removed from both databases');

    // Verify DELETE
    const deletedLocalDoc = await localUsers.findOne({ _id: localInsert.insertedId });
    const deletedAtlasDoc = await atlasUsers.findOne({ _id: atlasInsert.insertedId });
    if (deletedLocalDoc === null && deletedAtlasDoc === null) {
      console.log('✅ DELETE Verification Passed');
    } else {
      console.log('❌ DELETE Verification Failed');
    }
    await delay(10); // 10-second delay after DELETE

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await Promise.all([localClient.close(), atlasClient.close()]);
    console.log('Connections closed');
  }
}

main();
