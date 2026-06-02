#!/usr/bin/env python3
"""
Load drom_catalog_full.csv into autocrm.db catalog tables.
Handles conflicts via INSERT OR IGNORE / SELECT existing.
"""
import csv
import re
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "backend" / "autocrm.db"
CSV_PATH = Path(__file__).parent / "drom_catalog_full.csv"


def slugify(text: str) -> str:
    """Simple slugify: lowercase, replace spaces/special chars with underscore."""
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '_', text)
    return text


def parse_generation(gen_str: str):
    """
    Parse generation string into (name, year_from, year_to).
    Examples:
        "B4 (1991 - 1995)" -> ("B4", 1991, 1995)
        "Audi 50 1974 - 1978" -> ("Audi 50", 1974, 1978)
        "GB (2018 - н.в.)" -> ("GB", 2018, None)
        "Поколения Audi 80" -> (None, None, None)  # skip these
    """
    if not gen_str or gen_str.strip() == '':
        return None, None, None

    gen_str = gen_str.strip()

    # Skip generic "Поколения ..." rows
    if gen_str.startswith('Поколения'):
        return None, None, None

    # Pattern: "Name (YYYY - YYYY)" or "Name (YYYY - н.в.)"
    m = re.match(r'(.+?)\s*\((\d{4})\s*-\s*(\d{4}|н\.в\.)\)', gen_str)
    if m:
        name = m.group(1).strip()
        year_from = int(m.group(2))
        year_to_str = m.group(3)
        year_to = None if year_to_str == 'н.в.' else int(year_to_str)
        return name, year_from, year_to

    # Pattern: "Name YYYY - YYYY" (no parentheses)
    m = re.match(r'(.+?)\s+(\d{4})\s*-\s*(\d{4})', gen_str)
    if m:
        name = m.group(1).strip()
        year_from = int(m.group(2))
        year_to = int(m.group(3))
        return name, year_from, year_to

    # Pattern: "Name YYYY - н.в."
    m = re.match(r'(.+?)\s+(\d{4})\s*-\s*н\.в\.', gen_str)
    if m:
        name = m.group(1).strip()
        year_from = int(m.group(2))
        year_to = None
        return name, year_from, year_to

    # Fallback: just the string as name, no years
    return gen_str, None, None


def get_or_create_make(c, name: str) -> int:
    slug = slugify(name)
    c.execute("SELECT id FROM car_catalog_makes WHERE slug = ?", (slug,))
    row = c.fetchone()
    if row:
        return row[0]
    c.execute("INSERT INTO car_catalog_makes (slug, name) VALUES (?, ?)", (slug, name))
    return c.lastrowid


def get_or_create_model(c, make_id: int, name: str) -> int:
    slug = slugify(name)
    c.execute("SELECT id FROM car_catalog_models WHERE make_id = ? AND slug = ?", (make_id, slug))
    row = c.fetchone()
    if row:
        return row[0]
    c.execute("INSERT INTO car_catalog_models (make_id, slug, name) VALUES (?, ?, ?)",
              (make_id, slug, name))
    return c.lastrowid


def get_or_create_generation(c, model_id: int, name: str, year_from: int, year_to: int) -> int:
    c.execute(
        "SELECT id FROM car_catalog_generations WHERE model_id = ? AND name = ? AND year_from IS ?",
        (model_id, name, year_from)
    )
    row = c.fetchone()
    if row:
        return row[0]
    c.execute(
        "INSERT INTO car_catalog_generations (model_id, name, year_from, year_to) VALUES (?, ?, ?, ?)",
        (model_id, name, year_from, year_to)
    )
    return c.lastrowid


def add_body(c, generation_id: int, body_type: str):
    if not body_type or body_type.strip() == '':
        return
    body_type = body_type.strip()
    # Bodies don't have a unique constraint, but we can avoid exact duplicates
    c.execute(
        "SELECT id FROM car_catalog_bodies WHERE generation_id = ? AND body_type = ?",
        (generation_id, body_type)
    )
    if c.fetchone():
        return
    c.execute(
        "INSERT INTO car_catalog_bodies (generation_id, body_type) VALUES (?, ?)",
        (generation_id, body_type)
    )


def main():
    print(f"Database: {DB_PATH}")
    print(f"CSV: {CSV_PATH}")

    if not CSV_PATH.exists():
        print("CSV file not found!")
        return

    conn = sqlite3.connect(str(DB_PATH))
    c = conn.cursor()

    # Clear existing catalog data (vehicles don't FK to catalog)
    print("Clearing existing catalog data...")
    c.execute("DELETE FROM car_catalog_bodies")
    c.execute("DELETE FROM car_catalog_generations")
    c.execute("DELETE FROM car_catalog_models")
    c.execute("DELETE FROM car_catalog_makes")
    conn.commit()

    stats = {'makes': 0, 'models': 0, 'generations': 0, 'bodies': 0, 'skipped': 0, 'errors': 0}

    with open(CSV_PATH, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            brand = row.get('brand', '').strip()
            model = row.get('model', '').strip()
            generation = row.get('generation', '').strip()
            body = row.get('body', '').strip()

            if not brand or not model:
                stats['skipped'] += 1
                continue

            try:
                make_id = get_or_create_make(c, brand)
                if c.lastrowid and c.lastrowid > 0:
                    # We can't easily track if make was newly inserted vs existing
                    pass

                model_id = get_or_create_model(c, make_id, model)

                gen_name, year_from, year_to = parse_generation(generation)
                if gen_name is None:
                    stats['skipped'] += 1
                    continue

                gen_id = get_or_create_generation(c, model_id, gen_name, year_from, year_to)
                add_body(c, gen_id, body)

            except Exception as e:
                stats['errors'] += 1
                if stats['errors'] <= 5:
                    print(f"Error on row {row}: {e}")

    conn.commit()

    # Count final stats
    for table, key in [
        ('car_catalog_makes', 'makes'),
        ('car_catalog_models', 'models'),
        ('car_catalog_generations', 'generations'),
        ('car_catalog_bodies', 'bodies')
    ]:
        c.execute(f"SELECT COUNT(*) FROM {table}")
        stats[key] = c.fetchone()[0]

    conn.close()

    print(f"\nDone!")
    print(f"  Makes: {stats['makes']}")
    print(f"  Models: {stats['models']}")
    print(f"  Generations: {stats['generations']}")
    print(f"  Bodies: {stats['bodies']}")
    print(f"  Skipped rows: {stats['skipped']}")
    print(f"  Errors: {stats['errors']}")


if __name__ == '__main__':
    main()
