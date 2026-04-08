const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db();
    const result = await db.collection('products').updateMany({}, { $set: { approvalStatus: 'approved' } });
    console.log(result);
  } finally {
    await client.close();
  }
}

run().catch(console.dir);