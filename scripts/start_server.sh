#!/bin/bash
echo "ApplicationStart: Starting server with PM2"
# Ensure pm2 is available and start/reload your application
pm2 start /home/ec2-user/personalities/dist/app.js --name "personalities" || pm2 reload all --update-env
