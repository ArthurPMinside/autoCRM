from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.vehicle_catalog import CarCatalogMake, CarCatalogModel, CarCatalogGeneration, CarCatalogBody

router = APIRouter()


@router.get("/makes")
def get_makes(db: Session = Depends(get_db)):
    makes = db.query(CarCatalogMake).order_by(CarCatalogMake.name).all()
    return [{"id": m.id, "slug": m.slug, "name": m.name} for m in makes]


@router.get("/models")
def get_models(make_id: int, db: Session = Depends(get_db)):
    models = db.query(CarCatalogModel).filter(
        CarCatalogModel.make_id == make_id
    ).order_by(CarCatalogModel.name).all()
    return [{"id": m.id, "slug": m.slug, "name": m.name} for m in models]


@router.get("/generations")
def get_generations(model_id: int, db: Session = Depends(get_db)):
    gens = db.query(CarCatalogGeneration).filter(
        CarCatalogGeneration.model_id == model_id
    ).order_by(CarCatalogGeneration.year_from.desc()).all()
    return [{
        "id": g.id,
        "name": g.name,
        "year_from": g.year_from,
        "year_to": g.year_to,
    } for g in gens]


@router.get("/bodies")
def get_bodies(generation_id: int, db: Session = Depends(get_db)):
    bodies = db.query(CarCatalogBody).filter(
        CarCatalogBody.generation_id == generation_id
    ).order_by(CarCatalogBody.body_type).all()
    return [{
        "id": b.id,
        "body_type": b.body_type,
        "frames": b.frames,
    } for b in bodies]
