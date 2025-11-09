import { redirect } from "react-router";
import type { Route } from "./+types/home";
import { getSetupStatus } from "~/middleware/setup-check.server";
import { auth } from "~/lib/auth.server";

export function meta() {
  return [
    { title: "User Management System" },
    { name: "description", content: "Welcome to User Management System" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  // Check if setup is complete
  const setupComplete = await getSetupStatus();
  
  if (!setupComplete) {
    throw redirect("/setup");
  }
  
  // Check if user is authenticated
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    // If authenticated, redirect to dashboard
    if (session?.user) {
      throw redirect("/dashboard");
    }
  } catch (error) {
    // If auth check fails, continue to login redirect
    console.error("Error checking session:", error);
  }
  
  // Not authenticated, redirect to login
  throw redirect("/login");
}

export default function Home() {
  return null;
}
