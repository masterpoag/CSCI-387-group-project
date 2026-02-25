import './App.css'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/index.jsx";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage /*Add Vars here for passthrough*/ />} /> 
      </Routes>
    </Router>

  )
}

export default App
