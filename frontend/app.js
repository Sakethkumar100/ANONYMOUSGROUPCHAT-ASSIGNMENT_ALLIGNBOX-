// Global app state
let currentUser = null
let currentToken = null
const currentGroupId = 1 // Default to "Friday Chat"
let lastMessageTime = null
let pollingInterval = null
const seenMessageIds = new Set()
let tempMessageCounter = 0

// DOM elements
const loginScreen = document.getElementById("loginScreen")
const chatScreen = document.getElementById("chatScreen")
const loadingIndicator = document.getElementById("loadingIndicator")
const loginForm = document.getElementById("loginForm")
const nameInput = document.getElementById("nameInput")
const messageForm = document.getElementById("messageForm")
const messageInput = document.getElementById("messageInput")
const messagesList = document.getElementById("messagesList")
const anonymousMode = document.getElementById("anonymousMode")
const anonymousIndicator = document.getElementById("anonymousIndicator")
const userName = document.getElementById("userName")
const userAvatar = document.getElementById("userAvatar")
const onlineCount = document.getElementById("onlineCount")
const sendButton = document.getElementById("sendButton")

// API base URL
const API_BASE = window.location.origin + "/api"

// Utility functions
function showLoading() {
  loadingIndicator.classList.remove("hidden")
}

function hideLoading() {
  loadingIndicator.classList.add("hidden")
}

function showScreen(screen) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.add("hidden"))
  screen.classList.remove("hidden")
}

function escapeHtml(text) {
  const div = document.createElement("div")
  div.textContent = text
  return div.innerHTML
}

function formatTime(dateString) {
  const date = new Date(dateString)
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

// API functions
async function apiCall(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...(currentToken && { Authorization: `Bearer ${currentToken}` }),
      },
      ...options,
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("API call failed:", error)
    throw error
  }
}

// Authentication
async function login(name) {
  showLoading()
  try {
    const response = await apiCall("/auth/login", {
      method: "POST",
      body: JSON.stringify({ name }),
    })

    currentUser = response.user
    currentToken = response.token

    // Update UI
    userName.textContent = currentUser.name
    userAvatar.src = currentUser.avatar_url
    userAvatar.alt = `${currentUser.name}'s avatar`

    showScreen(chatScreen)

    // Start polling and load initial messages
    startPolling()
    loadMessages()

    console.log("Login successful:", response.message)
  } catch (error) {
    alert("Login failed: " + error.message)
  } finally {
    hideLoading()
  }
}

// Message functions
async function loadMessages() {
  try {
    const params = lastMessageTime ? `?since=${encodeURIComponent(lastMessageTime)}` : ""
    const response = await apiCall(`/groups/${currentGroupId}/messages${params}`)

    if (response.length > 0) {
      response.forEach((message) => {
        if (!seenMessageIds.has(message.id)) {
          displayMessage(message)
          seenMessageIds.add(message.id)
        }
      })

      // Update last message time
      lastMessageTime = response[response.length - 1].created_at

      // Mark new messages as read
      const newMessageIds = response.filter((msg) => msg.user_id !== currentUser.id).map((msg) => msg.id)

      if (newMessageIds.length > 0) {
        markMessagesAsRead(newMessageIds)
      }
    }
  } catch (error) {
    console.error("Failed to load messages:", error)
  }
}

async function sendMessage(text, isAnonymous = false) {
  if (!text.trim()) return

  const tempId = `temp_${++tempMessageCounter}`

  // Optimistic UI - show message immediately
  const optimisticMessage = {
    id: tempId,
    text: text.trim(),
    user_id: currentUser.id,
    user_name: currentUser.name,
    avatar_url: currentUser.avatar_url,
    is_anonymous: isAnonymous,
    created_at: new Date().toISOString(),
    status: "sending",
  }

  displayMessage(optimisticMessage, true)

  try {
    const response = await apiCall(`/groups/${currentGroupId}/messages`, {
      method: "POST",
      body: JSON.stringify({
        text: text.trim(),
        is_anonymous: isAnonymous,
        user_id: currentUser.id,
        tempId,
      }),
    })

    // Replace optimistic message with real message
    replaceOptimisticMessage(tempId, response.message)
    seenMessageIds.add(response.message.id)
  } catch (error) {
    console.error("Failed to send message:", error)
    // Remove optimistic message on error
    removeOptimisticMessage(tempId)
    alert("Failed to send message. Please try again.")
  }
}

function displayMessage(message, isOptimistic = false) {
  const messageEl = document.createElement("div")
  messageEl.className = `message ${message.user_id === currentUser.id ? "own" : ""} ${isOptimistic ? "sending" : ""}`
  messageEl.dataset.messageId = message.id

  const isAnonymous = message.is_anonymous
  const senderName = isAnonymous ? "Anonymous" : message.user_name
  const avatarUrl = isAnonymous ? "https://api.dicebear.com/7.x/avataaars/svg?seed=anonymous" : message.avatar_url

  messageEl.innerHTML = `
        <img src="${avatarUrl}" alt="${senderName}'s avatar" class="message-avatar">
        <div class="message-content">
            <div class="message-header">
                <span class="message-sender">${escapeHtml(senderName)}</span>
                ${isAnonymous ? '<span class="anonymous-badge">Anonymous</span>' : ""}
                <span class="message-time">${formatTime(message.created_at)}</span>
            </div>
            <div class="message-text">${escapeHtml(message.text)}</div>
            ${
              message.user_id === currentUser.id
                ? `
                <div class="message-status">
                    ${message.status === "read" ? "✓✓" : "✓"}
                    ${isOptimistic ? "Sending..." : ""}
                </div>
            `
                : ""
            }
        </div>
    `

  messagesList.appendChild(messageEl)
  scrollToBottom()
}

function replaceOptimisticMessage(tempId, realMessage) {
  const optimisticEl = document.querySelector(`[data-message-id="${tempId}"]`)
  if (optimisticEl) {
    optimisticEl.remove()
    displayMessage(realMessage)
  }
}

function removeOptimisticMessage(tempId) {
  const optimisticEl = document.querySelector(`[data-message-id="${tempId}"]`)
  if (optimisticEl) {
    optimisticEl.remove()
  }
}

function scrollToBottom() {
  messagesList.scrollTop = messagesList.scrollHeight
}

async function markMessagesAsRead(messageIds) {
  if (messageIds.length === 0) return

  try {
    await apiCall(`/groups/${currentGroupId}/read`, {
      method: "POST",
      body: JSON.stringify({ messageIds }),
    })
  } catch (error) {
    console.error("Failed to mark messages as read:", error)
  }
}

// Polling for real-time updates
function startPolling() {
  // Update online status
  updateOnlineStatus()

  // Poll for new messages every 3 seconds
  pollingInterval = setInterval(() => {
    loadMessages()
    updateOnlineStatus()
    updateMembersList()
  }, 3000)
}

function stopPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval)
    pollingInterval = null
  }
}

async function updateOnlineStatus() {
  if (!currentUser) return

  try {
    await apiCall(`/auth/user/${currentUser.id}/online`, {
      method: "POST",
    })
  } catch (error) {
    console.error("Failed to update online status:", error)
  }
}

async function updateMembersList() {
  try {
    const members = await apiCall(`/groups/${currentGroupId}/members`)
    const onlineMembers = members.filter((member) => member.online)
    onlineCount.textContent = `${onlineMembers.length} online`
  } catch (error) {
    console.error("Failed to update members list:", error)
  }
}

// Event listeners
loginForm.addEventListener("submit", (e) => {
  e.preventDefault()
  const name = nameInput.value.trim()
  if (name) {
    login(name)
  }
})

messageForm.addEventListener("submit", (e) => {
  e.preventDefault()
  const text = messageInput.value.trim()
  if (text) {
    sendMessage(text, anonymousMode.checked)
    messageInput.value = ""
  }
})

// Anonymous mode toggle
anonymousMode.addEventListener("change", (e) => {
  if (e.target.checked) {
    anonymousIndicator.classList.remove("hidden")
  } else {
    anonymousIndicator.classList.add("hidden")
  }
})

// Enter key to send message
messageInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault()
    messageForm.dispatchEvent(new Event("submit"))
  }
})

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
  stopPolling()
})

// Initialize app
document.addEventListener("DOMContentLoaded", () => {
  showScreen(loginScreen)
  nameInput.focus()
})
