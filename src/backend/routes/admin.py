import mysql.connector
import db
from fastapi import APIRouter
from utils import Result, log, data_base_err, auth_user, auth_admin

router = APIRouter(prefix="/api/admin")


@router.get("/delete-food")
async def delete_food(huid: float, uname: str, fname: str):
    res = Result()

    with db.DBConnect() as (connection, cursor):
        try:
            auth = await auth_user(huid, uname)
            if type(auth) != int:
                return auth

            uid = await auth_admin(auth)

            if type(uid) != int:
                return uid

            stmt = "DELETE FROM Food WHERE name = %s"

            cursor.execute(stmt, [fname])

            connection.commit()

            res.data["Result"] = "Success"
            res.data["Message"] = f"{fname} deleted"
            await log(f"{fname} deleted")

        except mysql.connector.Error as err:
            return await data_base_err(err, connection)


@router.get("/change-user-level")
async def change_user_level(huid: float, uname: str, changed_uid: int, level: int):
    res = Result()
    with db.DBConnect() as (connection, cursor):
        try:
            if level not in [1, 2, 3]:
                # 1 base
                # 2 Chef
                # 3 Fitness Instructor

                res.data["Result"] = "Failed"
                res.data["Message"] = "Not a valid account level"

                return res.get_data()

            auth = await auth_user(huid, uname)
            if type(auth) != int:
                return auth

            uid = await auth_admin(auth)
            if type(uid) != int:
                return uid

            if uid == changed_uid:
                res.data["Result"] = "Failed"
                res.data["Message"] = "Cannot changed currently logged-in user"
                await log("ERR: Cannot changed currently logged in user")

                return res.get_data()

            stmt = "UPDATE User SET account_type = %s WHERE uid = %s"

            cursor.execute(stmt, [level, changed_uid])

            connection.commit()

        except mysql.connector.Error as err:
            return await data_base_err(err, connection)


@router.get("/delete-user")
async def delete_user(huid: float, uname: str, deleted_uid: int):
    res = Result()
    with db.DBConnect() as (connection, cursor):
        try:
            auth = await auth_user(huid, uname)
            if type(auth) != int:
                return auth

            uid = await auth_admin(auth)

            if type(uid) != int:
                return uid

            if uid == deleted_uid:
                res.data["Result"] = "Failed"
                res.data["Message"] = "Cannot delete currently logged-in user"
                await log("ERR: Cannot delete currently logged in user")

                return res.get_data()

            stmt = "DELETE FROM User WHERE uid = %s AND uid != %s"
            cursor.execute(stmt, [deleted_uid, uid])

            connection.commit()

        except mysql.connector.Error as err:
            return await data_base_err(err, connection)


@router.get("/get-all-user")
async def get_all_user(huid: float, uname: str):
    res = Result()
    with db.DBConnect() as (connection, cursor):
        try:
            auth = await auth_user(huid, uname)
            if type(auth) != int:
                return auth

            uid = await auth_admin(auth)

            if type(uid) != int:
                return uid

            stmt = "SELECT * FROM User"

            cursor.execute(stmt)

            result = cursor.fetchall()

            res.data["Result"] = "Success"
            res.data["Message"] = "Returning all users"
            res.data["Data"] = result

            await log("Returning all users")

            return res.get_data()

        except mysql.connector.Error as err:
            await data_base_err(err, connection)
