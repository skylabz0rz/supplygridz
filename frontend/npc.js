
import { map } from './map.js';

let npcTrucks = [];
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

  for (let i = 0; i < 100; i++) {
    let start, end;
    do {
      start = cities[Math.floor(Math.random() * cities.length)];
      end = cities[Math.floor(Math.random() * cities.length)];
    } while (start.name === end.name || usedPairs.has(`${start.name}->${end.name}`));
    usedPairs.add(`${start.name}->${end.name}`);

    const company = companies[Math.floor(Math.random() * companies.length)];
    const progress = Math.random() * 0.8 + 0.1; // 10% to 90%
    const pos = interpolateCoords(start, end, progress);

    const marker = L.marker([pos.lat, pos.lon], {
      icon: L.icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/1995/1995476.png',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      })
    }).addTo(map).bindPopup(`${company}<br>${start.name} → ${end.name}`);

    npcTrucks.push({ marker, start, end, t: progress });
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
  npcTrucks = [];
  clearInterval(npcInterval);
}

window.spawnNPCs = spawnNPCs;
window.clearNPCs = clearNPCs;
