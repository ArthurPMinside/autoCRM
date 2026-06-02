#!/usr/bin/env python3
"""
Scrape drom.ru car catalog into autoCRM database.
Extracts: Brand -> Model -> Generation -> Body

Features:
  - Rate-limited sequential fetching (1.5–4s delays)
  - Rotating User-Agents
  - Exponential backoff on HTTP 429 / 5xx
  - Low concurrency (2 workers max)
  - Resumable: skips already-scraped brands/models via progress.json
  - Progress auto-saved after every brand & every model
  - Can resume after Ctrl+C, crash, or IP ban

Usage:
    cd backend && python scripts/scrape_drom_catalog.py          # resume by default
    cd backend && python scripts/scrape_drom_catalog.py --reset  # start from scratch
    cd backend && python scripts/scrape_drom_catalog.py --brand toyota bmw  # only these brands

Requirements:
    pip install requests
"""

import argparse
import json
import os
import random
import re
import sqlite3
import sys
import threading
import time
import traceback
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import requests

# ──────────────────────────────────────────────────────────────────────────────
# Config
# ──────────────────────────────────────────────────────────────────────────────

DB_PATH = Path(__file__).parent / "backend" / "autocrm.db"
PROGRESS_PATH = Path(__file__).parent / "backend" / "scrape_progress.json"
BASE_URL = "https://www.drom.ru"

# Rotating User-Agents to reduce fingerprinting
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.2478.67",
]

PROXY = os.getenv("HTTP_PROXY") or os.getenv("HTTPS_PROXY")

HEADERS_BASE = {
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
#    "DNT": "1",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Cache-Control": "max-age=0",
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


# ──────────────────────────────────────────────────────────────────────────────
# Progress tracker — resumable scraping
# ──────────────────────────────────────────────────────────────────────────────

class ProgressTracker:
    """
    Tracks which brands and models have been successfully scraped.
    Auto-saves to JSON after every completed brand/model.
    """

    def __init__(self, path: Path):
        self.path = path.resolve()
        self._data = self._load()
        self._lock = threading.Lock()

    def _load(self) -> dict:
        if self.path.exists():
            try:
                with open(self.path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except (json.JSONDecodeError, IOError):
                pass
        return {
            "completed_brands": {},      # {slug: true}
            "completed_models": {},      # {"brand_slug/model_slug": true}
            "failed_models": {},         # {"brand_slug/model_slug": error_msg}
            "stats": {
                "brands_total": 0,
                "brands_done": 0,
                "models_total": 0,
                "models_done": 0,
            },
        }

    def save(self):
        """Flush progress to disk immediately (thread-safe)."""
        with self._lock:
            tmp = self.path.with_suffix(".tmp")
            with open(tmp, "w", encoding="utf-8") as f:
                json.dump(self._data.copy(), f, ensure_ascii=False, indent=2)
            os.replace(str(tmp), str(self.path))

    def is_brand_done(self, slug: str) -> bool:
        return self._data["completed_brands"].get(slug, False)

    def is_model_done(self, brand_slug: str, model_slug: str) -> bool:
        return self._data["completed_models"].get(f"{brand_slug}/{model_slug}", False)

    def mark_brand_done(self, slug: str):
        self._data["completed_brands"][slug] = True
        self._data["stats"]["brands_done"] = len(self._data["completed_brands"])
        self.save()

    def mark_model_done(self, brand_slug: str, model_slug: str):
        self._data["completed_models"][f"{brand_slug}/{model_slug}"] = True
        self._data["stats"]["models_done"] = len(self._data["completed_models"])
        self.save()

    def mark_model_failed(self, brand_slug: str, model_slug: str, error: str):
        self._data["failed_models"][f"{brand_slug}/{model_slug}"] = str(error)
        self.save()

    def set_totals(self, brands: int, models: int):
        self._data["stats"]["brands_total"] = brands
        self._data["stats"]["models_total"] = models
        self.save()

    def summary(self) -> dict:
        return self._data["stats"].copy()

    def reset(self):
        self._data = {
            "completed_brands": {},
            "completed_models": {},
            "failed_models": {},
            "stats": {"brands_total": 0, "brands_done": 0, "models_total": 0, "models_done": 0},
        }
        self.save()
        if self.path.exists():
            self.path.unlink()


# ──────────────────────────────────────────────────────────────────────────────
# HTTP helpers with retry & rate-limiting
# ──────────────────────────────────────────────────────────────────────────────

def _headers() -> dict:
    h = HEADERS_BASE.copy()
    h["User-Agent"] = random.choice(USER_AGENTS)
    return h


def fetch(url: str, max_retries: int = 5) -> str:
    """Fetch URL with exponential backoff on 429/5xx and polite delays."""
    proxies = {"http": PROXY, "https": PROXY} if PROXY else None
    session = requests.Session()
    session.headers.update(_headers())

    for attempt in range(max_retries):
        try:
            resp = session.get(url, proxies=proxies, timeout=30, allow_redirects=True)
            if resp.status_code == 429:
                wait = min(2 ** attempt * 15 + random.uniform(0, 10), 120)
                print(f"    [429] Rate limited. Sleeping {wait:.1f}s...")
                time.sleep(wait)
                continue
            if resp.status_code >= 500:
                wait = min(2 ** attempt * 5 + random.uniform(0, 5), 60)
                print(f"    [5xx] Server error {resp.status_code}. Sleeping {wait:.1f}s...")
                time.sleep(wait)
                continue
            resp.raise_for_status()
            # Polite delay after successful request
            time.sleep(random.uniform(1.5, 4.0))
            return resp.text
        except requests.RequestException as e:
            wait = min(2 ** attempt * 3 + random.uniform(0, 3), 30)
            print(f"    [ERR] {e}. Retry in {wait:.1f}s ({attempt+1}/{max_retries})")
            time.sleep(wait)
    raise RuntimeError(f"Failed to fetch {url} after {max_retries} retries")


# ──────────────────────────────────────────────────────────────────────────────
# Parsing helpers
# ──────────────────────────────────────────────────────────────────────────────

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


# ──────────────────────────────────────────────────────────────────────────────
# Scrapers
# ──────────────────────────────────────────────────────────────────────────────

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
        print(f"  ERROR fetching models for {brand_slug}: {e}")
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
        print(f"    ERROR fetching generations for {brand_slug}/{model_slug}: {e}")
        return []


# ──────────────────────────────────────────────────────────────────────────────
# Database
# ──────────────────────────────────────────────────────────────────────────────

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


def _get_or_create_make(c, slug: str, name: str) -> int:
    c.execute("SELECT id FROM car_catalog_makes WHERE slug = ?", (slug,))
    row = c.fetchone()
    if row:
        return row[0]
    c.execute("INSERT INTO car_catalog_makes (slug, name) VALUES (?, ?)", (slug, name))
    return c.lastrowid


def _get_or_create_model(c, make_id: int, slug: str, name: str) -> int:
    c.execute("SELECT id FROM car_catalog_models WHERE make_id = ? AND slug = ?", (make_id, slug))
    row = c.fetchone()
    if row:
        return row[0]
    c.execute("INSERT INTO car_catalog_models (make_id, slug, name) VALUES (?, ?, ?)",
              (make_id, slug, name))
    return c.lastrowid


def save_brand_to_db(brand: dict, models: list[dict], model_gens: dict):
    """Incrementally save a single brand's data to the database."""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    make_id = _get_or_create_make(c, brand["slug"], brand["name"])

    for model in models:
        model_id = _get_or_create_model(c, make_id, model["slug"], model["name"])
        key = (brand["slug"], model["slug"])
        generations = model_gens.get(key, [])
        seen_gens = set()
        gen_ids = {}

        for gen in generations:
            gen_key = (model_id, gen["generation_info"], gen["year_from"])
            if gen_key not in seen_gens:
                seen_gens.add(gen_key)
                c.execute(
                    "INSERT INTO car_catalog_generations (model_id, name, year_from, year_to) VALUES (?, ?, ?, ?)",
                    (model_id, gen["generation_info"], gen["year_from"], gen["year_to"]))
                gen_ids[gen_key] = c.lastrowid
            gen_id = gen_ids[gen_key]
            c.execute(
                "INSERT INTO car_catalog_bodies (generation_id, body_type, frames, drom_id) VALUES (?, ?, ?, ?)",
                (gen_id, gen["body_type"], gen["frames"], gen["drom_id"]))

    conn.commit()
    conn.close()


def save_to_db(brands: list, brand_models: dict, model_gens: dict):
    """Batch save (used at end of run for any remaining data)."""
    for brand in brands:
        save_brand_to_db(brand, brand_models.get(brand["slug"], []), model_gens)


def db_stats() -> dict:
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    stats = {}
    for table in ["car_catalog_makes", "car_catalog_models", "car_catalog_generations", "car_catalog_bodies"]:
        c.execute(f"SELECT COUNT(*) FROM {table}")
        stats[table] = c.fetchone()[0]
    conn.close()
    return stats


# ──────────────────────────────────────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────────────────────────────────────

def scrape_model(brand_slug: str, model: dict, progress: ProgressTracker) -> tuple:
    key = (brand_slug, model["slug"])
    if progress.is_model_done(brand_slug, model["slug"]):
        return key, []  # skip already done
    gens = get_generations(brand_slug, model["slug"])
    progress.mark_model_done(brand_slug, model["slug"])
    return key, gens


def main():
    parser = argparse.ArgumentParser(description="Scrape drom.ru car catalog")
    parser.add_argument("--reset", action="store_true", help="Delete progress & DB and start from scratch")
    parser.add_argument("--brand", nargs="+", default=None, help="Scrape only specific brand slugs (e.g. toyota bmw)")
    parser.add_argument("--list-brands", action="store_true", help="Print available brand slugs and exit")
    args = parser.parse_args()

    progress = ProgressTracker(PROGRESS_PATH)

    if args.reset:
        print("[!] Reset mode: clearing progress and database...")
        progress.reset()
        if DB_PATH.exists():
            DB_PATH.unlink()
        print("[✓] Progress and DB cleared.\n")

    print("=" * 60)
    print("drom.ru catalog scraper v2 — resumable")
    print("=" * 60)
    print(f"Database  : {DB_PATH}")
    print(f"Progress  : {PROGRESS_PATH}")
    print(f"Proxy     : {PROXY or 'none'}")
    print()

    if args.list_brands:
        print("Fetching brand list...")
        brands = get_brands()
        priority = [b for b in brands if b["slug"] in PRIORITY_SLUGS]
        print(f"\nAvailable brands ({len(brands)} total, {len(priority)} priority):")
        for b in priority:
            print(f"  {b['slug']:<20} → {b['name']}")
        return

    # Init DB if needed
    if not DB_PATH.exists():
        print("Initializing database...")
        init_db()

    print("Fetching brands list...")
    all_brands = get_brands()
    print(f"Found {len(all_brands)} brands total")

    # Filter to priority or CLI-specified brands
    if args.brand:
        target_slugs = set(args.brand)
        priority_brands = [b for b in all_brands if b["slug"] in target_slugs]
        print(f"Will scrape {len(priority_brands)} specified brands")
    else:
        priority_brands = [b for b in all_brands if b["slug"] in PRIORITY_SLUGS]
        print(f"Will scrape {len(priority_brands)} priority brands")

    # Skip already completed brands unless --reset
    brands_to_scrape = [b for b in priority_brands if not progress.is_brand_done(b["slug"])]
    skipped = len(priority_brands) - len(brands_to_scrape)
    if skipped:
        print(f"  ({skipped} already completed — skipping)")
    print()

    brand_models = {}
    model_gens = {}

    # Set totals for progress tracking
    progress.set_totals(len(brands_to_scrape), 0)

    try:
        for i, brand in enumerate(brands_to_scrape, 1):
            print(f"[{i}/{len(brands_to_scrape)}] {brand['name']} ({brand['slug']})...")
            models = get_models(brand["slug"])
            if not models:
                print("  No models found, skipping.")
                progress.mark_brand_done(brand["slug"])
                continue
            print(f"  Found {len(models)} models, fetching generations with 2 workers + delays...")
            brand_models[brand["slug"]] = models

            # Low-concurrency fetching with polite delays built into fetch()
            with ThreadPoolExecutor(max_workers=2) as executor:
                futures = {
                    executor.submit(scrape_model, brand["slug"], model, progress): model
                    for model in models
                    if not progress.is_model_done(brand["slug"], model["slug"])
                }
                skipped_models = len(models) - len(futures)
                if skipped_models:
                    print(f"    ({skipped_models} models already done)")

                for future in as_completed(futures):
                    model = futures[future]
                    try:
                        key, gens = future.result()
                        model_gens[key] = gens
                        if gens:
                            print(f"    ✓ {model['name']}: {len(gens)} generation records")
                        else:
                            print(f"    – {model['name']}: no generations")
                    except Exception as e:
                        print(f"    ✗ {model['name']}: {e}")
                        progress.mark_model_failed(brand["slug"], model["slug"], str(e))

            progress.mark_brand_done(brand["slug"])
            save_brand_to_db(brand, models, model_gens)
            stats = progress.summary()
            print(f"  Progress: {stats['brands_done']}/{stats['brands_total']} brands, "
                  f"{stats['models_done']} models done\n")

    except KeyboardInterrupt:
        print("\n[!] Interrupted by user. Progress saved — restart without --reset to resume.")
        sys.exit(1)
    except Exception as e:
        print(f"\n[!] Unexpected error: {e}")
        traceback.print_exc()
        print("[!] Progress saved — restart without --reset to resume.")
        sys.exit(1)

    print("=" * 60)
    print("Saving to database...")
    save_to_db(brands_to_scrape, brand_models, model_gens)

    stats = db_stats()
    print("\nDone!")
    print(f"  Makes       : {stats['car_catalog_makes']}")
    print(f"  Models      : {stats['car_catalog_models']}")
    print(f"  Generations : {stats['car_catalog_generations']}")
    print(f"  Bodies      : {stats['car_catalog_bodies']}")
    print(f"\nDatabase saved to: {DB_PATH}")
    print(f"Progress file    : {PROGRESS_PATH}")

    failed = progress._data.get("failed_models", {})
    if failed:
        print(f"\n[!] {len(failed)} models failed. Run again to retry:")
        for key, err in list(failed.items())[:10]:
            print(f"    {key}: {err}")
        if len(failed) > 10:
            print(f"    ... and {len(failed) - 10} more")


if __name__ == "__main__":
    main()
