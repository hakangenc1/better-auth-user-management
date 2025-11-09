import { Form, useActionData, useNavigation } from "react-router";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Alert, AlertDescription } from "~/components/ui";
import { AlertCircle, Loader2, UserPlus } from "lucide-react";

export function SetupForm() {
    const actionData = useActionData<{ error?: string }>();
    const navigation = useNavigation();
    const isSubmitting = navigation.state === "submitting";
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [validationError, setValidationError] = useState("");

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        if (password !== confirmPassword) {
            e.preventDefault();
            setValidationError("Passwords do not match");
            return;
        }
        if (password.length < 8) {
            e.preventDefault();
            setValidationError("Password must be at least 8 characters long");
            return;
        }
        setValidationError("");
    };

    // Only show error if it exists and we're not currently submitting
    const showError = !isSubmitting && (actionData?.error || validationError);

    return (
        <Form method="post" className="space-y-6" onSubmit={handleSubmit}>
            {showError && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{actionData?.error || validationError}</AlertDescription>
                </Alert>
            )}

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="John Doe"
                        required
                        disabled={isSubmitting}
                        minLength={2}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="admin@example.com"
                        required
                        disabled={isSubmitting}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        required
                        disabled={isSubmitting}
                        minLength={8}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                        Must be at least 8 characters long
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        required
                        disabled={isSubmitting}
                        minLength={8}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                </div>
            </div>

            <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Admin Account...
                    </>
                ) : (
                    <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Create Admin Account
                    </>
                )}
            </Button>
        </Form>
    );
}
