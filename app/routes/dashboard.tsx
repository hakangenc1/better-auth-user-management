import { Outlet, redirect, Link, Form } from "react-router";
import type { Route } from "./+types/dashboard";
import { auth } from "~/lib/auth.server";
import { requireAuth } from "~/lib/auth.middleware";
import { Button } from "~/components/ui/button";
import { ThemeToggle } from "~/components/ui/theme-toggle";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Dashboard - User Management System" },
    { name: "description", content: "User management dashboard" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  // Use authentication middleware to check for authenticated admin user
  const user = await requireAuth(request);

  // Return user data to be available in the route context
  return { user };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "logout") {
    // Sign out using Better Auth
    await auth.api.signOut({
      headers: request.headers,
    });
    throw redirect("/");
  }

  return null;
}

interface DashboardLoaderData {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  const data = loaderData as unknown as DashboardLoaderData;

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Navigation Header */}
      <nav className="bg-card shadow-sm border-b flex-shrink-0">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-8">
              <Link to="/dashboard" className="text-xl font-bold text-foreground">
                User Management System
              </Link>
              
              {/* Navigation Links */}
              <div className="hidden md:flex space-x-4">
                <Link
                  to="/dashboard"
                  className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  to="/dashboard/users"
                  className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  Users
                </Link>
                <Link
                  to="/dashboard/activity"
                  className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  Activity
                </Link>
              </div>
            </div>

            {/* User Info and Logout */}
            <div className="flex items-center space-x-4">
              <div className="text-sm text-foreground">
                <span className="font-medium">{data.user.name}</span>
                <span className="text-muted-foreground ml-2">({data.user.email})</span>
              </div>
              <ThemeToggle />
              <Form method="post">
                <input type="hidden" name="intent" value="logout" />
                <Button type="submit" variant="default" size="default">
                  Logout
                </Button>
              </Form>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto px-4 py-8 h-full">
          <Outlet context={{ user: data.user }} />
        </div>
      </div>
    </div>
  );
}
