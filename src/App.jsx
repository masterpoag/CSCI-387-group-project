// Root application component for NutriFlow.
//
// Responsibilities:
//   - Wires up React Router and registers every page route.
//   - Tracks authentication state (driven by the login token in localStorage).
//   - Loads the signed-in user's account type so role-specific nav links
//     and routes can be conditionally rendered.
//   - Manages the light/dark theme and persists the user's choice.
//
// Account type values (returned by /api/get-auth-level):
//     0 = Admin       1 = Standard user
//     2 = Chef        3 = Trainer (gym instructor)

import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from "react-router-dom";
import HomePage from "./pages/index.jsx";
import LoginPage from "./pages/loginpage.jsx"
import FoodPage from "./pages/foodpage.jsx";
import WorkoutPage from "./pages/workoutpage.jsx";
import AdminPage from "./pages/adminpage.jsx";
import ChefDashboard from "./pages/chefdashboard.jsx";
import FitDashboard from "./pages/fitdashboard.jsx";

// Backend API base URL. Read from a Vite env var so it can differ between
// dev / staging / prod. Falls back to the production host if unset.
const API_BASE = import.meta.env.VITE_API_BASE ?? "https://gp.vroey.us";


function App() {
  // Authentication is determined by the presence of a token in localStorage.
  // The token is the hashed UID returned from /api/login.
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem("token");
  });

  // Account type drives role-aware UI (Chef/Fitness/Admin nav links, etc.).
  // null means "not loaded yet" or "unauthenticated".
  const [accountType, setAccountType] = useState(null);


  // Theme preference. On first load we honor a saved preference, then fall
  // back to the OS-level preference (prefers-color-scheme).
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light" || savedTheme === "dark") {
      return savedTheme;
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  // Mirror the theme to the <html data-theme="..."> attribute (CSS keys off
  // it for light-mode overrides) and persist the choice across sessions.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // After login (or on page reload while logged in), fetch the user's
  // account type so the nav can render the right role-specific links.
  useEffect(() => {
    async function loadAccountType() {
      const token = localStorage.getItem("token");
      if (!token) {
        setAccountType(null);
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/api/get-auth-level?huid=${token}`);
        const json = await res.json();
        if (json?.Result === "Success" && json.Data?.[0]?.account_type !== undefined) {
          setAccountType(json.Data[0].account_type);
        } else {
          setAccountType(null);
        }
      } catch {
        // Network error or malformed response — treat as unauthenticated for
        // the purposes of role-gated UI rather than crashing the app.
        setAccountType(null);
      }
    }

    if (isAuthenticated) {
      loadAccountType();
    }
  }, [isAuthenticated]);

  const isLightTheme = theme === "light";

  // Layout renders the top navigation bar (when not on /login) and the
  // route outlet. It lives inside <Router> so it can use useLocation().
  function Layout() {
    const location = useLocation();
    // The login page is intentionally chrome-less so the auth card is the
    // only thing on screen.
    const hideNav = location.pathname === "/login";

    const themeToggle = (
      <button
        type="button"
        className="topNavThemeButton"
        aria-label={isLightTheme ? "Switch to dark mode" : "Switch to light mode"}
        title={isLightTheme ? "Switch to dark mode" : "Switch to light mode"}
        onClick={() => setTheme((prevTheme) => (prevTheme === "dark" ? "light" : "dark"))}
      >
        <span
          className={`topNavThemeIcon${isLightTheme ? "" : " isMoon"}`}
          aria-hidden="true"
        >
          {isLightTheme ? "☀" : "☾"}
        </span>
      </button>
    );

    return (
      <>
        {!hideNav && (
          <nav className="topNav" aria-label="Primary navigation">
            <div className="topNavInner">
              <NavLink className="topNavBrand" to="/">
                NutriFlow
              </NavLink>
              <div className="topNavLinks">
                <NavLink
                  to="/"
                  className={({ isActive }) => `topNavLink${isActive ? " isActive" : ""}`}
                  end
                >
                  Home
                </NavLink>
                <NavLink
                  to="/food"
                  className={({ isActive }) => `topNavLink${isActive ? " isActive" : ""}`}
                >
                  Recipes
                </NavLink>
                <NavLink
                  to="/workouts"
                  className={({ isActive }) => `topNavLink${isActive ? " isActive" : ""}`}
                >
                  Workouts
                </NavLink>
                {/* Chef link visible to Chefs and Admins. */}
                {(accountType === 0 || accountType === 2) && (
                  <NavLink
                    to="/chef"
                    className={({ isActive }) => `topNavLink${isActive ? " isActive" : ""}`}
                  >
                    Chef
                  </NavLink>
                )}
                {/* Fitness link visible to Trainers and Admins. */}
                {(accountType === 0 || accountType === 3) && (
                  <NavLink
                    to="/fit"
                    className={({ isActive }) => `topNavLink${isActive ? " isActive" : ""}`}
                  >
                    Fitness
                  </NavLink>
                )}
                {/* Admin link visible only to Admins. */}
                {accountType === 0 && (
                  <NavLink
                    to="/admin"
                    className={({ isActive }) => `topNavLink${isActive ? " isActive" : ""}`}
                  >
                    Admin
                  </NavLink>
                )}
                {isAuthenticated ? (
                  <button
                    className="topNavLink"
                    onClick={() => {
                      localStorage.removeItem("token");
                      setIsAuthenticated(false);
                    }}
                  >
                    Logout
                  </button>
                ) : (
                  <NavLink
                    to="/login"
                    className={({ isActive }) => `topNavLink${isActive ? " isActive" : ""}`}
                    
                  >
                    Login
                  </NavLink>
                )}
              {themeToggle}
              </div>
            </div>
          </nav>
        )}
        {/* Role-gated routes: a user without the right account type is
            silently redirected to the home page rather than seeing a
            permission error. */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage setIsAuthenticated={setIsAuthenticated} />} />
          <Route path="/food" element={<FoodPage />} />
          <Route path="/workouts" element={<WorkoutPage />} />
          <Route path="/admin" element={accountType === 0 ? <AdminPage /> : <HomePage />} />
          <Route path="/chef" element={accountType === 2 || accountType === 0 ? <ChefDashboard /> : <HomePage />} />
          <Route path="/fit" element={accountType === 3 || accountType === 0 ? <FitDashboard /> : <HomePage />} />
        </Routes>
      </>
    );
  }

  // basename matches the deployment path on turing.cs.olemiss.edu so all
  // client-side routes resolve relative to /~group3sp26/.
  return (
    <Router basename="/~group3sp26/">
      <Layout />
    </Router>

  )
}

export default App
