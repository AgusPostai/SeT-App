const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Configuration for PostgreSQL connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://se_tu_app_db:hmQUFwQqfoqoDns@se-tu-app-db.flycast:5432/se_tu_app_db?sslmode=disable',
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Function to create tables if they don't exist
const createTables = async () => {
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS patients (
                id SERIAL PRIMARY KEY,
                dni TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                membership_start_date DATE NOT NULL,
                membership_duration_days INTEGER NOT NULL
            )
        `);
        await client.query(`
            CREATE TABLE IF NOT EXISTS payments (
                id SERIAL PRIMARY KEY,
                patient_id INTEGER,
                amount NUMERIC(10, 2) NOT NULL,
                payment_date DATE NOT NULL,
                FOREIGN KEY (patient_id) REFERENCES patients(id)
            )
        `);
        console.log('Tables are successfully created or already exist.');
    } catch (err) {
        console.error('Error creating tables:', err.stack);
    } finally {
        client.release();
    }
};

// API Routes
// Get all patients
app.get('/patients', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM patients');
        res.json({
            "message": "success",
            "data": result.rows
        });
    } catch (err) {
        res.status(500).json({"error": err.message});
    }
});

// Get patient by DNI
app.get('/patient/:dni', async (req, res) => {
    const { dni } = req.params;
    try {
        const result = await pool.query('SELECT * FROM patients WHERE dni = $1', [dni]);
        const patient = result.rows[0];

        if (!patient) {
            return res.status(404).json({"message": "Patient not found"});
        }

        const startDate = new Date(patient.membership_start_date);
        const durationDays = patient.membership_duration_days;
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + durationDays);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const isExpired = today > endDate;
        const daysRemaining = isExpired ? 0 : Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

        res.json({
            "message": "success",
            "data": {
                ...patient,
                is_expired: isExpired,
                days_remaining: daysRemaining
            }
        });
    } catch (err) {
        res.status(500).json({"error": err.message});
    }
});

// Add a new patient
app.post('/patients', async (req, res) => {
    const { dni, name, membership_start_date, membership_duration_days } = req.body;
    if (!dni || !name || !membership_start_date || !membership_duration_days) {
        return res.status(400).json({"error": "Missing required fields"});
    }
    try {
        const result = await pool.query(
            'INSERT INTO patients (dni, name, membership_start_date, membership_duration_days) VALUES ($1, $2, $3, $4) RETURNING id',
            [dni, name, membership_start_date, membership_duration_days]
        );
        res.status(201).json({
            "message": "Patient added successfully",
            "patient_id": result.rows[0].id
        });
    } catch (err) {
        res.status(400).json({"error": err.message});
    }
});

// Add a payment for a patient
app.post('/payments', async (req, res) => {
    const { patient_id, amount, payment_date } = req.body;
    if (!patient_id || !amount || !payment_date) {
        return res.status(400).json({"error": "Missing required fields"});
    }
    try {
        const result = await pool.query(
            'INSERT INTO payments (patient_id, amount, payment_date) VALUES ($1, $2, $3) RETURNING id',
            [patient_id, amount, payment_date]
        );
        res.status(201).json({
            "message": "Payment added successfully",
            "payment_id": result.rows[0].id
        });
    } catch (err) {
        res.status(400).json({"error": err.message});
    }
});

// Start the server
app.listen(port, '0.0.0.0', async () => {
    await createTables();
    console.log(`Backend server running on http://0.0.0.0:${port}`);
});