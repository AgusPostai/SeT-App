import React from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
            <div className="container-fluid">
                <Link className="navbar-brand" to="/">Se TÚ</Link>
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav me-auto">
                        <li className="nav-item">
                            <Link className="nav-link" to="/">Fichaje</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/admin/patients">Ver Pacientes</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/admin/add-patient">Agregar Paciente</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/admin/add-payment">Registrar Pago</Link>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;