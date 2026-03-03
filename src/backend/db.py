import mysql.connection
import json


def database_connect():
    db_key = ""

    with open("database.env") as file:
        db_keyf = json.load(file)

    connecton = mysql.connector.connect(
        host=db_key['servername'],
        port=3306,
        database=db_key['dbname'],
        user=db_key['username'],
        password=db_key['password']
    )

    return (connection, connection.cursor())
