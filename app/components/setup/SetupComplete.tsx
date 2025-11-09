import { Button } from "~/components/ui/button";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";

interface SetupCompleteProps {
  adminEmail: string;
}

export function SetupComplete({ adminEmail }: SetupCompleteProps) {
  const navigate = useNavigate();
  const [completing, setCompleting] = useState(true);

  useEffect(() => {
    // Mark setup as complete
    completeSetup();
  }, []);

  const completeSetup = async () => {
    try {
      await fetch("/api/setup/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      console.error("Error completing setup:", error);
    } finally {
      setCompleting(false);
    }
  };

  const handleGoToLogin = () => {
    navigate("/login");
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        {/* Success Icon */}
        <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-green-600 dark:text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h2 className="text-3xl font-bold text-foreground mb-2">
          Setup Complete!
        </h2>
        <p className="text-muted-foreground">
          Your application is ready to use
        </p>
      </div>

      {/* Success Message */}
      <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-6">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5"
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
              <p className="font-medium text-green-800 dark:text-green-200">Database Configured</p>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                Your database has been set up and all tables have been created successfully.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5"
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
              <p className="font-medium text-green-800 dark:text-green-200">Admin User Created</p>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                Your administrator account has been created with the email:
              </p>
              <p className="text-sm font-mono bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded mt-2 inline-block">
                {adminEmail}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5"
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
              <p className="font-medium text-green-800 dark:text-green-200">Setup Locked</p>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                The setup wizard has been locked to prevent unauthorized reconfiguration.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">Next Steps:</p>
        <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
          <li>Click the button below to go to the login page</li>
          <li>Sign in with your admin credentials</li>
          <li>Start managing users and configuring your application</li>
        </ol>
      </div>

      {/* Login Button */}
      <div className="flex justify-center pt-4">
        <Button
          onClick={handleGoToLogin}
          disabled={completing}
          size="lg"
          className="min-w-[200px]"
        >
          {completing ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4"
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
              Finalizing...
            </>
          ) : (
            <>
              Go to Login
              <svg
                className="ml-2 w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </>
          )}
        </Button>
      </div>

      {/* Security Note */}
      <div className="text-center text-xs text-muted-foreground pt-4 border-t">
        <p>
          Keep your admin credentials secure. You can manage additional users and permissions after logging in.
        </p>
      </div>
    </div>
  );
}
