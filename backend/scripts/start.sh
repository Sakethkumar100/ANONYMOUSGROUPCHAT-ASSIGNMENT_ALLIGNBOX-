#!/bin/bash

# Start script for the group chat application
echo "Starting Friday Chat application..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Error: .env file not found!"
    echo "Please copy .env.example to .env and configure your database settings."
    exit 1
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "Installing dependencies..."
    npm install
fi

# Check if database is set up
echo "Checking database connection..."
node -e "
const { pool } = require('./db');
pool.getConnection()
    .then(conn => {
        console.log('Database connection successful');
        conn.release();
        process.exit(0);
    })
    .catch(err => {
        console.error('Database connection failed:', err.message);
        console.log('Run: npm run migrate');
        process.exit(1);
    });
"

if [ $? -ne 0 ]; then
    echo "Database connection failed. Please run migration first:"
    echo "npm run migrate"
    exit 1
fi

# Start the server
echo "Starting server..."
npm start
