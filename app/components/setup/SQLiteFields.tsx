import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

interface SQLiteFieldsProps {
  values: {
    filePath: string;
  };
  onChange: (field: string, value: string) => void;
  errors?: Record<string, string>;
}

export function SQLiteFields({ values, onChange, errors = {} }: SQLiteFieldsProps) {
  return (
    <div className="space-y-4">
      {/* File Path */}
      <div className="space-y-2">
        <Label htmlFor="filePath">
          Database File Path <span className="text-destructive">*</span>
        </Label>
        <Input
          id="filePath"
          type="text"
          placeholder="./data/auth.db"
          value={values.filePath}
          onChange={(e) => onChange("filePath", e.target.value)}
          aria-invalid={!!errors.filePath}
        />
        {errors.filePath && (
          <p className="text-sm text-destructive">{errors.filePath}</p>
        )}
        <p className="text-xs text-muted-foreground">
          The file will be created automatically if it doesn't exist
        </p>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex gap-3">
          <svg
            className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium mb-1">SQLite Configuration Tips</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Use a relative path like <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">./data/auth.db</code></li>
              <li>The directory will be created if it doesn't exist</li>
              <li>Ensure the application has write permissions</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Default Value Suggestion */}
      <div className="bg-muted border rounded-lg p-3">
        <p className="text-sm text-foreground">
          <span className="font-medium">Recommended:</span> Use the default path{" "}
          <code className="bg-muted-foreground/10 px-1.5 py-0.5 rounded text-xs">./data/auth.db</code>
        </p>
      </div>
    </div>
  );
}
