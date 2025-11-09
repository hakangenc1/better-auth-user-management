import { ConfigStore } from '../app/lib/config.server';
import { promises as fs } from 'fs';
import path from 'path';

// Load environment variables from .env file
async function loadEnv() {
  try {
    const envPath = path.join(process.cwd(), '.env');
    const envContent = await fs.readFile(envPath, 'utf-8');
    const lines = envContent.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          process.env[key.trim()] = valueParts.join('=').trim();
        }
      }
    }
  } catch (error) {
    console.warn('Could not load .env file');
  }
}

/**
 * Verification script to check config file security
 * This script verifies:
 * 1. File permissions are set correctly (600 on Unix systems)
 * 2. Directory permissions are set correctly (700 on Unix systems)
 * 3. Config directory is not in public directory
 * 4. Config directory is in .gitignore
 */
async function verifyConfigSecurity() {
  console.log('🔒 Verifying config file security...\n');
  
  // Load environment variables first
  await loadEnv();
  
  try {
    const configStore = new ConfigStore();
    
    // Wait a moment for the async verification in constructor
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Check secure location
    const locationCheck = await configStore.verifySecureLocation();
    console.log(`📍 Location Check: ${locationCheck.secure ? '✅' : '❌'}`);
    console.log(`   ${locationCheck.message}\n`);
    
    // Check if config file exists
    const configPath = path.join(process.cwd(), '.data', 'config.json');
    try {
      const stats = await fs.stat(configPath);
      console.log(`📄 Config File: ✅ Exists`);
      
      // Check permissions on Unix systems
      if (process.platform !== 'win32') {
        const mode = stats.mode & 0o777;
        const expectedFileMode = 0o600;
        const filePermissionsCorrect = mode === expectedFileMode;
        
        console.log(`   Permissions: ${filePermissionsCorrect ? '✅' : '❌'} ${mode.toString(8)} (expected: ${expectedFileMode.toString(8)})`);
        
        // Check directory permissions
        const dirPath = path.dirname(configPath);
        const dirStats = await fs.stat(dirPath);
        const dirMode = dirStats.mode & 0o777;
        const expectedDirMode = 0o700;
        const dirPermissionsCorrect = dirMode === expectedDirMode;
        
        console.log(`   Directory Permissions: ${dirPermissionsCorrect ? '✅' : '❌'} ${dirMode.toString(8)} (expected: ${expectedDirMode.toString(8)})`);
      } else {
        console.log(`   Permissions: ℹ️  Windows system - using ACLs instead of Unix permissions`);
      }
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        console.log(`📄 Config File: ℹ️  Not created yet (run setup first)`);
      } else {
        console.log(`📄 Config File: ❌ Error checking: ${error.message}`);
      }
    }
    
    // Check .gitignore
    try {
      const gitignorePath = path.join(process.cwd(), '.gitignore');
      const gitignoreContent = await fs.readFile(gitignorePath, 'utf-8');
      const hasDataIgnore = gitignoreContent.includes('.data') || gitignoreContent.includes('/.data/');
      
      console.log(`\n📝 .gitignore: ${hasDataIgnore ? '✅' : '❌'} ${hasDataIgnore ? 'Contains .data directory' : 'Missing .data directory'}`);
    } catch (error) {
      console.log(`\n📝 .gitignore: ⚠️  Could not read file`);
    }
    
    console.log('\n✅ Security verification complete!');
    
  } catch (error: any) {
    console.error(`\n❌ Verification failed: ${error.message}`);
    process.exit(1);
  }
}

verifyConfigSecurity();
