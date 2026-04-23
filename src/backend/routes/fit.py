import mysql.connector
import db
from fastapi import APIRouter
from utils import Result, log, data_base_err, auth_user, auth_fit_or_admin

router = APIRouter(prefix="/api/fit")


@router.get("/delete-workout")
async def delete_workout(huid: float, uname: str, wid: int):
    res = Result()

    with db.DBConnect() as (connection, cursor):
        try:
            auth = await auth_user(huid, uname)
            if type(auth) != int:
                return auth

            uid = await auth_fit_or_admin(auth)
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
            await log(f"Workout {wid} deleted by uid {uid}")

            return res.get_data()

        except mysql.connector.Error as err:
            return await data_base_err(err, connection)
