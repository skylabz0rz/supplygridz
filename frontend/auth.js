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

    // Handle callback after redirect
    if (window.location.search.includes("code=") && window.location.search.includes("state=")) {
      await auth0Client.handleRedirectCallback();
      window.history.replaceState({}, document.title, "/");
    }

    // Safely attach button events only if buttons exist
    const loginBtn = document.getElementById("login-btn");
    if (loginBtn) loginBtn.onclick = () => auth0Client.loginWithRedirect();

    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) logoutBtn.onclick = () => auth0Client.logout({ returnTo: window.location.origin });

    const welcomeLoginBtn = document.getElementById("welcome-login-btn");
    if (welcomeLoginBtn) welcomeLoginBtn.onclick = () => auth0Client.loginWithRedirect();

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

  const $ = (id) => document.getElementById(id);

  const topbar = $("topbar");
  const sidebar = $("sidebar");
  const mapDiv = $("map");
  const userDisplay = $("user-display");
  const loginBtn = $("login-btn");
  const logoutBtn = $("logout-btn");
  const welcomeScreen = $("welcome-screen");

  if (isAuthenticated) {
    const user = await auth0Client.getUser();
    if (userDisplay) userDisplay.innerText = `Logged in as: ${user.name}`;
    if (loginBtn) loginBtn.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "inline-block";
    if (topbar) topbar.classList.remove("hidden");
    if (sidebar) sidebar.classList.remove("hidden");
    if (mapDiv) mapDiv.classList.remove("disabled");
    if (welcomeScreen) welcomeScreen.style.display = "none";
    clearNPCs();
  } else {
    if (userDisplay) userDisplay.innerText = "";
    if (loginBtn) loginBtn.style.display = "inline-block";
    if (logoutBtn) logoutBtn.style.display = "none";
    if (topbar) topbar.classList.add("hidden");
    if (sidebar) sidebar.classList.add("hidden");
    if (mapDiv) mapDiv.classList.add("disabled");
    if (welcomeScreen) welcomeScreen.style.display = "flex";
    spawnNPCs();
  }
}
