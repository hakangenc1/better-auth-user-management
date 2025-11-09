#!/usr/bin/env tsx
/**
 * Reset Setup Script
 * 
 * This script resets the entire setup configuration and database,
 * allowing you to start fresh with the setup wizard.
 * Clears all users, sessions, and data from the database.
 * 
 * Usage:
 *   npm run reset-setup
 *   or
 *   tsx scripts/reset-setup.ts
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function clearDatabaseData() {
  console.log('\n🗑️  Clearing database data...');

  const dbPath = path.join(__dirname, '..', 'data', 'auth.db');

  try {
    // Check if database exists
    await fs.access(dbPath);

    // Open database and clear all data
    const db = new Database(dbPath);

    try {
      // Delete all data from tables (in correct order due to foreign keys)
      console.log('  - Clearing activity logs...');
      db.prepare('DELETE FROM activity').run();

      console.log('  - Clearing two-factor authentication...');
      db.prepare('DELETE FROM "twoFactor"').run();

      console.log('  - Clearing verification records...');
      db.prepare('DELETE FROM verification').run();

      console.log('  - Clearing accounts...');
      db.prepare('DELETE FROM account').run();

      console.log('  - Clearing sessions...');
      db.prepare('DELETE FROM session').run();

      console.log('  - Clearing users...');
      db.prepare('DELETE FROM user').run();

      console.log('✅ Database data cleared successfully');
    } catch (error: any) {
      console.warn('⚠️  Could not clear some database tables:', error.message);
    } finally {
      db.close();
    }
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.log('ℹ️  SQLite database not found (skipping data cleanup)');
    } else {
      console.warn('⚠️  Could not access database:', error.message);
    }
  }
}

async function resetSetup() {
  console.log('🔄 Resetting setup configuration and database...\n');

  try {
    // 1. Clear database data first (before removing the database file)
    await clearDatabaseData();

    // 2. Remove configuration file
    const configPath = path.join(__dirname, '..', '.data', 'config.encrypted.json');
    try {
      await fs.unlink(configPath);
      console.log('\n✅ Removed configuration file');
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        console.log('\nℹ️  Configuration file not found (already clean)');
      } else {
        console.warn('\n⚠️  Could not remove configuration file:', error.message);
      }
    }

    // 3. Remove SQLite database if it exists
    const dbPath = path.join(__dirname, '..', 'data', 'auth.db');
    try {
      await fs.unlink(dbPath);
      console.log('✅ Removed SQLite database');
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        console.log('ℹ️  SQLite database not found (skipping)');
      } else {
        console.warn('⚠️  Could not remove SQLite database:', error.message);
      }
    }

    // 4. Remove any other database files
    const dataDir = path.join(__dirname, '..', 'data');
    try {
      const files = await fs.readdir(dataDir);
      for (const file of files) {
        if (file.endsWith('.db') || file.endsWith('.db-shm') || file.endsWith('.db-wal')) {
          await fs.unlink(path.join(dataDir, file));
          console.log(`✅ Removed ${file}`);
        }
      }
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        console.log('ℹ️  Data directory not found (skipping)');
      }
    }

    console.log('\n✨ Setup reset complete!');
    console.log('   All users, sessions, and data have been deleted.');
    console.log('\n📝 Next steps:');
    console.log('   1. Restart your development server');
    console.log('   2. Navigate to http://localhost:5173/setup');
    console.log('   3. Complete the setup wizard again\n');

    console.log('⚠️  Note: If you were using PostgreSQL, you\'ll need to manually');
    console.log('   clear the data or drop and recreate the database tables.\n');

  } catch (error: any) {
    console.error('\n❌ Error resetting setup:', error.message);
    process.exit(1);
  }
}

// Run the script
resetSetup().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
