#!/bin/bash
timestamp=$(date +%F_%H-%M-%S)
setsid fastapi run api.py --host 0.0.0.0 --port 8000 </dev/null >> "logs/${timestamp}api.log" 2>&1 &
