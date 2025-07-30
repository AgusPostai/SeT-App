const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/database.db', (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key'; // ¡Cambia esto en producción!

app.use(cors());
app.use(express.json());

const createTables = () => {
    db.serialize(() => {
        // Tabla de Usuarios
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL
            )
        `);

        // Tabla de Pacientes Modificada
        db.run(`
            CREATE TABLE IF NOT EXISTS patients (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                dni TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                membership_start_date DATE NOT NULL,
                membership_end_date DATE NOT NULL
            )
        `);

        // Tabla de Pagos (sin cambios)
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
        db.run('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username, hashedPassword], function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ message: 'User created successfully', userId: this.lastID });
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!user) {
            return res.status(400).json({ error: 'Cannot find user' });
        }
        if (await bcrypt.compare(password, user.password_hash)) {
            const accessToken = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: '24h' });
            res.json({ accessToken: accessToken });
        } else {
            res.status(401).json({ error: 'Not Allowed' });
        }
    });
});


// --- Rutas Públicas ---

// Get patient by DNI (para el fichaje)
app.get('/patient/:dni', (req, res) => {
    const { dni } = req.params;
    db.get('SELECT *, JULIANDAY(membership_end_date) - JULIANDAY(\'now\') as days_remaining FROM patients WHERE dni = ?', [dni], (err, patient) => {
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


// --- Rutas Protegidas ---

// Get all patients
app.get('/patients', authenticateToken, (req, res) => {
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

// Add a new patient (modificado)
app.post('/patients', authenticateToken, (req, res) => {
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

// Add a payment for a patient (modificado)
app.post('/payments', authenticateToken, (req, res) => {
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


// Start the server
app.listen(port, '::', () => {
    console.log(`Backend server running on http://0.0.0.0:${port}`);
});