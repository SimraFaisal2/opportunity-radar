#!/usr/bin/env python3
"""One-time fix: the pre-populated dev.db stores datetimes the way the old
Python app wrote them (e.g. "2026-10-20 00:00:00.000000" or
"2026-07-30T12:20:51.436569"). Prisma's SQLite connector expects ISO-8601 UTC
strings like "2026-10-20T00:00:00.000Z" and throws P2023 otherwise.

This script reformats the three datetime columns of Opportunity in place.
Run from opportunities-tracker/ :  python fix_legacy_dates.py
"""
import datetime
import sqlite3

DB = "prisma/dev.db"
COLS = ["deadline", "publishedAt", "createdAt"]


def reformat(value: str) -> str:
    s = value.strip()
    if not s:
        return value
    # tolerate either separator (space or T)
    if " " in s and "T" not in s:
        s = s.replace(" ", "T", 1)
    base, _, frac = s.partition(".")
    dt = datetime.datetime.strptime(base, "%Y-%m-%dT%H:%M:%S")
    micros = int((frac.rstrip("Z") or "0").ljust(6, "0")[:6])
    ms = round(micros / 1000)
    return f"{dt.strftime('%Y-%m-%dT%H:%M:%S')}.{ms:03d}Z"


def main() -> None:
    con = sqlite3.connect(DB)
    cur = con.cursor()
    changed = 0
    for col in COLS:
        rows = cur.execute(
            f"SELECT id, {col} FROM Opportunity WHERE {col} IS NOT NULL"
        ).fetchall()
        for row_id, value in rows:
            new_value = reformat(str(value))
            if new_value != value:
                cur.execute(
                    f"UPDATE Opportunity SET {col} = ? WHERE id = ?",
                    (new_value, row_id),
                )
                changed += 1
    con.commit()
    print(f"Reformatted {changed} datetime cell(s).")
    con.close()


if __name__ == "__main__":
    main()
