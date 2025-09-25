#!/bin/bash

# MoneyQuestV3 Process Manager
# Smart process management for development servers

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project-specific process detection
PROJECT_DIR="C:/Users/natha/OneDrive/Desktop/MoneyQuestV3"
WEBSITE_PORT=3000
BACKEND_PORT=8080

# Function to print colored output
print_status() {
    echo -e "${BLUE}[ProcessManager]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[ProcessManager]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[ProcessManager]${NC} $1"
}

print_error() {
    echo -e "${RED}[ProcessManager]${NC} $1"
}

# List MoneyQuestV3-specific processes
list_dev_processes() {
    print_status "Checking for MoneyQuestV3 development processes..."

    # Windows process listing with filtering
    local processes=$(tasklist | findstr "node.exe" | wc -l)
    echo "Found $processes Node.js processes running"

    # Check specific ports
    local website_proc=$(netstat -ano | findstr ":$WEBSITE_PORT " || true)
    local backend_proc=$(netstat -ano | findstr ":$BACKEND_PORT " || true)

    if [[ -n "$website_proc" ]]; then
        print_success "Website server running on port $WEBSITE_PORT"
    else
        print_warning "Website server not detected on port $WEBSITE_PORT"
    fi

    if [[ -n "$backend_proc" ]]; then
        print_success "Backend server running on port $BACKEND_PORT"
    else
        print_warning "Backend server not detected on port $BACKEND_PORT"
    fi
}

# Kill processes by port
kill_port() {
    local port=$1
    print_status "Killing processes on port $port..."

    # Find PID using netstat
    local pids=$(netstat -ano | findstr ":$port " | awk '{print $5}' | sort -u)

    if [[ -z "$pids" ]]; then
        print_warning "No processes found on port $port"
        return 0
    fi

    for pid in $pids; do
        if [[ "$pid" != "0" ]]; then
            taskkill //F //PID "$pid" 2>/dev/null || true
        fi
    done

    print_success "Port $port cleared"
}

# Kill all MoneyQuestV3 dev processes
kill_dev_servers() {
    print_status "Stopping MoneyQuestV3 development servers..."

    # Kill specific ports first
    kill_port $WEBSITE_PORT
    kill_port $BACKEND_PORT

    sleep 2

    # Force kill remaining node processes
    local remaining=$(tasklist | findstr "node.exe" | wc -l)
    if [[ "$remaining" -gt 0 ]]; then
        print_status "Force killing remaining Node.js processes..."
        taskkill //F //IM node.exe 2>/dev/null || true
    fi

    print_success "Development servers stopped"
}

# Main command handler
main() {
    case "${1:-status}" in
        "status"|"list")
            list_dev_processes
            ;;
        "kill"|"stop")
            kill_dev_servers
            ;;
        "kill-port")
            kill_port "$2"
            ;;
        *)
            print_error "Usage: $0 [status|kill|kill-port PORT]"
            exit 1
            ;;
    esac
}

main "$@"