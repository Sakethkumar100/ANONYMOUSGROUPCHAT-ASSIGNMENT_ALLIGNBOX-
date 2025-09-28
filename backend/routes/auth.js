const express = require("express")
const { query, queryOne } = require("../db")
const router = express.Router()

// Simple login by username (no password for demo)
router.post("/login", async (req, res) => {
  try {
    const { name } = req.body

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: "Name is required" })
    }

    const trimmedName = name.trim()

    // Check if user exists
    let user = await queryOne("SELECT id, name, avatar_url, created_at FROM users WHERE name = ?", [trimmedName])

    // Create user if doesn't exist
    if (!user) {
      const result = await query("INSERT INTO users (name, avatar_url) VALUES (?, ?)", [
        trimmedName,
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${trimmedName}`,
      ])

      user = {
        id: result.insertId,
        name: trimmedName,
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${trimmedName}`,
        created_at: new Date(),
      }
    }

    // Update last_seen
    await query("UPDATE users SET last_seen = NOW() WHERE id = ?", [user.id])

    // Auto-join default group (Friday Chat)
    await query("INSERT IGNORE INTO group_members (group_id, user_id) VALUES (1, ?)", [user.id])

    // Simple token (in production, use JWT)
    const token = `user_${user.id}_${Date.now()}`

    res.json({
      user,
      token,
      message: "Login successful",
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ error: "Login failed" })
  }
})

// Update user online status
router.post("/user/:userId/online", async (req, res) => {
  try {
    const { userId } = req.params

    await query("UPDATE users SET last_seen = NOW() WHERE id = ?", [userId])

    res.json({ ok: true })
  } catch (error) {
    console.error("Update online status error:", error)
    res.status(500).json({ error: "Failed to update online status" })
  }
})

module.exports = router
