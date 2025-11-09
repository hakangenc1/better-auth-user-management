import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { useState } from "react";

interface DatabaseTypeSelectorProps {
  onNext: (type: "sqlite" | "postgresql") => void;
}

export function DatabaseTypeSelector({ onNext }: DatabaseTypeSelectorProps) {
  const [selectedType, setSelectedType] = useState<"sqlite" | "postgresql" | null>(null);

  const handleSelect = (type: "sqlite" | "postgresql") => {
    setSelectedType(type);
  };

  const handleContinue = () => {
    if (selectedType) {
      onNext(selectedType);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2 text-foreground">Choose Your Database</h2>
        <p className="text-muted-foreground">
          Select the database type you want to use for your application
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* SQLite Option */}
        <Card
          className={cn(
            "cursor-pointer transition-all hover:shadow-md",
            selectedType === "sqlite" && "ring-2 ring-primary border-primary"
          )}
          onClick={() => handleSelect("sqlite")}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
                  />
                </svg>
              </div>
              <div>
                <CardTitle className="text-lg">SQLite</CardTitle>
                <CardDescription>File-based database</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-green-600 dark:text-green-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Easy to set up, no server required</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-green-600 dark:text-green-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Perfect for small to medium applications</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-green-600 dark:text-green-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Zero configuration, works out of the box</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* PostgreSQL Option */}
        <Card
          className={cn(
            "cursor-pointer transition-all hover:shadow-md",
            selectedType === "postgresql" && "ring-2 ring-primary border-primary"
          )}
          onClick={() => handleSelect("postgresql")}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2"
                  />
                </svg>
              </div>
              <div>
                <CardTitle className="text-lg">PostgreSQL</CardTitle>
                <CardDescription>Enterprise database</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-green-600 dark:text-green-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Powerful and scalable for large applications</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-green-600 dark:text-green-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Advanced features and better concurrency</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-green-600 dark:text-green-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Ideal for production environments</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleContinue}
          disabled={!selectedType}
          size="lg"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
