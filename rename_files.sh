#!/bin/bash

# Function to rename files if they exist
rename_file() {
  if [ -f "$1" ]; then
    mv "$1" "$2"
    echo "Renamed $1 to $2"
  else
    echo "File $1 does not exist, skipping."
  fi
}

# Backend Files
rename_file "./server/auth.js" "./server/auth.ts"
rename_file "./server/config/options.js" "./server/config/options.ts"
rename_file "./server/testOpenAI.js" "./server/testOpenAI.ts"

# Frontend Files
# (Add any remaining frontend files here if necessary)

