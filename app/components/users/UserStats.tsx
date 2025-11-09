import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { Users, UserCheck, UserX, Shield } from "lucide-react";
import type { User } from "~/types";

interface UserStatsProps {
  users: User[];
}

export function UserStats({ users }: UserStatsProps) {
  const total = users.length;
  const active = users.filter((u) => u.emailVerified && !u.banned).length;
  const banned = users.filter((u) => u.banned).length;
  const admins = users.filter((u) => u.role === "admin").length;
  const pending = users.filter((u) => !u.emailVerified && !u.banned).length;

  const stats = { total, active, banned, admins, pending };

  const statusData = [
    { name: "Active", value: stats.active, color: "hsl(142, 71%, 45%)" },
    { name: "Pending", value: stats.pending, color: "hsl(48, 96%, 53%)" },
    { name: "Banned", value: stats.banned, color: "hsl(var(--destructive))" },
  ];

  const roleData = [
    { name: "Users", count: stats.total - stats.admins },
    { name: "Admins", count: stats.admins },
  ];

  // Calculate user registrations by month (mock data based on existing users)
  const monthCounts: Record<string, number> = {};
  
  users.forEach((user) => {
    const date = new Date(user.createdAt);
    const monthKey = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
  });

  const registrationData = Object.entries(monthCounts)
    .map(([month, count]) => ({ month, count }))
    .slice(-6); // Last 6 months

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              All registered users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.active}
            </div>
            <p className="text-xs text-muted-foreground">
              Verified and active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Banned Users</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {stats.banned}
            </div>
            <p className="text-xs text-muted-foreground">
              Restricted accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administrators</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {stats.admins}
            </div>
            <p className="text-xs text-muted-foreground">
              Admin accounts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* User Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>User Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* User Roles */}
        <Card>
          <CardHeader>
            <CardTitle>User Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={roleData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Registration Trend */}
      {registrationData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>User Registrations</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={registrationData}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="hsl(var(--primary))" name="New Users" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
