import React, { useState, useEffect } from 'react';
import axios from 'axios';

function AdminDashboard() {
    const [patients, setPatients] = useState([]);
    const [newPatient, setNewPatient] = useState({
        dni: '',
        name: '',
        membership_start_date: '',
        membership_duration_days: ''
    });
    const [newPayment, setNewPayment] = useState({
        patient_id: '',
        amount: '',
        payment_date: ''
    });

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        try {
            const response = await axios.get('http://192.168.100.17:3000/patients');
            setPatients(response.data.data);
        } catch (error) {
            console.error('Error fetching patients:', error);
        }
    };

    const handlePatientChange = (e) => {
        setNewPatient({ ...newPatient, [e.target.name]: e.target.value });
    };

    const handlePatientSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://192.168.100.17:3000/patients', newPatient);
            alert('Paciente agregado exitosamente!');
            setNewPatient({
                dni: '',
                name: '',
                membership_start_date: '',
                membership_duration_days: ''
            });
            fetchPatients();
        } catch (error) {
            console.error('Error adding patient:', error);
            alert('Error al agregar paciente.');
        }
    };

    const handlePaymentChange = (e) => {
        setNewPayment({ ...newPayment, [e.target.name]: e.target.value });
    };

    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://192.168.100.17:3000/payments', newPayment);
            alert('Pago registrado exitosamente!');
            setNewPayment({
                patient_id: '',
                amount: '',
                payment_date: ''
            });
        } catch (error) {
            console.error('Error adding payment:', error);
            alert('Error al registrar pago.');
        }
    };

    return (
        <div className="admin-dashboard">
            <h2>Panel de Administración</h2>

            <div className="row">
                <div className="col-md-6">
                    <h3>Agregar Nuevo Paciente</h3>
                    <form onSubmit={handlePatientSubmit}>
                        <div className="mb-3">
                            <label htmlFor="dni" className="form-label">DNI</label>
                            <input type="text" className="form-control" id="dni" name="dni" value={newPatient.dni} onChange={handlePatientChange} required />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="name" className="form-label">Nombre</label>
                            <input type="text" className="form-control" id="name" name="name" value={newPatient.name} onChange={handlePatientChange} required />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="membership_start_date" className="form-label">Fecha Inicio Membresía</label>
                            <input type="date" className="form-control" id="membership_start_date" name="membership_start_date" value={newPatient.membership_start_date} onChange={handlePatientChange} required />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="membership_duration_days" className="form-label">Duración Membresía (días)</label>
                            <input type="number" className="form-control" id="membership_duration_days" name="membership_duration_days" value={newPatient.membership_duration_days} onChange={handlePatientChange} required />
                        </div>
                        <button type="submit" className="btn btn-primary">Agregar Paciente</button>
                    </form>
                </div>

                <div className="col-md-6">
                    <h3>Registrar Pago</h3>
                    <form onSubmit={handlePaymentSubmit}>
                        <div className="mb-3">
                            <label htmlFor="patient_id" className="form-label">ID Paciente</label>
                            <input type="number" className="form-control" id="patient_id" name="patient_id" value={newPayment.patient_id} onChange={handlePaymentChange} required />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="amount" className="form-label">Monto</label>
                            <input type="number" step="0.01" className="form-control" id="amount" name="amount" value={newPayment.amount} onChange={handlePaymentChange} required />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="payment_date" className="form-label">Fecha de Pago</label>
                            <input type="date" className="form-control" id="payment_date" name="payment_date" value={newPayment.payment_date} onChange={handlePaymentChange} required />
                        </div>
                        <button type="submit" className="btn btn-info">Registrar Pago</button>
                    </form>
                </div>
            </div>

            <h3 className="mt-5">Listado de Pacientes</h3>
            <table className="table table-striped">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>DNI</th>
                        <th>Nombre</th>
                        <th>Inicio Membresía</th>
                        <th>Duración (días)</th>
                    </tr>
                </thead>
                <tbody>
                    {patients.map(patient => (
                        <tr key={patient.id}>
                            <td>{patient.id}</td>
                            <td>{patient.dni}</td>
                            <td>{patient.name}</td>
                            <td>{patient.membership_start_date}</td>
                            <td>{patient.membership_duration_days}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default AdminDashboard;
