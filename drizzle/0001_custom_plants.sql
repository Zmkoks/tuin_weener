CREATE TABLE IF NOT EXISTS custom_plants (
  slug TEXT PRIMARY KEY,
  plant_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
