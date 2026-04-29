"""Admin-only routes (user management, content moderation).

Every endpoint under /api/admin runs the request through `auth_admin`
so a non-admin can never reach the underlying SQL.
"""

import mysql.connector
import db
from fastapi import APIRouter
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
from utils import Result, log, data_base_err, auth_user, auth_admin

router = APIRouter(prefix="/api/admin")


@router.get("/delete-food")
async def delete_food(huid: float, uname: str, fname: str):
    """Remove a food entry from the shared library by name."""
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
    """Promote / demote a user's account_type.

    Levels: 1=Standard, 2=Chef, 3=Trainer. Admin (0) is intentionally
    not selectable here. Admins can also not change their own account.
    """
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
    """Permanently delete a user account.

    The Admin cannot delete themselves. Foreign-key cascades take care
    of the user's owned recipes/workouts/reports.
    """
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
    """Return every user account so the Admin Dashboard can list them."""
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
    """Return every user-filed report.

    `tz` is an IANA timezone string sent from the browser so timestamps
    can be returned in the admin's local time. Each report includes a
    nested `obj` field describing the reported recipe/workout/food.
    """
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

            report_list = []
            for report in reports:
                rep_type = report["rep_type"] # type: ignore
                obj_id = int(report["obj_id"]) # type: ignore

                if rep_type == "rcp":
                    cursor.execute(
                        "SELECT Recipe.rid, Recipe.name, Recipe.`desc`, Recipe.instruct, Recipe.isPublic, Recipe.isPublishable, User.uname AS owner FROM Recipe JOIN User ON Recipe.User_uid = User.uid WHERE Recipe.rid = %s",
                        [obj_id]
                    )
                    obj = cursor.fetchone()
                elif rep_type == "wrk":
                    cursor.execute(
                        "SELECT Workout.wid, Workout.wname, Workout.instructions, Workout.isPublic, Workout.isPublishable, User.uname AS owner FROM Workout JOIN User ON Workout.User_uid = User.uid WHERE Workout.wid = %s",
                        [obj_id]
                    )
                    obj = cursor.fetchone()
                elif rep_type == "fdd":
                    cursor.execute(
                        "SELECT fid, name, cal, base_measure FROM Food WHERE fid = %s",
                        [obj_id]
                    )
                    obj = cursor.fetchone()
                else:
                    obj = None

                report_list.append({**report, "obj": obj}) # type: ignore

            res.data["Result"] = "Success"
            res.data["Message"] = "Returning all reports"
            res.data["Data"] = report_list
            await log(f"Admin {uname} fetching all reports ({len(report_list)} total)")

            return res.get_data()

        except mysql.connector.Error as err:
            return await data_base_err(err, connection)


@router.get("/delete-recipe")
async def delete_recipe(huid: float, uname: str, rid: int):
    """Admin-level recipe delete (no ownership check).

    Used to remove offending content surfaced through the report queue.
    """
    res = Result()

    with db.DBConnect() as (connection, cursor):
        try:
            auth = await auth_user(huid, uname)
            if type(auth) != int:
                return auth

            uid = await auth_admin(auth)
            if type(uid) != int:
                return uid

            stmt = "SELECT rid FROM Recipe WHERE rid = %s"
            cursor.execute(stmt, [rid])

            if len(cursor.fetchall()) == 0:
                res.data["Result"] = "Failed"
                res.data["Message"] = f"No recipe found with rid {rid}"
                await log(f"No recipe found with rid {rid}")

                return res.get_data()

            stmt = "SELECT Recipe_rid FROM Quantity WHERE Recipe_rid = %s"
            cursor.execute(stmt, [rid])

            if len(cursor.fetchall()) == 0:
                res.data["Result"] = "Failed"
                res.data["Message"] = f"No Quantity found with Recipe_rid {rid}"
                await log(f"No Quantity found with Recipe_rid {rid}")

                return res.get_data()

            stmt = "DELETE From Quantity WHERE Recipe_rid = %s"
            cursor.execute(stmt, [rid])

            stmt = "DELETE FROM Recipe WHERE rid = %s"
            cursor.execute(stmt, [rid])

            connection.commit()

            res.data["Result"] = "Success"
            res.data["Message"] = f"Recipe {rid} deleted"
            await log(f"Recipe {rid} deleted by admin uid {uid}")

            return res.get_data()

        except mysql.connector.Error as err:
            return await data_base_err(err, connection)


@router.get("/delete-workout")
async def delete_workout(huid: float, uname: str, wid: int):
    """Admin-level workout delete (no ownership check). Same purpose
    as /delete-recipe for the workout side of the moderation queue."""
    res = Result()

    with db.DBConnect() as (connection, cursor):
        try:
            auth = await auth_user(huid, uname)
            if type(auth) != int:
                return auth

            uid = await auth_admin(auth)
            if type(uid) != int:
                return uid

            stmt = "SELECT wid FROM Workout WHERE wid = %s"
            cursor.execute(stmt, [wid])

            if len(cursor.fetchall()) == 0:
                res.data["Result"] = "Failed"
                res.data["Message"] = f"No workout found with wid {wid}"
                await log(f"No workout found with wid {wid}")

                return res.get_data()

            stmt = "DELETE FROM Workout WHERE wid = %s"
            cursor.execute(stmt, [wid])

            connection.commit()

            res.data["Result"] = "Success"
            res.data["Message"] = f"Workout {wid} deleted"
            await log(f"Workout {wid} deleted by admin uid {uid}")

            return res.get_data()

        except mysql.connector.Error as err:
            return await data_base_err(err, connection)


@router.get("/delete-report")
async def admin_delete_report(huid: float, uname: str, repid: int):
    """Dismiss any user's report. Used by admins from the Reports
    tab to clear noise without touching the reported content."""
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
