import { auth } from "../app/lib/auth.server";

async function seed() {
  console.log("Seeding database with example users...");

  try {
    // Create admin user using better-auth API
    try {
      await auth.api.signUpEmail({
        body: {
          email: "admin@example.com",
          password: "admin123",
          name: "Admin User",
        },
      });
      console.log("✅ Admin user created:");
      console.log("   Email: admin@example.com");
      console.log("   Password: admin123");
    } catch (error: any) {
      if (error.body?.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") {
        console.log("ℹ️  Admin user already exists, skipping...");
      } else {
        throw error;
      }
    }

    // Create regular user using better-auth API
    try {
      await auth.api.signUpEmail({
        body: {
          email: "user@example.com",
          password: "user12345",
          name: "Regular User",
        },
      });
      console.log("✅ Regular user created:");
      console.log("   Email: user@example.com");
      console.log("   Password: user12345");
    } catch (error: any) {
      if (error.body?.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") {
        console.log("ℹ️  Regular user already exists, skipping...");
      } else {
        throw error;
      }
    }

    console.log("\n✅ Database seeded successfully!");
    console.log("\nNote: You may need to manually update user roles in the database.");
    console.log("To make admin@example.com an admin, run the update-admin-role script:");
    console.log("  npx tsx scripts/update-admin-role.ts");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
