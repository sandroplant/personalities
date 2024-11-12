#!/bin/bash
echo "AfterInstall: Installing dependencies"

# Navigate to the frontend directory and install frontend dependencies
echo "Installing frontend dependencies..."
cd /home/ec2-user/personalities/frontend
npm install

# Navigate to the backend directory and install backend dependencies
echo "Installing backend dependencies..."
cd /home/ec2-user/personalities/backend
pip install -r requirements.txt
