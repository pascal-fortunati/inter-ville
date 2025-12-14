// Entrée React
// - Monte l'application et charge styles globaux
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './Router.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
