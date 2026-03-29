from pydantic import BaseModel

class NewUser(BaseModel):
    uname: str
    upass: str
    weight: float
    atype: int
    isMetric: bool
    calGoal: int | None = None

class NewRecipe(BaseModel):
    rname: str
    desc: str
    instruct: str
    isPublic: bool

class Food(BaseModel):
    fname: str
    qty: float
    isNew: bool
    cal: int | None = None
    base_measurement: int | None = None 