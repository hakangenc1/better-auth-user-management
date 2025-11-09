import { redirect } from "react-router";
import { ConfigStore } from "~/lib/config.server";

/**
 * Setup completion middleware
 * Ensures setup is complete before accessing protected routes
 * and prevents access to setup wizard after completion
 */

/**
 * Check if setup is complete and redirect accordingly
 * Use this in loaders for protected routes
 */
export async function requireSetupComplete(request: Request): Promise<void> {
  const configStore = new ConfigStore();
  const isComplete = await configStore.isSetupComplete();
  
  if (!isComplete) {
    throw redirect('/setup');
  }
}

/**
 * Check if setup is incomplete and redirect to login if complete
 * Use this in the setup wizard loader
 */
export async function requireSetupIncomplete(request: Request): Promise<void> {
  const configStore = new ConfigStore();
  const isComplete = await configStore.isSetupComplete();
  
  if (isComplete) {
    throw redirect('/login');
  }
}

/**
 * Get setup status without redirecting
 * Useful for conditional rendering or API endpoints
 */
export async function getSetupStatus(): Promise<boolean> {
  try {
    const configStore = new ConfigStore();
    return await configStore.isSetupComplete();
  } catch (error) {
    console.error('Error checking setup status:', error);
    return false;
  }
}
