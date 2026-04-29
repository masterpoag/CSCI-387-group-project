"""Shared backend helpers.

This module is the toolbox the route handlers reuse: a Result envelope
matching the API's standard response shape, simple logging, password
and UID hashing helpers, and a family of `auth_*` functions that
verify a request is allowed to hit a given endpoint.

The `auth_*` functions follow a consistent contract:
    - Return the user's integer UID on success.
    - Return a Result-shaped dict on failure (so the route can return
      it directly to the client).
"""

import time
import math
import hashlib
import mysql.connector
from mysql.connector.abstracts import MySQLCursorAbstract
import db
from message import *


class Result():
    """Standard JSON envelope every endpoint returns.

    Fields:
      Result  — "Success" | "Failed" | "Warning"
      Message — human-readable description (mainly for debugging)
      Data    — payload, may be None
    """

    def __init__(self) -> None:
        self.data = {"Result": "Success", "Message": "", "Data": None}

    def get_data(self) -> dict:
        return self.data


async def log(msg: str) -> None:
    # It's rather simple now, but the idea is that I could expand it later if need be
    print("[API.PY] " + msg)


async def data_base_err(e: mysql.connector.Error, con) -> dict:
    """Roll back the open transaction and return a Failed envelope.

    Centralized so every route handles MySQL errors the same way and
    the actual error string never leaks back to the client.
    """
    res = Result()

    res.data["Result"] = "Failed"
    res.data["Message"] = "Database threw an error, check API logs"
    await log(f"Database threw an error!\n\t{e}")
    con.rollback()

    return res.get_data()


async def add_food(food: Food, cursor: MySQLCursorAbstract):
    """Insert a brand-new Food row.

    Used during recipe creation when an ingredient is flagged isNew=true.
    The food name is lower-cased so duplicate detection elsewhere is
    case-insensitive.
    """
    stmt = "INSERT INTO Food (cal, name, base_measure) VALUES (%s, %s, %s)"
    await log(f"INSERT INTO Food (cal, name, base_measure) VALUES ({food.cal}, {food.fname.lower()}, {food.base_measurement})")
    cursor.execute(stmt, [food.cal, food.fname.lower(), food.base_measurement])


async def hash_UID(uid: int) -> float:
    """Convert a real UID into a reversible token sent to the browser.

    The transformation is sqrt(pi * uid) + e^4.5. It's reversible by
    calc_UID() below so we can recover the UID without storing a
    server-side session table.
    """
    try:
        result = ((math.pi * uid) ** 0.5) + (math.e ** 4.5)
    except:
        await log("UID Hashing failed!")
        return -1

    return result


async def hash_pass(pswd: str, t: int | None = None) -> tuple[str, int]:
    """Compute the PBKDF2 password hash, salted with the account's createTime.

    On registration `t` is None and a fresh timestamp is generated; on
    login `t` is the createTime stored alongside the user so the same
    hash can be reproduced and compared. 3 iterations matches the
    existing data in the database.
    """
    if not t:
        t = math.floor(time.time())
        await log("No time passed. Creating new password.")
    else:
        await log("Time passed. Checking password.")
    hashbrown = hashlib.pbkdf2_hmac('sha256', pswd.encode('UTF-8'), str(t).encode('UTF-8'), 3)

    return (hashbrown.hex(), t)


async def calc_UID(hash: float) -> int:
    """Inverse of hash_UID: recover the UID from the hashed token."""
    try:
        result = round(((hash - (math.e ** 4.5)) ** 2) / math.pi)
    except:
        await log("UID Calculate failed!")
        return -1

    return result


async def safe(msg: str) -> bool:
    """Return False when the string contains characters we don't allow.

    Lightweight guard to keep obvious SQL/shell metacharacters out of
    user-supplied identifiers like usernames. Full safety still relies
    on parameterized queries throughout the route handlers.
    """
    banned_chars = [";", "(", ")", "\\", "\"", "\'", "&", "|", ",", "!", "$"]
    for c in banned_chars:
        if c in msg: return False

    return True


async def auth_user(huid: float, uname: str) -> int | dict:
    """Verify the hashed UID matches a known user with the given username.

    Returns the integer UID on success, or a Result envelope on failure.
    Used by every endpoint that requires the requester to be logged in.
    """
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
    """Allow only Chef accounts (account_type=2) and members of the
    Admin table. Used to gate the recipe-publishing endpoints."""
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


async def auth_fit_or_admin(uid: int) -> int | dict:
    """Allow only Trainer accounts (account_type=3) and Admin members.
    Mirrors auth_chef_or_admin for the workout-publishing endpoints."""
    res = Result()

    with db.DBConnect() as (connection, cursor):
        try:
            stmt = "SELECT account_type FROM User WHERE uid = %s"
            cursor.execute(stmt, [uid])
            result = cursor.fetchall()

            if len(result) == 1 and result[0]["account_type"] == 3: # type: ignore
                return uid

            stmt = "SELECT * FROM Admin WHERE User_uid = %s"
            cursor.execute(stmt, [uid])
            result = cursor.fetchall()

            if len(result) == 1:
                return uid

            res.data["Result"] = "Failed"
            res.data["Message"] = "Must be a fitness instructor or admin to access this endpoint"
            await log(f"UID {uid} is not a fitness instructor or admin")

            return res.get_data()
        except mysql.connector.Error as err:
            return await data_base_err(err, connection)


async def auth_admin(uid: int) -> int | dict:
    """Allow only members of the Admin table — the strictest guard,
    used by every /api/admin/* endpoint."""
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
