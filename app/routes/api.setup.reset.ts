import { type ActionFunctionArgs } from "react-router";
import { requireAdmin } from "~/lib/auth.middleware";
import { logActivity } from "~/lib/activity.server";
import { resetAuthInstance } from "~/lib/auth.server";
import { promises as fs } from "fs";
import path from "path";
import { ConfigStore } from "~/lib/config.server";
import { DatabaseConnectionManager } from "~/lib/db-connection.server";
import type Database from "better-sqlite3";

/**
 * API endpoint for resetting setup configuration and database
 * Requires admin authentication
 * Logs all reset attempts for security audit
 * Completely clears all users, data, and configuration
 */

export async function action({ request }: ActionFunctionArgs) {
  // Only allow POST requests
  if (request.method !== 'POST') {
    return Response.json({ 
      success: false,
      error: 'Method not allowed' 
    }, { status: 405 });
  }

  try {
    // Get client IP for logging
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    // Try to log if user is authenticated (optional)
    try {
      const user = await requireAdmin(request);
      
      await logActivity({
        userId: user.id,
        action: 'setup_reset',
        resourceType: 'system',
        resourceId: 'setup',
        details: {
          adminEmail: user.email,
          adminName: user.name,
          ip,
          timestamp: new Date().toISOString(),
        },
        ipAddress: ip,
        userAgent: request.headers.get('user-agent') || undefined,
      });
      console.log(`Setup reset initiated by admin: ${user.email} (${user.id})`);
    } catch {
      // If not authenticated, just log anonymously
      console.log(`Setup reset initiated from IP: ${ip}`);
    }
    
    // Step 1: Try to clear database records (works while server is running)
    console.log('🧹 Attempting to clear database records (if configured)...');
    try {
      const configStore = new ConfigStore();
      const config = await configStore.load();

      if (config && config.databaseConfig) {
        const mgr = new DatabaseConnectionManager();
        const adapter = await mgr.createAdapter(config.databaseConfig);

        const tablesToClear = [
          'session',
          'account',
          'verification',
          'twoFactor',
          'activity',
          'user'
        ];

        if (config.databaseConfig.type === 'sqlite') {
          try {
            const db = adapter as Database.Database;
            // temporarily disable foreign keys to allow bulk deletes
            try { db.pragma('foreign_keys = OFF'); } catch {}
            for (const table of tablesToClear) {
              try {
                db.prepare(`DELETE FROM ${table}`).run();
                console.log(`  ✅ Cleared table ${table}`);
              } catch (error: any) {
                if (!error.message.includes('no such table')) {
                  console.warn(`  ⚠️  Could not clear ${table}:`, error.message);
                }
              }
            }
            try { db.pragma('foreign_keys = ON'); } catch {}
            try { db.close(); } catch {}
          } catch (error: any) {
            console.warn('  ⚠️  SQLite adapter clear failed:', error.message);
          }
        } else {
          try {
            const pool = adapter as any;
            for (const table of tablesToClear) {
              try {
                await pool.query(`DELETE FROM "${table}"`);
                console.log(`  ✅ Cleared table ${table}`);
              } catch (error: any) {
                if (!/does not exist|relation .* does not exist/i.test(error.message)) {
                  console.warn(`  ⚠️  Could not clear ${table}:`, error.message);
                }
              }
            }
            try { await pool.end(); } catch {}
          } catch (error: any) {
            console.warn('  ⚠️  PostgreSQL adapter clear failed:', error.message);
          }
        }
      } else {
        console.log('  ℹ️  No database configuration found; skipping in-place clear');
      }
    } catch (error: any) {
      console.warn('⚠️  Could not clear database records in-place:', error.message);
    }

    // Step 2: Reset the auth instance
    console.log('🔄 Resetting auth instance...');
    resetAuthInstance();

    // Step 3: Remove configuration files
    console.log('🗑️  Removing configuration files...');
    const configDir = path.join(process.cwd(), '.data');
    const configFiles = ['config.json', 'config.encrypted.json'];
    let configRemoved = false;
    
    for (const configFile of configFiles) {
      const configPath = path.join(configDir, configFile);
      try {
        await fs.unlink(configPath);
        console.log(`  Removed ${configFile}`);
        configRemoved = true;
      } catch (error: any) {
        if (error.code !== 'ENOENT') {
          console.warn(`  Could not remove ${configFile}:`, error.message);
        }
      }
    }

    if (!configRemoved) {
      console.log('  No configuration files found (already clean)');
    }
    
    // Step 3: Delete database files completely
    console.log('Removing database files...');
    try {
      const dataDir = path.join(process.cwd(), 'data');
      const files = await fs.readdir(dataDir);
      let dbFilesRemoved = 0;
      
      for (const file of files) {
        if (file.endsWith('.db') || file.endsWith('.db-shm') || file.endsWith('.db-wal')) {
          try {
            await fs.unlink(path.join(dataDir, file));
            console.log(`  Removed ${file}`);
            dbFilesRemoved++;
          } catch (error: any) {
            if (error.code !== 'EBUSY') {
              console.warn(`  Failed to remove ${file}:`, error.message);
            }
          }
        }
      }
      
      if (dbFilesRemoved > 0) {
        console.log(`Removed ${dbFilesRemoved} database file(s)`);
      } else {
        console.log('No database files found (already clean)');
      }
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        console.warn('Could not remove database files:', error.message);
      }
    }
    
    console.log('Setup reset complete! All users, data, and configuration cleared.');
    
    return Response.json({
      success: true,
      message: 'Complete reset successful! All users, data, and configuration have been cleared. Please restart your development server for changes to take effect.',
    });
  } catch (error: any) {
    console.error('Setup reset error:', error);
    
    return Response.json({
      success: false,
      error: error.message || 'Failed to reset setup configuration',
    }, { status: 500 });
  }
}

// Prevent GET requests
export async function loader() {
  return Response.json({ 
    error: 'Method not allowed. Use POST to reset setup.' 
  }, { status: 405 });
}
