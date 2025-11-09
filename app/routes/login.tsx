import { redirect } from "react-router";
import { useSearchParams } from "react-router";
import type { Route } from "./+types/login";
import { auth } from "~/lib/auth.server";
import { requireSetupComplete } from "~/middleware/setup-check.server";
import { LoginForm } from "~/components/auth/LoginForm";
import { ThemeToggle } from "~/components/ui/theme-toggle";
import { Alert, AlertDescription } from "~/components/ui";
import { CheckCircle2 } from "lucide-react";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Login - User Management System" },
    { name: "description", content: "Login to access the user management dashboard" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  // Check if setup is complete first, redirect to setup if not
  await requireSetupComplete(request);

  // Check if user is already authenticated
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    // If authenticated, redirect to dashboard
    if (session?.user) {
      throw redirect("/dashboard");
    }
  } catch (error) {
    // If auth check fails, continue to login page
    console.error("Error checking session:", error);
  }

  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const { RateLimiter, getClientIP, logSecurityEvent } = await import("~/lib/security.server");
  
  const ip = getClientIP(request);
  const rateLimiter = new RateLimiter();
  
  // Password login: 5 attempts per 15 minutes
  const rateLimit = await rateLimiter.check(`login:password:${ip}`, 5, 15 * 60 * 1000);
  
  if (!rateLimit.allowed) {
    logSecurityEvent({
      type: "rate_limit",
      ip,
      userAgent: request.headers.get("user-agent") || undefined,
      details: "Password login rate limit exceeded",
    });
    
    return Response.json(
      { 
        error: `Too many login attempts. Please try again after ${rateLimit.resetAt.toLocaleTimeString()}` 
      },
      { 
        status: 429,
        headers: {
          "Retry-After": Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000).toString(),
        },
      }
    );
  }
  
  return null;
}

export default function Login() {
  const [searchParams] = useSearchParams();
  const setupComplete = searchParams.get("setup") === "complete";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="max-w-md w-full space-y-8 p-8">
        <div>
          <h2 className="text-center text-3xl font-bold text-foreground">
            User Management System
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Sign in to access the dashboard
          </p>
        </div>

        {setupComplete && (
          <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              Admin account created successfully! You can now login.
            </AlertDescription>
          </Alert>
        )}

        <LoginForm />
      </div>
    </div>
  );
}
