import { spawnNPCs, clearNPCs } from './npc.js';

let auth0Client = null;

// Always spawn NPCs for login screen background
spawnNPCs();

(async () => {
  auth0Client = await createAuth0Client({
    domain: "dev-tzh46biettai7rin.us.auth0.com",
    client_id: "km3gCmbm6K9aeA3uFQh4Wlw3FSUjhZwr",
    audience: "https://supplygridz.com/api",
    cacheLocation: 'localstorage',
    useRefreshTokens: true
  });

  // Handle login redirect
  if (window.location.search.includes("code=") && window.location.search.includes("state=")) {
    await auth0Client.handleRedirectCallback();
    window.history.replaceState({}, document.title, "/");
  }

  const isAuthenticated = await auth0Client.isAuthenticated();

  if (isAuthenticated) {
    clearNPCs();
    window.location.href = "/dashboard.html"; // ← redirect to your new dashboard
  } else {
    console.log("User not authenticated. Showing login with NPCs active.");
  }
})();
