import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

console.log("==> Starting Dakar core routing traffic segment seeding...");

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error(" [ERROR] DATABASE_URL environment variable is occupied or undefined. Please write it in your .env configuration file.");
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes("supabase") || databaseUrl.includes("render") 
    ? { rejectUnauthorized: false } 
    : false
});

// Helper coordinate rounding to match createSegmentName in server.js
function createSegmentName(coords) {
  const hash1 = Math.round(coords[0][0] * 1000) + ',' + Math.round(coords[0][1] * 1000);
  const hash2 = Math.round(coords[1][0] * 1000) + ',' + Math.round(coords[1][1] * 1000);
  return hash1 < hash2 ? `${hash1}|${hash2}` : `${hash2}|${hash1}`;
}

// Haversine formula to compute distance (in km)
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function seed() {
  try {
    console.log("Connecting database pool...");
    await pool.query("SELECT 1"); // Verify connection is active

    console.log("Adding mock drivers if missing to populate references...");
    const sampleDrivers = [
      { id: 1, nom: "Moussa Diop", telephone: "221775550101", disponible: true, note: 4.8, vehicule: "moto", lat: 14.693700, lng: -17.446664 },
      { id: 2, nom: "Awa Ndiaye", telephone: "221775550102", disponible: true, note: 4.9, vehicule: "moto", lat: 14.703700, lng: -17.436664 },
      { id: 3, nom: "Amadou Diallo", telephone: "221775550103", disponible: true, note: 4.2, vehicule: "moto", lat: 14.683700, lng: -17.456664 },
      { id: 4, nom: "Fatou Sow", telephone: "221775550104", disponible: false, note: 4.7, vehicule: "voiture", lat: 14.713700, lng: -17.426664 }
    ];

    for (const d of sampleDrivers) {
      await pool.query(`
        INSERT INTO livreurs (id, nom, telephone, disponible, note, vehicule, position)
        VALUES ($1, $2, $3, $4, $5, $6, ST_MakePoint($7, $8)::geography)
        ON CONFLICT (telephone) DO UPDATE
        SET position = EXCLUDED.position, disponible = EXCLUDED.disponible
      `, [d.id, d.nom, d.telephone, d.disponible, d.note, d.vehicule, d.lng, d.lat]);
    }

    console.log("Generating 1000+ realistic segment traces around Dakar corridors...");

    // Main corridors in Dakar for mock stats simulation (coordinates: [lat, lng])
    const corridors = [
      { name: "VDN highway segment 1", p1: [14.694, -17.447], p2: [14.704, -17.437] },
      { name: "VDN highway segment 2", p1: [14.704, -17.437], p2: [14.714, -17.427] },
      { name: "Avenue Cheikh Anta Diop", p1: [14.684, -17.457], p2: [14.694, -17.447] },
      { name: "Route de Ouakam", p1: [14.690, -17.460], p2: [14.700, -17.450] },
      { name: "Autoroute de l'Avenir", p1: [14.675, -17.430], p2: [14.685, -17.420] }
    ];

    const tracesToInsert = [];
    const now = new Date();

    // Loop days: Sunday (0) to Saturday (6)
    for (let day = 0; day < 7; day++) {
      // Loop hours of interest for delivery activity
      for (const hr of [8, 12, 14, 18, 20]) {
        // For each corridor
        for (const corr of corridors) {
          const segmentName = createSegmentName([corr.p1, corr.p2]);
          const distanceKm = calculateHaversineDistance(corr.p1[0], corr.p1[1], corr.p2[0], corr.p2[1]);

          // Decide if this segment-day-hour cohort is blocked (5% chance during evening rush hours)
          const isBlocked = (hr === 18 || hr === 20) && Math.random() < 0.05;

          // We insert multiple entries per segment (e.g. 6 traces) to fulfill "HAVING COUNT(*) >= 5" requirement
          const numberOfTraces = 6;
          for (let sampleIndex = 0; sampleIndex < numberOfTraces; sampleIndex++) {
            let speedKmh;
            if (isBlocked) {
              speedKmh = 2.0 + Math.random() * 5.0; // 2-7 km/h = severe congestion
            } else {
              // Introduce slight variation for duration / speeds
              // Rush hours (8 AM: morning rush, 6 PM: evening rush) are slower
              const isRush = (hr === 8 || hr === 18);
              const baseSpeedKmh = isRush ? 8.5 : 35.0; // slower during rush hour
              const randomVariance = (Math.random() * 6 - 3); // variance of -3 to +3 kmh
              speedKmh = Math.max(5.0, baseSpeedKmh + randomVariance);
            }
            const durationSeconds = Math.round((distanceKm / speedKmh) * 3600);

            // Subtract random minutes from now to distribute within the last 15 days
            const backdatedTime = new Date(now.getTime() - (Math.random() * 15 * 24 * 60 * 60 * 1000));

            tracesToInsert.push({
              segmentName,
              day,
              hour: hr,
              distanceKm,
              durationSeconds,
              created_at: backdatedTime
            });
          }
        }
      }
    }

    console.log(`Prepared ${tracesToInsert.length} data traces rows to populate... Inserting in batches...`);

    // Safe multi-value transaction execution
    await pool.query("BEGIN");
    
    // Clear previous traces to have clean experiment stats
    await pool.query("DELETE FROM traces_trafic");
    await pool.query("DELETE FROM segment_stats");

    for (const trace of tracesToInsert) {
      await pool.query(
        `INSERT INTO traces_trafic (segment, jour_semaine, heure, distance_km, duree_sec, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [trace.segmentName, trace.day, trace.hour, trace.distanceKm, trace.durationSeconds, trace.created_at]
      );
    }

    await pool.query("COMMIT");
    console.log(`✓ Inserted ${tracesToInsert.length} traces successfully!`);

    console.log("Executing aggregation to build primary index...");
    
    // Execute aggregate traffic query (Rule 3.3 and threshold 5)
    await pool.query(`
      INSERT INTO segment_stats (segment, jour_semaine, heure, nb_traces, duree_moy_sec, distance_moy_km, vitesse_moy_kmh, updated_at)
      SELECT
        segment,
        jour_semaine,
        heure,
        COUNT(*) as nb_traces,
        AVG(duree_sec) as duree_moy_sec,
        AVG(distance_km) as distance_moy_km,
        AVG(distance_km * 3600.0 / NULLIF(duree_sec, 0)) as vitesse_moy_kmh,
        NOW()
      FROM traces_trafic
      GROUP BY segment, jour_semaine, heure
      HAVING COUNT(*) >= 5
    `);

    const statsCountResult = await pool.query("SELECT COUNT(*) FROM segment_stats");
    console.log(`✓ Database aggregate matrices complete! Created ${statsCountResult.rows[0].count} stats rows.`);
    console.log("You can start your dev server or docker environment safely now.");
    
    process.exit(0);
  } catch (err) {
    await pool.query("ROLLBACK").catch(() => {});
    console.error("❌ Seeding failed with error:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
