
import React, { useState } from 'react';
import axios from 'axios';

function AddPatient() {
    const [patient, setPatient] = useState({
        dni: '',
        name: '',
        membership_start_date: '',
        membership_end_date: ''
    });

    const handleChange = (e) => {
        setPatient({ ...patient, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('https://backend-still-hill-8646.fly.dev/patients', patient, {
                headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
            });
            alert('Paciente agregado exitosamente!');
            setPatient({ dni: '', name: '', membership_start_date: '', membership_end_date: '' });
        } catch (error) {
            console.error('Error adding patient:', error);
            alert('Error al agregar paciente. Verifique que el DNI no esté duplicado.');
        }
    };

    return (
        <div className="row justify-content-center">
            <div className="col-md-8">
                <h3>Agregar Nuevo Paciente</h3>
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="dni" className="form-label">DNI</label>
                        <input type="text" className="form-control" id="dni" name="dni" value={patient.dni} onChange={handleChange} required />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="name" className="form-label">Nombre</label>
                        <input type="text" className="form-control" id="name" name="name" value={patient.name} onChange={handleChange} required />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="membership_start_date" className="form-label">Fecha Inicio Membresía</label>
                        <input type="date" className="form-control" id="membership_start_date" name="membership_start_date" value={patient.membership_start_date} onChange={handleChange} required />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="membership_end_date" className="form-label">Fecha de Vencimiento de la Membresía</label>
                        <input type="date" className="form-control" id="membership_end_date" name="membership_end_date" value={patient.membership_end_date} onChange={handleChange} required />
                    </div>
                    <button type="submit" className="btn btn-primary">Agregar Paciente</button>
                </form>
            </div>
        </div>
    );
}

export default AddPatient;
