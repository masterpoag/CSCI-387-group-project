import mysql.connector
import json


def database_connect():
    db_key = ""

    with open("database.env") as file:
        db_key = json.load(file)

    connection = mysql.connector.connect(
        host=db_key['servername'],
        port=3306,
        database=db_key['dbname'],
        user=db_key['username'],
        password=db_key['password'],
        raise_on_warnings=True
    )

    return (connection, connection.cursor(dictionary=True))
