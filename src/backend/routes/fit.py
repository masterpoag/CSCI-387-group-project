import mysql.connector
import db
from fastapi import APIRouter
from utils import Result, log, data_base_err, auth_user, auth_fit_or_admin

router = APIRouter(prefix="/api/fit")


@router.get("/get-publishable-workout")
async def get_publishable_workout(huid: float, uname: str):
    res = Result()

    with db.DBConnect() as (connection, cursor):
        try:
            auth = await auth_user(huid, uname)
            if type(auth) != int:
                return auth

            uid = await auth_fit_or_admin(auth)
            if type(uid) != int:
                return uid

            stmt = "SELECT Workout.wid, Workout.wname, Workout.instructions, Workout.isPublic, User.uname FROM Workout JOIN User ON Workout.User_uid = User.uid WHERE Workout.isPublishable = TRUE"
            cursor.execute(stmt)

            workouts = cursor.fetchall()

            workout_list = []
            for workout in workouts:
                workout_list.append({
                    "wid": int(workout["wid"]), # type: ignore
                    "name": workout["wname"], # type: ignore
                    "instructions": workout["instructions"], # type: ignore
                    "isPublic": bool(workout["isPublic"]), # type: ignore
                    "owner": workout["uname"], # type: ignore
                })

            res.data["Result"] = "Success"
            res.data["Message"] = "Returning all publishable workouts"
            res.data["Data"] = workout_list
            await log(f"Returning {len(workout_list)} publishable workouts")

            return res.get_data()

        except mysql.connector.Error as err:
            return await data_base_err(err, connection)


@router.get("/set-workout-publicity")
async def set_workout_publicity(huid: float, uname: str, wid: int, isPublic: bool):
    res = Result()

    with db.DBConnect() as (connection, cursor):
        try:
            auth = await auth_user(huid, uname)
            if type(auth) != int:
                return auth

            uid = await auth_fit_or_admin(auth)
            if type(uid) != int:
                return uid

            stmt = "SELECT wid, isPublishable FROM Workout WHERE wid = %s"
            cursor.execute(stmt, [wid])

            row = cursor.fetchone()
            if row is None:
                res.data["Result"] = "Failed"
                res.data["Message"] = f"No workout found with wid {wid}"
                await log(f"No workout found with wid {wid}")

                return res.get_data()

            if isPublic and not row["isPublishable"]: # type: ignore
                res.data["Result"] = "Failed"
                res.data["Message"] = f"Workout {wid} is not publishable and cannot be made public"
                await log(f"Attempt to make non-publishable workout {wid} public denied")

                return res.get_data()

            stmt = "UPDATE Workout SET isPublic = %s WHERE wid = %s"
            cursor.execute(stmt, [isPublic, wid])

            connection.commit()

            res.data["Result"] = "Success"
            res.data["Message"] = f"Workout {wid} isPublic set to {isPublic}"
            await log(f"Workout {wid} isPublic set to {isPublic} by uid {uid}")

            return res.get_data()

        except mysql.connector.Error as err:
            return await data_base_err(err, connection)

