import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import type { SetupConfig, DatabaseConfig } from '~/types';

const CONFIG_DIR = '.data';
const CONFIG_FILE = 'config.json';
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;

/**
 * ConfigStore manages persistent storage of database configuration with encryption
 * for sensitive data like passwords.
 */
export class ConfigStore {
  private configPath: string;
  private encryptionKey: Buffer;

  constructor() {
    this.configPath = path.join(process.cwd(), CONFIG_DIR, CONFIG_FILE);
    
    // Derive encryption key from BETTER_AUTH_SECRET
    const secret = process.env.BETTER_AUTH_SECRET;
    if (!secret) {
      throw new Error('BETTER_AUTH_SECRET environment variable is required');
    }
    
    // Use a fixed salt for key derivation (stored in memory, not on disk)
    const salt = Buffer.from('better-auth-config-salt-v1');
    this.encryptionKey = scryptSync(secret, salt, KEY_LENGTH);
    
    // Verify secure location on initialization (async, but don't block constructor)
    this.verifySecureLocation().then(result => {
      if (!result.secure) {
        console.error(`SECURITY WARNING: ${result.message}`);
      }
    }).catch(error => {
      console.warn(`Could not verify config security: ${error.message}`);
    });
  }

  /**
   * Load configuration from disk
   */
  async load(): Promise<SetupConfig | null> {
    try {
      const data = await fs.readFile(this.configPath, 'utf-8');
      const parsed = JSON.parse(data);
      
      // Decrypt sensitive fields
      if (parsed.databaseConfig?.postgresql?.password) {
        parsed.databaseConfig.postgresql.password = this.decrypt(
          parsed.databaseConfig.postgresql.password
        );
      }
      
      return parsed as SetupConfig;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // Config file doesn't exist yet
        return null;
      }
      throw new Error(`Failed to load configuration: ${error.message}`);
    }
  }

  /**
   * Save configuration to disk with encryption
   */
  async save(config: SetupConfig): Promise<void> {
    try {
      // Ensure config directory exists
      await fs.mkdir(path.dirname(this.configPath), { recursive: true });
      
      // Clone config to avoid mutating the original
      const configToSave = JSON.parse(JSON.stringify(config));
      
      // Encrypt sensitive fields
      if (configToSave.databaseConfig?.postgresql?.password) {
        configToSave.databaseConfig.postgresql.password = this.encrypt(
          configToSave.databaseConfig.postgresql.password
        );
      }
      
      // Write to file
      await fs.writeFile(
        this.configPath,
        JSON.stringify(configToSave, null, 2),
        'utf-8'
      );
      
      // Set restrictive file permissions (owner read/write only)
      await this.setSecurePermissions();
    } catch (error: any) {
      throw new Error(`Failed to save configuration: ${error.message}`);
    }
  }

  /**
   * Check if setup is complete
   */
  async isSetupComplete(): Promise<boolean> {
    const config = await this.load();
    return config?.setupComplete === true;
  }

  /**
   * Reset configuration (admin only)
   */
  async reset(): Promise<void> {
    try {
      await fs.unlink(this.configPath);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw new Error(`Failed to reset configuration: ${error.message}`);
      }
      // If file doesn't exist, that's fine
    }
  }

  /**
   * Encrypt sensitive data using AES-256-GCM
   */
  private encrypt(data: string): string {
    try {
      // Generate random IV and salt for this encryption
      const iv = randomBytes(IV_LENGTH);
      const salt = randomBytes(SALT_LENGTH);
      
      // Create cipher
      const cipher = createCipheriv(ALGORITHM, this.encryptionKey, iv);
      
      // Encrypt data
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Get auth tag
      const authTag = cipher.getAuthTag();
      
      // Combine: salt + iv + authTag + encrypted data
      const combined = Buffer.concat([
        salt,
        iv,
        authTag,
        Buffer.from(encrypted, 'hex')
      ]);
      
      return `encrypted:${combined.toString('base64')}`;
    } catch (error: any) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt sensitive data
   */
  private decrypt(encryptedData: string): string {
    try {
      // Check if data is encrypted
      if (!encryptedData.startsWith('encrypted:')) {
        // Data is not encrypted, return as-is (for backward compatibility)
        return encryptedData;
      }
      
      // Remove prefix and decode
      const combined = Buffer.from(encryptedData.slice(10), 'base64');
      
      // Extract components
      const salt = combined.subarray(0, SALT_LENGTH);
      const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
      const authTag = combined.subarray(
        SALT_LENGTH + IV_LENGTH,
        SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH
      );
      const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
      
      // Create decipher
      const decipher = createDecipheriv(ALGORITHM, this.encryptionKey, iv);
      decipher.setAuthTag(authTag);
      
      // Decrypt data
      let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error: any) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Set secure file permissions on config file and directory
   * Sets 600 (owner read/write only) on config file
   * Sets 700 (owner read/write/execute only) on config directory
   */
  private async setSecurePermissions(): Promise<void> {
    try {
      // On Windows, file permissions work differently (ACLs instead of Unix permissions)
      // The fs.chmod call will have limited effect, but we still call it for cross-platform consistency
      if (process.platform !== 'win32') {
        const configDir = path.dirname(this.configPath);
        
        // Set directory permissions to 700 (owner read/write/execute only)
        // Execute permission is needed to access files within the directory
        await fs.chmod(configDir, 0o700);
        
        // Set file permissions to 600 (owner read/write only)
        await fs.chmod(this.configPath, 0o600);
      }
    } catch (error: any) {
      // Log warning but don't fail - permissions might not be supported on all systems
      console.warn(`Warning: Could not set secure permissions on config file: ${error.message}`);
    }
  }

  /**
   * Verify that the .data directory is not web-accessible
   * This checks that the directory is outside the public directory
   */
  async verifySecureLocation(): Promise<{ secure: boolean; message: string }> {
    try {
      const configDir = path.dirname(this.configPath);
      const publicDir = path.join(process.cwd(), 'public');
      const absoluteConfigDir = path.resolve(configDir);
      const absolutePublicDir = path.resolve(publicDir);
      
      // Check if config directory is inside public directory
      const isInsidePublic = absoluteConfigDir.startsWith(absolutePublicDir);
      
      if (isInsidePublic) {
        return {
          secure: false,
          message: 'SECURITY WARNING: Config directory is inside public directory and may be web-accessible!'
        };
      }
      
      // Verify .gitignore includes .data directory
      try {
        const gitignorePath = path.join(process.cwd(), '.gitignore');
        const gitignoreContent = await fs.readFile(gitignorePath, 'utf-8');
        const hasDataIgnore = gitignoreContent.includes('.data') || gitignoreContent.includes('/.data/');
        
        if (!hasDataIgnore) {
          return {
            secure: false,
            message: 'WARNING: .data directory is not in .gitignore. Sensitive config may be committed to version control!'
          };
        }
      } catch (error) {
        // .gitignore might not exist, which is okay
      }
      
      return {
        secure: true,
        message: 'Config directory is secure: outside public directory and in .gitignore'
      };
    } catch (error: any) {
      return {
        secure: false,
        message: `Could not verify secure location: ${error.message}`
      };
    }
  }
}
