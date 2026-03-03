import './App.css'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/index.jsx";
import LoginPage from "./pages/loginpage.jsx"

function App() {
  return (
    <Router basename='/~cgpoag/CSCI-387'>
      <Routes>
        <Route path="/" element={<HomePage /*Add Vars here for passthrough*/ />} /> 
      </Routes>
      <Routes>
        <Route path="/login" element={<LoginPage /*Add Vars here for passthrough*/ />} /> 
      </Routes>
    </Router>

  )
}

export default App
