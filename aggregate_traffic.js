import dotenv from "dotenv";
import pg from "pg";

// Bootstrap environment variables
dotenv.config();

console.log("==> Starting stand-alone traffic segment statistics aggregation (Cron Job style)...");

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.warn(" [WARN] No DATABASE_URL configured in the environment. Skipping historical database aggregation. (Running in local simulated sandbox mode)");
  process.exit(0);
}

const pool = new pg.Pool({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes("supabase") || databaseUrl.includes("render") 
    ? { rejectUnauthorized: false } 
    : false
});

async function run() {
  try {
    console.log("Connecting to PostgreSQL core instance...");
    
    // 0. Ensure target schema objects exist on startups
    await pool.query(`
      CREATE TABLE IF NOT EXISTS segment_stats (
        segment TEXT PRIMARY KEY,
        jour_semaine INT NOT NULL,
        heure INT NOT NULL,
        nb_traces INT NOT NULL,
        duree_moy_sec FLOAT NOT NULL,
        distance_moy_km FLOAT NOT NULL,
        vitesse_moy_kmh FLOAT NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_stats_lookup ON segment_stats(jour_semaine, heure)`);

    console.log("Consolidating courier trace logs (traces_trafic -> segment_stats) for Dakar routes...");
    
    // Run core aggregation with HAVING COUNT(*) >= 5 filter (Rule 3.3)
    const result = await pool.query(`
      INSERT INTO segment_stats (segment, jour_semaine, heure, nb_traces, duree_moy_sec, distance_moy_km, vitesse_moy_kmh)
      SELECT
        segment,
        jour_semaine,
        heure,
        COUNT(*) as nb_traces,
        AVG(duree_sec) as duree_moy_sec,
        AVG(distance_km) as distance_moy_km,
        AVG(distance_km * 3600.0 / NULLIF(duree_sec, 0)) as vitesse_moy_kmh
      FROM traces_trafic
      WHERE created_at > NOW() - INTERVAL '30 days'
      GROUP BY segment, jour_semaine, heure
      HAVING COUNT(*) >= 5
      ON CONFLICT (segment)
      DO UPDATE SET
        nb_traces = EXCLUDED.nb_traces,
        duree_moy_sec = EXCLUDED.duree_moy_sec,
        distance_moy_km = EXCLUDED.distance_moy_km,
        vitesse_moy_kmh = EXCLUDED.vitesse_moy_kmh,
        updated_at = NOW()
    `);

    console.log("Pruning obsolete trace records > 30 days old to preserve storage efficiency...");
    const cleanup = await pool.query(`DELETE FROM traces_trafic WHERE created_at < NOW() - INTERVAL '30 days'`);

    console.log(`✓ Aggregation job completed successfully!`);
    console.log(`   - Segments updated/inserted: ${result.rowCount || 0}`);
    console.log(`   - Obsolete traces pruned: ${cleanup.rowCount || 0}`);
    
    process.exit(0);
  } catch (err) {
    console.error("❌ Aggregation job encountered a fatal execution failure:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
