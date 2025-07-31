import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Navbar from './components/Navbar';
import AddPatient from './components/AddPatient';
import AddPayment from './components/AddPayment';
import PatientList from './components/PatientList';
import PatientCheck from './components/PatientCheck';

import './App.css';

function App() {
    return (
        <Router>
            <Navbar />
            <div className="container mt-4">
                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<PatientCheck />} />
                    <Route path="/admin/patients" element={<PatientList />} />
                    <Route path="/admin/add-patient" element={<AddPatient />} />
                    <Route path="/admin/add-payment" element={<AddPayment />} />

                    {/* Redirect any other path to the main check-in page */}
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;