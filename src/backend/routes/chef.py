import mysql.connector
import db
from fastapi import APIRouter
from utils import Result, log, data_base_err, auth_user, auth_chef_or_admin

router = APIRouter(prefix="/api/chef")


@router.get("/get-publishable-recipes")
async def get_publishable_recipes(huid: float, uname: str):
    res = Result()

    with db.DBConnect() as (connection, cursor):
        try:
            auth = await auth_user(huid, uname)
            if type(auth) != int:
                return auth

            uid = await auth_chef_or_admin(auth)
            if type(uid) != int:
                return uid

            stmt = "SELECT Recipe.rid, Recipe.name, Recipe.`desc`, Recipe.instruct, Recipe.isPublic, User.uname FROM Recipe JOIN User ON Recipe.User_uid = User.uid WHERE Recipe.isPublishable = TRUE"
            cursor.execute(stmt)

            recipes = cursor.fetchall()

            recipe_list = []
            for recipe in recipes:
                rid = int(recipe["rid"]) # type: ignore

                stmt = "SELECT Food.name, Quantity.qty, Food.cal, Food.base_measure FROM Quantity JOIN Food ON Quantity.Food_fid = Food.fid WHERE Quantity.Recipe_rid = %s"
                cursor.execute(stmt, [rid])
                ingredients = cursor.fetchall()

                recipe_list.append({
                    "rid": int(recipe["rid"]), # type: ignore
                    "name": recipe["name"], # type: ignore
                    "desc": recipe["desc"], # type: ignore
                    "instruct": recipe["instruct"], # type: ignore
                    "isPublic": bool(recipe["isPublic"]), # type: ignore
                    "owner": recipe["uname"], # type: ignore
                    "ingredients": ingredients
                })

            res.data["Result"] = "Success"
            res.data["Message"] = "Returning all private recipes"
            res.data["Data"] = recipe_list
            await log(f"Returning {len(recipe_list)} private recipes")

            return res.get_data()

        except mysql.connector.Error as err:
            return await data_base_err(err, connection)


@router.get("/set-recipe-publicity")
async def set_recipe_publicity(huid: float, uname: str, rid: int, isPublic: bool):
    res = Result()

    with db.DBConnect() as (connection, cursor):
        try:
            auth = await auth_user(huid, uname)
            if type(auth) != int:
                return auth

            uid = await auth_chef_or_admin(auth)
            if type(uid) != int:
                return uid

            stmt = "SELECT rid, isPublishable FROM Recipe WHERE rid = %s"
            cursor.execute(stmt, [rid])

            row = cursor.fetchone()
            if row is None:
                res.data["Result"] = "Failed"
                res.data["Message"] = f"No recipe found with rid {rid}"
                await log(f"No recipe found with rid {rid}")

                return res.get_data()

            if isPublic and not bool(row["isPublishable"]): # type: ignore
                res.data["Result"] = "Failed"
                res.data["Message"] = f"Recipe {rid} is not publishable and cannot be made public"
                await log(f"Attempt to make non-publishable recipe {rid} public denied")

                return res.get_data()

            stmt = "UPDATE Recipe SET isPublic = %s WHERE rid = %s"
            cursor.execute(stmt, [isPublic, rid])

            if bool(row["isPublishable"]): # type: ignore
                stmt = "UPDATE Recipe SET isPublishable = FALSE"
                cursor.execute(stmt)    

            connection.commit()

            res.data["Result"] = "Success"
            res.data["Message"] = f"Recipe {rid} isPublic set to {isPublic}"
            await log(f"Recipe {rid} isPublic set to {isPublic} by uid {uid}")

            return res.get_data()

        except mysql.connector.Error as err:
            return await data_base_err(err, connection)
