import Database from "better-sqlite3";

const db = new Database(process.env.DATABASE_URL || "./data/auth.db");

console.log("🔍 Checking 2FA status in database...\n");

try {
  // Check users
  const users = db.prepare("SELECT id, email, name, twoFactorEnabled FROM user").all();
  console.log("📊 Users:");
  users.forEach((user: any) => {
    console.log(`  - ${user.email}: 2FA ${user.twoFactorEnabled ? 'ENABLED' : 'DISABLED'}`);
  });

  // Check twoFactor table
  console.log("\n📊 TwoFactor records:");
  const twoFactorRecords = db.prepare("SELECT userId, createdAt FROM twoFactor").all();
  if (twoFactorRecords.length === 0) {
    console.log("  - No 2FA records found");
  } else {
    twoFactorRecords.forEach((record: any) => {
      console.log(`  - User ID: ${record.userId}, Created: ${record.createdAt}`);
    });
  }

  // Check sessions
  console.log("\n📊 Active sessions:");
  const sessions = db.prepare("SELECT id, userId, expiresAt FROM session").all();
  console.log(`  - Total sessions: ${sessions.length}`);

} catch (error) {
  console.error("❌ Error:", error);
} finally {
  db.close();
}
