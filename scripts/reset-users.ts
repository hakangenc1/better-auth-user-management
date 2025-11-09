import Database from "better-sqlite3";

const dbPath = process.env.DATABASE_URL || "./data/auth.db";

async function resetUsers() {
  console.log("🔄 Resetting database - deleting all users...");
  console.log(`Database path: ${dbPath}`);

  const db = new Database(dbPath);

  try {
    // Helper function to safely delete from table if it exists
    const safeDelete = (tableName: string) => {
      try {
        const result = db.prepare(`DELETE FROM ${tableName}`).run();
        console.log(`   Deleted ${result.changes} ${tableName}(s)`);
        return result.changes;
      } catch (error: any) {
        if (error.message.includes("no such table")) {
          console.log(`   Skipped ${tableName} (table doesn't exist)`);
          return 0;
        }
        throw error;
      }
    };

    // Delete all records from related tables (in correct order due to foreign keys)
    safeDelete("session");
    safeDelete("account");
    safeDelete("verification");
    safeDelete("twoFactor");
    safeDelete("activity");
    
    const userResult = db.prepare("DELETE FROM user").run();
    console.log(`   Deleted ${userResult.changes} user(s)`);

    console.log("\n✅ Database reset successfully!");
    console.log("✅ All users have been deleted");
    console.log("\n📝 Next steps:");
    console.log("   1. Start the dev server: npm run dev");
    console.log("   2. Visit http://localhost:5173");
    console.log("   3. You'll be redirected to /setup to create your first admin user");
  } catch (error) {
    console.error("❌ Error resetting database:", error);
    throw error;
  } finally {
    db.close();
  }
}

resetUsers().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
