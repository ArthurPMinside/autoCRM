from pydantic import BaseModel


class SettingsBase(BaseModel):
    work_start_hour: int
    work_end_hour: int


class SettingsResponse(SettingsBase):
    id: int

    class Config:
        from_attributes = True
