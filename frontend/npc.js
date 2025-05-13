
import { map } from './map.js';

let npcTrucks = [];
let npcRoutes = [];
let npcInterval;
let spawnInterval;

const roadSpeedLimits = {
  motorway: [65, 80],
  trunk: [55, 70],
  primary: [45, 60],
  secondary: [35, 50],
  residential: [25, 35],
  unknown: [40, 55]
};

async function loadTextFile(url) {
  const response = await fetch(url);
  const text = await response.text();
  return text.trim().split('\n');
}

function parseCityLine(line) {
  const [name, lat, lon] = line.split(',');
  return { name, lat: parseFloat(lat), lon: parseFloat(lon) };
}

function decodeGeo(step) {
  const coords = step.geometry.coordinates.map(pair => [pair[1], pair[0]]);
  return coords;
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(Δφ / 2) ** 2 +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getSpeedForRoad(type) {
  const [min, max] = roadSpeedLimits[type] || roadSpeedLimits["unknown"];
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function fetchRouteSteps(start, end) {
  const url = `/osrm/route/v1/driving/${start.lon},${start.lat};${end.lon},${end.lat}?overview=full&geometries=geojson&steps=true`;
  const response = await fetch(url);
  const contentType = response.headers.get("content-type");
  if (!response.ok || !contentType.includes("application/json")) {
    throw new Error(`Invalid response ${response.status}`);
  }
  const data = await response.json();
  if (!data.routes || data.routes.length === 0) throw new Error("No route found");
  return data.routes[0].legs[0].steps;
}

async function generateOneNPC(cities, companies, usedPairs, npcIndex) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const start = cities[Math.floor(Math.random() * cities.length)];
    const end = cities[Math.floor(Math.random() * cities.length)];
    if (start.name === end.name || usedPairs.has(`${start.name}->${end.name}`)) continue;
    usedPairs.add(`${start.name}->${end.name}`);

    const company = companies[Math.floor(Math.random() * companies.length)];
    console.log(`NPC${npcIndex}: ${company} from ${start.name} → ${end.name}`);

    try {
      const steps = await fetchRouteSteps(start, end);
      const route = [];

      steps.forEach(step => {
        const coords = decodeGeo(step);
        const roadClass = step.maneuver?.modifier || "unknown";
        const roadName = step.name || "Unnamed Road";
        const baseSpeed = getSpeedForRoad(roadClass);
        coords.forEach(coord => {
          route.push({
            latlng: coord,
            baseSpeed,
            road: roadName
          });
        });
      });

      const startIdx = Math.floor(route.length * (Math.random() * 0.8 + 0.1));
      const marker = L.marker(route[startIdx].latlng, {
        icon: L.icon({
          iconUrl: 'https://cdn-icons-png.flaticon.com/512/854/854894.png',  // truck icon
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        })
      }).addTo(map);

      const routeLine = L.polyline(route.map(r => r.latlng), {
        color: '#444',
        weight: 2,
        opacity: 0.5,
        dashArray: '4,6'
      }).addTo(map);

      const updateTooltip = (speed, road) => {
        marker.setTooltipContent(`${company}<br>${start.name} → ${end.name}<br>${road}<br>Speed: ${speed.toFixed(1)} mph`);
      };

      marker.bindTooltip('', {
        permanent: true, direction: 'right', offset: [10, 0]
      });

      npcTrucks.push({
        marker,
        route,
        index: startIdx,
        updateTooltip
      });
      npcRoutes.push(routeLine);
      return;
    } catch (err) {
      console.warn(`NPC${npcIndex} attempt ${attempt + 1} failed:`, err.message);
    }
  }

  console.warn(`NPC${npcIndex} failed to generate after 3 attempts.`);
}

async function spawnNPCs() {
  const cityLines = await loadTextFile("cities.txt");
  const cities = cityLines.map(parseCityLine);
  const companies = await loadTextFile("companies.txt");
  const usedPairs = new Set();

  let npcCount = 0;

  spawnInterval = setInterval(async () => {
    if (npcCount >= 20) {
      clearInterval(spawnInterval);
      return;
    }
    await generateOneNPC(cities, companies, usedPairs, npcCount + 1);
    npcCount++;
  }, 400);

  npcInterval = setInterval(() => {
    npcTrucks.forEach(truck => {
      const current = truck.route[truck.index];
      const nextIndex = (truck.index + 1) % truck.route.length;
      const next = truck.route[nextIndex];

      const distance = calculateDistance(current.latlng[0], current.latlng[1], next.latlng[0], next.latlng[1]);
      let jitter = Math.floor(Math.random() * 7) - 3; // -3 to +3
      let speed = next.baseSpeed + jitter;
      if (speed < 5) speed = 5;

      truck.marker.setLatLng(next.latlng);
      truck.index = nextIndex;
      truck.updateTooltip(speed, next.road);
    });
  }, 1500);
}

function clearNPCs() {
  npcTrucks.forEach(truck => map.removeLayer(truck.marker));
  npcRoutes.forEach(line => map.removeLayer(line));
  npcTrucks = [];
  npcRoutes = [];
  clearInterval(npcInterval);
  clearInterval(spawnInterval);
}

export { spawnNPCs, clearNPCs };
