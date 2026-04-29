"""FastAPI application entry point.

Mounts every route module and configures CORS so the React frontend
(running on the university Turing host or on the deployed gp.vroey.us
endpoints) can call the API without browser preflight errors.

Run with:
    fastapi dev api.py        # development (hot reload)
    fastapi run api.py        # production
See bgk_run.sh for the wrapper used in the deployed environment.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import admin, chef, fit, general

app = FastAPI()

# Origins the browser is permitted to call the API from. Includes the
# local dev server, the university host, and the staging/prod hostnames.
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

# Each router groups a set of related endpoints. See routes/*.py for the
# actual handler implementations.
app.include_router(admin.router)
app.include_router(chef.router)
app.include_router(fit.router)
app.include_router(general.router)
