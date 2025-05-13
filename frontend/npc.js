
import { map } from './map.js';

let npcTrucks = [];
let npcRoutes = [];
let npcInterval;
let spawnInterval;

const SPEED_BY_ROAD = {
  interstate: [65, 80],
  highway: [55, 70],
  residential: [25, 35],
  unknown: [40, 60]
};

const SPEED_LIMIT_BY_VEHICLE = {
  default: 80,  // placeholder, to be customized per vehicle
};

function classifyRoad(name) {
  if (!name) return 'unknown';
  if (/I-\d+/.test(name) || name.includes("Interstate")) return 'interstate';
  if (/US-\d+/.test(name) || name.includes("Hwy") || name.includes("Highway")) return 'highway';
  if (/Main|1st|2nd|3rd|Street|Ave|Rd/.test(name)) return 'residential';
  return 'unknown';
}

async function loadTextFile(url) {
  const response = await fetch(url);
  const text = await response.text();
  return text.trim().split('\n');
}

function parseCityLine(line) {
  const [name, lat, lon] = line.split(',');
  return { name, lat: parseFloat(lat), lon: parseFloat(lon) };
}

function decodeGeoJSONRoute(coords) {
  return coords.map(pair => [pair[1], pair[0]]);
}

async function fetchDetailedRoute(start, end) {
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

async function tryGenerateOne(cities, companies, usedPairs, npcIndex) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const start = cities[Math.floor(Math.random() * cities.length)];
    const end = cities[Math.floor(Math.random() * cities.length)];
    if (start.name === end.name || usedPairs.has(`${start.name}->${end.name}`)) continue;
    usedPairs.add(`${start.name}->${end.name}`);

    const company = companies[Math.floor(Math.random() * companies.length)];
    console.log(`NPC${npcIndex}: ${company} from ${start.name} → ${end.name}`);

    try {
      const steps = await fetchDetailedRoute(start, end);
      let routeCoords = [];
      let speedPlan = [];

      steps.forEach(step => {
        const coords = decodeGeoJSONRoute(step.geometry.coordinates);
        const roadType = classifyRoad(step.name || step.ref);
        const [min, max] = SPEED_BY_ROAD[roadType] || SPEED_BY_ROAD.unknown;
        const speed = Math.floor(Math.random() * (max - min + 1)) + min;
        coords.forEach((coord, idx) => {
          routeCoords.push(coord);
          if (idx > 0) speedPlan.push(Math.min(speed, SPEED_LIMIT_BY_VEHICLE.default));
        });
      });

      if (routeCoords.length < 2) throw new Error("Too short");

      const progressIndex = Math.floor(routeCoords.length * (Math.random() * 0.8 + 0.1));
      const marker = L.marker(routeCoords[progressIndex], {
        icon: L.icon({
          iconUrl: 'https://cdn-icons-png.flaticon.com/512/1995/1995476.png',
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        })
      }).addTo(map);

      const polyline = L.polyline(routeCoords, {
        color: '#444',
        weight: 2,
        opacity: 0.5,
        dashArray: '4,6'
      }).addTo(map);

      const updateTooltip = (speed) => {
        marker.setTooltipContent(`${company}<br>${start.name} → ${end.name}<br>Speed: ${speed.toFixed(1)} mph`);
      };

      marker.bindTooltip('', {
        permanent: true, direction: 'right', offset: [10, 0]
      });

      npcTrucks.push({
        marker,
        route: routeCoords,
        speedPlan,
        index: progressIndex,
        updateTooltip
      });
      npcRoutes.push(polyline);
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
    if (npcCount >= 10) {
      clearInterval(spawnInterval);
      return;
    }
    await tryGenerateOne(cities, companies, usedPairs, npcCount + 1);
    npcCount++;
  }, 1000);

  npcInterval = setInterval(() => {
    npcTrucks.forEach(truck => {
      const current = truck.route[truck.index];
      truck.index = (truck.index + 1) % truck.route.length;
      const next = truck.route[truck.index];
      const speed = truck.speedPlan[truck.index] || 50;
      truck.marker.setLatLng(next);
      truck.updateTooltip(speed);
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


