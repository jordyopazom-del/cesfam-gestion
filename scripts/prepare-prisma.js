const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');

console.log('🔄 Automatic Prisma Adapter: SQLite ➡️ PostgreSQL');

try {
  let schemaContent = fs.readFileSync(schemaPath, 'utf8');

  // Replace provider = "sqlite" with provider = "postgresql"
  if (schemaContent.includes('provider = "sqlite"')) {
    schemaContent = schemaContent.replace('provider = "sqlite"', 'provider = "postgresql"');
    fs.writeFileSync(schemaPath, schemaContent, 'utf8');
    console.log('✅ Successfully switched Prisma provider to "postgresql" for serverless deployment.');
  } else if (schemaContent.includes('provider = "postgresql"')) {
    console.log('ℹ️ Prisma provider is already configured to "postgresql".');
  } else {
    console.warn('⚠️ Warning: Prisma provider could not be verified in schema.prisma.');
  }
} catch (error) {
  console.error('❌ Error updating Prisma schema:', error);
  process.exit(1);
}
