from fastapi import FastAPI
from json
import db

app = FastAPI()

connection, cursor = db.database_connect()

@app.get("/")
async def read_root():
    return {"Hello": "World!"}

