import importlib.util
from pathlib import Path
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.vehicle_catalog import CarCatalogMake, CarCatalogModel, CarCatalogGeneration, CarCatalogBody


def _load_seed_data():
    """Load SEED_DATA from scripts/seed_vehicle_catalog.py to avoid duplication."""
    script_path = Path(__file__).parent.parent.parent / "scripts" / "seed_vehicle_catalog.py"
    spec = importlib.util.spec_from_file_location("seed_vehicle_catalog", script_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.SEED_DATA


def seed_catalog():
    """Seed vehicle catalog if tables are empty."""
    db: Session = SessionLocal()
    try:
        if db.query(CarCatalogMake).first() is not None:
            return

        SEED_DATA = _load_seed_data()

        for make_name, models in SEED_DATA:
            make = CarCatalogMake(
                slug=make_name.lower().replace(" ", "_").replace("(", "").replace(")", "").replace(".", ""),
                name=make_name,
            )
            db.add(make)
            db.flush()  # get make.id

            for model_name, generations in models:
                model = CarCatalogModel(
                    make_id=make.id,
                    slug=model_name.lower().replace(" ", "_").replace("-", "_"),
                    name=model_name,
                )
                db.add(model)
                db.flush()  # get model.id

                for gen_name, year_from, year_to, bodies in generations:
                    generation = CarCatalogGeneration(
                        model_id=model.id,
                        name=gen_name,
                        year_from=year_from,
                        year_to=year_to,
                    )
                    db.add(generation)
                    db.flush()  # get generation.id

                    for body in bodies:
                        db.add(CarCatalogBody(
                            generation_id=generation.id,
                            body_type=body,
                            frames=None,
                            drom_id=None,
                        ))

        db.commit()
        print("Vehicle catalog seeded successfully.")
    except Exception as e:
        db.rollback()
        print(f"Failed to seed vehicle catalog: {e}")
        raise
    finally:
        db.close()
