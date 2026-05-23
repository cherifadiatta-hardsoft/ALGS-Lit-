import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}/api`;

console.log("=================================================================");
console.log("🚦 Dakar Core Routing Traffic Detour & Cache Integration Test 🚦");
console.log("=================================================================\n");

const testCases = [
  {
    name: "VDN highway route crossing (Plateau to Almadies Peak Area)",
    lat1: 14.694,
    lng1: -17.447,
    lat2: 14.714,
    lng2: -17.427,
    expectedMinGain: 1
  },
  {
    name: "Avenue Cheikh Anta Diop cross route",
    lat1: 14.684,
    lng1: -17.457,
    lat2: 14.700,
    lng2: -17.435,
    expectedMinGain: 1
  }
];

async function runSequentialTests() {
  console.log("🔷 1. RUNNING FUNCTIONAL DETOUR TESTS SEQUENTIALLY...\n");
  
  for (const tc of testCases) {
    const startTime = Date.now();
    const url = `${BASE_URL}/route/optimisee?lat1=${tc.lat1}&lng1=${tc.lng1}&lat2=${tc.lat2}&lng2=${tc.lat2}`;
    
    console.log(`📍 Test Case: ${tc.name}`);
    console.log(`   Command: GET ${url}`);
    
    try {
      const response = await axios.get(url, { timeout: 5000, validateStatus: false });
      const apiDuration = Date.now() - startTime;
      
      if (response.status !== 200) {
        console.error(`   ❌ HTTP Error ${response.status}:`, response.data);
        continue;
      }

      const data = response.data;
      if (!data.success) {
        console.error(`   ❌ API Error:`, data.error || "Unknown response error status");
        continue;
      }

      console.log(`   ✅ API responded in ${apiDuration}ms`);
      
      const normal = data.normal;
      const detour = data.detour;

      console.log(`   [Baseline Path] Distance: ${normal.distance_km}km | Base Duration: ${normal.duree_min}min | Historical ETA (Trafic): ${normal.eta_trafic_min}min`);
      
      if (detour) {
        console.log(`   [Detour Path]   Distance: ${detour.distance_km}km | Detour ETA (Trafic): ${detour.eta_trafic_min}min`);
        console.log(`   🚨 Bypassed Axle: ${detour.ax_evite || "Congested corridor"}`);
        console.log(`   🎉 Time Saved:   ${detour.gain_min} minutes (${detour.gain_percent}%)`);
        console.log(`   💬 Alert Sent:   "${detour.message}"`);
        
        if (detour.gain_min >= tc.expectedMinGain) {
          console.log(`   ✅ PASS - Route optimizer calculated a valid detour path saving >= ${tc.expectedMinGain}min.\n`);
        } else {
          console.log(`   ⚠️ WARN - Calculated detour gain is small (${detour.gain_min}min) but route returned successfully.\n`);
        }
      } else {
        console.log("   🟢 Active Path is fluid. No detour suggested.\n");
      }
    } catch (err) {
      console.error(`   ❌ Request failed: ${err.message}\n`);
    }
  }
}

async function runLoadAndCacheTest() {
  console.log("🔷 2. RUNNING CONCURRENT CACHE & REDIS LOAD TEST...");
  console.log("   Simulating 30 concurrent API calls to measure caching response speeds...");

  const firstTc = testCases[0];
  const url = `${BASE_URL}/route/optimisee?lat1=${firstTc.lat1}&lng1=${firstTc.lng1}&lat2=${firstTc.lat2}&lng2=${firstTc.lat2}`;

  const requests = Array.from({ length: 30 }).map((_, idx) => {
    const rStart = Date.now();
    return axios.get(url, { timeout: 10000, validateStatus: false })
      .then(res => ({
        index: idx,
        status: res.status,
        duration: Date.now() - rStart,
        success: res.data && res.data.success
      }))
      .catch(err => ({
        index: idx,
        status: 500,
        duration: Date.now() - rStart,
        success: false,
        error: err.message
      }));
  });

  const startTime = Date.now();
  const results = await Promise.all(requests);
  const totalDuration = Date.now() - startTime;

  const succeeded = results.filter(r => r.status === 200 && r.success);
  const failed = results.filter(r => !r.success);

  // Group latencies to inspect caching effect
  const latencies = results.map(r => r.duration).sort((a, b) => a - b);
  const averageLatency = latencies.reduce((sum, val) => sum + val, 0) / latencies.length;
  const p50 = latencies[Math.floor(latencies.length * 0.50)];
  const p95 = latencies[Math.floor(latencies.length * 0.95)];

  console.log(`\n=================================================================`);
  console.log(`📊 Load Test Summary (Warm Cache Performance verification)`);
  console.log(`=================================================================`);
  console.log(`   - Total Requests:      ${results.length}`);
  console.log(`   - Successful Loads:    ${succeeded.length}`);
  console.log(`   - Failed Loads:        ${failed.length}`);
  console.log(`   - Total Run Duration:  ${totalDuration}ms`);
  console.log(`   - Avg Request Latency: ${averageLatency.toFixed(1)}ms`);
  console.log(`   - Median (p50) Speed:  ${p50}ms`);
  console.log(`   - Peak (p95) Speed:    ${p95}ms`);
  
  if (p50 < 45) {
    console.log(`   🚀 SUCCESS: Cache matches/hits optimally sub-50ms directly from RAM!`);
  } else {
    console.log(`   ℹ️ Note: Latencies are steady (OSRM requests or database responses might be processing).`);
  }
  console.log(`=================================================================\n`);
}

async function start() {
  await runSequentialTests();
  await runLoadAndCacheTest();
  process.exit(0);
}

start();
