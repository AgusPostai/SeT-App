
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import axios from 'axios';

import Navbar from './components/Navbar';
import Login from './components/Login';
import AddPatient from './components/AddPatient';
import AddPayment from './components/AddPayment';
import PatientList from './components/PatientList';
import PatientCheck from './components/PatientCheck';

import './App.css';

// Componente para Rutas Protegidas
const PrivateRoutes = () => {
    const [auth, setAuth] = useState({ loading: true, isAuthenticated: false });

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            // Aquí podrías añadir una verificación del token contra el backend
            setAuth({ loading: false, isAuthenticated: true });
        } else {
            setAuth({ loading: false, isAuthenticated: false });
        }
    }, []);

    if (auth.loading) {
        return <div>Loading...</div>; // O un spinner
    }

    return auth.isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};

function App() {
    return (
        <Router>
            <Navbar />
            <div className="container mt-4">
                <Routes>
                    {/* Ruta Pública */}
                    <Route path="/check" element={<PatientCheck />} />
                    <Route path="/login" element={<Login />} />

                    {/* Rutas Privadas */}
                    <Route element={<PrivateRoutes />}>
                        <Route path="/admin/patients" element={<PatientList />} />
                        <Route path="/admin/add-patient" element={<AddPatient />} />
                        <Route path="/admin/add-payment" element={<AddPayment />} />
                        {/* Redirige la raíz del admin al listado de pacientes */}
                        <Route path="/admin" element={<Navigate to="/admin/patients" />} />
                    </Route>

                    {/* Redirección por defecto */}
                    <Route path="*" element={<Navigate to="/check" />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
