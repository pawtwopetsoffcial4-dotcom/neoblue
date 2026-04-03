import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config({ path: '.env.local' });

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  const adminLogin = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'demoadmin@gmail.com', password: 'demoadminpass' }),
  });
  const adminData = await adminLogin.json();
  console.log('admin login ok:', adminLogin.ok, adminData.message);

  const vendor = await db.collection('users').findOne({ role: 'vendor' }, { projection: { email: 1, isApproved: 1, name: 1 } });
  console.log('before:', vendor);

  if (!vendor) {
    console.log('No vendor found');
    await mongoose.disconnect();
    return;
  }

  const approveRes = await fetch(`http://localhost:3000/api/vendors/${vendor._id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminData.token}`,
    },
    body: JSON.stringify({ action: 'approve' }),
  });
  const approveData = await approveRes.json();
  console.log('approve status:', approveRes.status, approveData);

  const refreshed = await db.collection('users').findOne({ _id: vendor._id }, { projection: { email: 1, isApproved: 1, role: 1 } });
  console.log('after:', refreshed);

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
