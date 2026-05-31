import uuid
from sqlalchemy import Column, String, DateTime, Integer, Numeric, ForeignKey, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

def GUID():
    return Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
