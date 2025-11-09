import { Link, useLoaderData } from "react-router";
import type { Route } from "./+types/dashboard._index";
import { getAllUsers } from "~/lib/db.server";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Users, UserCheck, UserX, Shield, Activity, TrendingUp } from "lucide-react";
import { BarChart, Bar, ResponsiveContainer, Tooltip, Cell } from "recharts";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Dashboard - User Management System" },
    { name: "description", content: "Overview of user management system" },
  ];
}

// Loader - fetch users on server
export async function loader() {
  const users = getAllUsers();
  return { users };
}

export default function DashboardIndex() {
  const { users } = useLoaderData<typeof loader>();

  const stats = {
    total: users.length,
    active: users.filter((u) => u.emailVerified && !u.banned).length,
    banned: users.filter((u) => u.banned).length,
    admins: users.filter((u) => u.role === "admin").length,
  };

  // User status breakdown for mini chart
  const pending = users.filter((u) => !u.emailVerified && !u.banned).length;
  const statusData = [
    { name: 'Active', value: stats.active, color: '#22c55e', label: 'Active Users' },
    { name: 'Pending', value: pending, color: '#eab308', label: 'Pending Verification' },
    { name: 'Banned', value: stats.banned, color: '#ef4444', label: 'Banned Users' },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = stats.total > 0 ? Math.round((data.value / stats.total) * 100) : 0;
      return (
        <div
          style={{
            backgroundColor: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px',
            padding: '8px 12px',
          }}
        >
          <p style={{ fontSize: '12px', fontWeight: '600', color: 'hsl(var(--foreground))' }}>
            {data.label}
          </p>
          <p style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', marginTop: '2px' }}>
            {data.value} users ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-full flex flex-col space-y-4 overflow-auto">
      <div className="flex-shrink-0">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Overview of your user management system
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Link to="/dashboard/users">
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pb-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="mt-2" style={{ width: '100%', height: '40px' }}>
                <ResponsiveContainer width="100%" height={40}>
                  <BarChart data={statusData}>
                    <Tooltip 
                      content={<CustomTooltip />}
                      cursor={{ fill: 'hsl(var(--accent))' }}
                    />
                    <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-4">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.active}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium">Banned Users</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-4">
            <div className="text-2xl font-bold text-destructive">
              {stats.banned}
            </div>
            <p className="text-xs text-muted-foreground">
              Restricted accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium">Administrators</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-4">
            <div className="text-2xl font-bold text-primary">
              {stats.admins}
            </div>
            <p className="text-xs text-muted-foreground">
              Admin accounts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-3 md:grid-cols-3">
        <Link to="/dashboard/users">
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Manage Users
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <p className="text-xs text-muted-foreground">
                View and manage all user accounts
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/dashboard/activity">
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Activity Log
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <p className="text-xs text-muted-foreground">
                View recent admin actions
              </p>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <p className="text-xs font-medium text-green-600 dark:text-green-400">
              All systems operational
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
