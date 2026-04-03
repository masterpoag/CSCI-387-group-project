#!/bin/bash
timestamp=$(date +%F_%H-%M-%S)
mode="empty"
if [ -z "$1" ]; then
    echo "Flag not set, defaulting to dev mode"
    mode="dev"
fi

if [ $mode != "dev" ] && [ $1 != "-r" ] || [ $1 != "--run" ]; then
    echo "Deployment Mode"
    setsid fastapi run /home/group3/CSCI-387-group-project/src/backend/api.py --host localhost --port 8000 </dev/null >> "/home/group3/CSCI-387-group-project/src/backend/logs/${timestamp}api.log" 2>&1 &
else
    echo "Development Mode"
    setsid fastapi dev /home/group3/CSCI-387-group-project/src/backend/api.py --host localhost --port 8000 </dev/null >> "/home/group3/CSCI-387-group-project/src/backend/logs/${timestamp}api.log" 2>&1 &
fi