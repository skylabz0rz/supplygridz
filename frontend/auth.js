
import { map } from './map.js';

let auth0Client;

(async () => {
  auth0Client = await createAuth0Client({
    domain: "dev-tzh46biettai7rin.us.auth0.com",
    client_id: "km3gCmbm6K9aeA3uFQh4Wlw3FSUjhZwr",
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
})();

async function updateUI() {
  const isAuthenticated = await auth0Client.isAuthenticated();

  if (isAuthenticated) {
    const user = await auth0Client.getUser();
    document.getElementById("user-display").innerText = `Logged in as: ${user.name}`;
    document.getElementById("login-btn").style.display = "none";
    document.getElementById("logout-btn").style.display = "inline-block";
    document.getElementById("welcome-screen").style.display = "none";
    document.getElementById("app-container").style.display = "flex";

    if (window.clearNPCs) window.clearNPCs(); // remove NPC trucks
    // TODO: load user-specific vehicles here
  } else {
    document.getElementById("user-display").innerText = "";
    document.getElementById("login-btn").style.display = "inline-block";
    document.getElementById("logout-btn").style.display = "none";
    document.getElementById("welcome-screen").style.display = "flex";
    document.getElementById("app-container").style.display = "flex";

    if (window.spawnNPCs) window.spawnNPCs(); // create NPC trucks
  }
}
