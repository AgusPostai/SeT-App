
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function PatientList() {
    const [patients, setPatients] = useState([]);

    useEffect(() => {
        const fetchPatients = async () => {
            try {
                const response = await axios.get('https://backend-still-hill-8646.fly.dev/patients', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
                });
                setPatients(response.data.data);
            } catch (error) {
                console.error('Error fetching patients:', error);
            }
        };
        fetchPatients();
    }, []);

    return (
        <div>
            <h3>Listado de Pacientes</h3>
            <table className="table table-striped">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>DNI</th>
                        <th>Nombre</th>
                        <th>Inicio Membresía</th>
                        <th>Vencimiento Membresía</th>
                    </tr>
                </thead>
                <tbody>
                    {patients.map(patient => (
                        <tr key={patient.id}>
                            <td>{patient.id}</td>
                            <td>{patient.dni}</td>
                            <td>{patient.name}</td>
                            <td>{new Date(patient.membership_start_date).toLocaleDateString()}</td>
                            <td>{new Date(patient.membership_end_date).toLocaleDateString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default PatientList;
