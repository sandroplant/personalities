#!/bin/bash
echo "AfterInstall: Installing dependencies"

# Navigate to the frontend directory and install frontend dependencies
echo "Frontend: Navigating to frontend directory"
cd /home/ec2-user/personalities/frontend || { echo "Failed to navigate to frontend"; exit 1; }
echo "Frontend: Running npm install"
npm install || { echo "npm install failed"; exit 1; }

# Navigate to the backend directory and install backend dependencies
echo "Backend: Navigating to backend directory"
cd /home/ec2-user/personalities/backend || { echo "Failed to navigate to backend"; exit 1; }
echo "Backend: Running pip install"
pip install -r requirements.txt || { echo "pip install failed"; exit 1; }
