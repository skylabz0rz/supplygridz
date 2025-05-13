
import { map } from './map.js';

let npcTrucks = [];
let npcRoutes = [];
let npcInterval;

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

async function fetchRoute(start, end) {
  const url = `/osrm/route/v1/driving/${start.lon},${start.lat};${end.lon},${end.lat}?overview=full&geometries=geojson`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  if (!data.routes || data.routes.length === 0) throw new Error('No route found');
  return decodeGeoJSONRoute(data.routes[0].geometry.coordinates);
}

async function getValidRoute(cities, companies, usedPairs) {
  for (let attempts = 0; attempts < 10; attempts++) {
    const start = cities[Math.floor(Math.random() * cities.length)];
    const end = cities[Math.floor(Math.random() * cities.length)];
    if (start.name === end.name || usedPairs.has(`${start.name}->${end.name}`)) continue;
    usedPairs.add(`${start.name}->${end.name}`);

    try {
      const routeCoords = await fetchRoute(start, end);
      const company = companies[Math.floor(Math.random() * companies.length)];
      return { routeCoords, start, end, company };
    } catch (err) {
      console.warn("Retrying route:", err.message);
    }
  }
  throw new Error("Failed to find valid route after multiple attempts.");
}

async function spawnNPCs() {
  const cityLines = await loadTextFile("cities.txt");
  const cities = cityLines.map(parseCityLine);
  const companies = await loadTextFile("companies.txt");

  const usedPairs = new Set();

  for (let i = 0; i < 10; i++) {
    try {
      const { routeCoords, start, end, company } = await getValidRoute(cities, companies, usedPairs);
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
        index: progressIndex,
        start,
        end,
        updateTooltip
      });
      npcRoutes.push(polyline);
    } catch (err) {
      console.warn("Skipped NPC:", err.message);
    }
  }

  npcInterval = setInterval(() => {
    npcTrucks.forEach(truck => {
      const current = truck.route[truck.index];
      truck.index = (truck.index + 1) % truck.route.length;
      const next = truck.route[truck.index];

      const distance = calculateDistance(current[0], current[1], next[0], next[1]);
      const speedMps = distance / 1.5;
      const speedMph = speedMps * 2.23694;

      truck.marker.setLatLng(next);
      truck.updateTooltip(speedMph);
    });
  }, 1500);
}

function clearNPCs() {
  npcTrucks.forEach(truck => map.removeLayer(truck.marker));
  npcRoutes.forEach(line => map.removeLayer(line));
  npcTrucks = [];
  npcRoutes = [];
  clearInterval(npcInterval);
}

export { spawnNPCs, clearNPCs };

