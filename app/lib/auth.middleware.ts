import { redirect } from "react-router";
import { auth } from "~/lib/auth.server";

/**
 * Authentication middleware for protected routes
 * Checks if the user is authenticated
 * 
 * @param request - The incoming request object
 * @returns The authenticated user object
 * @throws Redirects to login page if not authenticated
 */
export async function requireAuth(request: Request) {
  // Get the current session from Better Auth
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  // Check if user is authenticated
  if (!session?.user) {
    throw redirect("/");
  }

  // Return user data to be available in the route context
  return session.user;
}

/**
 * Admin authentication middleware for admin-only routes
 * Checks if the user is authenticated AND has admin role
 * 
 * @param request - The incoming request object
 * @returns The authenticated admin user object
 * @throws Redirects to dashboard if not admin, or login if not authenticated
 */
export async function requireAdmin(request: Request) {
  // Get the current session from Better Auth
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  // Check if user is authenticated
  if (!session?.user) {
    throw redirect("/");
  }

  // Check if user has admin role
  if (session.user.role !== "admin") {
    throw redirect("/dashboard");
  }

  // Return admin user data
  return session.user;
}
