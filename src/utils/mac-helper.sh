#!/bin/bash

# ZenMotion Mac Helper Script
# This script helps prevent your Mac from going to sleep
# Use this alongside the ZenMotion Chrome extension for best results

echo "ZenMotion Mac Helper"
echo "===================="
echo

# Check if caffeinate is available
if ! command -v caffeinate &> /dev/null; then
    echo "Error: caffeinate command not found. This script requires macOS."
    exit 1
fi

# Function to display help
show_help() {
    echo "Usage:"
    echo "  ./mac-helper.sh [option]"
    echo
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -t, --time     Specify duration in minutes (default: 60)"
    echo "  -i, --idle     Prevent idle sleep only (allows display sleep)"
    echo "  -d, --display  Prevent display sleep"
    echo "  -s, --system   Prevent system sleep (most aggressive)"
    echo "  -a, --all      Use all prevention methods (recommended for stubborn Macs)"
    echo
    echo "Examples:"
    echo "  ./mac-helper.sh -d -t 120    # Prevent display sleep for 2 hours"
    echo "  ./mac-helper.sh -s           # Prevent system sleep indefinitely"
    echo "  ./mac-helper.sh -a           # Use all prevention methods"
    echo
}

# Default values
DURATION=60  # minutes
MODE="-i"    # Default to idle prevention only
USE_ALL=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -t|--time)
            DURATION="$2"
            shift 2
            ;;
        -i|--idle)
            MODE="-i"
            shift
            ;;
        -d|--display)
            MODE="-d"
            shift
            ;;
        -s|--system)
            MODE="-s"
            shift
            ;;
        -a|--all)
            USE_ALL=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Convert duration to seconds
SECONDS_DURATION=$((DURATION * 60))

# Display mode information
if [ "$USE_ALL" = true ]; then
    MODE_DESC="all prevention methods"
else
    case $MODE in
        -i)
            MODE_DESC="idle sleep prevention"
            ;;
        -d)
            MODE_DESC="display sleep prevention"
            ;;
        -s)
            MODE_DESC="system sleep prevention"
            ;;
    esac
fi

echo "Starting $MODE_DESC for $DURATION minutes"
echo "Press Ctrl+C to stop"
echo

# Function to simulate user activity
simulate_activity() {
    # Move mouse slightly every 30 seconds
    while true; do
        # Get current position
        if command -v cliclick &> /dev/null; then
            # Use cliclick if available for more reliable movement
            cliclick m:+1,+1
            sleep 1
            cliclick m:-1,-1
        else
            # Fallback to osascript
            osascript -e 'tell application "System Events" to key code 63' # Press fn key
            sleep 0.5
            osascript -e 'tell application "System Events" to keystroke "."' # Press period key
        fi
        sleep 30
    done
}

# Run caffeinate with the specified mode and duration
if [ "$USE_ALL" = true ]; then
    # Use all prevention methods
    if [ "$DURATION" -eq 0 ]; then
        echo "Running indefinitely with all prevention methods until manually stopped..."
        caffeinate -d -i -m -s &
        CAFFEINATE_PID=$!
        
        # Also start activity simulation
        simulate_activity &
        ACTIVITY_PID=$!
    else
        echo "Will run until $(date -v +${DURATION}M +"%H:%M:%S")"
        caffeinate -d -i -m -s -t $SECONDS_DURATION &
        CAFFEINATE_PID=$!
        
        # Also start activity simulation
        simulate_activity &
        ACTIVITY_PID=$!
    fi
else
    # Use specified mode
    if [ "$DURATION" -eq 0 ]; then
        echo "Running indefinitely until manually stopped..."
        caffeinate $MODE &
        CAFFEINATE_PID=$!
    else
        echo "Will run until $(date -v +${DURATION}M +"%H:%M:%S")"
        caffeinate $MODE -t $SECONDS_DURATION &
        CAFFEINATE_PID=$!
    fi
fi

# Trap Ctrl+C to clean up
trap 'echo; echo "Stopping ZenMotion Mac Helper..."; kill $CAFFEINATE_PID 2>/dev/null; if [ -n "$ACTIVITY_PID" ]; then kill $ACTIVITY_PID 2>/dev/null; fi; exit 0' INT

# Wait for caffeinate to finish or be interrupted
wait $CAFFEINATE_PID

echo "ZenMotion Mac Helper completed"