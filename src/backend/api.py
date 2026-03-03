from fastapi import FastAPI
import json
import db
import time
import math

app = FastAPI()

connection, cursor = db.database_connect()

@app.get("/api/cookie{uid}")
async def cookie_hash(uid: int):
    t = time.time()

    return f"{{ID:{(math.pi ** (t * uid)) ** 0.5}}}"

@app.get("/hello")
async def read_root():
    return "Hi! Hallo! Bonjour!"



