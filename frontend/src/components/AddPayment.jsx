
import React, { useState } from 'react';
import axios from 'axios';

function AddPayment() {
    const [payment, setPayment] = useState({
        dni: '',
        amount: '',
        payment_date: ''
    });

    const handleChange = (e) => {
        setPayment({ ...payment, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Use environment variable for API URL
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        try {
            await axios.post(`${apiUrl}/payments`, payment, {
                headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
            });
            alert('Pago registrado exitosamente!');
            setPayment({ dni: '', amount: '', payment_date: '' });
        } catch (error) {
            console.error('Error adding payment:', error);
            alert('Error al registrar pago. Verifique que el DNI del paciente exista.');
        }
    };

    return (
        <div className="row justify-content-center">
            <div className="col-md-8">
                <h3>Registrar Pago</h3>
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="dni" className="form-label">DNI Paciente</label>
                        <input type="text" className="form-control" id="dni" name="dni" value={payment.dni} onChange={handleChange} required />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="amount" className="form-label">Monto</label>
                        <input type="number" step="0.01" className="form-control" id="amount" name="amount" value={payment.amount} onChange={handleChange} required />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="payment_date" className="form-label">Fecha de Pago</label>
                        <input type="date" className="form-control" id="payment_date" name="payment_date" value={payment.payment_date} onChange={handleChange} required />
                    </div>
                    <button type="submit" className="btn btn-info">Registrar Pago</button>
                </form>
            </div>
        </div>
    );
}

export default AddPayment;
