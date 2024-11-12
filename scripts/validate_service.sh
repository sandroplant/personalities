#!/bin/bash
echo "ValidateService: Checking if the server is running"
# Adjust the URL to match your server's actual port if necessary
curl -f http://localhost:3000 || exit 1
