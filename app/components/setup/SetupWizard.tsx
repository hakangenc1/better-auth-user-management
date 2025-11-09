import { useState } from "react";
import type { DatabaseConfig } from "~/types";
import { StepIndicator } from "./StepIndicator";
import { DatabaseTypeSelector } from "./DatabaseTypeSelector";
import { DatabaseConfigForm } from "./DatabaseConfigForm";
import { MigrationProgress } from "./MigrationProgress";
import { AdminUserForm } from "./AdminUserForm";
import { SetupComplete } from "./SetupComplete";
import { ThemeToggle } from "~/components/ui/theme-toggle";

interface SetupWizardProps {
  initialStep?: number;
}

export function SetupWizard({ initialStep = 1 }: SetupWizardProps) {
  const [step, setStep] = useState(initialStep);
  const [config, setConfig] = useState<Partial<DatabaseConfig>>({});
  const [adminEmail, setAdminEmail] = useState<string>("");

  const totalSteps = 5;

  const handleTypeSelect = (type: "sqlite" | "postgresql") => {
    setConfig({ type });
    setStep(2);
  };

  const handleConfigSubmit = (dbConfig: DatabaseConfig) => {
    setConfig(dbConfig);
    setStep(3);
  };

  const handleMigrationComplete = () => {
    setStep(4);
  };

  const handleSetupComplete = (email: string) => {
    setAdminEmail(email);
    setStep(5);
  };

  const handleBack = () => {
    if (step > 1 && step < 3) {
      setStep(step - 1);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4 relative">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Welcome to User Management System
          </h1>
          <p className="text-muted-foreground">
            Let's get your application set up in just a few steps
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-card rounded-lg shadow-lg p-8 border">
          {/* Step Indicator */}
          {step < 5 && (
            <StepIndicator currentStep={step} totalSteps={totalSteps} />
          )}

          {/* Step Content */}
          <div className="mt-8">
            {step === 1 && (
              <DatabaseTypeSelector onNext={handleTypeSelect} />
            )}
            {step === 2 && (
              <DatabaseConfigForm
                config={config}
                onNext={handleConfigSubmit}
                onBack={handleBack}
              />
            )}
            {step === 3 && (
              <MigrationProgress onComplete={handleMigrationComplete} />
            )}
            {step === 4 && (
              <AdminUserForm onComplete={handleSetupComplete} />
            )}
            {step === 5 && (
              <SetupComplete adminEmail={adminEmail} />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-6 text-sm text-muted-foreground">
          <p>Need help? Check the documentation or contact support</p>
          {step < 5 && (
            <div className="text-xs">
              <p>Having issues? Run: <code className="bg-muted px-1 py-0.5 rounded">npm run reset-setup</code></p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
