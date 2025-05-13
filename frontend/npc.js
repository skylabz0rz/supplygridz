import { cities } from './cities.js';
import { companies } from './companies.js';

let npcCount = 1; // Limit to one NPC for testing
let activeNPCs = [];

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

async function fetchRouteSteps(start, end) {
  const url = `/osrm/route/v1/driving/${start.lon},${start.lat};${end.lon},${end.lat}?overview=full&geometries=geojson&steps=true`;
  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!data || !data.routes || !data.routes[0]) {
      console.warn("Bad route data:", data);
      return null;
    }

    return data.routes[0].legs[0].steps;
  } catch (err) {
    console.error("Error fetching route:", err);
    return null;
  }
}

function drawRouteOnMap(steps) {
  if (!window.map || !steps || !Array.isArray(steps)) {
    console.warn("Map not initialized or steps invalid", steps);
    return;
  }

  const coords = steps.flatMap(step =>
    step.geometry?.coordinates?.map(([lon, lat]) => [lat, lon]) || []
  );

  if (coords.length === 0) {
    console.warn("No coordinates to draw");
    return;
  }

  const routeLine = L.polyline(coords, {
    color: 'orange',
    weight: 4,
    opacity: 0.8
  }).addTo(window.map);

  activeNPCs.push(routeLine);
}

async function generateOneNPC(npcId = 1) {
  const company = getRandomElement(companies).trim();
  const start = getRandomElement(cities);
  const end = getRandomElement(cities);

  if (start.name === end.name) return;

  console.log(`NPC${npcId}: ${company} from ${start.name} → ${end.name}`);

  const steps = await fetchRouteSteps(start, end);
  if (!steps) return;

  drawRouteOnMap(steps);
}

export async function spawnNPCs() {
  clearNPCs();
  for (let i = 1; i <= npcCount; i++) {
    await generateOneNPC(i);
  }
}

export function clearNPCs() {
  activeNPCs.forEach(obj => {
    if (window.map.hasLayer(obj)) {
      window.map.removeLayer(obj);
    }
  });
  activeNPCs = [];
}
