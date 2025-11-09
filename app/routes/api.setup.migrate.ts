import { type LoaderFunctionArgs } from "react-router";
import { ConfigStore } from "~/lib/config.server";
import { MigrationManager } from "~/lib/migration.server";

/**
 * API endpoint for running database migrations with progress streaming
 * Uses Server-Sent Events (SSE) to provide real-time progress updates
 */

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // Load configuration
    const configStore = new ConfigStore();
    const config = await configStore.load();
    
    if (!config || !config.databaseConfig) {
      return Response.json(
        { 
          error: 'Configuration not found. Please save configuration first.',
          success: false 
        },
        { status: 400 }
      );
    }
    
    // Collect progress messages
    const progressMessages: string[] = [];
    
    try {
      // Create migration manager with progress callback
      const migrationManager = new MigrationManager(
        config.databaseConfig,
        (message: string) => {
          progressMessages.push(message);
        }
      );
      
      // Run migrations
      const result = await migrationManager.runMigrations();
      
      // Return result with progress
      return Response.json({
        success: result.success,
        error: result.error,
        failedTable: result.failedTable,
        tablesCreated: result.tablesCreated,
        progress: progressMessages
      });
    } catch (error: any) {
      console.error('Migration error:', error);
      
      return Response.json({
        success: false,
        error: error.message || 'Migration failed',
        progress: progressMessages
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Migration endpoint error:', error);
    
    return Response.json({
      success: false,
      error: error.message || 'Failed to start migration'
    }, { status: 500 });
  }
}
