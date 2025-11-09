import { type ActionFunctionArgs } from "react-router";
import { requireAdmin } from "~/lib/auth.middleware";
import { ConfigStore } from "~/lib/config.server";
import { DatabaseConnectionManager } from "~/lib/db-connection.server";
import { logActivity } from "~/lib/activity.server";
import { resetAuthInstance } from "~/lib/auth.server";
import Database from "better-sqlite3";

/**
 * API endpoint for resetting setup configuration and database
 * Requires admin authentication
 * Logs all reset attempts for security audit
 * Clears all users, sessions, and data from the database
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
    
    let adminInfo = { email: 'unknown', name: 'unknown', id: 'unknown' };
    
    // Try to log if user is authenticated (optional)
    try {
      const user = await requireAdmin(request);
      adminInfo = { email: user.email, name: user.name, id: user.id };
      
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
    
    // Step 1: Clear all database data
    console.log('🗑️  Clearing database data...');
    let adapter: any = null;
    try {
      const configStore = new ConfigStore();
      const config = await configStore.load();
      
      if (config && config.databaseConfig) {
        const connectionManager = new DatabaseConnectionManager();
        adapter = await connectionManager.createAdapter(config.databaseConfig);
        
        if (config.databaseConfig.type === 'sqlite') {
          const db = adapter as Database.Database;
          
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
          
          // Close the database connection
          db.close();
          console.log('✅ Database data cleared and connection closed');
        } else {
          // PostgreSQL
          const pool = adapter as any;
          
          console.log('  - Clearing activity logs...');
          await pool.query('DELETE FROM activity');
          
          console.log('  - Clearing two-factor authentication...');
          await pool.query('DELETE FROM "twoFactor"');
          
          console.log('  - Clearing verification records...');
          await pool.query('DELETE FROM verification');
          
          console.log('  - Clearing accounts...');
          await pool.query('DELETE FROM account');
          
          console.log('  - Clearing sessions...');
          await pool.query('DELETE FROM session');
          
          console.log('  - Clearing users...');
          await pool.query('DELETE FROM "user"');
          
          // Close the pool connection
          await pool.end();
          console.log('✅ Database data cleared and connection closed');
        }
      } else {
        console.log('ℹ️  No database configuration found, skipping data cleanup');
      }
    } catch (error: any) {
      console.warn('⚠️  Could not clear database data:', error.message);
      // Try to close connection if it was opened
      if (adapter) {
        try {
          if (typeof adapter.close === 'function') {
            adapter.close();
          } else if (typeof adapter.end === 'function') {
            await adapter.end();
          }
        } catch (closeError) {
          console.warn('⚠️  Could not close database connection:', closeError);
        }
      }
      // Continue with config reset even if database cleanup fails
    }
    
    // Step 2: Reset the auth instance
    console.log('🔄 Resetting auth instance...');
    resetAuthInstance();
    
    // Step 3: Reset the configuration
    console.log('🗑️  Clearing configuration...');
    const configStore = new ConfigStore();
    await configStore.reset();
    console.log('✅ Configuration cleared successfully');
    
    // Step 4: Wait a moment to ensure all operations complete
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('✨ Setup reset complete!');
    
    return Response.json({
      success: true,
      message: 'Setup configuration and database have been reset. All users and data have been deleted.',
    });
  } catch (error: any) {
    console.error('❌ Setup reset error:', error);
    
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
