import Database from "better-sqlite3";

const db = new Database(process.env.DATABASE_URL || "./data/auth.db");

try {
  console.log("Updating admin user role and verification status...");

  const result = db
    .prepare('UPDATE user SET role = ?, emailVerified = ? WHERE email = ?')
    .run("admin", 1, "admin@example.com");

  if (result.changes > 0) {
    console.log("✅ Admin user updated successfully!");
    console.log("   Email: admin@example.com");
    console.log("   Role: admin");
    console.log("   Email Verified: true");
  } else {
    console.log("⚠️  No user found with email: admin@example.com");
  }
} catch (error) {
  console.error("❌ Error updating admin user:", error);
  throw error;
} finally {
  db.close();
}
