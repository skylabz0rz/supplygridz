
import { spawnNPCs, clearNPCs } from './npc.js';

let auth0Client = null;

(async () => {
  try {
    auth0Client = await createAuth0Client({
      domain: "dev-tzh46biettai7rin.us.auth0.com",
      client_id: "km3Gmbm6K9aeA3uFQh4Wlw3FSUjhZwr",
      audience: "https://supplygridz.com/api",
      cacheLocation: 'localstorage'
    });

    if (window.location.search.includes("code=") && window.location.search.includes("state=")) {
      await auth0Client.handleRedirectCallback();
      window.history.replaceState({}, document.title, "/");
    }

    document.getElementById("login-btn").onclick = () => auth0Client.loginWithRedirect();
    document.getElementById("logout-btn").onclick = () => auth0Client.logout({ returnTo: window.location.origin });
    document.getElementById("welcome-login-btn").onclick = () => auth0Client.loginWithRedirect();

    updateUI();
  } catch (err) {
    console.warn("Auth0 unavailable. Simulating logged-out state.");
    updateUI(false);
  }
})();

async function updateUI(authAvailable = true) {
  let isAuthenticated = false;

  if (authAvailable && auth0Client) {
    isAuthenticated = await auth0Client.isAuthenticated();
  }

  const topbar = document.getElementById("topbar");
  const sidebar = document.getElementById("sidebar");
  const mapDiv = document.getElementById("map");

  if (isAuthenticated) {
    const user = await auth0Client.getUser();
    document.getElementById("user-display").innerText = `Logged in as: ${user.name}`;
    document.getElementById("login-btn").style.display = "none";
    document.getElementById("logout-btn").style.display = "inline-block";
    topbar.classList.remove("hidden");
    sidebar.classList.remove("hidden");
    mapDiv.classList.remove("disabled");
    document.getElementById("welcome-screen").style.display = "none";
    clearNPCs();
  } else {
    document.getElementById("user-display").innerText = "";
    document.getElementById("login-btn").style.display = "inline-block";
    document.getElementById("logout-btn").style.display = "none";
    topbar.classList.add("hidden");
    sidebar.classList.add("hidden");
    mapDiv.classList.add("disabled");
    document.getElementById("welcome-screen").style.display = "flex";
    spawnNPCs();
  }
}
