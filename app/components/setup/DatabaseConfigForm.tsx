import { useState } from "react";
import { Button } from "~/components/ui/button";
import { PostgreSQLFields } from "./PostgreSQLFields";
import { SQLiteFields } from "./SQLiteFields";
import { ConnectionTestResult } from "./ConnectionTestResult";
import type { DatabaseConfig } from "~/types";
import { z } from "zod";

interface DatabaseConfigFormProps {
  config: Partial<DatabaseConfig>;
  onNext: (config: DatabaseConfig) => void;
  onBack: () => void;
}

// Validation schemas
const sqliteSchema = z.object({
  type: z.literal("sqlite"),
  sqlite: z.object({
    filePath: z.string().min(1, "File path is required"),
  }),
});

const postgresqlSchema = z.object({
  type: z.literal("postgresql"),
  postgresql: z.object({
    host: z.string().min(1, "Host is required"),
    port: z.number().min(1).max(65535, "Port must be between 1 and 65535"),
    database: z.string().min(1, "Database name is required"),
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
    schema: z.string().optional(),
    ssl: z.boolean().optional(),
  }),
});

export function DatabaseConfigForm({ config, onNext, onBack }: DatabaseConfigFormProps) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    error?: string;
    errorType?: "network" | "authentication" | "permissions" | "unknown";
    suggestions?: string[];
  } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form values based on database type
  const [formValues, setFormValues] = useState<DatabaseConfig>(() => {
    if (config.type === "postgresql") {
      return {
        type: "postgresql",
        postgresql: {
          host: config.postgresql?.host || "localhost",
          port: config.postgresql?.port || 5432,
          database: config.postgresql?.database || "",
          username: config.postgresql?.username || "",
          password: config.postgresql?.password || "",
          schema: config.postgresql?.schema || "",
          ssl: config.postgresql?.ssl || false,
        },
      };
    } else {
      return {
        type: "sqlite",
        sqlite: {
          filePath: config.sqlite?.filePath || "./data/auth.db",
        },
      };
    }
  });

  const handleFieldChange = (field: string, value: string | number | boolean) => {
    setFormValues((prev) => {
      if (prev.type === "postgresql" && prev.postgresql) {
        return {
          ...prev,
          postgresql: {
            ...prev.postgresql,
            [field]: value,
          },
        };
      } else if (prev.type === "sqlite" && prev.sqlite) {
        return {
          ...prev,
          sqlite: {
            ...prev.sqlite,
            [field]: value,
          },
        };
      }
      return prev;
    });
    
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    // Clear test result when form changes
    setTestResult(null);
  };

  const validateForm = (): boolean => {
    try {
      if (formValues.type === "sqlite") {
        sqliteSchema.parse(formValues);
      } else {
        postgresqlSchema.parse(formValues);
      }
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          const field = err.path[err.path.length - 1];
          newErrors[field as string] = err.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleTestConnection = async () => {
    if (!validateForm()) {
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch("/api/setup/test-connection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formValues),
      });

      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        error: "Failed to test connection. Please try again.",
        errorType: "unknown",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleContinue = async () => {
    if (!validateForm() || !testResult?.success) {
      return;
    }

    try {
      // Save configuration to server before proceeding
      const response = await fetch("/api/setup/save-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formValues),
      });

      const result = await response.json();

      if (result.success) {
        // Configuration saved successfully, proceed to next step
        onNext(formValues);
      } else {
        // Show error if save failed
        setTestResult({
          success: false,
          error: result.error || "Failed to save configuration",
          errorType: "unknown",
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        error: "Failed to save configuration. Please try again.",
        errorType: "unknown",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2 text-foreground">Configure Database Connection</h2>
        <p className="text-muted-foreground">
          Enter your {formValues.type === "sqlite" ? "SQLite" : "PostgreSQL"} database details
        </p>
      </div>

      {/* Form Fields */}
      <div className="bg-card border rounded-lg p-6">
        {formValues.type === "postgresql" && formValues.postgresql && (
          <PostgreSQLFields
            values={formValues.postgresql}
            onChange={handleFieldChange}
            errors={errors}
          />
        )}
        {formValues.type === "sqlite" && formValues.sqlite && (
          <SQLiteFields
            values={formValues.sqlite}
            onChange={handleFieldChange}
            errors={errors}
          />
        )}
      </div>

      {/* Test Connection Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleTestConnection}
          disabled={testing}
          variant="outline"
          size="lg"
        >
          {testing ? (
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
              Testing Connection...
            </>
          ) : (
            "Test Connection"
          )}
        </Button>
      </div>

      {/* Test Result */}
      {testResult && (
        <ConnectionTestResult result={testResult} />
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4">
        <Button onClick={onBack} variant="outline" size="lg">
          Back
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!testResult?.success}
          size="lg"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
