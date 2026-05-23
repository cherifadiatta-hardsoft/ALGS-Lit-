-- ALGS Location Matching Core Database Schema
-- Run this schema in your PostgreSQL instance (e.g., Supabase or Render DB).

-- 0. Enable PostGIS extension for high-performance spatial & radius calculations
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Table: livreurs (Drivers/Couriers status & real-time telemetry positions)
CREATE TABLE IF NOT EXISTS livreurs (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(255) NOT NULL,
  telephone VARCHAR(50) NOT NULL UNIQUE,
  disponible BOOLEAN DEFAULT true,
  note FLOAT DEFAULT 4.5,
  vehicule VARCHAR(50) DEFAULT 'moto',
  position GEOGRAPHY(Point, 4326),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index spatial pour les recherches de proximité ultra-rapides (< 10ms)
CREATE INDEX IF NOT EXISTS idx_livreurs_position ON livreurs USING GIST (position);

-- 2. Table: commandes (Delivery items/requests with assigned courier)
CREATE TABLE IF NOT EXISTS commandes (
  id SERIAL PRIMARY KEY,
  client_nom VARCHAR(255),
  client_tel VARCHAR(50),
  position_client GEOGRAPHY(Point, 4326) NOT NULL,
  position_depart GEOGRAPHY(Point, 4326),
  statut VARCHAR(50) DEFAULT 'en_attente', -- ('en_attente', 'assignee', 'en_cours', 'livree', 'annulee')
  livreur_id INT REFERENCES livreurs(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index pour requêtes par statut
CREATE INDEX IF NOT EXISTS idx_commandes_statut ON commandes (statut);

-- 3. Table: traces_trafic (Saves segment travel duration to extract historical congestion parameters)
CREATE TABLE IF NOT EXISTS traces_trafic (
  id BIGSERIAL PRIMARY KEY,
  segment TEXT NOT NULL, -- ex: "14694,-17447|14704,-17437"
  jour_semaine INT NOT NULL, -- 0=Sunday, 6=Saturday
  heure INT NOT NULL, -- Hour 0 to 23
  distance_km FLOAT NOT NULL,
  duree_sec INT NOT NULL,
  vitesse_moy_kmh FLOAT GENERATED ALWAYS AS (distance_km * 3600.0 / NULLIF(duree_sec, 0)) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices spatial-temporels pour des requêtes en millisecondes
CREATE INDEX IF NOT EXISTS idx_traces_segment ON traces_trafic(segment, jour_semaine, heure);
CREATE INDEX IF NOT EXISTS idx_traces_time ON traces_trafic(jour_semaine, heure);

-- 4. Table: segment_stats (Pre-aggregates traces_trafic for lightning-fast routing predictions)
CREATE TABLE IF NOT EXISTS segment_stats (
  segment TEXT PRIMARY KEY,
  jour_semaine INT NOT NULL,
  heure INT NOT NULL,
  nb_traces INT NOT NULL,
  duree_moy_sec FLOAT NOT NULL,
  distance_moy_km FLOAT NOT NULL,
  vitesse_moy_kmh FLOAT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour des lookups temps-réel instantanés
CREATE INDEX IF NOT EXISTS idx_stats_lookup ON segment_stats(jour_semaine, heure);

-- Insert friendly initial dummy mock data for livreurs to allow immediate testing within the matching range (around Dakar, Senegal or similar coordinates, or general custom coordinates)
INSERT INTO livreurs (nom, telephone, disponible, note, vehicule, position)
VALUES 
  ('Moussa Diop', '221775550101', true, 4.8, 'moto', ST_MakePoint(-17.446664, 14.693700)::geography),
  ('Awa Ndiaye', '221775550102', true, 4.9, 'moto', ST_MakePoint(-17.436664, 14.703700)::geography),
  ('Amadou Diallo', '221775550103', true, 4.2, 'moto', ST_MakePoint(-17.456664, 14.683700)::geography),
  ('Fatou Sow', '221775550104', false, 4.7, 'voiture', ST_MakePoint(-17.426664, 14.713700)::geography)
ON CONFLICT (telephone) DO UPDATE 
SET position = EXCLUDED.position, disponible = EXCLUDED.disponible;

-- 5. PostGIS helper function to calculate custom perpendicular detour offsets (Dakar route bypass)
CREATE OR REPLACE FUNCTION get_detour_point(
  seg_text TEXT,
  offset_meters FLOAT DEFAULT 500
)
RETURNS GEOMETRY AS $$
DECLARE
  seg_geom GEOMETRY;
  mid_point GEOMETRY;
  bearing FLOAT;
  detour_point GEOMETRY;
BEGIN
  -- Convert "lat1,lng1|lat2,lng2" coordinates from text to a spatial LINESTRING
  seg_geom := ST_MakeLine(
    ST_MakePoint(
      split_part(split_part(seg_text, '|', 1), ',', 2)::float, 
      split_part(split_part(seg_text, '|', 1), ',', 1)::float
    ),
    ST_MakePoint(
      split_part(split_part(seg_text, '|', 2), ',', 2)::float, 
      split_part(split_part(seg_text, '|', 2), ',', 1)::float
    )
  );

  -- Midpoint of segment
  mid_point := ST_LineInterpolatePoint(seg_geom, 0.5);

  -- Angle of segment in radians
  bearing := ST_Azimuth(ST_StartPoint(seg_geom), ST_EndPoint(seg_geom));

  -- Return point shifted 90 degrees left of the segment
  detour_point := ST_Project(mid_point, offset_meters, bearing + PI()/2)::geometry;

  RETURN detour_point;
END;
$$ LANGUAGE plpgsql;

