const mysql = require("mysql2/promise");
require("dotenv").config();

async function describeTables() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "mediko",
  });

  try {
    const conn = await pool.getConnection();
    
    // Get all tables
    const [tables] = await conn.execute(`SHOW TABLES`);
    console.log("\n=== ALL TABLES ===");
    tables.forEach(t => {
      const tableName = Object.values(t)[0];
      console.log(`- ${tableName}`);
    });

    // Describe each table
    const tableNames = ["rendezvous", "medecins", "patients", "utilisateur", "ratings", "avis", "disponibilites", "specialite"];
    
    for (const tableName of tableNames) {
      try {
        const [columns] = await conn.execute(`DESCRIBE ${tableName}`);
        console.log(`\n=== TABLE: ${tableName} ===`);
        columns.forEach(col => {
          console.log(`  ${col.Field}: ${col.Type} ${col.Null === "NO" ? "NOT NULL" : "NULL"} ${col.Key ? `[KEY: ${col.Key}]` : ""} ${col.Default ? `DEFAULT: ${col.Default}` : ""} ${col.Extra ? `[${col.Extra}]` : ""}`);
        });
      } catch (e) {
        console.log(`\n=== TABLE: ${tableName} === (does not exist or error)`);
      }
    }

    await conn.end();
  } catch (err) {
    console.error("Error:", err.message);
  }
  
  await pool.end();
}

describeTables();
