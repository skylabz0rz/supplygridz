import { cities } from './cities.js';
import { companies } from './companies.js';

let npcCount = 1; // Limit to 1 for home screen testing
let activeNPCs = [];

// Utility: Pick random array element
function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Utility: Haversine distance between two coordinates
function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) *
            Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// Fetch route from OSRM
async function fetchRouteGeometry(start, end) {
  const maxDistance = 800; // Max NPC trip in km
  const distance = getDistanceKm(start.lat, start.lon, end.lat, end.lon);

  if (distance > maxDistance) {
    console.warn("Skipping NPC due to long distance:", distance, start, end);
    return null;
  }

  const url = `/osrm/route/v1/driving/${start.lon},${start.lat};${end.lon},${end.lat}?overview=full&geometries=geojson&steps=true`;
  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!data || !data.routes || !data.routes[0]) {
      console.warn("Bad route data:", data);
      return null;
    }

    return data.routes[0].geometry;
  } catch (err) {
    console.error("Error fetching route:", err);
    return null;
  }
}

// Draw route on Leaflet map
function drawRouteOnMap(steps) {
  if (!window.map || !steps || !Array.isArray(steps)) {
    console.warn("Invalid steps or map not initialized", steps);
    return;
  }

  const coords = steps.flatMap(step =>
    step.geometry?.coordinates?.map(([lon, lat]) => [lat, lon]) || []
  );

  if (coords.length === 0) {
    console.warn("No coordinates found in steps");
    return;
  }

  const routeLine = L.polyline(coords, {
    color: 'orange',
    weight: 4,
    opacity: 0.8
  }).addTo(window.map);

  activeNPCs.push(routeLine);
}


// Spawn one NPC
async function generateOneNPC(npcId = 1) {
  const company = getRandomElement(companies).trim();
  const start = getRandomElement(cities);
  const end = getRandomElement(cities);

  if (start.name === end.name) return;

  console.log(`NPC${npcId}: ${company} from ${start.name} → ${end.name}`);

  const route = await fetchRouteGeometry(start, end);
  if (!route) return;

  drawRouteOnMap(route);
}

// Exported functions
export async function spawnNPCs() {
  clearNPCs();
  for (let i = 1; i <= npcCount; i++) {
    await generateOneNPC(i);
  }
}

export function clearNPCs() {
  activeNPCs.forEach(layer => window.map.removeLayer(layer));
  activeNPCs = [];
}
