import { createAuthClient } from "better-auth/react";
import { adminClient, twoFactorClient, multiSessionClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" 
    ? window.location.origin 
    : process.env.VITE_API_URL || "http://localhost:5173",
  plugins: [
    adminClient(),
    twoFactorClient({
      twoFactorPage: "/two-factor",
    }),
    multiSessionClient(),
  ],
});
