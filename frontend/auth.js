import { spawnNPCs, clearNPCs } from './npc.js';

let createAuth0Client;

(async () => {
  const module = await import('./lib/auth0-spa-js.production.esm.js');
  createAuth0Client = module.createAuth0Client;
})();


let auth0 = null;
let isAuthenticated = false;

export async function initAuth() {
  try {
    auth0 = await createAuth0Client({
	domain: "dev-tzh46biettai7rin.us.auth0.com",
	client_id: "km3gCmbm6K9aeA3uFQh4W1w3FSUjhZwr",
	redirect_uri: window.location.origin,
	cacheLocation: 'localstorage',
	useRefreshTokens: true
	});

	bindAuthButtons();  // ✅ Now it's called after auth0 is ready

    if (window.location.search.includes("code=") && window.location.search.includes("state=")) {
      await auth0.handleRedirectCallback();
      window.history.replaceState({}, document.title, "/");
    }

    isAuthenticated = await auth0.isAuthenticated();

    if (isAuthenticated) {
      const user = await auth0.getUser();
      console.log("Logged in user:", user);
      clearNPCs();
    } else {
      spawnNPCs();
    }

	updateUI();

  } catch (err) {
    console.warn("Auth0 unavailable. Simulating logged-out state.");
    spawnNPCs();
    updateUI(false);
  }
}

async function updateUI(authAvailable = true) {
  const topbar = document.getElementById("topbar");
  const sidebar = document.getElementById("sidebar");
  const mapDiv = document.getElementById("map");

  let isAuthenticated = false;

  if (authAvailable && auth0) {
    isAuthenticated = await auth0.isAuthenticated();
  }

  if (isAuthenticated) {
    const user = await auth0.getUser();
    document.getElementById("user-display").innerText = `Logged in as: ${user.name}`;
    document.getElementById("login-btn").style.display = "none";
    document.getElementById("logout-btn").style.display = "inline-block";
    topbar?.classList.remove("hidden");
    sidebar?.classList.remove("hidden");
    mapDiv?.classList.remove("disabled");
    document.getElementById("welcome-screen").style.display = "none";
  } else {
    document.getElementById("user-display").innerText = "";
    document.getElementById("login-btn").style.display = "inline-block";
    document.getElementById("logout-btn").style.display = "none";
    topbar?.classList.add("hidden");
    sidebar?.classList.add("hidden");
    mapDiv?.classList.add("disabled");
    document.getElementById("welcome-screen").style.display = "flex";
  }
}

// Button listeners (bind once DOM is ready)
function bindAuthButtons() {
  document.getElementById("login-btn").onclick = () => {
    if (auth0) auth0.loginWithRedirect();
  };
  document.getElementById("logout-btn").onclick = () => {
    if (auth0) auth0.logout({ returnTo: window.location.origin });
  };
  document.getElementById("welcome-login-btn").onclick = () => {
    if (auth0) auth0.loginWithRedirect();
  };
}


export { auth0, isAuthenticated };
