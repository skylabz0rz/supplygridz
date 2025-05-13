import { spawnNPCs } from './npc.js';

let createAuth0Client;
let auth0 = null;

const auth0Ready = (async () => {
  const module = await import('./lib/auth0-spa-js.production.esm.js');
  createAuth0Client = module.createAuth0Client;
})();

window.login = async () => {
  await auth0Ready;
  auth0 = await createAuth0Client({
    domain: "dev-tzh46biettai7rin.us.auth0.com",
    client_id: "km3gCmbm6K9aeA3uFQh4W1w3FSUjhZwr",
    redirect_uri: window.location.origin,
    cacheLocation: 'localstorage',
    useRefreshTokens: true
  });

  if (window.location.search.includes("code=") && window.location.search.includes("state=")) {
    await auth0.handleRedirectCallback();
    window.history.replaceState({}, document.title, "/");
  }

  const isAuthenticated = await auth0.isAuthenticated();

  if (isAuthenticated) {
    const user = await auth0.getUser();
    console.log("Logged in user:", user);
    // You could now import the game UI here
    import('./game-loader.js');
  } else {
    console.warn("Login failed. Running in guest mode.");
    spawnNPCs();
  }
};

window.addEventListener('DOMContentLoaded', () => {
  window.map = L.map('map').setView([39.8283, -98.5795], 4);  // Center USA

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(window.map);

  // Spawn NPCs right away for animated map
  spawnNPCs();
});

