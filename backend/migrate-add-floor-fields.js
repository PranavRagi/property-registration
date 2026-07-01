// backend/migrate-add-floor-fields.js
require('dotenv').config();
const { connectDB, Property } = require('./db');

async function migrate() {
  try {
    await connectDB();
    console.log('🔧 Starting migration: add floor fields to existing properties...');

    // Add floorNumber, totalFloors, and isNegotiable to properties that don't have them
    const result = await Property.updateMany(
      { 
        $or: [
          { floorNumber: { $exists: false } },
          { totalFloors: { $exists: false } },
          { isNegotiable: { $exists: false } }
        ]
      },
      {
        $set: {
          floorNumber: null,
          totalFloors: null,
          isNegotiable: false
        }
      }
    );

    console.log(`🎉 Migration complete! Updated ${result.modifiedCount} properties`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

migrate();