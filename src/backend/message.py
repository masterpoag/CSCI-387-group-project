"""Pydantic request-body schemas shared by the API routes.

FastAPI uses these classes to validate and parse incoming JSON before
the route handler ever runs, so individual handlers can assume the data
is well-typed.
"""

from pydantic import BaseModel, model_validator


class NewReport(BaseModel):
    """Body for /api/report-content.

    rep_type is a 3-letter discriminator picking the kind of object
    being reported: 'rcp' (recipe), 'wrk' (workout), or 'fdd' (food).
    obj_id is the primary key of that object.
    """
    rname: str
    desc: str
    rep_type: str
    obj_id: int

    @model_validator(mode="after")
    def check(self):
        # Reject anything outside the three known content types so
        # downstream code doesn't have to handle unexpected values.
        if self.rep_type not in ['rcp', 'wrk', 'fdd']:
            raise ValueError("'rep_type' must be 'rcp', 'wrk', or 'fdd'")
        return self


class NewUser(BaseModel):
    """Body for /api/register.

    atype = 1 (Standard), 2 (Chef), 3 (Trainer). Admins are managed via
    a separate Admin table, not via this field.
    calGoal is optional — see the hasCG query parameter on the route.
    """
    uname: str
    upass: str
    weight: float
    atype: int
    calGoal: int | None = None


class NewRecipe(BaseModel):
    """Body for /api/create-recipe (the recipe metadata portion).

    isPublishable flags the recipe for review by a Chef/Admin; they
    decide whether it actually goes public.
    """
    rname: str
    desc: str
    instruct: str
    isPublishable: bool


class NewWorkout(BaseModel):
    """Body for /api/create-workout.

    Same isPublishable convention as NewRecipe but reviewed by Trainers
    instead of Chefs.
    """
    name: str
    instructions: str
    isPublishable: bool


class Food(BaseModel):
    """A single ingredient line attached to a recipe creation request.

    isNew distinguishes between picking a food that already exists in
    the shared library (isNew=false, only fname and qty matter) and
    creating a brand-new food on the fly (isNew=true, cal and
    base_measurement are required).
    """
    fname: str
    qty: float
    isNew: bool
    cal: int | None = None
    base_measurement: int | None = None

    @model_validator(mode="after")
    def check(self):
        # Enforce the conditional-required fields described above.
        if self.isNew:
            if self.cal is None or self.base_measurement is None:
                raise ValueError("'cal' and 'base_measurement' are required when 'isNew' is true")
        return self
