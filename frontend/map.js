
// Create and expose the map globally
window.map = L.map('map').setView([39.5, -98.35], 5); // zoomed in one level

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(window.map);
