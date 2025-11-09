import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("setup", "routes/setup.tsx"),
  route("api/auth/*", "routes/api.auth.$.ts"),
  route("api/activity", "routes/api.activity.ts"),
  route("api/setup/test-connection", "routes/api.setup.test-connection.ts"),
  route("api/setup/save-config", "routes/api.setup.save-config.ts"),
  route("api/setup/migrate", "routes/api.setup.migrate.ts"),
  route("api/setup/create-admin", "routes/api.setup.create-admin.ts"),
  route("api/setup/complete", "routes/api.setup.complete.ts"),
  route("api/setup/reset", "routes/api.setup.reset.ts"),
  route("dashboard", "routes/dashboard.tsx", [
    index("routes/dashboard._index.tsx"),
    route("users", "routes/dashboard.users.tsx"),
    route("sessions", "routes/dashboard.sessions.tsx"),
    route("activity", "routes/dashboard.activity.tsx"),
    route("profile", "routes/dashboard.profile.tsx"),
  ]),
] satisfies RouteConfig;
