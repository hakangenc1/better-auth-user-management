import React, { createContext, useContext, useState, useCallback } from "react";
import { authClient } from "~/lib/auth.client";
import type { User, CreateUserData, UpdateUserData } from "~/types";
import { useActivity } from "~/contexts/ActivityContext";
import { useAuth } from "~/contexts/AuthContext";

interface UserContextType {
  users: User[];
  isLoading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
  createUser: (data: CreateUserData) => Promise<void>;
  updateUser: (userId: string, data: UpdateUserData) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  banUser: (userId: string) => Promise<void>;
  unbanUser: (userId: string) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { logActivity } = useActivity();
  const { user: currentUser } = useAuth();

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await authClient.admin.listUsers({
        query: {
          limit: 100,
          offset: 0,
        },
      });
      
      if (result.error) {
        throw new Error(result.error.message || "Failed to fetch users");
      }

      if (result.data) {
        setUsers(result.data.users as User[]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch users";
      setError(errorMessage);
      console.error("Fetch users error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createUser = useCallback(async (data: CreateUserData) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await authClient.admin.createUser({
        email: data.email,
        name: data.name,
        password: data.password,
        role: data.role,
      });

      if (result.error) {
        throw new Error(result.error.message || "Failed to create user");
      }

      // Optimistic update: add the new user to the list
      if (result.data) {
        const newUser = result.data.user as User;
        setUsers((prevUsers) => [...prevUsers, newUser]);
        
        // Log activity
        logActivity({
          action: `Created user ${newUser.name}`,
          user: currentUser?.name || "Admin",
          target: newUser.email,
          type: "create",
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create user";
      setError(errorMessage);
      console.error("Create user error:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [logActivity, currentUser]);

  const updateUser = useCallback(async (userId: string, data: UpdateUserData) => {
    setIsLoading(true);
    setError(null);
    
    // Optimistic update: update the user in the list immediately
    const previousUsers = [...users];
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === userId ? { ...user, ...data } : user
      )
    );

    try {
      const result = await authClient.admin.updateUser({
        userId,
        data,
      });

      if (result.error) {
        // Revert optimistic update on error
        setUsers(previousUsers);
        throw new Error(result.error.message || "Failed to update user");
      }

      // Update with actual data from server
      if (result.data) {
        const updatedUser = result.data as User;
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === userId ? updatedUser : user
          )
        );
        
        // Log activity
        const changedFields = Object.keys(data).join(", ");
        logActivity({
          action: `Updated user ${updatedUser.name} (${changedFields})`,
          user: currentUser?.name || "Admin",
          target: updatedUser.email,
          type: data.role ? "role" : "edit",
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update user";
      setError(errorMessage);
      console.error("Update user error:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [users, logActivity, currentUser]);

  const deleteUser = useCallback(async (userId: string) => {
    setIsLoading(true);
    setError(null);
    
    // Find user before deleting for activity log
    const userToDelete = users.find((u) => u.id === userId);
    
    // Optimistic update: remove the user from the list immediately
    const previousUsers = [...users];
    setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));

    try {
      const result = await authClient.admin.removeUser({
        userId,
      });

      if (result.error) {
        // Revert optimistic update on error
        setUsers(previousUsers);
        throw new Error(result.error.message || "Failed to delete user");
      }
      
      // Log activity
      if (userToDelete) {
        logActivity({
          action: `Deleted user ${userToDelete.name}`,
          user: currentUser?.name || "Admin",
          target: userToDelete.email,
          type: "delete",
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete user";
      setError(errorMessage);
      console.error("Delete user error:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [users, logActivity, currentUser]);

  const banUser = useCallback(async (userId: string) => {
    setIsLoading(true);
    setError(null);
    
    // Optimistic update
    const previousUsers = [...users];
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === userId ? { ...user, banned: true } : user
      )
    );

    try {
      const result = await authClient.admin.banUser({
        userId,
      });

      if (result.error) {
        setUsers(previousUsers);
        throw new Error(result.error.message || "Failed to ban user");
      }

      // Log activity
      const bannedUser = users.find((u) => u.id === userId);
      if (bannedUser) {
        logActivity({
          action: `Banned user ${bannedUser.name}`,
          user: currentUser?.name || "Admin",
          target: bannedUser.email,
          type: "ban",
        });
      }

      // Refresh to get updated data
      await fetchUsers();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to ban user";
      setError(errorMessage);
      console.error("Ban user error:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [users, fetchUsers, logActivity, currentUser]);

  const unbanUser = useCallback(async (userId: string) => {
    setIsLoading(true);
    setError(null);
    
    // Optimistic update
    const previousUsers = [...users];
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === userId ? { ...user, banned: false } : user
      )
    );

    try {
      const result = await authClient.admin.unbanUser({
        userId,
      });

      if (result.error) {
        setUsers(previousUsers);
        throw new Error(result.error.message || "Failed to unban user");
      }

      // Log activity
      const unbannedUser = users.find((u) => u.id === userId);
      if (unbannedUser) {
        logActivity({
          action: `Unbanned user ${unbannedUser.name}`,
          user: currentUser?.name || "Admin",
          target: unbannedUser.email,
          type: "unban",
        });
      }

      // Refresh to get updated data
      await fetchUsers();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to unban user";
      setError(errorMessage);
      console.error("Unban user error:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [users, fetchUsers, logActivity, currentUser]);

  const value: UserContextType = {
    users,
    isLoading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    banUser,
    unbanUser,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUsers() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUsers must be used within a UserProvider");
  }
  return context;
}
