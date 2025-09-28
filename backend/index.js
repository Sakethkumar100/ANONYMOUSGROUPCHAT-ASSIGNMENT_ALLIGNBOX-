const express = require("express")
const cors = require("cors")
const path = require("path")
require("dotenv").config()

// Import route modules
const authRoutes = require("./routes/auth")
const groupRoutes = require("./routes/groups")
const messageRoutes = require("./routes/messages")

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, "../frontend")))

// API Routes
app.use("/api/auth", authRoutes)
app.use("/api/groups", groupRoutes)
app.use("/api/messages", messageRoutes)

// Serve frontend files
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"))
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err)
  res.status(500).json({ error: "Internal server error" })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log("Frontend available at: http://localhost:" + PORT)
})
