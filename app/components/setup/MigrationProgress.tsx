import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";

interface MigrationProgressProps {
  onComplete: () => void;
}

type MigrationStatus = "running" | "success" | "error";

interface ProgressMessage {
  message: string;
  timestamp: number;
}

export function MigrationProgress({ onComplete }: MigrationProgressProps) {
  const [status, setStatus] = useState<MigrationStatus>("running");
  const [progress, setProgress] = useState<ProgressMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    runMigration();
  }, []);

  const runMigration = async () => {
    try {
      // Add initial message
      setProgress([{ message: "Starting migration process...", timestamp: Date.now() }]);
      
      // Call migration API with cache busting
      const response = await fetch(`/api/setup/migrate?t=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Add all progress messages
      if (result.progress && Array.isArray(result.progress)) {
        result.progress.forEach((msg: string) => {
          setProgress((prev) => [
            ...prev,
            { message: msg, timestamp: Date.now() },
          ]);
        });
      }
      
      // Check result
      if (result.success) {
        setProgress((prev) => [
          ...prev,
          { message: "Migration completed successfully!", timestamp: Date.now() },
        ]);
        setStatus("success");
        setTimeout(() => {
          onComplete();
        }, 1500);
      } else {
        setStatus("error");
        setError(result.error || "Migration failed");
        setProgress((prev) => [
          ...prev,
          { message: `Error: ${result.error}`, timestamp: Date.now() },
        ]);
      }
    } catch (err: any) {
      console.error("Migration error:", err);
      setStatus("error");
      setError(`Failed to run migration: ${err.message || err}`);
      setProgress((prev) => [
        ...prev,
        { message: `Error: ${err.message || err}`, timestamp: Date.now() },
      ]);
    }
  };

  const handleRetry = () => {
    setStatus("running");
    setProgress([]);
    setError(null);
    runMigration();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2 text-foreground">Setting Up Database</h2>
        <p className="text-muted-foreground">
          {status === "running" && "Creating tables and configuring your database..."}
          {status === "success" && "Database setup completed successfully!"}
          {status === "error" && "An error occurred during setup"}
        </p>
      </div>

      {/* Progress Log */}
      <div className="bg-black dark:bg-gray-950 rounded-lg p-4 min-h-[300px] max-h-[400px] overflow-y-auto border">
        <div className="font-mono text-sm space-y-1">
          {progress.map((item, index) => (
            <div key={index} className="text-gray-300 dark:text-gray-400 flex items-start gap-2">
              <span className="text-gray-500 dark:text-gray-600 shrink-0">
                {new Date(item.timestamp).toLocaleTimeString()}
              </span>
              <span className="flex-1">{item.message}</span>
            </div>
          ))}
          
          {/* Loading indicator */}
          {status === "running" && (
            <div className="flex items-center gap-2 text-blue-400 dark:text-blue-500 animate-pulse">
              <svg
                className="animate-spin h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Processing...</span>
            </div>
          )}
        </div>
      </div>

      {/* Status Messages */}
      {status === "success" && (
        <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex gap-3">
            <svg
              className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="font-medium text-green-800 dark:text-green-200">Migration Successful</p>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                All database tables have been created successfully. Proceeding to admin user creation...
              </p>
            </div>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex gap-3">
            <svg
              className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <p className="font-medium text-red-800 dark:text-red-200">Migration Failed</p>
              {error && (
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
              )}
              <div className="mt-3">
                <Button onClick={handleRetry} variant="outline" size="sm">
                  Retry Migration
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tables Created List */}
      {progress.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
            Tables Created:
          </p>
          <div className="flex flex-wrap gap-2">
            {progress
              .filter((p) => p.message.includes("Created table") || p.message.includes("table"))
              .map((p, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                >
                  {p.message.replace("Created table:", "").replace("✓", "").trim()}
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
