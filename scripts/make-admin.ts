import Database from "better-sqlite3";
import readline from "readline";

const db = new Database(process.env.DATABASE_URL || "./data/auth.db");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function main() {
  console.log("🔧 Make User Admin\n");

  // List all users
  const users = db.prepare("SELECT id, email, name, role FROM user").all() as Array<{
    id: string;
    email: string;
    name: string;
    role: string;
  }>;

  if (users.length === 0) {
    console.log("❌ No users found in the database.");
    console.log("Please create a user first by signing up.");
    rl.close();
    db.close();
    return;
  }

  console.log("Available users:");
  users.forEach((user, index) => {
    console.log(
      `${index + 1}. ${user.email} (${user.name}) - Current role: ${user.role || "user"}`
    );
  });

  const answer = await question("\nEnter the number of the user to make admin (or 'q' to quit): ");

  if (answer.toLowerCase() === "q") {
    console.log("Cancelled.");
    rl.close();
    db.close();
    return;
  }

  const userIndex = parseInt(answer) - 1;

  if (isNaN(userIndex) || userIndex < 0 || userIndex >= users.length) {
    console.log("❌ Invalid selection.");
    rl.close();
    db.close();
    return;
  }

  const selectedUser = users[userIndex];

  // Update user role to admin
  db.prepare("UPDATE user SET role = ? WHERE id = ?").run("admin", selectedUser.id);

  console.log(`\n✅ Successfully made ${selectedUser.email} an admin!`);
  console.log("\nYou may need to log out and log back in for the changes to take effect.");

  rl.close();
  db.close();
}

main().catch((error) => {
  console.error("❌ Error:", error);
  rl.close();
  db.close();
  process.exit(1);
});
