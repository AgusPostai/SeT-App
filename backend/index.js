
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key'; // ¡Cambia esto en producción!

app.use(cors());
app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://se_tu_app_db:hmQUFwQqfoqoDns@se-tu-app-db.flycast:5432/se_tu_app_db?sslmode=disable',
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

const createTables = async () => {
    const client = await pool.connect();
    try {
        // Tabla de Usuarios
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL
            )
        `);

        // Tabla de Pacientes Modificada
        await client.query(`
            CREATE TABLE IF NOT EXISTS patients (
                id SERIAL PRIMARY KEY,
                dni TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                membership_start_date DATE NOT NULL,
                membership_end_date DATE NOT NULL
            )
        `);

        // Tabla de Pagos (sin cambios)
        await client.query(`
            CREATE TABLE IF NOT EXISTS payments (
                id SERIAL PRIMARY KEY,
                patient_id INTEGER,
                amount NUMERIC(10, 2) NOT NULL,
                payment_date DATE NOT NULL,
                FOREIGN KEY (patient_id) REFERENCES patients(id)
            )
        `);
        console.log('Tables checked/created successfully.');
    } catch (err) {
        console.error('Error creating tables:', err.stack);
    } finally {
        client.release();
    }
};

// Middleware de autenticación
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// --- Rutas de Autenticación ---
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id',
            [username, hashedPassword]
        );
        res.status(201).json({ message: 'User created successfully', userId: result.rows[0].id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        const user = result.rows[0];
        if (!user) {
            return res.status(400).json({ error: 'Cannot find user' });
        }
        if (await bcrypt.compare(password, user.password_hash)) {
            const accessToken = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: '24h' });
            res.json({ accessToken: accessToken });
        } else {
            res.status(401).json({ error: 'Not Allowed' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// --- Rutas Públicas ---

// Get patient by DNI (para el fichaje)
app.get('/patient/:dni', async (req, res) => {
    const { dni } = req.params;
    try {
        const result = await pool.query('SELECT *, membership_end_date - CURRENT_DATE as days_remaining FROM patients WHERE dni = $1', [dni]);
        const patient = result.rows[0];

        if (!patient) {
            return res.status(404).json({ message: "Patient not found" });
        }

        const isExpired = patient.days_remaining < 0;

        res.json({
            message: "success",
            data: {
                ...patient,
                is_expired: isExpired,
                days_remaining: isExpired ? 0 : patient.days_remaining
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// --- Rutas Protegidas ---

// Get all patients
app.get('/patients', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM patients ORDER BY id DESC');
        res.json({
            "message": "success",
            "data": result.rows
        });
    } catch (err) {
        res.status(500).json({"error": err.message});
    }
});

// Add a new patient (modificado)
app.post('/patients', authenticateToken, async (req, res) => {
    const { dni, name, membership_start_date, membership_end_date } = req.body;
    if (!dni || !name || !membership_start_date || !membership_end_date) {
        return res.status(400).json({"error": "Missing required fields"});
    }
    try {
        const result = await pool.query(
            'INSERT INTO patients (dni, name, membership_start_date, membership_end_date) VALUES ($1, $2, $3, $4) RETURNING id',
            [dni, name, membership_start_date, membership_end_date]
        );
        res.status(201).json({
            "message": "Patient added successfully",
            "patient_id": result.rows[0].id
        });
    } catch (err) {
        res.status(400).json({"error": err.message});
    }
});

// Add a payment for a patient (modificado)
app.post('/payments', authenticateToken, async (req, res) => {
    const { dni, amount, payment_date } = req.body;
    if (!dni || !amount || !payment_date) {
        return res.status(400).json({"error": "Missing required fields"});
    }
    try {
        // Primero, encontrar el ID del paciente a partir del DNI
        const patientResult = await pool.query('SELECT id FROM patients WHERE dni = $1', [dni]);
        if (patientResult.rows.length === 0) {
            return res.status(404).json({ error: 'Patient with that DNI not found' });
        }
        const patient_id = patientResult.rows[0].id;

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
