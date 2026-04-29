"""MySQL connection helpers used by every route module.

`database_connect()` opens a raw connection using credentials read from
the database.env file kept outside the repo. `DBConnect` wraps that in a
context manager so route handlers can write::

    with DBConnect() as (conn, cursor):
        cursor.execute(...)

and have the cursor and connection cleaned up automatically when the
block exits, even if a handler raises.
"""

import mysql.connector
import json


def database_connect():
    """Open a fresh MySQL connection using the deployed credentials file."""
    db_key = ""

    # Credentials live outside the repo (and outside source control) and
    # are loaded from a JSON file at this fixed path on the deployment host.
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
    """Context manager that yields (connection, cursor).

    The cursor is configured with `dictionary=True` so query results
    arrive as `{column: value}` dicts rather than positional tuples,
    which is what every route in this project expects.
    """

    def __enter__(self):
        self.connection = database_connect()
        self.cursor = self.connection.cursor(dictionary=True)

        return self.connection, self.cursor

    def __exit__(self, exc_type, exc, tb):
        # Always close the cursor and connection, even if the route raised.
        self.cursor.close()
        self.connection.close()
    
    
