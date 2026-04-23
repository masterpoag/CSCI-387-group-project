from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import admin, chef, fit, general

app = FastAPI()

origins = [
    "http://0.0.0.0:8000",
    "http://0.0.0.0",
    "https://localhost:8000",
    "https://turing.cs.olemiss.edu",
    "https://gp.vroey.us",
    "https://gp-test.vroey.us",
    ]

app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        )

app.include_router(admin.router)
app.include_router(chef.router)
app.include_router(fit.router)
app.include_router(general.router)
