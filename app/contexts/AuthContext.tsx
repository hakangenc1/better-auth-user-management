import React, { createContext, useContext, useEffect, useState } from "react";
import { authClient } from "~/lib/auth.client";

interface User {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  emailVerified: boolean;
  banned?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch session on mount
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data: session } = await authClient.getSession();
        if (session?.user) {
          setUser(session.user as User);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error fetching session:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();
  }, []);

  const isAdmin = user?.role === "admin";

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await authClient.signIn.email({
        email,
        password,
      });

      if (result.error) {
        throw new Error(result.error.message || "Login failed");
      }

      // Fetch updated session after login
      const { data: session } = await authClient.getSession();
      if (session?.user) {
        const userData = session.user as User;
        
        // Check if user is banned
        if (userData.banned) {
          // Sign out the banned user
          await authClient.signOut();
          throw new Error("Your account has been banned. Please contact support for assistance.");
        }
        
        setUser(userData);
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authClient.signOut();
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAdmin,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
