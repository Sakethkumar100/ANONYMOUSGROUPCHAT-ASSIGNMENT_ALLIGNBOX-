const express = require("express")
const { query } = require("../db")
const router = express.Router()

// Get group members with online status
router.get("/:groupId/members", async (req, res) => {
  try {
    const { groupId } = req.params

    const members = await query(
      `
            SELECT 
                u.id,
                u.name,
                u.avatar_url,
                u.last_seen,
                gm.role,
                gm.joined_at,
                CASE 
                    WHEN u.last_seen > DATE_SUB(NOW(), INTERVAL 10 SECOND) 
                    THEN true 
                    ELSE false 
                END as online
            FROM group_members gm
            JOIN users u ON gm.user_id = u.id
            WHERE gm.group_id = ?
            ORDER BY u.name
        `,
      [groupId],
    )

    res.json(members)
  } catch (error) {
    console.error("Get members error:", error)
    res.status(500).json({ error: "Failed to get group members" })
  }
})

// Get messages for a group
router.get("/:groupId/messages", async (req, res) => {
  try {
    const { groupId } = req.params
    const { since } = req.query

    let sql = `
            SELECT 
                m.id,
                m.group_id,
                m.user_id,
                m.text,
                m.is_anonymous,
                m.status,
                m.created_at,
                u.name as user_name,
                u.avatar_url
            FROM messages m
            JOIN users u ON m.user_id = u.id
            WHERE m.group_id = ?
        `

    const params = [groupId]

    if (since) {
      sql += " AND m.created_at > ?"
      params.push(since)
    }

    sql += " ORDER BY m.created_at ASC LIMIT 100"

    const messages = await query(sql, params)

    res.json(messages)
  } catch (error) {
    console.error("Get messages error:", error)
    res.status(500).json({ error: "Failed to get messages" })
  }
})

// Send a message to a group
router.post("/:groupId/messages", async (req, res) => {
  try {
    const { groupId } = req.params
    const { text, is_anonymous = false, user_id, tempId } = req.body

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "Message text is required" })
    }

    if (!user_id) {
      return res.status(400).json({ error: "User ID is required" })
    }

    // Insert message
    const result = await query("INSERT INTO messages (group_id, user_id, text, is_anonymous) VALUES (?, ?, ?, ?)", [
      groupId,
      user_id,
      text.trim(),
      is_anonymous,
    ])

    // Get the created message with user info
    const message = await query(
      `
            SELECT 
                m.id,
                m.group_id,
                m.user_id,
                m.text,
                m.is_anonymous,
                m.status,
                m.created_at,
                u.name as user_name,
                u.avatar_url
            FROM messages m
            JOIN users u ON m.user_id = u.id
            WHERE m.id = ?
        `,
      [result.insertId],
    )

    res.json({
      message: message[0],
      tempId, // Return tempId for frontend to replace optimistic message
    })
  } catch (error) {
    console.error("Send message error:", error)
    res.status(500).json({ error: "Failed to send message" })
  }
})

// Mark messages as read
router.post("/:groupId/read", async (req, res) => {
  try {
    const { groupId } = req.params
    const { messageIds } = req.body

    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({ error: "Message IDs are required" })
    }

    // Update message status to 'read'
    const placeholders = messageIds.map(() => "?").join(",")
    await query(`UPDATE messages SET status = 'read' WHERE id IN (${placeholders}) AND group_id = ?`, [
      ...messageIds,
      groupId,
    ])

    res.json({ ok: true })
  } catch (error) {
    console.error("Mark read error:", error)
    res.status(500).json({ error: "Failed to mark messages as read" })
  }
})

module.exports = router
