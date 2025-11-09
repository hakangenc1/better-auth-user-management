interface ConnectionTestResultProps {
  result: {
    success: boolean;
    error?: string;
    errorType?: "network" | "authentication" | "permissions" | "unknown";
    suggestions?: string[];
  };
}

export function ConnectionTestResult({ result }: ConnectionTestResultProps) {
  if (result.success) {
    return (
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
            <p className="font-medium text-green-800 dark:text-green-200">Connection Successful</p>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              Your database connection is working correctly. You can proceed to the next step.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
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
          <p className="font-medium text-red-800 dark:text-red-200">Connection Failed</p>
          
          {/* Error Message */}
          {result.error && (
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              {result.error}
            </p>
          )}

          {/* Error Type Badge */}
          {result.errorType && (
            <div className="mt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
                {result.errorType.charAt(0).toUpperCase() + result.errorType.slice(1)} Error
              </span>
            </div>
          )}

          {/* Troubleshooting Suggestions */}
          {result.suggestions && result.suggestions.length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                Troubleshooting Suggestions:
              </p>
              <ul className="space-y-1">
                {result.suggestions.map((suggestion, index) => (
                  <li key={index} className="text-sm text-red-700 dark:text-red-300 flex items-start gap-2">
                    <svg
                      className="w-4 h-4 shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
