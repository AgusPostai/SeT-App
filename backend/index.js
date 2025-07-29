const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS patients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            dni TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            membership_start_date TEXT NOT NULL,
            membership_duration_days INTEGER NOT NULL
        )`);
        db.run(`CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER,
            amount REAL NOT NULL,
            payment_date TEXT NOT NULL,
            FOREIGN KEY (patient_id) REFERENCES patients(id)
        )`);
    }
});

// API Routes
// Get all patients
app.get('/patients', (req, res) => {
    db.all('SELECT * FROM patients', [], (err, rows) => {
        if (err) {
            res.status(400).json({"error": err.message});
            return;
        }
        res.json({
            "message": "success",
            "data": rows
        });
    });
});

// Get patient by DNI
app.get('/patient/:dni', (req, res) => {
    const dni = req.params.dni;
    db.get('SELECT * FROM patients WHERE dni = ?', [dni], (err, row) => {
        if (err) {
            res.status(400).json({"error": err.message});
            return;
        }
        if (!row) {
            res.status(404).json({"message": "Patient not found"});
            return;
        }

        // Calculate membership status
        const startDate = new Date(row.membership_start_date);
        const durationDays = row.membership_duration_days;
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + durationDays);

        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize today's date to compare only dates

        const isExpired = today > endDate;
        const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

        res.json({
            "message": "success",
            "data": {
                ...row,
                is_expired: isExpired,
                days_remaining: isExpired ? 0 : daysRemaining
            }
        });
    });
});

// Add a new patient
app.post('/patients', (req, res) => {
    const { dni, name, membership_start_date, membership_duration_days } = req.body;
    if (!dni || !name || !membership_start_date || !membership_duration_days) {
        res.status(400).json({"error": "Missing required fields"});
        return;
    }
    db.run(`INSERT INTO patients (dni, name, membership_start_date, membership_duration_days) VALUES (?, ?, ?, ?)`,
        [dni, name, membership_start_date, membership_duration_days],
        function (err) {
            if (err) {
                res.status(400).json({"error": err.message});
                return;
            }
            res.status(201).json({
                "message": "Patient added successfully",
                "patient_id": this.lastID
            });
        }
    );
});

// Add a payment for a patient
app.post('/payments', (req, res) => {
    const { patient_id, amount, payment_date } = req.body;
    if (!patient_id || !amount || !payment_date) {
        res.status(400).json({"error": "Missing required fields"});
        return;
    }
    db.run(`INSERT INTO payments (patient_id, amount, payment_date) VALUES (?, ?, ?)`,
        [patient_id, amount, payment_date],
        function (err) {
            if (err) {
                res.status(400).json({"error": err.message});
                return;
            }
            res.status(201).json({
                "message": "Payment added successfully",
                "payment_id": this.lastID
            });
        }
    );
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Backend server running on http://0.0.0.0:${port}`);
    console.log(`Accessible via your local IP: http://<YOUR_LOCAL_IP_ADDRESS>:${port}`);
});
