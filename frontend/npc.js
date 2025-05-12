
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

function interpolateCoords(start, end, t) {
  return {
    lat: start.lat + (end.lat - start.lat) * t,
    lon: start.lon + (end.lon - start.lon) * t
  };
}

async function spawnNPCs() {
  const cityLines = await loadTextFile("cities.txt");
  const cities = cityLines.map(parseCityLine);
  const companies = await loadTextFile("companies.txt");

  const usedPairs = new Set();

  for (let i = 0; i < 50; i++) {
    let start, end;
    do {
      start = cities[Math.floor(Math.random() * cities.length)];
      end = cities[Math.floor(Math.random() * cities.length)];
    } while (start.name === end.name || usedPairs.has(`${start.name}->${end.name}`));
    usedPairs.add(`${start.name}->${end.name}`);

    const company = companies[Math.floor(Math.random() * companies.length)];
    const progress = Math.random() * 0.8 + 0.1;
    const pos = interpolateCoords(start, end, progress);

    const icon = L.icon({
      iconUrl: 'https://cdn-icons-png.flaticon.com/512/1995/1995476.png',
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    const label = `${company}<br>${start.name} → ${end.name}`;
    const marker = L.marker([pos.lat, pos.lon], { icon })
      .addTo(map)
      .bindTooltip(label, { permanent: true, direction: 'right', offset: [10, 0] });

    const routeLine = L.polyline(
      [[start.lat, start.lon], [end.lat, end.lon]],
      {
        color: '#888',
        weight: 2,
        opacity: 0.4,
        dashArray: '5,5'
      }
    ).addTo(map);

    npcTrucks.push({ marker, start, end, t: progress });
    npcRoutes.push(routeLine);
  }

  npcInterval = setInterval(() => {
    npcTrucks.forEach(truck => {
      truck.t += 0.002;
      if (truck.t > 1) truck.t = 0.1;
      const newPos = interpolateCoords(truck.start, truck.end, truck.t);
      truck.marker.setLatLng([newPos.lat, newPos.lon]);
    });
  }, 2000);
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
