from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    service: str


class DBHealthResponse(BaseModel):
    status: str
    service: str
    database: str
