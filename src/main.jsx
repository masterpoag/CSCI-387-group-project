// Application entry point. Mounts the React tree into the #root element
// declared in index.html and loads the global stylesheet.

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './global.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
