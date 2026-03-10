from fastapi import FastAPI
from pydantic import BaseModel
import json
import db
import time
import math

app = FastAPI()
connection, cursor = db.database_connect()

class NewUser(BaseModel):
    uname: str
    upass: str
    weight: float
    atype: int
    isMetric: bool
    calGoal: float | None = None

class Result():
    def __init__(self) -> None:
        self.data = {"Result": "Success", "Message": "", "Data": None}
    def dump(self) -> str:
        d = self.data
        return json.dumps(d)

# Helper functions
async def hash_UID(uid: int) -> float:
    try:
        result = ((math.pi * uid) ** 0.5) + (math.e ** 4.5)
    except:
        return -1

    return result

async def calc_UID(hash: float) -> int:
    try:
        result =  math.floor(((hash - (math.e ** 4.5)) ** 2) / math.pi)
    except:
       return -1

    return result

# API Endpoints
@app.get("/api/cookie")
async def cookie_hash(uid: int):
    res = Result()

    hash = await hash_UID(uid)
    if hash != -1:
        res.data["Data"] = hash
    else:
        res.data["Result"] = "Failed"

    return res.dump()

@app.post("/api/register?hascg={hasCG}")
async def register(hasCG: bool):
    # A few things:
    # 1. Check if the username is already in the database
    # 2. Check if the calorie goal is filled
    # 3. Calculate hash password
    # 4. Store information in db
    res = Result()
    
    if len(NewUser.uname) > 30:
        res.data["Result"] = "Failed"
        res.data["Message"] = "uname is greater than 30"
        return res.dump()
    
    result = cursor.execute("SELECT uname FROM User WHERE uname = ?", NewUser.uname)

    if type(result) != None:
        res.data["Result"] = "Failed"
        res.data["Message"] = "uname already exsists in database"
        res.data["Data"] = result
        return res.dump()

@app.get("/hello")
async def read_root():
    ret = Result()

    ret.data["Message"] = "Hi! Hallo! Bonjour!"

    return ret.dump()



