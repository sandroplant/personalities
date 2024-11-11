#!/bin/bash
echo "ValidateService: Checking if the server is running"
curl -f http://localhost:3000 || exit 1
