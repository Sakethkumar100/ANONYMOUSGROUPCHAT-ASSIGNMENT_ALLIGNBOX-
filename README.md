# Friday Chat - Minimal Group Chat App

A minimal full-stack group chat application built with vanilla HTML/CSS/JavaScript frontend and Node.js + Express + MySQL backend. Features real-time messaging via polling, anonymous mode, read receipts, and online status indicators.

## Features

- **Simple Authentication**: Login with just a username (no password required for demo)
- **Real-time Messaging**: Messages update every 3 seconds via polling (no WebSocket dependencies)
- **Anonymous Mode**: Toggle to send messages anonymously
- **Read Receipts**: Visual indicators for sent (✓) and read (✓✓) messages
- **Online Status**: See who's currently online with green dot indicators
- **Optimistic UI**: Messages appear instantly while sending to server
- **Mobile-First Design**: Responsive layout that works on all devices
- **XSS Protection**: All user input is properly escaped

## Tech Stack

- **Frontend**: Plain HTML, CSS, Vanilla JavaScript (no frameworks)
- **Backend**: Node.js + Express + mysql2
- **Database**: MySQL
- **Real-time**: Short polling (every 3 seconds)

## Project Structure

\`\`\`
group-chat-app/
├── backend/
│   ├── index.js              # Main server file
│   ├── db.js                 # Database connection helper
│   ├── package.json          # Backend dependencies
│   ├── routes/
│   │   ├── auth.js           # Authentication routes
│   │   ├── groups.js         # Group and message routes
│   │   └── messages.js       # Additional message routes
│   └── scripts/
│       └── migrate.js        # Database migration script
├── frontend/
│   ├── index.html            # Main HTML file
│   ├── styles.css            # All CSS styles
│   └── app.js                # Frontend JavaScript
├── migrations/
│   └── seed.sql              # Database schema and seed data
├── .env.example              # Environment variables template
└── README.md                 # This file
\`\`\`

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- A MySQL user with database creation privileges

### Step 1: Database Setup

1. Install and start MySQL on your system
2. Create a database user (or use root):
   \`\`\`sql
   CREATE USER 'chatuser'@'localhost' IDENTIFIED BY 'your_password';
   GRANT ALL PRIVILEGES ON *.* TO 'chatuser'@'localhost';
   FLUSH PRIVILEGES;
   \`\`\`

### Step 2: Environment Configuration

1. Copy the environment template:
   \`\`\`bash
   cp .env.example .env
   \`\`\`

2. Edit `.env` with your database credentials:
   \`\`\`env
   DB_HOST=localhost
   DB_USER=chatuser
   DB_PASSWORD=your_password
   DB_NAME=chat_app
   SERVER_PORT=3000
   \`\`\`

### Step 3: Install Dependencies

\`\`\`bash
cd backend
npm install
\`\`\`

### Step 4: Run Database Migration

\`\`\`bash
# From the backend directory
npm run migrate
\`\`\`

This will:
- Create the `chat_app` database
- Create all required tables (users, groups, group_members, messages)
- Insert sample data (3 users, 1 group, sample messages)

### Step 5: Start the Server

\`\`\`bash
# From the backend directory
npm run dev
# or
npm start
\`\`\`

### Step 6: Open the App

Open your browser and go to: `http://localhost:3000`

## Usage

1. **Login**: Enter any username to join the chat
2. **Send Messages**: Type in the input field and press Enter or click send
3. **Anonymous Mode**: Toggle the switch to send messages anonymously
4. **View Online Users**: See the online count in the header
5. **Read Receipts**: Your messages show ✓ for sent, ✓✓ for read

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with username
- `POST /api/auth/user/:userId/online` - Update online status

### Groups & Messages
- `GET /api/groups/:groupId/members` - Get group members with online status
- `GET /api/groups/:groupId/messages?since=timestamp` - Get messages (with optional timestamp filter)
- `POST /api/groups/:groupId/messages` - Send a message
- `POST /api/groups/:groupId/read` - Mark messages as read

## Database Schema

### users
- `id` (INT, Primary Key)
- `name` (VARCHAR, Unique)
- `avatar_url` (VARCHAR)
- `last_seen` (TIMESTAMP)
- `created_at` (TIMESTAMP)

### groups
- `id` (INT, Primary Key)
- `title` (VARCHAR)
- `created_at` (TIMESTAMP)

### group_members
- `id` (INT, Primary Key)
- `group_id` (INT, Foreign Key)
- `user_id` (INT, Foreign Key)
- `role` (ENUM: 'member', 'admin')
- `joined_at` (TIMESTAMP)

### messages
- `id` (INT, Primary Key)
- `group_id` (INT, Foreign Key)
- `user_id` (INT, Foreign Key)
- `text` (TEXT)
- `is_anonymous` (BOOLEAN)
- `status` (ENUM: 'sent', 'read')
- `created_at` (TIMESTAMP)

## Configuration

### Polling Interval
To change the polling frequency, edit the interval in `frontend/app.js`:
\`\`\`javascript
// Poll every 3 seconds (3000ms)
pollingInterval = setInterval(() => {
    loadMessages();
    updateOnlineStatus();
    updateMembersList();
}, 3000); // Change this value
\`\`\`

### Online Status Timeout
Users appear offline if they haven't been seen in 10 seconds. To change this, edit the SQL query in `backend/routes/groups.js`:
\`\`\`sql
CASE 
    WHEN u.last_seen > DATE_SUB(NOW(), INTERVAL 10 SECOND) 
    THEN true 
    ELSE false 
END as online
\`\`\`

### Database Connection Pool
Connection pool settings can be adjusted in `backend/db.js`:
\`\`\`javascript
const pool = mysql.createPool({
    // ... other settings
    connectionLimit: 10,  // Max connections
    queueLimit: 0        // Max queued requests
});
\`\`\`

## Development

### Adding New Features

1. **Backend**: Add routes in `backend/routes/`
2. **Frontend**: Add functions in `frontend/app.js`
3. **Database**: Create migration scripts in `backend/scripts/`

### Running in Development

The server serves static files from the `frontend/` directory, so you can edit HTML/CSS/JS files and refresh the browser to see changes.

### Debugging

- Backend logs appear in the terminal where you ran `npm start`
- Frontend logs appear in the browser's developer console
- Database queries are logged to the console for debugging

## Security Notes

- This is a demo application - in production, implement proper authentication with passwords/JWT
- All user input is escaped to prevent XSS attacks
- Database queries use parameterized statements to prevent SQL injection
- Consider adding rate limiting for production use

## Troubleshooting

### Database Connection Issues
- Verify MySQL is running: `sudo service mysql status`
- Check credentials in `.env` file
- Ensure user has proper privileges

### Port Already in Use
- Change `SERVER_PORT` in `.env` file
- Or kill the process using port 3000: `lsof -ti:3000 | xargs kill`

### Messages Not Updating
- Check browser console for JavaScript errors
- Verify backend is running and accessible
- Check network tab in browser dev tools for failed API calls

### Migration Fails
- Ensure MySQL user has CREATE DATABASE privileges
- Check that MySQL is running and accessible
- Verify connection details in `.env`

## License

MIT License - feel free to use this code for learning and development.
