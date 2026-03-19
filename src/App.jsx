oimport './App.css'
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from "react-router-dom";
import HomePage from "./pages/index.jsx";
import LoginPage from "./pages/loginpage.jsx"


function App() {
  {/* Define styles*/}
  const navStyle = {
    display: "flex",
    gap: "20px",
    padding: "10px",
  };

  function Layout() {
    const location = useLocation();
    const hideNav = location.pathname === "/login";

    return (
      <>
        {!hideNav && (
          <nav style={navStyle}>
            {/* Navigation links */}
            <NavLink to="/">HomePage</NavLink>
            <NavLink to="/login">LoginPage</NavLink>
          </nav>
        )}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
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
