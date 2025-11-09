import { type ActionFunctionArgs } from "react-router";
import { ConfigStore } from "~/lib/config.server";
import { resetAuthInstance } from "~/lib/auth.server";

/**
 * API endpoint for completing setup and locking the setup wizard
 * Sets the setupComplete flag to prevent further access to setup
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
    // Load existing configuration
    const configStore = new ConfigStore();
    const config = await configStore.load();
    
    if (!config) {
      return Response.json({
        success: false,
        error: 'Configuration not found. Please complete setup first.'
      }, { status: 400 });
    }
    
    // Check if already complete
    if (config.setupComplete) {
      return Response.json({
        success: true,
        message: 'Setup is already complete',
        alreadyComplete: true
      });
    }
    
    // Update configuration to mark setup as complete
    const updatedConfig = {
      ...config,
      setupComplete: true,
      updatedAt: new Date().toISOString(),
    };
    
    // Save updated configuration
    await configStore.save(updatedConfig);
    
    // Reset auth instance so it reinitializes with the new configuration
    resetAuthInstance();
    
    // Log setup completion
    console.log('Setup completed successfully at', updatedConfig.updatedAt);
    
    return Response.json({
      success: true,
      message: 'Setup completed successfully. You can now log in.',
      setupComplete: true
    });
  } catch (error: any) {
    console.error('Setup completion error:', error);
    
    return Response.json({
      success: false,
      error: error.message || 'Failed to complete setup',
      suggestions: [
        'Ensure configuration was saved successfully',
        'Verify the application has write permissions',
        'Check the error message for details'
      ]
    }, { status: 500 });
  }
}

/**
 * GET endpoint to check setup completion status
 */
export async function loader() {
  try {
    const configStore = new ConfigStore();
    const isComplete = await configStore.isSetupComplete();
    
    return Response.json({
      success: true,
      setupComplete: isComplete
    });
  } catch (error: any) {
    console.error('Setup status check error:', error);
    
    return Response.json({
      success: false,
      error: error.message || 'Failed to check setup status',
      setupComplete: false
    }, { status: 500 });
  }
}
