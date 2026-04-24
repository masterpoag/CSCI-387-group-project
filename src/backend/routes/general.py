import mysql.connector
import db
from fastapi import APIRouter
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
from message import *
from utils import Result, log, data_base_err, add_food, hash_UID, hash_pass, calc_UID, safe, auth_user

router = APIRouter()

@router.post("/api/report-content")
async def report_content(huid: float, uname: str, nr: NewReport):
    res = Result()

    with db.DBConnect() as (connection, cursor):
        try:
            uid = await auth_user(huid, uname)
            if type(uid) != int:
                return uid

            stmt = "SELECT FROM Report WHERE User_uid = %s AND obj_id = %s"
            cursor.execute(stmt, [uid, nr.obj_id])

            if (len(cursor.fetchall()) != 0):
                res.data["Result"] = "Failed"
                res.data["Message"] = "User already has a report for this object"

                return res.get_data()

            stmt = "INSERT INTO Report (User_uid, rname, descript, rep_type, obj_id, timestub) VALUES (%s, %s, %s, %s, %s, UTC_TIMESTAMP())"
            cursor.execute(stmt, [uid, nr.rname, nr.desc, nr.rep_type, nr.obj_id])

            await log(f"INSERT INTO Report (User_uid, rname, descript, rep_type, obj_id, timestub) VALUES ({uid}, {nr.rname}, {nr.desc}, {nr.rep_type}, {nr.obj_id}, UTC_TIMESTAMP())")

            connection.commit()

            res.data["Result"] = "Success"
            res.data["Message"] = "Report successfully created"

            return res.get_data()
        
        except mysql.connector.Error as err:
            return await data_base_err(err, connection)


@router.post("/api/create-food")
async def create_food(nf: Food):
    '''
    Check if food exists,
    If it doesn't insert.
    '''

    res = Result()

    with db.DBConnect() as (connection, cursor):
        try:
            stmt = "SELECT name FROM Food WHERE name = %s"

            cursor.execute(stmt, [nf.fname])

            names = cursor.fetchall()

            if len(names) != 0:
                res.data["Result"] = "Failed"
                res.data["Message"] = "Food already exists in database!"
                await log("Error: Food already exists in database!")

                return res.get_data()

            stmt = "INSERT INTO Food (cal, base_measure, name) VALUES (%s, %s, %s)"

            cursor.execute(stmt, [nf.cal, nf.base_measurement, nf.fname])

            connection.commit()
            await log(f"Food {nf.fname} successfully added.")
        except mysql.connector.Error as err:
            connection.rollback()
            await log(f"Database threw an error!\n\t{err}")

            res.data["Result"] = "Failed"
            res.data["Message"] = "Database threw an error, check API logs"

            return res.get_data()


@router.post("/api/create-recipe")
async def create_recipe(huid: float, uname: str, nr: NewRecipe, foods: list[Food]):
    """
    Notes:
    Sign in system may be abstracted into it's own function soon. That'll mean a new object like NewRecipe or Food.

    If isNew is true, 'cal' and 'base_measurement' are required.

    Base measurement indexes:
    0 --> Pound
    1 --> Ounce
    2 --> Cup
    3 --> Teaspoon

    When you use 'qty', the backend expects it to be in unites relative to the food's base measurement. It is up to the front end to do the conversion.
    """

    '''
    Dev Notes:
    1. Check if the user is logged in (does hashed uid match corresponding uname?)
    2. Add new foods (if any)
    3. Get each food fid for Bridge Entity
    4. Add recipe
    5. Add quantities to B.E.
    '''
    res = Result()
    with db.DBConnect() as (connection, cursor):
        try:
            auth = await auth_user(huid, uname)
            uid = 0
            if type(auth) != int:
                return auth

            uid = auth

            # Start transaction
            connection.start_transaction()

            # Check if recipe is actually new
            stmt = "SELECT name FROM Recipe WHERE User_uid = %s AND name = %s"
            cursor.execute(stmt, [uid, nr.rname])

            result = cursor.fetchall()

            if len(result) != 0:
                res.data["Result"] = "Failed"
                res.data["Message"] = "Recipe with that name already exists for that user!"
                await log("Recipe with that name already exists for that user!")
                connection.rollback()

                return res.get_data()

            # Gather each fid for each food
            fids = []
            for f in foods:
                stmt = "SELECT name FROM Food WHERE name = %s"
                cursor.execute(stmt, [f.fname])

                result = cursor.fetchall()

                if f.isNew and len(result) == 0:
                    await add_food(f, cursor)

                stmt = "SELECT fid FROM Food WHERE name = %s"
                cursor.execute(stmt, [f.fname])

                result = cursor.fetchall()

                # It shouldn't be possible for result to be empty, so I won't bother checking for it
                fids.append([result[0]["fid"], f.qty]) #type: ignore

            # Add Recipe
            stmt = "INSERT INTO Recipe (name, `desc`, instruct, isPublic, User_uid) VALUES (%s, %s, %s, %s, %s)"
            await log(f"INSERT INTO Recipe (name, `desc`, instruct, isPublic, User_uid) VALUES ({nr.rname}, {nr.desc}, {nr.instruct}, {nr.isPublic}, {uid})")
            cursor.execute(stmt, [nr.rname, nr.desc, nr.instruct, nr.isPublic, uid])

            stmt = "SELECT rid FROM Recipe WHERE User_uid = %s AND name = %s"
            cursor.execute(stmt, [uid, nr.rname])

            result = cursor.fetchall()
            rid = int(result[0]["rid"]) #type: ignore

            # Add to Quantity B.E.
            stmt = "INSERT INTO Quantity (Food_fid, Recipe_rid, qty) VALUES (%s, %s, %s)"

            for fid, qty in fids:
                cursor.execute(stmt, [fid, rid, qty])

            #End Transaction
            connection.commit()

            res.data["Result"] = "Success"
            res.data["Message"] = f"Recipe {nr.rname} successfully added."

            return res.get_data()

        except mysql.connector.Error as err:
            res.data["Result"] = "Failed"
            res.data["Message"] = "Database threw an error, check API logs"
            await log(f"Database threw an error!\n\t{err}")
            #Rollback
            connection.rollback()

            return res.get_data()


@router.post("/api/create-workout")
async def create_workout(huid: float, uname: str, nw: NewWorkout):
    """
    Creates a new workout for the authenticated user.

    Requires the user to be logged in via huid and uname.
    Prevents duplicate workouts (same instructions for the same user).
    """

    '''
    Dev Notes:
    1. Check if the user is logged in (does hashed uid match corresponding uname?)
    2. Check if workout with the same instructions already exists for that user
    3. Add workout
    '''
    res = Result()
    with db.DBConnect() as (connection, cursor):
        try:
            auth = await auth_user(huid, uname)
            if type(auth) != int:
                return auth

            uid = auth

            # Start transaction
            connection.start_transaction()

            # Check if workout already exists for this user
            stmt = "SELECT wid FROM Workout WHERE User_uid = %s AND instructions = %s"
            cursor.execute(stmt, [uid, nw.instructions])

            result = cursor.fetchall()

            if len(result) != 0:
                res.data["Result"] = "Failed"
                res.data["Message"] = "Workout with those instructions already exists for that user!"
                await log("Workout with those instructions already exists for that user!")
                connection.rollback()

                return res.get_data()

            # Add Workout
            stmt = "INSERT INTO Workout (instructions, wname, isPublic, User_uid) VALUES (%s, %s, %s, %s)"
            await log(f"INSERT INTO Workout (instructions, wname, isPublic, User_uid) VALUES ({nw.instructions}, {nw.name}, {nw.isPublic}, {uid})")
            cursor.execute(stmt, [nw.instructions, nw.name, nw.isPublic, uid])

            # End Transaction
            connection.commit()

            res.data["Result"] = "Success"
            res.data["Message"] = "Workout successfully added."

            return res.get_data()

        except mysql.connector.Error as err:
            res.data["Result"] = "Failed"
            res.data["Message"] = "Database threw an error, check API logs"
            await log(f"Database threw an error!\n\t{err}")
            connection.rollback()

            return res.get_data()


@router.get("/api/get-user-recipe")
async def get_user_recipe(huid: float, uname: str):
    res = Result()

    with db.DBConnect() as (connection, cursor):
        try:
            auth = await auth_user(huid, uname)
            if type(auth) != int:
                return auth

            uid = auth

            stmt = "SELECT rid, name, `desc`, instruct, isPublic FROM Recipe WHERE User_uid = %s"
            cursor.execute(stmt, [uid])

            recipes = cursor.fetchall()

            recipe_list = []
            for recipe in recipes:
                rid = recipe["rid"] # type: ignore

                stmt = "SELECT Food.name, Quantity.qty, Food.cal, Food.base_measure FROM Quantity JOIN Food ON Quantity.Food_fid = Food.fid WHERE Quantity.Recipe_rid = %s"
                cursor.execute(stmt, [rid]) # type: ignore
                ingredients = cursor.fetchall()

                recipe_list.append({
                    "rid": recipe["rid"], # type: ignore
                    "name": recipe["name"], # type: ignore
                    "desc": recipe["desc"], # type: ignore
                    "instruct": recipe["instruct"], # type: ignore
                    "isPublic": bool(recipe["isPublic"]), # type: ignore
                    "ingredients": ingredients
                })

            res.data["Result"] = "Success"
            res.data["Message"] = f"Returning recipes for {uname}"
            res.data["Data"] = recipe_list
            await log(f"Returning {len(recipe_list)} recipes for {uname}")

            return res.get_data()

        except mysql.connector.Error as err:
            res.data["Result"] = "Failed"
            res.data["Message"] = "Database threw an error, check API logs"
            await log(f"Database threw an error!\n\t{err}")
            connection.rollback()

            return res.get_data()


@router.get("/api/delete-recipe")
async def delete_recipe(huid: float, uname: str, rid: int):
    res = Result()

    with db.DBConnect() as (connection, cursor):
        try:
            auth = await auth_user(huid, uname)
            if type(auth) != int:
                return auth

            uid = auth

            stmt = "SELECT rid FROM Recipe WHERE rid = %s AND User_uid = %s"
            cursor.execute(stmt, [rid, uid])

            if len(cursor.fetchall()) == 0:
                res.data["Result"] = "Failed"
                res.data["Message"] = f"No recipe found with rid {rid} owned by {uname}"
                await log(f"No recipe with rid {rid} owned by uid {uid}")

                return res.get_data()

            stmt = "DELETE FROM Quantity WHERE Recipe_rid = %s"
            cursor.execute(stmt, [rid])

            stmt = "DELETE FROM Recipe WHERE rid = %s AND User_uid = %s"
            cursor.execute(stmt, [rid, uid])

            connection.commit()

            res.data["Result"] = "Success"
            res.data["Message"] = f"Recipe {rid} deleted"
            await log(f"Recipe {rid} deleted by owner uid {uid}")

            return res.get_data()

        except mysql.connector.Error as err:
            return await data_base_err(err, connection)


@router.get("/api/delete-workout")
async def delete_workout(huid: float, uname: str, wid: int):
    res = Result()

    with db.DBConnect() as (connection, cursor):
        try:
            auth = await auth_user(huid, uname)
            if type(auth) != int:
                return auth

            uid = auth

            stmt = "SELECT wid FROM Workout WHERE wid = %s AND User_uid = %s"
            cursor.execute(stmt, [wid, uid])

            if len(cursor.fetchall()) == 0:
                res.data["Result"] = "Failed"
                res.data["Message"] = f"No workout found with wid {wid} owned by {uname}"
                await log(f"No workout with wid {wid} owned by uid {uid}")

                return res.get_data()

            stmt = "DELETE FROM Workout WHERE wid = %s AND User_uid = %s"
            cursor.execute(stmt, [wid, uid])

            connection.commit()

            res.data["Result"] = "Success"
            res.data["Message"] = f"Workout {wid} deleted"
            await log(f"Workout {wid} deleted by owner uid {uid}")

            return res.get_data()

        except mysql.connector.Error as err:
            return await data_base_err(err, connection)


@router.get("/api/get-foods")
async def get_foods():
    res = Result()

    with db.DBConnect() as (connection, cursor):
        try:
            stmt = "SELECT * FROM Food"
            cursor.execute(stmt)

            foods = cursor.fetchall()

            res.data["Result"] = "Success"
            res.data["Message"] = "Returning Foods"
            res.data["Data"] = foods

            connection.commit()

            await log(f"Returning foods:\n\t{foods}")

            return res.get_data()

        except mysql.connector.Error as err:
            res.data["Result"] = "Failed"
            res.data["Message"] = "Database threw an error, check API logs"
            await log(f"Database threw an error!\n\t{err}")
            connection.rollback()

            return res.get_data()


@router.get("/api/get-public-recipe")
async def get_public_recipe():
    res = Result()

    with db.DBConnect() as (connection, cursor):
        try:
            stmt = "SELECT Recipe.rid, Recipe.name, Recipe.`desc`, Recipe.instruct, Recipe.isPublic, User.uname FROM Recipe JOIN User ON Recipe.User_uid = User.uid WHERE Recipe.isPublic = TRUE"
            cursor.execute(stmt)

            recipes = cursor.fetchall()

            recipe_list = []
            for recipe in recipes:
                rid = int(recipe["rid"]) # type: ignore

                stmt = "SELECT Food.name, Quantity.qty, Food.cal, Food.base_measure FROM Quantity JOIN Food ON Quantity.Food_fid = Food.fid WHERE Quantity.Recipe_rid = %s"
                cursor.execute(stmt, [rid])
                ingredients = cursor.fetchall()

                recipe_list.append({
                    "name": recipe["name"], # type: ignore
                    "desc": recipe["desc"], # type: ignore
                    "instruct": recipe["instruct"], # type: ignore
                    "isPublic": bool(recipe["isPublic"]), # type: ignore
                    "owner": recipe["uname"], # type: ignore
                    "ingredients": ingredients
                })

            res.data["Result"] = "Success"
            res.data["Message"] = "Returning all public recipes"
            res.data["Data"] = recipe_list
            await log(f"Returning {len(recipe_list)} public recipes")

            return res.get_data()

        except mysql.connector.Error as err:
            res.data["Result"] = "Failed"
            res.data["Message"] = "Database threw an error, check API logs"
            await log(f"Database threw an error!\n\t{err}")
            connection.rollback()

            return res.get_data()


@router.get("/api/get-public-workout")
async def get_public_workout():
    res = Result()

    with db.DBConnect() as (connection, cursor):
        try:
            stmt = "SELECT Workout.wid, Workout.instructions, Workout.wname, Workout.isPublic, User.uname FROM Workout JOIN User ON Workout.User_uid = User.uid WHERE Workout.isPublic = TRUE"
            cursor.execute(stmt)

            workouts = cursor.fetchall()

            workout_list = []
            for workout in workouts:
                workout_list.append({
                    "name": workout["wname"], # type: ignore
                    "wid": int(workout["wid"]), # type: ignore
                    "instructions": workout["instructions"], # type: ignore
                    "isPublic": bool(workout["isPublic"]), # type: ignore
                    "owner": workout["uname"], # type: ignore
                })

            res.data["Result"] = "Success"
            res.data["Message"] = "Returning all public workouts"
            res.data["Data"] = workout_list
            await log(f"Returning {len(workout_list)} public workouts")

            return res.get_data()

        except mysql.connector.Error as err:
            res.data["Result"] = "Failed"
            res.data["Message"] = "Database threw an error, check API logs"
            await log(f"Database threw an error!\n\t{err}")
            connection.rollback()

            return res.get_data()


@router.get("/api/get-user-workout")
async def get_user_workout(huid: float, uname: str):
    res = Result()

    with db.DBConnect() as (connection, cursor):
        try:
            auth = await auth_user(huid, uname)
            if type(auth) != int:
                return auth

            uid = auth

            stmt = "SELECT * FROM Workout WHERE User_uid = %s"
            cursor.execute(stmt, [uid])

            workouts = cursor.fetchall()

            workout_list = []
            for workout in workouts:
                workout_list.append({
                    "wid": int(workout["wid"]), # type: ignore
                    "name": workout["wname"], # type: ignore
                    "instructions": workout["instructions"], # type: ignore
                    "isPublic": bool(workout["isPublic"]), # type: ignore
                })

            res.data["Result"] = "Success"
            res.data["Message"] = f"Returning workouts for {uname}"
            res.data["Data"] = workout_list
            await log(f"Returning {len(workout_list)} workouts for {uname}")

            return res.get_data()

        except mysql.connector.Error as err:
            res.data["Result"] = "Failed"
            res.data["Message"] = "Database threw an error, check API logs"
            await log(f"Database threw an error!\n\t{err}")
            connection.rollback()

            return res.get_data()


@router.post("/api/register")
async def register(hasCG: bool, nu: NewUser):
    # A few things:
    # 1. Check if the username is already in the database
    # 2. Check if the calorie goal is filled
    # 3. Calculate hash password
    # 4. Store information in db
    res = Result()
    with db.DBConnect() as (connection, cursor):
        try:
            if len(nu.uname) > 20:
                res.data["Result"] = "Failed"
                res.data["Message"] = "username is greater than 20"
                await log(f"len(nu.umane) ({len(nu.uname)}) is greater than 20!")

                return res.get_data()

            isSafe = await safe(nu.uname)
            if not isSafe:
                res.data["Result"] = "Failed"
                res.data["Message"] = "username contains banned characters"
                await log(f"{nu.uname} contains banned characters")

                return res.get_data()
            cursor.execute("SELECT uname FROM User WHERE uname = %s", [nu.uname])
            await log(f"SELECT uname FROM User WHERE uname = {nu.uname}")

            result = cursor.fetchall()

            if len(result) != 0:
                res.data["Result"] = "Failed"
                res.data["Message"] = "Username already exists in database"
                await log(f"{nu.uname} already exists in database!")

                return res.get_data()

            # Set up variables
            pswd, create_time = await hash_pass(nu.upass)

            stmt = ""
            if hasCG:
                stmt = "INSERT INTO User (uname, pass, createTime, wieght, account_type, cal_goal) VALUES (%s, %s, %s, %s,  %s, %s)"
                await log(f"INSERT INTO User (uname, pass, createTime, wieght, account_type, cal_goal) VALUES ({nu.uname}, {pswd}, {create_time}, {nu.weight}, {nu.atype}, {nu.calGoal}")
                cursor.execute(stmt, [nu.uname, pswd, create_time, nu.weight, nu.atype, nu.calGoal])
            else:
                stmt = "INSERT INTO User (uname, pass, createTime, wieght, account_type) VALUES (%s, %s, %s, %s, %s)"
                await log(f"INSERT INTO User (uname, pass, createTime, wieght, account_type) VALUES ({nu.uname}, {pswd}, {create_time}, {nu.weight}, {nu.atype})")
                cursor.execute(stmt, [nu.uname, pswd, create_time, nu.weight, nu.atype])

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


@router.get("/api/get-food")
async def get_food():
    res = Result()
    with db.DBConnect() as (connection, cursor):
        try:
            stmt = "SELECT name, cal, base_measure FROM Food"
            cursor.execute(stmt)
            await log(stmt)

            result = cursor.fetchall()

            if len(result) == 0:
                res.data["Result"] = "Failed"
                res.data["Message"] = "Food table empty"
                await log("Food table empty")

                return res.get_data()

            res.data["Result"] = "Success"
            res.data["Message"] = "Returning all food names"
            res.data["Data"] = result

            return res.get_data()

        except mysql.connector.Error as err:
            res.data["Result"] = "Failed"
            res.data["Message"] = "Database threw an error, check API logs"
            await log(f"Database error:\n\t{err}")

            return res.get_data()


@router.get("/api/get-auth-level")
async def get_auth_level(huid: float):
    res = Result()

    with db.DBConnect() as (connection, cursor):
        try:
            uid = await calc_UID(huid)

            if uid == -1:
                res.data["Result"] = "Failed"
                res.data["Message"] = "huid corrupted"
                await log("Passed hashed uid returned -1")

                return res.get_data()

            stmt = "SELECT account_type FROM User WHERE uid = %s"

            cursor.execute(stmt, [uid])

            acc_type = cursor.fetchall()

            res.data["Result"] = "Success"
            res.data["Message"] = "Fetched account type successfully"
            res.data["Data"] = acc_type
            await log(f"Returning account type for uid {uid}")

            return res.get_data()

        except mysql.connector.Error as err:
            res.data["Result"] = "Failed"
            res.data["Message"] = "Database threw an error, check API logs"
            await log(f"Database error:\n\t{err}")

            return res.get_data()


@router.get("/api/login")
async def login(uname: str, upass: str):
    res = Result()
    with db.DBConnect() as (connection, cursor):
        try:
            '''
            1. Check if user exsists
            2. Check if password is the same as the hashed password
                if so, return hashed UID
            '''

            isSafe = await safe(uname)
            if not isSafe:
                res.data["Result"] = "Failed"
                res.data["Message"] = "uname contains banned characters"
                await log(f"{uname} contains banned characters")

                return res.get_data()

            cursor.execute("SELECT uname FROM User WHERE uname = %s", [uname])
            await log(f"SELECT uname FROM User WHERE uname = {uname}")

            result = cursor.fetchall()

            if len(result) == 0:
                res.data["Result"] = "Failed"
                res.data["Message"] = "Username does not exsist"
                await log(f"{uname} does not exist in database")
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

            # Password is correct, return hashed uid

            huid = await hash_UID(stored_uid)

            res.data["Result"] = "Success"
            res.data["Message"] = f"{uname} successfully signed in"
            res.data["Data"] = huid
            await log(f"{uname} successfully signed in")

            connection.commit()

            return res.get_data()

        except mysql.connector.Error as err:
            res.data["Result"] = "Failed"
            res.data["Message"] = "Database threw an error, check API logs"
            await log(f"Database error:\n\t{err}")

            return res.get_data()


@router.get("/api/get-user-reports")
async def get_user_reports(huid: float, uname: str, tz: str):
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

            uid = auth

            stmt = "SELECT repid, rname, descript, rep_type, obj_id, CONVERT_TZ(timestub, 'UTC', %s) as timestub FROM Report WHERE User_uid = %s"
            cursor.execute(stmt, [tz, uid])

            reports = cursor.fetchall()

            res.data["Result"] = "Success"
            res.data["Message"] = f"Returning reports for {uname}"
            res.data["Data"] = reports
            await log(f"Returning {len(reports)} reports for {uname}")

            return res.get_data()

        except mysql.connector.Error as err:
            return await data_base_err(err, connection)


@router.get("/api/delete-report")
async def delete_report(huid: float, uname: str, repid: int):
    res = Result()

    with db.DBConnect() as (connection, cursor):
        try:
            auth = await auth_user(huid, uname)
            if type(auth) != int:
                return auth

            uid = auth

            stmt = "SELECT repid FROM Report WHERE repid = %s AND User_uid = %s"
            cursor.execute(stmt, [repid, uid])

            if len(cursor.fetchall()) == 0:
                res.data["Result"] = "Failed"
                res.data["Message"] = f"No report found with repid {repid} owned by {uname}"
                await log(f"No report with repid {repid} owned by uid {uid}")

                return res.get_data()

            stmt = "DELETE FROM Report WHERE repid = %s AND User_uid = %s"
            cursor.execute(stmt, [repid, uid])

            connection.commit()

            res.data["Result"] = "Success"
            res.data["Message"] = f"Report {repid} deleted"
            await log(f"Report {repid} deleted by owner uid {uid}")

            return res.get_data()

        except mysql.connector.Error as err:
            return await data_base_err(err, connection)


@router.get("/hello")
async def read_root():
    ret = Result()

    ret.data["Message"] = "Hi! Hallo! Bonjour!"
    await log("Hello endpoint called")

    return ret.get_data()
