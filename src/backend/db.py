import mysql.connector
import json


def database_connect():
    db_key = ""

    with open("/home/group3/CSCI-387-group-project/src/backend/database.env") as file:
        db_key = json.load(file)

    connection = mysql.connector.connect(
        host=db_key['servername'],
        port=3306,
        database=db_key['dbname'],
        user=db_key['username'],
        password=db_key['password'],
        raise_on_warnings=True
    )

    return connection

class DBConnect:
    def __enter__(self):
        self.connection = database_connect()
        self.cursor = self.connection.cursor(dictionary=True)
        
        return self.connection, self.cursor
    
    def __exit__(self, exc_type, exc, tb):
        self.cursor.close()
        self.connection.close()
    
    
