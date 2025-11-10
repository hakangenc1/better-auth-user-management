#!/usr/bin/env tsx
/**
 * Reset Setup Script
 * 
 * Complete reset of database and configuration.
 * Matches the behavior of the web-based reset button.
 * 
 * Usage:
 *   npm run reset-setup
 *   or
 *   tsx scripts/reset-setup.ts
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function resetSetup() {
  console.log('🔄 Resetting setup configuration and database...\n');

  try {
    // Step 1: Remove configuration files
    console.log('🗑️  Removing configuration files...');
    const configDir = path.join(process.cwd(), '.data');
    const configFiles = ['config.json', 'config.encrypted.json'];
    let configRemoved = false;
    
    for (const configFile of configFiles) {
      const configPath = path.join(configDir, configFile);
      try {
        await fs.unlink(configPath);
        console.log(`  ✅ Removed ${configFile}`);
        configRemoved = true;
      } catch (error: any) {
        if (error.code !== 'ENOENT') {
          console.warn(`  ⚠️  Could not remove ${configFile}:`, error.message);
        }
      }
    }

    if (!configRemoved) {
      console.log('  ℹ️  No configuration files found (already clean)');
    }

    // Step 2: Remove database files
    console.log('\n🗑️  Removing database files...');
    const dataDir = path.join(process.cwd(), 'data');
    try {
      const files = await fs.readdir(dataDir);
      let dbFilesRemoved = 0;
      let failedFiles: string[] = [];
      
      for (const file of files) {
        if (file.endsWith('.db') || file.endsWith('.db-shm') || file.endsWith('.db-wal')) {
          try {
            await fs.unlink(path.join(dataDir, file));
            console.log(`  ✅ Removed ${file}`);
            dbFilesRemoved++;
          } catch (error: any) {
            if (error.code === 'EBUSY') {
              failedFiles.push(file);
              console.warn(`  ⚠️  Cannot remove ${file} (file is locked by another process)`);
            } else {
              console.warn(`  ⚠️  Failed to remove ${file}: ${error.message}`);
            }
          }
        }
      }
      
      if (dbFilesRemoved > 0) {
        console.log(`  ✅ Removed ${dbFilesRemoved} database file(s)`);
      } else if (failedFiles.length > 0) {
        console.warn('\n  ⚠️  Could not remove database files - they are locked');
        console.warn('  Files could not be removed:');
        failedFiles.forEach(f => console.warn(`     - ${f}`));
        process.exit(1);
      } else {
        console.log('  ℹ️  No database files found (already clean)');
      }
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        console.warn('\n⚠️  Could not access data directory:', error.message);
      }
    }

    console.log('\n✨ Setup reset complete!');
    console.log('\n📋 Summary:');
    console.log('   ✓ Configuration files deleted');
    console.log('   ✓ Database files deleted');
    console.log('   ✓ All data cleared');
    console.log('\n📝 Next steps:');
    console.log('   1. Restart your development server');
    console.log('   2. Database will be recreated automatically');
    console.log('   3. Navigate to http://localhost:5173/setup');
    console.log('   4. Complete the setup wizard\n');

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
