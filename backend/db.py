"""Lightweight self-hosted persistence for Fields and Scans — replaces what used to be
base44's hosted entity database. Plain sqlite3 (stdlib, no new dependency), one file on
disk at backend/greensight.db.

Two tables:
  fields — real, user-managed fields (name, crop, coordinates, ...). The Raspberry Pi's
           own field ("North Field") is auto-seeded on first run so every real capture
           from /api/analyze has somewhere to attach its scan history.
  scans  — one row per analyzed photo (from the Pi's schedule, a manual "New Scan"
           upload, or the raw testing page), storing both flat summary columns (for fast
           listing/trend queries) and the full analysis JSON (for detail views).
"""
import json
import os
import sqlite3
from datetime import datetime, timezone

DB_PATH = os.getenv("GREENSIGHT_DB_PATH", "backend/greensight.db")

NORTH_FIELD_DEFAULTS = {
    "name": "North Field",
    "crop": "grass",
    "grass_type": "Kentucky Bluegrass",
    "area_acres": 100.0,
    "latitude": 43.4663,
    "longitude": -79.9786,
    "elevation_m": 218.0,
    "source": "raspberry_pi",
}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db() -> None:
    os.makedirs(os.path.dirname(DB_PATH) or ".", exist_ok=True)
    conn = get_conn()
    try:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS fields (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                crop TEXT,
                grass_type TEXT,
                area_acres REAL,
                latitude REAL,
                longitude REAL,
                elevation_m REAL,
                source TEXT NOT NULL DEFAULT 'manual',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS scans (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                field_id INTEGER NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
                image_url TEXT,
                source TEXT NOT NULL DEFAULT 'manual',
                overall_health_score REAL,
                health_status TEXT,
                affected_area_percent REAL,
                overall_risk TEXT,
                payload_json TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_scans_field_id ON scans(field_id);
            CREATE INDEX IF NOT EXISTS idx_scans_created_at ON scans(created_at);
        """)
        conn.commit()
    finally:
        conn.close()
    seed_default_field()


def seed_default_field() -> int:
    """Ensures the Pi's own field exists; returns its id. Idempotent."""
    conn = get_conn()
    try:
        row = conn.execute(
            "SELECT id FROM fields WHERE source = 'raspberry_pi' ORDER BY id LIMIT 1"
        ).fetchone()
        if row:
            return row["id"]
        now = _now()
        cur = conn.execute(
            """INSERT INTO fields (name, crop, grass_type, area_acres, latitude, longitude,
                                    elevation_m, source, created_at, updated_at)
               VALUES (:name, :crop, :grass_type, :area_acres, :latitude, :longitude,
                       :elevation_m, :source, :created_at, :updated_at)""",
            {**NORTH_FIELD_DEFAULTS, "created_at": now, "updated_at": now},
        )
        conn.commit()
        return cur.lastrowid
    finally:
        conn.close()


def _field_row_to_dict(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "name": row["name"],
        "crop": row["crop"],
        "grass_type": row["grass_type"],
        "area_acres": row["area_acres"],
        "latitude": row["latitude"],
        "longitude": row["longitude"],
        "elevation_m": row["elevation_m"],
        "source": row["source"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def list_fields() -> list[dict]:
    conn = get_conn()
    try:
        rows = conn.execute("SELECT * FROM fields ORDER BY id ASC").fetchall()
        fields = [_field_row_to_dict(r) for r in rows]
        for field in fields:
            latest = conn.execute(
                """SELECT overall_health_score, health_status, overall_risk, created_at
                   FROM scans WHERE field_id = ? ORDER BY created_at DESC LIMIT 1""",
                (field["id"],),
            ).fetchone()
            field["latest_scan"] = dict(latest) if latest else None
            field["scan_count"] = conn.execute(
                "SELECT COUNT(*) AS c FROM scans WHERE field_id = ?", (field["id"],)
            ).fetchone()["c"]
        return fields
    finally:
        conn.close()


def get_field(field_id: int) -> dict | None:
    conn = get_conn()
    try:
        row = conn.execute("SELECT * FROM fields WHERE id = ?", (field_id,)).fetchone()
        return _field_row_to_dict(row) if row else None
    finally:
        conn.close()


def create_field(data: dict) -> dict:
    conn = get_conn()
    try:
        now = _now()
        cur = conn.execute(
            """INSERT INTO fields (name, crop, grass_type, area_acres, latitude, longitude,
                                    elevation_m, source, created_at, updated_at)
               VALUES (:name, :crop, :grass_type, :area_acres, :latitude, :longitude,
                       :elevation_m, 'manual', :created_at, :updated_at)""",
            {
                "name": data["name"],
                "crop": data.get("crop"),
                "grass_type": data.get("grass_type"),
                "area_acres": data.get("area_acres"),
                "latitude": data.get("latitude"),
                "longitude": data.get("longitude"),
                "elevation_m": data.get("elevation_m"),
                "created_at": now,
                "updated_at": now,
            },
        )
        conn.commit()
        return get_field(cur.lastrowid)
    finally:
        conn.close()


def update_field(field_id: int, data: dict) -> dict | None:
    existing = get_field(field_id)
    if not existing:
        return None
    conn = get_conn()
    try:
        merged = {**existing, **{k: v for k, v in data.items() if v is not None}}
        conn.execute(
            """UPDATE fields SET name = ?, crop = ?, grass_type = ?, area_acres = ?,
                                  latitude = ?, longitude = ?, elevation_m = ?, updated_at = ?
               WHERE id = ?""",
            (
                merged["name"], merged["crop"], merged["grass_type"], merged["area_acres"],
                merged["latitude"], merged["longitude"], merged["elevation_m"], _now(),
                field_id,
            ),
        )
        conn.commit()
        return get_field(field_id)
    finally:
        conn.close()


def delete_field(field_id: int) -> bool:
    conn = get_conn()
    try:
        cur = conn.execute("DELETE FROM fields WHERE id = ?", (field_id,))
        conn.commit()
        return cur.rowcount > 0
    finally:
        conn.close()


def _scan_row_to_dict(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "field_id": row["field_id"],
        "image_url": row["image_url"],
        "source": row["source"],
        "overall_health_score": row["overall_health_score"],
        "health_status": row["health_status"],
        "affected_area_percent": row["affected_area_percent"],
        "overall_risk": row["overall_risk"],
        "created_at": row["created_at"],
        "payload": json.loads(row["payload_json"]),
    }


def create_scan(field_id: int, payload: dict, source: str = "manual") -> dict:
    conn = get_conn()
    try:
        now = _now()
        grass = payload.get("grass_analysis", {})
        risk = payload.get("risk_assessment", {})
        cur = conn.execute(
            """INSERT INTO scans (field_id, image_url, source, overall_health_score,
                                   health_status, affected_area_percent, overall_risk,
                                   payload_json, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                field_id,
                payload.get("capture", {}).get("image_url"),
                source,
                grass.get("overall_health_score"),
                grass.get("health_status"),
                grass.get("affected_area_percent"),
                risk.get("overall_risk"),
                json.dumps(payload),
                now,
            ),
        )
        conn.execute("UPDATE fields SET updated_at = ? WHERE id = ?", (now, field_id))
        conn.commit()
        row = conn.execute("SELECT * FROM scans WHERE id = ?", (cur.lastrowid,)).fetchone()
        return _scan_row_to_dict(row)
    finally:
        conn.close()


def list_scans(field_id: int | None = None, limit: int = 50) -> list[dict]:
    conn = get_conn()
    try:
        if field_id is not None:
            rows = conn.execute(
                "SELECT * FROM scans WHERE field_id = ? ORDER BY created_at DESC LIMIT ?",
                (field_id, limit),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM scans ORDER BY created_at DESC LIMIT ?", (limit,)
            ).fetchall()
        return [_scan_row_to_dict(r) for r in rows]
    finally:
        conn.close()


def get_scan(scan_id: int) -> dict | None:
    conn = get_conn()
    try:
        row = conn.execute("SELECT * FROM scans WHERE id = ?", (scan_id,)).fetchone()
        return _scan_row_to_dict(row) if row else None
    finally:
        conn.close()
