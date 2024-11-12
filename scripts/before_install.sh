#!/bin/bash
echo "BeforeInstall: Cleaning old files"
# Optionally, you could remove node_modules or virtualenv to ensure fresh installs
rm -rf /home/ec2-user/personalities/frontend/node_modules
rm -rf /home/ec2-user/personalities/backend/venv
