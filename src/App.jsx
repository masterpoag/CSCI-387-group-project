import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from "react-router-dom";
import HomePage from "./pages/index.jsx";
import LoginPage from "./pages/loginpage.jsx"
import FoodPage from "./pages/foodpage.jsx";
import WorkoutPage from "./pages/workoutpage.jsx";
import AdminPage from "./pages/adminpage.jsx";

const API_BASE = import.meta.env.VITE_API_BASE ?? "https://gp.vroey.us";


function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem("token");
  });

  const [accountType, setAccountType] = useState(null);


  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light" || savedTheme === "dark") {
      return savedTheme;
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

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
        setAccountType(null);
      }
    }

    if (isAuthenticated) {
      loadAccountType();
    }
  }, [isAuthenticated]);

  const isLightTheme = theme === "light";

  function Layout() {
    const location = useLocation();
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
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage setIsAuthenticated={setIsAuthenticated} />} />
          <Route path="/food" element={<FoodPage />} />
          <Route path="/workouts" element={<WorkoutPage />} />
          <Route path="/admin" element={accountType === 0 ? <AdminPage /> : <HomePage />} />
        </Routes>
      </>
    );
  }

  return (
    <Router basename="/~group3sp26/">
      <Layout />
    </Router>

  )
}

export default App
