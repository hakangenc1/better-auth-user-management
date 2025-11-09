import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface Activity {
  id: string;
  action: string;
  user: string;
  target?: string;
  timestamp: Date;
  type: "create" | "delete" | "ban" | "unban" | "edit" | "role";
  metadata?: any;
}

interface ActivityContextType {
  activities: Activity[];
  logActivity: (activity: Omit<Activity, "id" | "timestamp">) => Promise<void>;
  refreshActivities: () => Promise<void>;
  isLoading: boolean;
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

export function ActivityProvider({ children }: { children: React.ReactNode }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch activities from database
  const refreshActivities = useCallback(async () => {
    try {
      const response = await fetch("/api/activity?limit=50");
      if (response.ok) {
        const data = await response.json();
        setActivities(
          data.activities.map((a: any) => ({
            ...a,
            timestamp: new Date(a.timestamp),
          }))
        );
      } else {
        // Fallback to localStorage if API is not available yet
        console.warn("Activity API not available, using localStorage fallback");
        const stored = localStorage.getItem("admin_activities");
        if (stored) {
          const parsed = JSON.parse(stored);
          setActivities(
            parsed.map((a: any) => ({
              ...a,
              timestamp: new Date(a.timestamp),
            }))
          );
        }
      }
    } catch (error) {
      console.error("Failed to fetch activities:", error);
      // Fallback to localStorage on error
      try {
        const stored = localStorage.getItem("admin_activities");
        if (stored) {
          const parsed = JSON.parse(stored);
          setActivities(
            parsed.map((a: any) => ({
              ...a,
              timestamp: new Date(a.timestamp),
            }))
          );
        }
      } catch (e) {
        console.error("Failed to load from localStorage:", e);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Log activity to database
  const logActivity = async (activity: Omit<Activity, "id" | "timestamp">) => {
    const newActivity: Activity = {
      ...activity,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    try {
      const response = await fetch("/api/activity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(activity),
      });

      if (response.ok) {
        const data = await response.json();
        const dbActivity: Activity = {
          ...data.activity,
          timestamp: new Date(data.activity.timestamp),
        };
        
        // Update the UI with database response
        setActivities((prev) => [dbActivity, ...prev]);
      } else {
        // Fallback to localStorage if API is not available
        console.warn("Activity API not available, using localStorage fallback");
        setActivities((prev) => [newActivity, ...prev]);
        
        // Store in localStorage
        const stored = localStorage.getItem("admin_activities");
        const existing = stored ? JSON.parse(stored) : [];
        const updated = [newActivity, ...existing].slice(0, 50);
        localStorage.setItem("admin_activities", JSON.stringify(updated));
      }
    } catch (error) {
      console.error("Failed to log activity:", error);
      // Fallback to localStorage on error
      setActivities((prev) => [newActivity, ...prev]);
      
      try {
        const stored = localStorage.getItem("admin_activities");
        const existing = stored ? JSON.parse(stored) : [];
        const updated = [newActivity, ...existing].slice(0, 50);
        localStorage.setItem("admin_activities", JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to save to localStorage:", e);
      }
    }
  };

  // Load activities from database on mount
  useEffect(() => {
    refreshActivities();
  }, [refreshActivities]);

  // Refresh activities every 30 seconds to stay in sync
  useEffect(() => {
    const interval = setInterval(() => {
      refreshActivities();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [refreshActivities]);

  const value: ActivityContextType = {
    activities,
    logActivity,
    refreshActivities,
    isLoading,
  };

  return (
    <ActivityContext.Provider value={value}>{children}</ActivityContext.Provider>
  );
}

export function useActivity() {
  const context = useContext(ActivityContext);
  if (context === undefined) {
    throw new Error("useActivity must be used within an ActivityProvider");
  }
  return context;
}
