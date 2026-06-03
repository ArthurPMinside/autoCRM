from sqlalchemy import Column, Integer
from app.db.database import Base


class Settings(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)
    work_start_hour = Column(Integer, default=10, nullable=False)
    work_end_hour = Column(Integer, default=20, nullable=False)
