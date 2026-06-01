#!/usr/bin/env python3
"""
Scrape drom.ru car catalog into autoCRM database.
Extracts: Brand -> Model -> Generation -> Body

Usage:
    cd backend && python scripts/scrape_drom_catalog.py
"""

import re
import json
import sqlite3
import time
import urllib.request
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

DB_PATH = Path(__file__).parent.parent / "app.db"
BASE_URL = "https://www.drom.ru"
HEADERS = {
    "User-Agent": "Mozilla/5.0",
    "Accept": "text/html",
    "Accept-Language": "ru-RU,ru;q=0.9",
}

# Top 60 brands for Russian market (covers ~99% of serviced cars)
PRIORITY_SLUGS = [
    "lada", "kia", "hyundai", "toyota", "bmw", "audi", "volkswagen",
    "mercedes-benz", "nissan", "mazda", "mitsubishi", "renault", "skoda",
    "ford", "honda", "chevrolet", "lexus", "subaru", "suzuki", "opel",
    "volvo", "peugeot", "citroen", "chery", "geely", "great_wall", "haval",
    "gaz", "uaz", "moskvitch", "porsche", "jaguar", "land_rover", "infiniti",
    "acura", "cadillac", "jeep", "chrysler", "dodge", "mini", "genesis",
    "ssang_yong", "daihatsu", "isuzu", "daewoo", "zil", "zaz", "vortex",
    "tagaz", "bogdan", "derways", "changan", "haima", "lifan", "faw", "jac",
    "dongfeng", "brilliance", "zotye", "cheryexeed", "omoda", "jaecoo",
    "jetour", "belgee", "baic", "bestune", "deepal", "evolute", "knewstar",
    "kaiyi", "senat", "voyah", "zeekr", "li", "nio", "xpeng", "xiaomi",
    "im_motors", "radar", "tank", "wey", "byd", "tata", "iveco",
]

KNOWN_NAMES = {
    "lada": "Lada (ВАЗ)", "kia": "Kia", "hyundai": "Hyundai", "toyota": "Toyota",
    "bmw": "BMW", "audi": "Audi", "volkswagen": "Volkswagen", "mercedes-benz": "Mercedes-Benz",
    "nissan": "Nissan", "mazda": "Mazda", "mitsubishi": "Mitsubishi", "renault": "Renault",
    "skoda": "Skoda", "ford": "Ford", "honda": "Honda", "chevrolet": "Chevrolet",
    "lexus": "Lexus", "subaru": "Subaru", "suzuki": "Suzuki", "opel": "Opel",
    "volvo": "Volvo", "peugeot": "Peugeot", "citroen": "Citroen", "chery": "Chery",
    "geely": "Geely", "great_wall": "Great Wall", "haval": "Haval", "gaz": "ГАЗ",
    "uaz": "УАЗ", "moskvitch": "Москвич", "porsche": "Porsche", "jaguar": "Jaguar",
    "land_rover": "Land Rover", "infiniti": "Infiniti", "acura": "Acura",
    "cadillac": "Cadillac", "jeep": "Jeep", "chrysler": "Chrysler", "dodge": "Dodge",
    "mini": "MINI", "genesis": "Genesis", "ssang_yong": "SsangYong",
    "daihatsu": "Daihatsu", "isuzu": "Isuzu", "daewoo": "Daewoo", "zil": "ЗИЛ",
    "zaz": "ЗАЗ", "vortex": "Vortex", "tagaz": "ТагАЗ", "bogdan": "Богдан",
    "derways": "Derways", "changan": "Changan", "haima": "Haima", "lifan": "Lifan",
    "faw": "FAW", "jac": "JAC", "dongfeng": "Dongfeng", "brilliance": "Brilliance",
    "zotye": "Zotye", "cheryexeed": "Exeed", "omoda": "Omoda", "jaecoo": "Jaecoo",
    "jetour": "Jetour", "belgee": "Belgee", "baic": "BAIC", "bestune": "Bestune",
    "deepal": "Deepal", "evolute": "Evolute", "knewstar": "Knewstar", "kaiyi": "Kaiyi",
    "senat": "Aurus", "voyah": "Voyah", "zeekr": "Zeekr", "li": "Li Auto",
    "nio": "NIO", "xpeng": "Xpeng", "xiaomi": "Xiaomi", "im_motors": "IM Motors",
    "radar": "Radar", "tank": "Tank", "wey": "Wey", "byd": "BYD", "tata": "Tata",
    "iveco": "Iveco",
}


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("cp1251", errors="ignore")


def extract_json_from_html(html: str, key: str) -> list:
    idx = html.find(key)
    if idx == -1:
        return []
    start = html.find("[", idx)
    if start == -1:
        return []
    depth = 0
    in_string = False
    escape = False
    for i in range(start, len(html)):
        ch = html[i]
        if escape:
            escape = False
            continue
        if ch == "\\":
            escape = True
            continue
        if ch == '"':
            in_string = not in_string
            continue
        if not in_string:
            if ch in "[{":
                depth += 1
            elif ch in "}]":
                depth -= 1
                if depth == 0:
                    try:
                        return json.loads(html[start : i + 1])
                    except json.JSONDecodeError:
                        return []
    return []


def get_brands() -> list[dict]:
    html = fetch(f"{BASE_URL}/catalog/")
    brands = []
    for slug in sorted(set(re.findall(r'href="https://www\.drom\.ru/catalog/([a-z0-9_-]+)/"', html))):
        if slug in ("engine", "frame", "~search"):
            continue
        name = KNOWN_NAMES.get(slug, slug.replace("_", " ").title())
        brands.append({"slug": slug, "name": name})
    return brands


def get_models(brand_slug: str) -> list[dict]:
    try:
        html = fetch(f"{BASE_URL}/catalog/{brand_slug}/")
        models = []
        pattern = rf'href="https://www\.drom\.ru/catalog/{brand_slug}/([a-z0-9_-]+)/"'
        for slug in sorted(set(re.findall(pattern, html))):
            if slug in ("engine", "frame"):
                continue
            models.append({"slug": slug, "name": slug.replace("_", " ").title()})
        return models
    except Exception as e:
        print(f"ERROR fetching models for {brand_slug}: {e}")
        return []


def get_generations(brand_slug: str, model_slug: str) -> list[dict]:
    try:
        html = fetch(f"{BASE_URL}/catalog/{brand_slug}/{model_slug}/")
        data = extract_json_from_html(html, "generationsInOrder")
        generations = []
        for gen in data:
            title = gen.get("title", "")
            gen_info = gen.get("generationInfo", "")
            year_match = re.search(r'(\d{4})\s*-\s*(\d{4}|н\.в\.|н\.в)', title)
            year_from = int(year_match.group(1)) if year_match else None
            year_to_str = year_match.group(2) if year_match else None
            year_to = int(year_to_str) if year_to_str and year_to_str[0].isdigit() else None

            for item in gen.get("items", []):
                body_types = item.get("frameTypes", "")
                known_bodies = ["Седан", "Хэтчбек", "Универсал", "Внедорожник", "Кроссовер",
                               "Минивэн", "Пикап", "Купе", "Кабриолет", "Лифтбек", "Фургон",
                               "Родстер", "Тарга", "Внедорожник открытый", "Седан 2 дв.",
                               "Хэтчбек 3 дв.", "Хэтчбек 5 дв.", "Универсал 5 дв.", "Лимузин"]
                bodies_found = []
                for bt in known_bodies:
                    if bt.lower() in body_types.lower():
                        bodies_found.append(bt)
                if not bodies_found:
                    first = body_types.split(",")[0].strip()
                    if first:
                        bodies_found.append(first)

                for body in bodies_found:
                    generations.append({
                        "title": title,
                        "generation_info": gen_info,
                        "year_from": year_from,
                        "year_to": year_to,
                        "body_type": body,
                        "frames": item.get("frames", ""),
                        "drom_id": item.get("id", ""),
                    })
        return generations
    except Exception as e:
        print(f"ERROR fetching generations for {brand_slug}/{model_slug}: {e}")
        return []


def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.executescript("""
        DROP TABLE IF EXISTS car_catalog_bodies;
        DROP TABLE IF EXISTS car_catalog_generations;
        DROP TABLE IF EXISTS car_catalog_models;
        DROP TABLE IF EXISTS car_catalog_makes;
        
        CREATE TABLE car_catalog_makes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            slug TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL
        );
        CREATE TABLE car_catalog_models (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            make_id INTEGER NOT NULL,
            slug TEXT NOT NULL,
            name TEXT NOT NULL,
            UNIQUE(make_id, slug),
            FOREIGN KEY (make_id) REFERENCES car_catalog_makes(id)
        );
        CREATE TABLE car_catalog_generations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            model_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            year_from INTEGER,
            year_to INTEGER,
            UNIQUE(model_id, name, year_from),
            FOREIGN KEY (model_id) REFERENCES car_catalog_models(id)
        );
        CREATE TABLE car_catalog_bodies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            generation_id INTEGER NOT NULL,
            body_type TEXT NOT NULL,
            frames TEXT,
            drom_id TEXT,
            FOREIGN KEY (generation_id) REFERENCES car_catalog_generations(id)
        );
        CREATE INDEX idx_bodies_generation ON car_catalog_bodies(generation_id);
        CREATE INDEX idx_generations_model ON car_catalog_generations(model_id);
        CREATE INDEX idx_models_make ON car_catalog_models(make_id);
    """)
    conn.commit()
    conn.close()


def save_to_db(brands: list, brand_models: dict, model_gens: dict):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    make_ids = {}
    model_ids = {}
    gen_ids = {}

    for brand in brands:
        c.execute("INSERT INTO car_catalog_makes (slug, name) VALUES (?, ?)",
                  (brand["slug"], brand["name"]))
        make_ids[brand["slug"]] = c.lastrowid

    for brand_slug, models in brand_models.items():
        make_id = make_ids[brand_slug]
        for model in models:
            c.execute("INSERT INTO car_catalog_models (make_id, slug, name) VALUES (?, ?, ?)",
                      (make_id, model["slug"], model["name"]))
            model_ids[(brand_slug, model["slug"])] = c.lastrowid

    for (brand_slug, model_slug), generations in model_gens.items():
        model_id = model_ids[(brand_slug, model_slug)]
        seen_gens = set()
        for gen in generations:
            key = (model_id, gen["generation_info"], gen["year_from"])
            if key not in seen_gens:
                seen_gens.add(key)
                c.execute(
                    "INSERT INTO car_catalog_generations (model_id, name, year_from, year_to) VALUES (?, ?, ?, ?)",
                    (model_id, gen["generation_info"], gen["year_from"], gen["year_to"]))
                gen_ids[key] = c.lastrowid
            gen_id = gen_ids[key]
            c.execute(
                "INSERT INTO car_catalog_bodies (generation_id, body_type, frames, drom_id) VALUES (?, ?, ?, ?)",
                (gen_id, gen["body_type"], gen["frames"], gen["drom_id"]))

    conn.commit()
    conn.close()


def scrape_model(brand_slug: str, model: dict) -> tuple:
    gens = get_generations(brand_slug, model["slug"])
    return (brand_slug, model["slug"]), gens


def main():
    print("Initializing database...")
    init_db()

    print("Fetching brands...")
    all_brands = get_brands()
    print(f"Found {len(all_brands)} brands total")

    # Filter to priority brands
    priority_brands = [b for b in all_brands if b["slug"] in PRIORITY_SLUGS]
    print(f"Will scrape {len(priority_brands)} priority brands")

    brand_models = {}
    model_gens = {}

    for i, brand in enumerate(priority_brands):
        print(f"\n[{i+1}/{len(priority_brands)}] {brand['name']} ({brand['slug']})...")
        models = get_models(brand["slug"])
        if not models:
            continue
        print(f"  Found {len(models)} models, fetching generations...")
        brand_models[brand["slug"]] = models

        # Concurrent fetching of generation data for all models
        with ThreadPoolExecutor(max_workers=8) as executor:
            futures = {
                executor.submit(scrape_model, brand["slug"], model): model
                for model in models
            }
            for future in as_completed(futures):
                model = futures[future]
                try:
                    key, gens = future.result()
                    model_gens[key] = gens
                except Exception as e:
                    print(f"    ERROR {model['name']}: {e}")

    print("\nSaving to database...")
    save_to_db(priority_brands, brand_models, model_gens)

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM car_catalog_makes")
    makes_count = c.fetchone()[0]
    c.execute("SELECT COUNT(*) FROM car_catalog_models")
    models_count = c.fetchone()[0]
    c.execute("SELECT COUNT(*) FROM car_catalog_generations")
    gens_count = c.fetchone()[0]
    c.execute("SELECT COUNT(*) FROM car_catalog_bodies")
    bodies_count = c.fetchone()[0]
    conn.close()

    print(f"\nDone!")
    print(f"  Makes: {makes_count}")
    print(f"  Models: {models_count}")
    print(f"  Generations: {gens_count}")
    print(f"  Bodies: {bodies_count}")


if __name__ == "__main__":
    main()
