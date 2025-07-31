
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// --- Database Setup ---
const db = new sqlite3.Database('./data/database.db', (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

const createTables = () => {
    db.serialize(() => {
        // Tabla de Pacientes
        db.run(`
            CREATE TABLE IF NOT EXISTS patients (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                dni TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                membership_start_date DATE NOT NULL,
                membership_end_date DATE NOT NULL
            )
        `);

        // Tabla de Pagos
        db.run(`
            CREATE TABLE IF NOT EXISTS payments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_id INTEGER,
                amount NUMERIC(10, 2) NOT NULL,
                payment_date DATE NOT NULL,
                FOREIGN KEY (patient_id) REFERENCES patients(id)
            )
        `);
        console.log('Tables checked/created successfully.');
    });
};

createTables();

// --- Middleware ---
app.use(cors());
app.use(express.json());


// --- API Routes ---

// Get patient by DNI (for public check-in)
app.get('/patient/:dni', (req, res) => {
    const { dni } = req.params;
    db.get(`SELECT *, JULIANDAY(membership_end_date) - JULIANDAY('now') as days_remaining FROM patients WHERE dni = ?`, [dni], (err, patient) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!patient) {
            return res.status(404).json({ message: "Patient not found" });
        }
        const isExpired = patient.days_remaining < 0;
        res.json({
            message: "success",
            data: {
                ...patient,
                is_expired: isExpired,
                days_remaining: isExpired ? 0 : Math.floor(patient.days_remaining)
            }
        });
    });
});

// Get all patients (now public)
app.get('/patients', (req, res) => {
    db.all('SELECT * FROM patients ORDER BY id DESC', (err, rows) => {
        if (err) {
            return res.status(500).json({"error": err.message});
        }
        res.json({
            "message": "success",
            "data": rows
        });
    });
});

// Add a new patient (now public)
app.post('/patients', (req, res) => {
    const { dni, name, lastname, membership_start_date, membership_end_date } = req.body;

    if (!dni || !name || !lastname || !membership_start_date || !membership_end_date) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    const fullName = `${name} ${lastname}`;

    db.run(
        'INSERT INTO patients (dni, name, membership_start_date, membership_end_date) VALUES (?, ?, ?, ?)',
        [dni, fullName, membership_start_date, membership_end_date],
        function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(409).json({ error: 'El DNI ya se encuentra registrado.' });
                } else {
                    console.error('Database error:', err.message);
                    return res.status(500).json({ error: 'Ocurrió un error inesperado al agregar el paciente.', details: err.message });
                }
            }
            res.status(201).json({
                message: 'Patient added successfully',
                patient_id: this.lastID
            });
        }
    );
});

// Add a payment for a patient (now public)
app.post('/payments', (req, res) => {
    const { dni, amount, payment_date } = req.body;
    if (!dni || !amount || !payment_date) {
        return res.status(400).json({"error": "Missing required fields"});
    }
    db.get('SELECT id FROM patients WHERE dni = ?', [dni], (err, patient) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!patient) {
            return res.status(404).json({ error: 'Patient with that DNI not found' });
        }
        const patient_id = patient.id;
        db.run(
            'INSERT INTO payments (patient_id, amount, payment_date) VALUES (?, ?, ?)',
            [patient_id, amount, payment_date],
            function(err) {
                if (err) {
                    return res.status(400).json({"error": err.message});
                }
                res.status(201).json({
                    "message": "Payment added successfully",
                    "payment_id": this.lastID
                });
            }
        );
    });
});


// --- Start Server ---
app.listen(port, '::', () => {
    console.log(`Backend server running on http://0.0.0.0:${port}`);
});
