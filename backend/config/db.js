const mongoose = require('mongoose');


const connectDatabase = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    const conn =   await mongoose.connect(process.env.MONGO_URI);
    console.log(`🍃 MongoDB Connected: ${conn.connection.host}`);

    // Drop legacy global sku_1 index and apply schema indexes (sku+branch+warehouse unique).
    try {
      const Product = require('../models/product.model');
      const coll = conn.connection.db.collection('products');
      const idx = await coll.indexes();
      const hasLegacySku = idx.some((i) => i.name === 'sku_1');
      if (hasLegacySku) {
        await coll.dropIndex('sku_1');
        console.log('Dropped legacy products index: sku_1');
      }
      await Product.syncIndexes();
    } catch (e) {
      console.warn('Product index sync (non-fatal):', e.message);
    }

    return conn;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected');
});

mongoose.connection.on('error', (error) => {
  console.error('MongoDB error:', error);
});

module.exports = { connectDatabase };
