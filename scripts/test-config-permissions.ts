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

async function testConfigPermissions() {
  console.log('🧪 Testing config file permissions...\n');
  
  // Load environment variables first
  await loadEnv();
  
  try {
    const configStore = new ConfigStore();
    
    // Create a test configuration
    const testConfig = {
      setupComplete: false,
      databaseConfig: {
        type: 'sqlite' as const,
        sqlite: {
          filePath: './data/test.db'
        }
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log('📝 Creating test config file...');
    await configStore.save(testConfig);
    console.log('✅ Config file created\n');
    
    // Verify permissions
    const configPath = path.join(process.cwd(), '.data', 'config.json');
    const stats = await fs.stat(configPath);
    
    if (process.platform !== 'win32') {
      const fileMode = stats.mode & 0o777;
      const expectedFileMode = 0o600;
      
      console.log(`📄 File Permissions:`);
      console.log(`   Current: ${fileMode.toString(8)}`);
      console.log(`   Expected: ${expectedFileMode.toString(8)}`);
      console.log(`   Status: ${fileMode === expectedFileMode ? '✅ CORRECT' : '❌ INCORRECT'}\n`);
      
      // Check directory permissions
      const dirPath = path.dirname(configPath);
      const dirStats = await fs.stat(dirPath);
      const dirMode = dirStats.mode & 0o777;
      const expectedDirMode = 0o700;
      
      console.log(`📁 Directory Permissions:`);
      console.log(`   Current: ${dirMode.toString(8)}`);
      console.log(`   Expected: ${expectedDirMode.toString(8)}`);
      console.log(`   Status: ${dirMode === expectedDirMode ? '✅ CORRECT' : '❌ INCORRECT'}\n`);
      
      if (fileMode === expectedFileMode && dirMode === expectedDirMode) {
        console.log('✅ All permissions are correctly set!');
      } else {
        console.log('❌ Some permissions are incorrect!');
        process.exit(1);
      }
    } else {
      console.log('ℹ️  Windows system detected - Unix permissions not applicable');
      console.log('   Windows uses ACLs for file security');
      console.log('✅ Config file created successfully');
    }
    
    // Clean up test file
    console.log('\n🧹 Cleaning up test config...');
    await configStore.reset();
    console.log('✅ Test complete!');
    
  } catch (error: any) {
    console.error(`\n❌ Test failed: ${error.message}`);
    process.exit(1);
  }
}

testConfigPermissions();
