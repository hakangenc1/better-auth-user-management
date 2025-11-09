import { useState } from "react";
import { redirect } from "react-router";
import type { Route } from "./+types/setup.database";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { ThemeToggle } from "~/components/ui/theme-toggle";
import { AlertCircle, Database, CheckCircle2 } from "lucide-react";
import { existsSync, writeFileSync, readFileSync } from "fs";
import { join } from "path";

export function meta() {
  return [
    { title: "Database Setup - User Management System" },
    { name: "description", content: "Configure your database connection" },
  ];
}

export async function loader() {
  // Check if .env file exists and has DATABASE_URL configured
  const envPath = join(process.cwd(), ".env");
  const hasEnv = existsSync(envPath);
  
  if (hasEnv) {
    const envContent = readFileSync(envPath, "utf-8");
    if (envContent.includes("DATABASE_URL") && envContent.includes("DATABASE_TYPE")) {
      // Database already configured, redirect to setup
      throw redirect("/setup");
    }
  }

  return { hasEnv };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const dbType = formData.get("dbType") as string;
  const connectionString = formData.get("connectionString") as string;

  try {
    // Validate connection string based on database type
    if (!connectionString) {
      return { error: "Connection string is required" };
    }

    // Create or update .env file
    const envPath = join(process.cwd(), ".env");
    let envContent = "";

    if (existsSync(envPath)) {
      envContent = readFileSync(envPath, "utf-8");
    }

    // Update or add DATABASE_URL and DATABASE_TYPE
    const lines = envContent.split("\n");
    const updatedLines = lines.filter(
      (line) => !line.startsWith("DATABASE_URL=") && !line.startsWith("DATABASE_TYPE=")
    );

    updatedLines.push(`DATABASE_URL="${connectionString}"`);
    updatedLines.push(`DATABASE_TYPE="${dbType}"`);

    writeFileSync(envPath, updatedLines.join("\n"));

    // Test connection based on database type
    if (dbType === "sqlite") {
      const Database = (await import("better-sqlite3")).default;
      const db = new Database(connectionString);
      db.close();
    } else if (dbType === "postgresql") {
      const { Pool } = await import("pg");
      const pool = new Pool({ connectionString });
      await pool.query("SELECT 1");
      await pool.end();
    } else if (dbType === "mysql") {
      const { createPool } = await import("mysql2/promise");
      const pool = createPool(connectionString);
      await pool.query("SELECT 1");
      await pool.end();
    }

    return redirect("/setup");
  } catch (error) {
    console.error("Database connection error:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to connect to database",
    };
  }
}

export default function DatabaseSetup() {
  const [dbType, setDbType] = useState<string>("sqlite");
  const [connectionString, setConnectionString] = useState<string>("./data/auth.db");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getPlaceholder = () => {
    switch (dbType) {
      case "postgresql":
        return "postgresql://user:password@localhost:5432/database";
      case "mysql":
        return "mysql://user:password@localhost:3306/database";
      case "sqlite":
      default:
        return "./data/auth.db";
    }
  };

  const getDescription = () => {
    switch (dbType) {
      case "postgresql":
        return "Enter your PostgreSQL connection string. Format: postgresql://user:password@host:port/database";
      case "mysql":
        return "Enter your MySQL connection string. Format: mysql://user:password@host:port/database";
      case "sqlite":
      default:
        return "Enter the path to your SQLite database file. It will be created if it doesn't exist.";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-6 w-6" />
            <CardTitle>Database Configuration</CardTitle>
          </div>
          <CardDescription>
            Configure your database connection before creating your admin account
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This is a one-time setup. Choose your database type and provide the connection details.
            </AlertDescription>
          </Alert>

          <form method="post" className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="dbType">Database Type</Label>
              <Select
                name="dbType"
                value={dbType}
                onValueChange={(value) => {
                  setDbType(value);
                  // Set default connection string for each type
                  if (value === "sqlite") setConnectionString("./data/auth.db");
                  else if (value === "postgresql") setConnectionString("");
                  else if (value === "mysql") setConnectionString("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select database type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sqlite">SQLite (Recommended for development)</SelectItem>
                  <SelectItem value="postgresql">PostgreSQL</SelectItem>
                  <SelectItem value="mysql">MySQL</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="connectionString">Connection String</Label>
              <Input
                id="connectionString"
                name="connectionString"
                type="text"
                value={connectionString}
                onChange={(e) => setConnectionString(e.target.value)}
                placeholder={getPlaceholder()}
                required
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">{getDescription()}</p>
            </div>

            <div className="rounded-lg bg-muted p-4 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                What happens next?
              </h3>
              <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc">
                <li>Your database connection will be saved to .env file</li>
                <li>The connection will be tested to ensure it works</li>
                <li>Database tables will be created automatically</li>
                <li>You'll be redirected to create your first admin account</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitting || !connectionString}
              >
                {isSubmitting ? "Testing Connection..." : "Continue to Admin Setup"}
              </Button>
            </div>
          </form>

          <div className="border-t pt-6">
            <h3 className="text-sm font-semibold mb-3">Database Requirements</h3>
            <div className="grid gap-3 text-xs">
              <div className="flex items-start gap-2">
                <div className="font-mono bg-muted px-2 py-1 rounded">SQLite</div>
                <div className="text-muted-foreground">
                  No installation required. Perfect for development and small deployments.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="font-mono bg-muted px-2 py-1 rounded">PostgreSQL</div>
                <div className="text-muted-foreground">
                  Requires PostgreSQL 12+ and the 'pg' npm package.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="font-mono bg-muted px-2 py-1 rounded">MySQL</div>
                <div className="text-muted-foreground">
                  Requires MySQL 8+ and the 'mysql2' npm package.
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
