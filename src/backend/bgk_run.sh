#!/bin/bash
# Background launcher for the FastAPI backend on the Turing host.
#
# Usage:
#   ./bgk_run.sh            # development mode (hot reload)
#   ./bgk_run.sh -r         # production mode
#   ./bgk_run.sh --run      # production mode (long flag form)
#
# Activates the project virtualenv, starts uvicorn under setsid so the
# server keeps running after the SSH session exits, and tees stdout +
# stderr into a timestamped log file under backend/logs/.

source /home/group3/CSCI-387-group-project/src/backend/venv/bin/activate

# Timestamp used to name the log file for this launch.
timestamp=$(date +%F_%H-%M-%S)
mode="empty"
if [ -z "$1" ]; then
    echo "Flag not set, defaulting to dev mode"
    mode="dev"
fi

# Mode selector — anything other than dev runs the production server.
if [ $mode != "dev" ] && [ $1 != "-r" ] || [ $1 != "--run" ]; then
    echo "Deployment Mode"
    setsid fastapi run /home/group3/CSCI-387-group-project/src/backend/api.py --host localhost --port 8000 </dev/null >> "/home/group3/CSCI-387-group-project/src/backend/logs/${timestamp}api.log" 2>&1 &
else
    echo "Development Mode"
    setsid fastapi dev /home/group3/CSCI-387-group-project/src/backend/api.py --host localhost --port 8000 </dev/null >> "/home/group3/CSCI-387-group-project/src/backend/logs/${timestamp}api.log" 2>&1 &
fi
