import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/login.tsx"),
  route("api/auth/*", "routes/api.auth.$.ts"),
  route("dashboard", "routes/dashboard.tsx", [
    index("routes/dashboard._index.tsx"),
    route("users", "routes/dashboard.users.tsx"),
    route("activity", "routes/dashboard.activity.tsx"),
  ]),
] satisfies RouteConfig;
