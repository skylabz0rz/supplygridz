import { spawnNPCs, clearNPCs } from './npc.js';

let auth0Client = null;

(async () => {
  try {
    auth0Client = await createAuth0Client({
      domain: "dev-tzh46biettai7rin.us.auth0.com",
      client_id: "km3Gmbm6K9aeA3uFQh4Wlw3FSUjhZwr",
      audience: "https://supplygridz.com/api",
      cacheLocation: 'localstorage',
      useRefreshTokens: true
    });

    // Handle redirect from Auth0
    if (window.location.search.includes("code=") && window.location.search.includes("state=")) {
      await auth0Client.handleRedirectCallback();
      window.history.replaceState({}, document.title, "/");
    }

    const loginBtn = document.getElementById("welcome-login-btn");
    if (loginBtn) {
      loginBtn.onclick = () => auth0Client.loginWithRedirect();
    }

    updateUI();
  } catch (err) {
    console.warn("Auth0 unavailable. Simulating logged-out state.");
    updateUI(false);
  }
})();

async function updateUI(authAvailable = true) {
  const $ = (id) => document.getElementById(id);
  const sidebar = $("sidebar");
  const mapDiv = $("map");
  const welcomeScreen = $("welcome-screen");

  let isAuthenticated = false;
  if (authAvailable && auth0Client) {
    isAuthenticated = await auth0Client.isAuthenticated();
  }

  if (isAuthenticated) {
    if (sidebar) sidebar.classList.remove("hidden");
    if (mapDiv) mapDiv.classList.remove("disabled");
    if (welcomeScreen) welcomeScreen.style.display = "none";
    clearNPCs();
  } else {
    if (sidebar) sidebar.classList.add("hidden");
    if (mapDiv) mapDiv.classList.add("disabled");
    if (welcomeScreen) welcomeScreen.style.display = "flex";
    spawnNPCs();
  }
}
