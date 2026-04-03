import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

dotenv.config({ path: '.env.local' });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  const user = await db.collection('users').findOne(
    { email: 'demoadmin@gmail.com' },
    { projection: { email: 1, role: 1, isApproved: 1, password: 1 } }
  );

  if (!user) {
    console.log('No user found for demoadmin@gmail.com');
    await mongoose.disconnect();
    return;
  }

  const passwordMatch = await bcrypt.compare('demoadminpass', user.password || '');

  console.log({
    email: user.email,
    role: user.role,
    isApproved: user.isApproved,
    passwordLength: (user.password || '').length,
    passwordMatch,
  });

  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
