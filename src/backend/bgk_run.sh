#!/bin/bash
timestamp=$(date +%F_%H-%M-%S)
mode="empty"
if [ -z "$1" ]; then
    echo "Flag not set, defaulting to dev mode"
    mode="dev"
fi

if [ $mode != "dev" ] && [ $1 != "-r" ] || [ $1 != "--run" ]; then
    echo "Deployment Mode"
    setsid fastapi run api.py --host localhost --port 8000 </dev/null >> "logs/${timestamp}api.log" 2>&1 &
else
    echo "Development Mode"
    setsid fastapi dev api.py --host localhost --port 8000 </dev/null >> "logs/${timestamp}api.log" 2>&1 &
fi