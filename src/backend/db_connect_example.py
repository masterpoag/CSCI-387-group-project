import mysql.connector
import json

db_key = ''

with open('.EXAMPLEENV', 'r') as file:
    db_key = json.load(file)

connection = mysql.connector.connect(
    host=db_key['servername'], 
    port=3306,
    database=db_key['dbname'],
    user=db_key['username'],
    password=db_key['password']
)

cursor = connection.cursor()

# EXAMPLE SQL CODE EXEC
'''
This inserts into a sample table with the attributes: Name (str) Age (int)

smt = 'INSERT INTO People VALUES ("Joey", 21)'
cursor.execute(smt) # once statements are loaded, they need to be executed
connection.commit() # all loaded statements are executed

'''