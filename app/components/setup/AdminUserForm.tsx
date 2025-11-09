import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { z } from "zod";

interface AdminUserFormProps {
  onComplete: (email: string) => void;
}

// Validation schema
const adminUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export function AdminUserForm({ onComplete }: AdminUserFormProps) {
  const [formValues, setFormValues] = useState({
    email: "",
    name: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleFieldChange = (field: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    setSubmitError(null);
  };

  const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
    if (password.length === 0) return { strength: 0, label: "", color: "" };
    if (password.length < 8) return { strength: 25, label: "Weak", color: "bg-red-500" };
    
    let strength = 25;
    if (password.length >= 12) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 12.5;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 12.5;
    
    if (strength <= 25) return { strength, label: "Weak", color: "bg-red-500" };
    if (strength <= 50) return { strength, label: "Fair", color: "bg-orange-500" };
    if (strength <= 75) return { strength, label: "Good", color: "bg-yellow-500" };
    return { strength, label: "Strong", color: "bg-green-500" };
  };

  const passwordStrength = getPasswordStrength(formValues.password);

  const validateForm = (): boolean => {
    try {
      adminUserSchema.parse(formValues);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          const field = err.path[0];
          newErrors[field as string] = err.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch("/api/setup/create-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formValues.email,
          name: formValues.name,
          password: formValues.password,
        }),
      });

      const result = await response.json();

      if (result.success) {
        onComplete(formValues.email);
      } else {
        setSubmitError(result.error || "Failed to create admin user");
      }
    } catch (error) {
      setSubmitError("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2 text-foreground">Create Admin User</h2>
        <p className="text-muted-foreground">
          Set up your administrator account to manage the application
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">
            Email Address <span className="text-destructive">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="admin@example.com"
            value={formValues.email}
            onChange={(e) => handleFieldChange("email", e.target.value)}
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email}</p>
          )}
        </div>

        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">
            Full Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="John Doe"
            value={formValues.name}
            onChange={(e) => handleFieldChange("name", e.target.value)}
            aria-invalid={!!errors.name}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="password">
            Password <span className="text-destructive">*</span>
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={formValues.password}
            onChange={(e) => handleFieldChange("password", e.target.value)}
            aria-invalid={!!errors.password}
          />
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password}</p>
          )}
          
          {/* Password Strength Indicator */}
          {formValues.password && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Password Strength:</span>
                <span className={`font-medium ${
                  passwordStrength.strength <= 25 ? "text-red-600 dark:text-red-400" :
                  passwordStrength.strength <= 50 ? "text-orange-600 dark:text-orange-400" :
                  passwordStrength.strength <= 75 ? "text-yellow-600 dark:text-yellow-400" :
                  "text-green-600 dark:text-green-400"
                }`}>
                  {passwordStrength.label}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <div
                  className={`h-full rounded-full transition-all ${passwordStrength.color}`}
                  style={{ width: `${passwordStrength.strength}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">
            Confirm Password <span className="text-destructive">*</span>
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={formValues.confirmPassword}
            onChange={(e) => handleFieldChange("confirmPassword", e.target.value)}
            aria-invalid={!!errors.confirmPassword}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-destructive">{errors.confirmPassword}</p>
          )}
        </div>

        {/* Password Requirements */}
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">Password Requirements:</p>
          <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
            <li className="flex items-center gap-2">
              <svg
                className={`w-3 h-3 ${formValues.password.length >= 8 ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              At least 8 characters long
            </li>
            <li className="flex items-center gap-2">
              <svg className="w-3 h-3 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Mix of uppercase and lowercase letters (recommended)
            </li>
            <li className="flex items-center gap-2">
              <svg className="w-3 h-3 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Include numbers and special characters (recommended)
            </li>
          </ul>
        </div>

        {/* Submit Error */}
        {submitError && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p className="text-sm text-red-700 dark:text-red-300">{submitError}</p>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={submitting}
          size="lg"
          className="w-full"
        >
          {submitting ? (
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
              Creating Admin User...
            </>
          ) : (
            "Create Admin User"
          )}
        </Button>
      </form>
    </div>
  );
}
