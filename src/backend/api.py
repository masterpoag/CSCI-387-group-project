from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import db
import time
import math
import hashlib
import mysql.connector

app = FastAPI()

origins = [
    "http://0.0.0.0:8000",
    "http://0.0.0.0",
    "https://turing.cs.olemiss.edu",
    "https://gp-test.vroey.us",
    ]

app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        )

connection, cursor = db.database_connect()

class NewUser(BaseModel):
    uname: str
    upass: str
    weight: float
    atype: int
    isMetric: bool
    calGoal: int | None = None

class Result():
    def __init__(self) -> None:
        self.data = {"Result": "Success", "Message": "", "Data": None}
    def get_data(self) -> dict:
        return self.data

# Helper functions
async def log(msg: str) -> None:
    # It's rather simple now, but the idea is that I could expand it later if need be
    print("[API.PY] " + msg)

async def hash_UID(uid: int) -> float:
    try:
        result = ((math.pi * uid) ** 0.5) + (math.e ** 4.5)
    except:
        await log("UID Hashing failed!") 
        return -1

    return result

async def hash_pass(pswd: str, t: int | None = None) -> tuple[str, int]:
    if not t:
        t = math.floor(time.time())
        await log("No time passed. Creating new password.")
    else:
        await log("Time passed. Checking password.")
    hashbrown = hashlib.pbkdf2_hmac('sha256', pswd.encode('UTF-8'), str(t).encode('UTF-8'), 3)
    
    return (hashbrown.hex(), t)

async def calc_UID(hash: float) -> int:
    try:
        result =  math.floor(((hash - (math.e ** 4.5)) ** 2) / math.pi)
    except:
        await log("UID Cacluate failed!") 
        return -1

    return result

# API Endpoints
@app.post("/api/register")
async def register(hasCG: bool, nu: NewUser):
    # A few things:
    # 1. Check if the username is already in the database
    # 2. Check if the calorie goal is filled
    # 3. Calculate hash password
    # 4. Store information in db
    res = Result()
    
    try:       
        if len(nu.uname) > 30:
            res.data["Result"] = "Failed"
            res.data["Message"] = "uname is greater than 30"
            await log(f"len(nu.umane) ({len(nu.uname)}) is greater than 30!")

            return res.get_data()
    
        cursor.execute("SELECT uname FROM User WHERE uname = %s", [nu.uname])
        await log(f"SELECT uname FROM User WHERE uname = {nu.uname}") 
        
        result = cursor.fetchall()

        if len(result) != 0:
            res.data["Result"] = "Failed"
            res.data["Message"] = "Username already exsists in database"
            await log(f"{nu.uname} already exsists in database!")

            return res.get_data()

        # Set up variables
        isMetric = 1 if nu.isMetric else 0
        pswd, create_time = await hash_pass(nu.upass) 
       
        stmt = ""
        if hasCG:
            stmt = "INSERT INTO User (uname, pass, createTime, wieght, account_type, isMetric, cal_goal) VALUES (%s, %s, %s, %s, %s, %s, %s)"
            await log(f"INSERT INTO User (uname, pass, createTime, wieght, account_type, isMetric, cal_goal) VALUES ({nu.uname}, {pswd}, {create_time}, {nu.weight}, {nu.atype}, {isMetric}, {nu.calGoal}")
            cursor.execute(stmt, [nu.uname, pswd, create_time, nu.weight, nu.atype, isMetric, nu.calGoal])
        else:        
            stmt = "INSERT INTO User (uname, pass, createTime, wieght, account_type, isMetric) VALUES (%s, %s, %s, %s, %s, %s)"
            await log(f"INSERT INTO User (uname, pass, createTime, wieght, account_type, isMetric) VALUES ({nu.uname}, {pswd}, {create_time}, {nu.weight}, {nu.atype}, {isMetric})")
            cursor.execute(stmt, [nu.uname, pswd, create_time, nu.weight, nu.atype, isMetric])
  
        connection.commit()
        
        if cursor.warning_count != 0:
            res.data["Result"] = "Warning"
            res.data["Message"] = "Database registration warning, check API logs"
            await log(f"Database warning:\n\t{cursor.warnings}")

            return res.get_data()
    
        res.data["Result"] = "Success"
        res.data["Message"] = f"User {nu.uname} successfully created."
        await log(f"User {nu.uname} successfully created.") 
         
        return res.get_data()
    except mysql.connector.Error as err:
        res.data["Result"] = "Failed"
        res.data["Message"] = "Database threw an error, check API logs"
        await log(f"Database threw an error!\n\t{err}") 

        return res.get_data()

@app.get("/api/login")
async def login(uname: str, upass: str):
    res = Result()
     
    try:
        '''
        1. Check if user exsists
        2. Check if password is the same as the hashed password
            if so, return hashed UID 
        '''
        
        cursor.execute("SELECT uname FROM User WHERE uname = %s", [uname])
        await log(f"SELECT uname FROM User WHERE uname = {uname}")

        result = cursor.fetchall()
        
        if len(result) == 0:
            res.data["Result"] = "Failed" 
            res.data["Message"] = "Username does not exsist" 
            return res.get_data()
        
        cursor.execute("SELECT pass, createTime, uid FROM User WHERE uname = %s", [uname]) 
        result = cursor.fetchone()
       
        if result is None:
            raise mysql.connector.Error
          
        stored_pass: str = result["pass"] # type: ignore
        stored_time: int = result["createTime"] # type: ignore
        stored_uid: int = result["uid"] # type: ignore 
        
        checked_pass, _ = await hash_pass(upass, stored_time)
       
        if stored_pass != checked_pass:
            res.data["Result"] = "Failed"
            res.data["Message"] = "Incorrect password"
            await log("Incorrect password!")

            return res.get_data()
        
        # Password is correct, return hased uid
        
        huid = await hash_UID(stored_uid)
        
        res.data["Result"] = "Success"
        res.data["Message"] = f"{uname} successfully signed in"
        res.data["Data"] = huid
        await log(f"{uname} successfully signed in") 
        
        return res.get_data()
            
    except mysql.connector.Error as err:
        res.data["Result"] = "Failed"
        res.data["Message"] = "Database threw an error, check API logs" 
        await log(f"Database error:\n\t{err}")

        return res.get_data()

@app.get("/hello")
async def read_root():
    ret = Result()

    ret.data["Message"] = "Hi! Hallo! Bonjour!"

    return ret.get_data()



