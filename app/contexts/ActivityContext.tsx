import React, { createContext, useContext, useState, useCallback } from "react";

export interface Activity {
  id: string;
  action: string;
  user: string;
  target?: string;
  timestamp: Date;
  type: "create" | "delete" | "ban" | "unban" | "edit" | "role";
}

interface ActivityContextType {
  activities: Activity[];
  logActivity: (activity: Omit<Activity, "id" | "timestamp">) => void;
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

export function ActivityProvider({ children }: { children: React.ReactNode }) {
  const [activities, setActivities] = useState<Activity[]>([]);

  const logActivity = useCallback((activity: Omit<Activity, "id" | "timestamp">) => {
    const newActivity: Activity = {
      ...activity,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    
    setActivities((prev) => [newActivity, ...prev].slice(0, 50)); // Keep last 50 activities
    
    // Store in localStorage for persistence
    try {
      const stored = localStorage.getItem("admin_activities");
      const existing = stored ? JSON.parse(stored) : [];
      const updated = [newActivity, ...existing].slice(0, 50);
      localStorage.setItem("admin_activities", JSON.stringify(updated));
    } catch (error) {
      console.error("Failed to store activity:", error);
    }
  }, []);

  // Load activities from localStorage on mount
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("admin_activities");
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert timestamp strings back to Date objects
        const activities = parsed.map((a: any) => ({
          ...a,
          timestamp: new Date(a.timestamp),
        }));
        setActivities(activities);
      }
    } catch (error) {
      console.error("Failed to load activities:", error);
    }
  }, []);

  const value: ActivityContextType = {
    activities,
    logActivity,
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
