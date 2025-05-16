#!/bin/bash

echo "ZenMotion Extension Build Script"
echo "==============================="
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is required but not installed."
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Install dependencies if needed
echo "Installing dependencies..."
npm install

# Generate icons
echo "Generating icons..."
npm run generate-icons

# Create package for Chrome Web Store
echo "Creating package for Chrome Web Store..."
npm run package

echo
echo "Build complete!"
echo "The extension package has been created as zenmotion.zip"
echo "You can upload this file to the Chrome Developer Dashboard."
echo 