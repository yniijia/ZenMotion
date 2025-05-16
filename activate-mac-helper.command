#!/bin/bash

# ZenMotion Mac Helper Launcher
# This is a clickable launcher for macOS users

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Make the helper script executable if it's not already
chmod +x "$SCRIPT_DIR/src/utils/mac-helper.sh"

# Run the helper script with the -a flag (all prevention methods)
"$SCRIPT_DIR/src/utils/mac-helper.sh" -a

# Keep the terminal window open so users can see the output
echo
echo "Press any key to close this window..."
read -n 1