from pydantic import BaseModel, model_validator

class NewUser(BaseModel):
    uname: str
    upass: str
    weight: float
    atype: int
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
    
    @model_validator(mode="after")
    def check(self):
        if self.isNew:
            if self.cal is None or self.base_measurement is None:
                raise ValueError("'cal' and 'base_measurement' are required when 'isNew' is true")
        return self
