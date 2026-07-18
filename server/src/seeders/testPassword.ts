import mongoose from 'mongoose';
import User from '../models/User.js';
import { env } from '../config/env.js';

const testPassword = async (): Promise<void> => {
  try {
    console.log('Testing password hashing...\n');

    await mongoose.connect(env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const admin = await User.findOne({ email: 'admin@bda.com' }).select('+password');

    if (!admin) {
      console.log('Admin user not found. Run npm run seed first.');
      process.exit(1);
    }

    console.log('Email:', admin.email);
    console.log('Hashed Password:', admin.password);
    console.log('');

    const testPasswords = ['admin123', 'wrong123', 'Admin123'];

    for (const pwd of testPasswords) {
      const isMatch = await admin.comparePassword(pwd);
      console.log(`Testing "${pwd}": ${isMatch ? 'MATCH' : 'NO MATCH'}`);
    }

    console.log('\nTest complete!');
    process.exit(0);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error:', message);
    process.exit(1);
  }
};

void testPassword();
