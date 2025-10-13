// app.js
const express = require("express");
const path = require("path");
const mysql = require("mysql2"); // added for MySQL

const app = express();
const PORT = process.env.PORT || 800;

// Middleware to parse URL-encoded bodies (from forms)
app.use(express.urlencoded({ extended: true }));

// Serve static files (CSS, JS, images) from 'static' folder
app.use('/static', express.static(path.join(__dirname, 'static')));

// Set Pug as the view engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// ✅ MySQL Connection Setup
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',          // your MySQL username
    password: 'password',          // your MySQL password (if any)
    database: 'saree_center' // database name you created
});

db.connect((err) => {
    if (err) {
        console.error('❌ Database connection failed:', err);
    } else {
        console.log('✅ Connected to MySQL database.');
    }
});

// ---------------- ROUTES ----------------

// Home + default
app.get(['/', '/home'], (req, res) => {
    res.status(200).render('index.pug', { title: 'Saree Center' });
});

// Pages
app.get('/contact', (req, res) => {
    res.status(200).render('contact.pug', { title: 'Saree Center' });
});

app.get('/services', (req, res) => {
    res.status(200).render('service.pug', { title: 'Saree Center' });
});

app.get('/about', (req, res) => {
    res.status(200).render('about.pug', { title: 'Saree Center' });
});

app.get('/traditional', (req, res) => {
    res.status(200).render('traditional.pug', { title: 'Saree Center' });
});

app.get('/bridal', (req, res) => {
    res.status(200).render('bridal.pug', { title: 'Saree Center' });
});

app.get('/handloom', (req, res) => {
    res.status(200).render('handloom.pug', { title: 'Saree Center' });
});

// ✅ Handle contact form submissions (save to MySQL)
app.post('/contact', (req, res) => {
    const { nam, locality, mobile, ambition } = req.body;

    const sql = 'INSERT INTO contacts (nam, locality, mobile,choice) VALUES (?, ?, ?, ?)';
    const values = [nam, locality, mobile, ambition];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('❌ Error inserting data:', err);
            return res.status(500).render('index.pug', {
                title: 'Saree Center',
                message: '❌ Something went wrong while saving your data.'
            });
        }

        console.log('✅ Data inserted successfully:', result);
        res.status(200).render('index.pug', {
            title: 'Saree Center',
            message: '✅ Form submitted successfully and saved to database!'
        });
    });
});

// ✅ Optional: View all saved contacts
app.get('/contacts', (req, res) => {
    db.query('SELECT * FROM contacts', (err, results) => {
        if (err) {
            console.error('❌ Error fetching contacts:', err);
            return res.status(500).send('Database error');
        }
        res.render('contact-list.pug', { title: 'All Contacts', contacts: results });
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
