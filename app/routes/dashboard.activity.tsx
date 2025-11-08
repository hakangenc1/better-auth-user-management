import { useState, useMemo } from "react";
import type { Route } from "./+types/dashboard.activity";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Activity, UserPlus, UserMinus, Ban, ShieldCheck, Edit, ChevronLeft, ChevronRight } from "lucide-react";
import { useActivity } from "~/contexts/ActivityContext";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Activity Log - Dashboard" },
    { name: "description", content: "View admin actions and system activity" },
  ];
}

export default function DashboardActivity() {
  const { activities } = useActivity();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const getIcon = (type: "create" | "delete" | "ban" | "unban" | "edit" | "role") => {
    switch (type) {
      case "create":
        return <UserPlus className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case "delete":
        return <UserMinus className="h-4 w-4 text-destructive" />;
      case "ban":
        return <Ban className="h-4 w-4 text-orange-600 dark:text-orange-400" />;
      case "unban":
        return <ShieldCheck className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case "edit":
        return <Edit className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
      case "role":
        return <ShieldCheck className="h-4 w-4 text-primary" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
    if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
    return `${days} day${days !== 1 ? "s" : ""} ago`;
  };

  // Paginate activities
  const paginatedActivities = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return activities.slice(startIndex, endIndex);
  }, [activities, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(activities.length / itemsPerPage);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  return (
    <div className="h-full flex flex-col space-y-4 overflow-hidden">
      <div className="flex-shrink-0">
        <h1 className="text-2xl font-bold text-foreground">Activity Log</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track all admin actions
        </p>
      </div>

      {/* Activity Stats */}
      <div className="grid gap-3 md:grid-cols-4 flex-shrink-0">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Actions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-xl font-bold">{activities.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Created</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-xl font-bold text-green-600 dark:text-green-400">
              {activities.filter((a) => a.type === "create").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Banned</CardTitle>
            <Ban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
              {activities.filter((a) => a.type === "ban").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Modified</CardTitle>
            <Edit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {activities.filter((a) => a.type === "edit" || a.type === "role").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Timeline */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="flex-shrink-0">
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto">
          {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Activity className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No Activity Yet
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Admin actions like creating, editing, banning, or deleting users will appear here.
                Start managing users to see activity logs.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent transition-colors"
                >
                  <div className="mt-1">{getIcon(activity.type)}</div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      {activity.action}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Target: <span className="font-mono">{activity.target}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      By {activity.user} • {formatTime(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination - Outside scroll area */}
      {activities.length > itemsPerPage && (
        <div className="flex items-center justify-between border-t pt-4 flex-shrink-0">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, activities.length)} of{" "}
            {activities.length} activities
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <div className="text-sm font-medium">
              Page {currentPage} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
