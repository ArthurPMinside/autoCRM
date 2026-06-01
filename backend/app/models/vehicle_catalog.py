from sqlalchemy import Column, String, Integer, ForeignKey
from app.models.base import Base


class CarCatalogMake(Base):
    __tablename__ = "car_catalog_makes"
    id = Column(Integer, primary_key=True, autoincrement=True)
    slug = Column(String(100), unique=True, nullable=False)
    name = Column(String(100), nullable=False)


class CarCatalogModel(Base):
    __tablename__ = "car_catalog_models"
    id = Column(Integer, primary_key=True, autoincrement=True)
    make_id = Column(Integer, ForeignKey("car_catalog_makes.id"), nullable=False)
    slug = Column(String(100), nullable=False)
    name = Column(String(100), nullable=False)


class CarCatalogGeneration(Base):
    __tablename__ = "car_catalog_generations"
    id = Column(Integer, primary_key=True, autoincrement=True)
    model_id = Column(Integer, ForeignKey("car_catalog_models.id"), nullable=False)
    name = Column(String(100), nullable=False)
    year_from = Column(Integer)
    year_to = Column(Integer)


class CarCatalogBody(Base):
    __tablename__ = "car_catalog_bodies"
    id = Column(Integer, primary_key=True, autoincrement=True)
    generation_id = Column(Integer, ForeignKey("car_catalog_generations.id"), nullable=False)
    body_type = Column(String(100), nullable=False)
    frames = Column(String(200))
    drom_id = Column(String(50))
