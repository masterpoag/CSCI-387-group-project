import mysql.connector
import db
from fastapi import APIRouter
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
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


@router.get("/get-all-reports")
async def get_all_reports(huid: float, uname: str, tz: str):
    res = Result()

    try:
        ZoneInfo(tz)
    except ZoneInfoNotFoundError:
        res.data["Result"] = "Failed"
        res.data["Message"] = f"Invalid timezone: {tz}"
        await log(f"Invalid timezone passed: {tz}")
        return res.get_data()

    with db.DBConnect() as (connection, cursor):
        try:
            auth = await auth_user(huid, uname)
            if type(auth) != int:
                return auth

            uid = await auth_admin(auth)
            if type(uid) != int:
                return uid

            stmt = "SELECT Report.repid, Report.rname, Report.descript, Report.rep_type, Report.obj_id, CONVERT_TZ(Report.timestub, 'UTC', %s) as timestub, User.uname FROM Report JOIN User ON Report.User_uid = User.uid"
            cursor.execute(stmt, [tz])

            reports = cursor.fetchall()

            res.data["Result"] = "Success"
            res.data["Message"] = "Returning all reports"
            res.data["Data"] = reports
            await log(f"Admin {uname} fetching all reports ({len(reports)} total)")

            return res.get_data()

        except mysql.connector.Error as err:
            return await data_base_err(err, connection)


@router.get("/delete-report")
async def admin_delete_report(huid: float, uname: str, repid: int):
    res = Result()

    with db.DBConnect() as (connection, cursor):
        try:
            auth = await auth_user(huid, uname)
            if type(auth) != int:
                return auth

            uid = await auth_admin(auth)
            if type(uid) != int:
                return uid

            stmt = "SELECT repid FROM Report WHERE repid = %s"
            cursor.execute(stmt, [repid])

            if len(cursor.fetchall()) == 0:
                res.data["Result"] = "Failed"
                res.data["Message"] = f"No report found with repid {repid}"
                await log(f"Admin {uname}: no report with repid {repid}")

                return res.get_data()

            stmt = "DELETE FROM Report WHERE repid = %s"
            cursor.execute(stmt, [repid])

            connection.commit()

            res.data["Result"] = "Success"
            res.data["Message"] = f"Report {repid} deleted"
            await log(f"Report {repid} deleted by admin uid {uid}")

            return res.get_data()

        except mysql.connector.Error as err:
            return await data_base_err(err, connection)
