import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from "react-router-dom";
import HomePage from "./pages/index.jsx";
import LoginPage from "./pages/loginpage.jsx"
import FoodPage from "./pages/foodpage.jsx";


function App() {
  function Layout() {
    const location = useLocation();
    const hideNav = location.pathname === "/login";

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
                  to="/login"
                  className={({ isActive }) => `topNavLink${isActive ? " isActive" : ""}`}
                >
                  Login
                </NavLink>
              </div>
            </div>
          </nav>
        )}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/food" element={<FoodPage />} />
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
