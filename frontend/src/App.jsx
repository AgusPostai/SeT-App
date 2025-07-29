import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import './index.css';

// Components
import AdminDashboard from './components/AdminDashboard';
import PatientCheck from './components/PatientCheck';

function App() {
  return (
    <Router>
      <nav className="navbar navbar-expand-lg navbar-dark">
        <div className="container-fluid">
          <Link className="navbar-brand" to="/">Se Tú</Link>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav">
              <li className="nav-item">
                <Link className="nav-link" to="/admin">Administrador</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/patient-check">Consulta Paciente</Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <div className="container mt-4">
        <Routes>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/patient-check" element={<PatientCheck />} />
          <Route path="/" element={
            <div className="text-center">
              <h1>Bienvenido a Se Tú</h1>
              <p>Selecciona una opción del menú para comenzar.</p>
            </div>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;