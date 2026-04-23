import time
import math
import hashlib
import mysql.connector
from mysql.connector.abstracts import MySQLCursorAbstract
import db
from message import *


class Result():
    def __init__(self) -> None:
        self.data = {"Result": "Success", "Message": "", "Data": None}

    def get_data(self) -> dict:
        return self.data


async def log(msg: str) -> None:
    # It's rather simple now, but the idea is that I could expand it later if need be
    print("[API.PY] " + msg)


async def data_base_err(e: mysql.connector.Error, con) -> dict:
    res = Result()

    res.data["Result"] = "Failed"
    res.data["Message"] = "Database threw an error, check API logs"
    await log(f"Database threw an error!\n\t{e}")
    con.rollback()

    return res.get_data()


async def add_food(food: Food, cursor: MySQLCursorAbstract):
    stmt = "INSERT INTO Food (cal, name, base_measure) VALUES (%s, %s, %s)"
    await log(f"INSERT INTO Food (cal, name, base_measure) VALUES ({food.cal}, {food.fname.lower()}, {food.base_measurement})")
    cursor.execute(stmt, [food.cal, food.fname.lower(), food.base_measurement])


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
        result = round(((hash - (math.e ** 4.5)) ** 2) / math.pi)
    except:
        await log("UID Calculate failed!")
        return -1

    return result


async def safe(msg: str) -> bool:
    banned_chars = [";", "(", ")", "\\", "\"", "\'", "&", "|", ",", "!", "$"]
    for c in banned_chars:
        if c in msg: return False

    return True


async def auth_user(huid: float, uname: str) -> int | dict:
    res = Result()

    with db.DBConnect() as (connection, cursor):
        uid = await calc_UID(huid)

        if uid == -1:
            res.data["Result"] = "Failed"
            res.data["Message"] = "huid corrupted"
            await log("Passed hashed uid returned -1")

            return res.get_data()

        stmt = "SELECT uname, uid FROM User WHERE uid = %s"
        cursor.execute(stmt, [uid])

        result = cursor.fetchall()

        if len(result) == 0:
            res.data["Result"] = "Failed"
            res.data["Message"] = "Unknown user"
            await log("No matching UID in User table")

            return res.get_data()

        if result[0]["uname"] != uname: #type: ignore
            res.data["Result"] = "Failed"
            res.data["Message"] = "Unknown user, check logs"
            await log("WARNING: UID does not match passed username. Something fishy might be going on!")

            return res.get_data()

        connection.commit()

        return uid


async def auth_chef_or_admin(uid: int) -> int | dict:
    res = Result()

    with db.DBConnect() as (connection, cursor):
        try:
            stmt = "SELECT account_type FROM User WHERE uid = %s"
            cursor.execute(stmt, [uid])
            result = cursor.fetchall()

            if len(result) == 1 and result[0]["account_type"] == 2: # type: ignore
                return uid

            stmt = "SELECT * FROM Admin WHERE User_uid = %s"
            cursor.execute(stmt, [uid])
            result = cursor.fetchall()

            if len(result) == 1:
                return uid

            res.data["Result"] = "Failed"
            res.data["Message"] = "Must be a chef or admin to access this endpoint"
            await log(f"UID {uid} is not a chef or admin")

            return res.get_data()
        except mysql.connector.Error as err:
            return await data_base_err(err, connection)


async def auth_admin(uid: int) -> int | dict:
    res = Result()

    with db.DBConnect() as (connection, cursor):
        try:
            stmt = "SELECT * FROM Admin WHERE User_uid = %s"

            cursor.execute(stmt, [uid])

            result = cursor.fetchall()

            if len(result) != 1:
                res.data["Result"] = "Failed"
                res.data["Message"] = "UID Not in Admin table"
                await log(f"UID {uid} not in Admin table")

                return res.get_data()

            return uid
        except mysql.connector.Error as err:
            return await data_base_err(err, connection)
