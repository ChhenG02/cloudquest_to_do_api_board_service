import 'colors';
import * as readlineSync from 'readline-sync';
import { AppDataSource } from './data-source'; 

async function migrate() {
  try {
    // 1️⃣ Initialize database connection
    await AppDataSource.initialize();

    // 1.5️⃣ Ensure UUID extension exists for Postgres
    await AppDataSource.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // 2️⃣ Check if there are existing tables
    const tableNames = await AppDataSource.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema='public'`
    );

    if (tableNames.length > 0) {
      // 3️⃣ Ask user for confirmation before dropping tables
      const confirm = readlineSync.keyInYNStrict(
        "⚠️  This will DROP and recreate all tables. Proceed?".yellow
      );

      if (!confirm) {
        console.log("\nMigration cancelled.".cyan);
        process.exit(0);
      }
    }

    // 4️⃣ Drop & recreate tables
    await AppDataSource.synchronize(true); // `true` = force drop + recreate

    console.log("\nMigration completed successfully.".green);
    process.exit(0);

  } catch (error: any) {
    console.error("\nMigration error:".red, error.message);
    process.exit(1);
  }
}

// Run script
migrate();
