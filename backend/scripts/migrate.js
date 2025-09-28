// backend/scripts/migrate.js
const mysql = require("mysql2/promise")
const fs = require("fs")
const path = require("path")
require("dotenv").config({ path: path.join(__dirname, "../../.env") })

function removeSqlComments(sql) {
  // Remove /* ... */ block comments
  sql = sql.replace(/\/\*[\s\S]*?\*\//g, " ")
  // Remove -- line comments
  sql = sql.replace(/--.*$/gm, " ")
  return sql
}

async function runMigration() {
  let connection

  try {
    console.log("Connecting with:", {
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD ? "***" : "NO PASSWORD",
      database: process.env.DB_NAME || "chatui",
    })

    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      port: process.env.DB_PORT || 3306,
      multipleStatements: true,
    })

    console.log("Connected to MySQL server")

    const dbName = process.env.DB_NAME || "chatui"
    // create db if not exists
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``)
    console.log(`✓ Database "${dbName}" created/verified`)

    // switch to DB
    await connection.changeUser({ database: dbName })
    console.log(`✓ Using database "${dbName}"`)

    const sqlPath = path.join(__dirname, "../../migrations/seed.sql")
    let sqlContent = fs.readFileSync(sqlPath, "utf8")

    // Remove comments (block and line comments)
    sqlContent = removeSqlComments(sqlContent)

    // Remove CREATE DATABASE / USE statements (we already handled DB creation & changeUser())
    sqlContent = sqlContent
      .split("\n")
      .filter((line) => {
        const trimmed = line.trim().toUpperCase()
        if (!trimmed) return false
        if (trimmed.startsWith("CREATE DATABASE")) return false
        if (trimmed.startsWith("USE ")) return false
        return true
      })
      .join("\n")

    // Final trim
    const cleaned = sqlContent.trim()
    if (!cleaned) {
      console.log("No SQL to execute after cleaning comments and database statements.")
    } else {
      console.log("Executing SQL from seed file (multipleStatements enabled)...")
      try {
        // execute entire SQL in one call (multipleStatements must be true)
        await connection.query(cleaned)
        console.log("✓ Seed SQL executed successfully")
      } catch (err) {
        console.error("✗ Error executing seed SQL (full snippet shown below):")
        // show a short snippet to help debug
        console.error(cleaned.substring(0, 800) + (cleaned.length > 800 ? "...\n\n(full SQL truncated)" : ""))
        throw err
      }
    }

    console.log("Migration completed successfully!")
    console.log(`Database "${dbName}" created with sample data`)
  } catch (error) {
    console.error("Migration failed:", error.message)
    process.exit(1)
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

runMigration()
