import mongoose from 'mongoose';

const globalWithMongoose = global as typeof globalThis & {
  mongoose: { conn?: typeof mongoose; promise?: Promise<typeof mongoose>; };
};

async function dbConnect(): Promise<void> {
  if (globalWithMongoose.mongoose?.conn) {
    console.log('Using existing MongoDB connection');
    return;
  }

  if (!globalWithMongoose.mongoose) globalWithMongoose.mongoose = {};

  try {
    const opts = {
      bufferCommands: false,
    };

    globalWithMongoose.mongoose.promise = mongoose.connect(
      process.env.MONGODB_URI || '',
      opts
    );

    globalWithMongoose.mongoose.conn = await globalWithMongoose.mongoose.promise;
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

export default dbConnect;
