
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
  return coords.map(pair => [pair[1], pair[0]]); // flip lon/lat to lat/lon for Leaflet
}

async function fetchRoute(start, end) {
  const url = `/osrm/route/v1/driving/${start.lon},${start.lat};${end.lon},${end.lat}?overview=full&geometries=geojson`;
  const response = await fetch(url);
  const data = await response.json();
  if (data.code !== 'Ok') throw new Error('Route error');
  return decodeGeoJSONRoute(data.routes[0].geometry.coordinates);
}

async function spawnNPCs() {
  const cityLines = await loadTextFile("cities.txt");
  const cities = cityLines.map(parseCityLine);
  const companies = await loadTextFile("companies.txt");

  const usedPairs = new Set();

  for (let i = 0; i < 10; i++) {
    let start, end;
    do {
      start = cities[Math.floor(Math.random() * cities.length)];
      end = cities[Math.floor(Math.random() * cities.length)];
    } while (start.name === end.name || usedPairs.has(`${start.name}->${end.name}`));
    usedPairs.add(`${start.name}->${end.name}`);

    const company = companies[Math.floor(Math.random() * companies.length)];

    try {
      const routeCoords = await fetchRoute(start, end);
      const progressIndex = Math.floor(routeCoords.length * (Math.random() * 0.8 + 0.1));
      const marker = L.marker(routeCoords[progressIndex], {
        icon: L.icon({
          iconUrl: 'https://cdn-icons-png.flaticon.com/512/1995/1995476.png',
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        })
      }).addTo(map).bindTooltip(`${company}<br>${start.name} → ${end.name}`, {
        permanent: true, direction: 'right', offset: [10, 0]
      });

      const polyline = L.polyline(routeCoords, {
        color: '#888',
        weight: 2,
        opacity: 0.3,
        dashArray: '4,6'
      }).addTo(map);

      npcTrucks.push({ marker, route: routeCoords, index: progressIndex });
      npcRoutes.push(polyline);
    } catch (err) {
      console.warn('Failed to fetch route:', err);
    }
  }

  npcInterval = setInterval(() => {
    npcTrucks.forEach(truck => {
      truck.index = (truck.index + 1) % truck.route.length;
      truck.marker.setLatLng(truck.route[truck.index]);
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

window.spawnNPCs = spawnNPCs;
window.clearNPCs = clearNPCs;
