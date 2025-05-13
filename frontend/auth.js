import { spawnNPCs, clearNPCs } from './npc.js';

let auth0Client = null;

(async () => {
  auth0Client = await createAuth0Client({
    domain: "dev-tzh46biettai7rin.us.auth0.com",
    client_id: "km3Gmbm6K9aeA3uFQh4Wlw3FSUjhZwr",
    audience: "https://supplygridz.com/api",
    cacheLocation: 'localstorage',
    useRefreshTokens: true
  });

  // Handle login redirect callback
  if (window.location.search.includes("code=") && window.location.search.includes("state=")) {
    await auth0Client.handleRedirectCallback();
    window.history.replaceState({}, document.title, "/");
  }

  const isAuthenticated = await auth0Client.isAuthenticated();

  if (!isAuthenticated) {
    // Immediately send to login screen
    return auth0Client.loginWithRedirect();
  }

  updateUI(true);
})();

async function updateUI(authAvailable = true) {
  const $ = (id) => document.getElementById(id);
  const sidebar = $("sidebar");
  const mapDiv = $("map");

  if (authAvailable && auth0Client) {
    const user = await auth0Client.getUser();
    if (sidebar) sidebar.classList.remove("hidden");
    if (mapDiv) mapDiv.classList.remove("disabled");
    clearNPCs();
  }
}
