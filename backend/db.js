const mysql = require("mysql2/promise")
const path = require("path")

// Load .env from project root (one level above backend/)
require("dotenv").config({ path: path.join(__dirname, "../.env") })


// Create connection pool for better performance
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "chatui",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

// Helper function to execute queries
async function query(sql, params = []) {
  try {
    const [results] = await pool.execute(sql, params)
    return results
  } catch (error) {
    console.error("Database query error:", error)
    throw error
  }
}

// Helper function to get a single row
async function queryOne(sql, params = []) {
  const results = await query(sql, params)
  return results[0] || null
}

module.exports = {
  pool,
  query,
  queryOne,
}
