import React, { useState } from 'react';
import axios from 'axios';
import './PatientCheck.css'; // Import the CSS for animation

function PatientCheck() {
    const [dni, setDni] = useState('');
    const [patientInfo, setPatientInfo] = useState(null);
    const [error, setError] = useState('');

    const handleDniChange = (e) => {
        setDni(e.target.value);
    };

    const checkMembership = async (e) => {
        e.preventDefault();
        setPatientInfo(null);
        setError('');
        try {
            const response = await axios.get(`https://backend-still-hill-8646.fly.dev/patient/${dni}`);
            setPatientInfo(response.data.data);
        } catch (err) {
            if (err.response && err.response.status === 404) {
                setError('Paciente no encontrado.');
            } else {
                setError('Error al consultar membresía.');
            }
            console.error('Error checking membership:', err);
        }
    };

    return (
        <div className={`patient-check-container ${patientInfo && patientInfo.is_expired ? 'expired-background' : ''}`}>
            <h2>Consulta de Membresía</h2>
            <form onSubmit={checkMembership}>
                <div className="mb-3">
                    <label htmlFor="patientDni" className="form-label">Ingresa tu DNI</label>
                    <input type="text" className="form-control" id="patientDni" value={dni} onChange={handleDniChange} required />
                </div>
                <button type="submit" className="btn btn-primary">Consultar</button>
            </form>

            {error && <div className="alert alert-danger mt-3">{error}</div>}

            {patientInfo && (
                <div className="mt-4 p-4 border rounded">
                    <h3>Estado de Membresía para {patientInfo.name}</h3>
                    {patientInfo.is_expired ? (
                        <div className="text-danger expired-message">
                            <p>¡Tu membresía ha vencido!</p>
                            <p>Por favor, acércate a la administración para renovar.</p>
                        </div>
                    ) : (
                        <div className="text-success">
                            <p>¡Estás al día con tu membresía!</p>
                            <p>Días restantes: {patientInfo.days_remaining}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default PatientCheck;
