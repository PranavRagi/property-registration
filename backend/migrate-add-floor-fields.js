// backend/migrate-add-floor-fields.js
require('dotenv').config();
const { connectDB, Property } = require('./db');

async function migrate() {
  try {
    await connectDB();
    console.log('🔧 Starting migration: add floor fields to existing properties...');

    // Find all properties and update them
    const properties = await Property.find({});
    console.log(`📋 Found ${properties.length} properties`);

    let updatedCount = 0;
    for (const prop of properties) {
      const update = {};
      
      // Add floorNumber if missing
      if (!('floorNumber' in prop.toObject())) {
        update.floorNumber = null;
      }
      
      // Add totalFloors if missing
      if (!('totalFloors' in prop.toObject())) {
        update.totalFloors = null;
      }
      
      // Add isNegotiable if missing
      if (!('isNegotiable' in prop.toObject())) {
        update.isNegotiable = false;
      }

      // Only update if there are changes
      if (Object.keys(update).length > 0) {
        await Property.updateOne({ _id: prop._id }, { $set: update });
        updatedCount++;
        console.log(`✅ Updated property: ${prop.propertyID}`);
      }
    }

    console.log(`🎉 Migration complete! Updated ${updatedCount} properties`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

migrate();