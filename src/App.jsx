import './App.css'
import { BrowserRouter as Router, Routes, Route, NavLink } from "react-router-dom";
import HomePage from "./pages/index.jsx";
import LoginPage from "./pages/loginpage.jsx"
import FoodPage from "./pages/foodpage.jsx"


function App() {
  {/* Define styles*/}
  const navStyle = {
    display: "flex",
    gap: "20px",
    padding: "10px",
  };



  return (
    <Router basename="/~group3sp26/">
    <nav style={navStyle}>
        {/* Navigation links */}
        <NavLink to="/">
          HomePage
        </NavLink>
        <NavLink to="/login">
          LoginPage
        </NavLink>
      </nav>
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/food" element={<FoodPage darkMode={true}/>} />
    </Routes>
  </Router>

  )
}

export default App
