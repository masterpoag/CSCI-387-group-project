import './App.css'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/index.jsx";
import LoginPage from "./pages/loginpage.jsx"

function App() {
  return (
    <Router basename="/~cgpoag/CSCI-387">
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
    </Routes>
  </Router>

  )
}

export default App
