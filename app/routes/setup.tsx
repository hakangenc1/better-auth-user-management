import { type LoaderFunctionArgs, type ActionFunctionArgs } from "react-router";
import { ConfigStore } from "~/lib/config.server";
import { requireSetupIncomplete } from "~/middleware/setup-check.server";

/**
 * Setup wizard main route
 * Handles multi-step setup process for database configuration
 */

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // Redirect to login if setup is already complete
    await requireSetupIncomplete(request);
    
    // Return initial state for setup wizard
    return Response.json({ 
      step: 1,
      setupComplete: false 
    });
  } catch (error: any) {
    // If it's a redirect, let it through
    if (error instanceof Response) {
      throw error;
    }
    
    console.error('Setup loader error:', error);
    return Response.json({ 
      step: 1,
      setupComplete: false,
      error: error.message 
    });
  }
}

export async function action({ request }: ActionFunctionArgs) {
  try {
    const formData = await request.formData();
    const action = formData.get('action') as string;
    
    // Route to appropriate handler based on action
    switch (action) {
      case 'check-status':
        return await handleCheckStatus();
      default:
        return Response.json({ 
          error: 'Invalid action',
          success: false 
        }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Setup action error:', error);
    return Response.json({ 
      error: error.message || 'An error occurred',
      success: false 
    }, { status: 500 });
  }
}

/**
 * Check setup status
 */
async function handleCheckStatus() {
  try {
    const configStore = new ConfigStore();
    const isComplete = await configStore.isSetupComplete();
    
    return Response.json({ 
      setupComplete: isComplete,
      success: true 
    });
  } catch (error: any) {
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
}

import { SetupWizard } from "~/components/setup/SetupWizard";

/**
 * Setup wizard UI component
 */
export default function Setup() {
  return <SetupWizard />;
}
