// server.js
const express = require('express');
const mysql = require('mysql2'); // Para MySQL o MariaDB
const cors = require('cors');

const app = express();
app.use(cors()); // Permite solicitudes de diferentes dominios
app.use(express.json()); // Permite recibir datos en formato JSON

// Conexión a la base de datos
const db = mysql.createConnection({
    host: 'localhost', // Cambia esto a tu host de DB
    user: 'root',
    password: 'Diego',
    database: 'MED_db',
});

db.connect((err) => {
    if (err) throw err;
    console.log('Conectado a la base de datos');
});

// Endpoint para obtener todos los usuarios
app.get('/api/usuarios', (req, res) => {
    db.query('SELECT * FROM Usuario', (error, results) => {
        if (error) return res.status(500).json({ error });
        res.json(results);
    });
});

// Endpoint para crear un nuevo usuario
app.post('/api/usuarios', (req, res) => {
    const { nombre, email, contraseña } = req.body;
    const query = 'INSERT INTO Usuario (nombre, email, contraseña) VALUES (?, ?, ?)';
    db.query(query, [nombre, email, contraseña], (error, results) => {
        if (error) return res.status(500).json({ error });
        res.json({ message: 'Usuario creado', id: results.insertId });
    });
});

// Inicia el servidor en el puerto 5000
app.listen(5000, () => {
    console.log('Servidor corriendo en http://localhost:5000');
});