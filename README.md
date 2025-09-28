🎉 Friday Chat – Minimal Group Chat App

A minimal full-stack group chat application built with vanilla HTML/CSS/JS frontend and Node.js + Express + MySQL backend. Features real-time messaging, anonymous mode, read receipts, and online status indicators.

🌟 Features

✅ Simple Authentication – Login with just a username (demo mode, no password required)

💬 Real-time Messaging – Updates every 3 seconds via polling

🕵️‍♂️ Anonymous Mode – Send messages anonymously

👀 Read Receipts – Sent (✓) and read (✓✓) indicators

🟢 Online Status – See who’s online in the group

🚀 Optimistic UI – Messages appear instantly while sending

📱 Mobile-First Design – Fully responsive layout

🛡️ XSS Protection – User input is safely escaped

🛠 Tech Stack

Frontend: HTML, CSS, Vanilla JavaScript

Backend: Node.js + Express + mysql2

Database: MySQL

Real-time: Short polling (every 3 seconds, no WebSockets)

📁 Project Structure
group-chat-app/
├── backend/
│   ├── index.js              # Main server
│   ├── db.js                 # Database connection
│   ├── package.json          # Backend dependencies
│   ├── routes/
│   │   ├── auth.js           # Auth routes
│   │   ├── groups.js         # Group & messages
│   │   └── messages.js       # Additional message routes
│   └── scripts/
│       └── migrate.js        # Database migration script
├── frontend/
│   ├── index.html            # Main HTML
│   ├── styles.css            # CSS
│   └── app.js                # JS frontend logic
├── migrations/
│   └── seed.sql              # DB schema & seed data
├── .env.example              # Environment variables template
└── README.md                 # This file

⚡ Quick Start
Prerequisites

Node.js (v14+)

MySQL (v5.7+)

MySQL user with database creation privileges

1️⃣ Database Setup
CREATE USER 'chatuser'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON *.* TO 'chatuser'@'localhost';
FLUSH PRIVILEGES;

2️⃣ Environment Configuration
# Copy the template
cp .env.example .env


Edit .env with your credentials:

DB_HOST=localhost
DB_USER=chatuser
DB_PASSWORD=your_password
DB_NAME=chat_app
SERVER_PORT=3000

3️⃣ Install Dependencies
cd backend
npm install

4️⃣ Run Database Migration
npm run migrate


This will:

Create the database chat_app

Create all required tables (users, groups, group_members, messages)

Insert sample data (3 users, 1 group, sample messages)

5️⃣ Start the Server
npm run dev
# or
npm start

6️⃣ Open the App

Open your browser:

http://localhost:3000

💻 Usage

Login: Enter any username

Send Messages: Press Enter or click send

Anonymous Mode: Toggle the switch to send anonymously

View Online Users: Green dot indicates online

Read Receipts: ✓ = sent, ✓✓ = read

🔌 API Endpoints
Authentication

POST /api/auth/login – Login with username

POST /api/auth/user/:userId/online – Update online status

Groups & Messages

GET /api/groups/:groupId/members – Get group members

GET /api/groups/:groupId/messages?since=timestamp – Get messages

POST /api/groups/:groupId/messages – Send a message

POST /api/groups/:groupId/read – Mark messages as read

🗄 Database Schema

users: id, name, avatar_url, last_seen, created_at
groups: id, title, created_at
group_members: id, group_id, user_id, role, joined_at
messages: id, group_id, user_id, text, is_anonymous, status, created_at

⚙️ Configuration

Polling Interval: Edit frontend/app.js for frequency (default 3000ms)

Online Timeout: Change SQL in backend/routes/groups.js

DB Connection Pool: Adjust in backend/db.js (connectionLimit, queueLimit)

🛠 Development

Backend: Add routes in backend/routes/

Frontend: Add functions in frontend/app.js

Database: Create migration scripts in backend/scripts/

🔒 Security Notes

Escape all user input to prevent XSS

Use parameterized queries to prevent SQL injection

Demo app – implement proper auth (JWT, password hashing) for production

Consider rate limiting in production

⚠️ Troubleshooting

Database Issues: Verify MySQL is running and credentials in .env

Port in Use: Change SERVER_PORT in .env or kill the process using the port

Migration Fails: Check MySQL privileges and connection details

Messages Not Updating: Check browser console and network requests

📜 License

MIT License – free to use for learning and development.
