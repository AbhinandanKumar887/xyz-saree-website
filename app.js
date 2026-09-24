// app.js
const express = require("express");
const path = require("path");
const mysql = require("mysql2");

const app = express();
const PORT = process.env.PORT || 800;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Static files
app.use('/static', express.static(path.join(__dirname, 'static')));

// View engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// ── MySQL Connection ───────────────────────────────────────────────────
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'saree_center'
});

db.connect((err) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
    } else {
        console.log('✅ Connected to MySQL database.');
    }
});

// Ensure required tables exist
db.query(`
    CREATE TABLE IF NOT EXISTS contacts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nam VARCHAR(100),
        locality VARCHAR(150),
        mobile VARCHAR(20),
        choice VARCHAR(200),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`, (err) => { if (err) console.error('contacts table error:', err.message); });

db.query(`
    CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id VARCHAR(50) UNIQUE,
        full_name VARCHAR(100),
        address TEXT,
        city VARCHAR(100),
        pincode VARCHAR(10),
        phone VARCHAR(20),
        payment_method VARCHAR(20),
        amount DECIMAL(10,2),
        status VARCHAR(50) DEFAULT 'Order Placed',
        step INT DEFAULT 1,
        placed_date DATE DEFAULT (CURDATE()),
        delivery_date DATE DEFAULT (DATE_ADD(CURDATE(), INTERVAL 7 DAY)),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`, (err) => { if (err) console.error('orders table error:', err.message); });

// Ensure users table exists (phone-based, no passwords)
db.query(`
    CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        phone VARCHAR(20) UNIQUE NOT NULL,
        full_name VARCHAR(100),
        address TEXT,
        city VARCHAR(100),
        pincode VARCHAR(10),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
`, (err) => { if (err) console.error('users table error:', err.message); });

// ── HELPER — generate order ID ─────────────────────────────────────────
function generateOrderId() {
    const ts = Date.now().toString().slice(-6);
    return `XYZ-${ts}`;
}

// ── ROUTES ────────────────────────────────────────────────────────────

// Home
app.get(['/', '/home'], (req, res) => {
    res.render('index', { title: 'Home' });
});

// About
app.get('/about', (req, res) => {
    res.render('about', { title: 'About Us' });
});

// Services
app.get('/services', (req, res) => {
    res.render('service', { title: 'Our Services' });
});

// Contact GET
app.get('/contact', (req, res) => {
    res.render('contact', { title: 'Contact Us' });
});

// Contact POST
app.post('/contact', (req, res) => {
    const { nam, locality, mobile, ambition } = req.body;
    const sql = 'INSERT INTO contacts (nam, locality, mobile, choice) VALUES (?, ?, ?, ?)';

    db.query(sql, [nam, locality, mobile, ambition], (err) => {
        if (err) {
            console.error('❌ Contact insert error:', err.message);
            return res.render('contact', {
                title: 'Contact Us',
                message: '❌ Something went wrong. Please try again.'
            });
        }
        res.render('contact', {
            title: 'Contact Us',
            message: '✅ Thank you! We will get back to you soon.'
        });
    });
});

// Collections
app.get('/traditional', (req, res) => res.render('traditional', { title: 'Traditional Sarees' }));
app.get('/bridal',      (req, res) => res.render('bridal',      { title: 'Bridal Collection' }));
app.get('/handloom',    (req, res) => res.render('handloom',    { title: 'Handloom Sarees' }));

// Cart (items stored client-side in localStorage; this just renders the shell)
app.get('/cart', (req, res) => {
    res.render('cart', { title: 'Your Cart' });
});

// ── CHECKOUT ──────────────────────────────────────────────────────────
app.get('/checkout', (req, res) => {
    res.render('checkout', { title: 'Checkout' });
});

app.post('/checkout', (req, res) => {
    const { full_name, address, city, pincode, phone, payment_method } = req.body;
    const orderId = generateOrderId();
    const amount  = 12599; // static demo amount

    const sql = `INSERT INTO orders
        (order_id, full_name, address, city, pincode, phone, payment_method, amount)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    db.query(sql, [orderId, full_name, address, city, pincode, phone, payment_method, amount], (err) => {
        if (err) {
            console.error('❌ Order insert error:', err.message);
            return res.render('checkout', {
                title: 'Checkout',
                errorMsg: '❌ Could not place order. Please try again.'
            });
        }

        // Upsert user record so profile stays up to date
        db.query(
            `INSERT INTO users (phone, full_name, address, city, pincode)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
               full_name = VALUES(full_name),
               address   = VALUES(address),
               city      = VALUES(city),
               pincode   = VALUES(pincode)`,
            [phone, full_name, address, city, pincode],
            (uErr) => { if (uErr) console.error('⚠️  User upsert error:', uErr.message); }
        );

        // Redirect to tracking with the new order ID and phone so client can save it
        res.redirect(`/order-tracking?order_id=${orderId}&placed=1&phone=${encodeURIComponent(phone)}`);
    });
});

// ── ORDER TRACKING ────────────────────────────────────────────────────
app.get('/order-tracking', (req, res) => {
    const orderId = (req.query.order_id || '').trim();
    const placed  = req.query.placed === '1';
    const phone   = (req.query.phone || '').trim();

    if (!orderId) {
        return res.render('order-tracking', { title: 'Track Order', searched: false, phone });
    }

    db.query('SELECT * FROM orders WHERE order_id = ?', [orderId], (err, rows) => {
        if (err) {
            console.error('❌ Order lookup error:', err.message);
            return res.render('order-tracking', {
                title: 'Track Order',
                orderId,
                searched: true,
                orderData: null,
                phone
            });
        }

        if (!rows.length) {
            return res.render('order-tracking', {
                title: 'Track Order',
                orderId,
                searched: true,
                orderData: null,
                phone
            });
        }

        const row = rows[0];
        // Map status string → step number
        const stepMap = {
            'Order Placed':      1,
            'Confirmed':         2,
            'Shipped':           3,
            'Out for Delivery':  4,
            'Delivered':         5
        };

        const orderData = {
            id:           row.order_id,
            item:         'XYZ Saree Centre Order',
            status:       row.status,
            statusCode:   row.status.toLowerCase().replace(/ /g, '-').replace('order-', ''),
            step:         stepMap[row.status] || 1,
            placedDate:   row.placed_date ? new Date(row.placed_date).toDateString() : 'N/A',
            deliveryDate: row.delivery_date ? new Date(row.delivery_date).toDateString() : 'N/A'
        };

        res.render('order-tracking', {
            title: 'Track Order',
            orderId,
            searched: true,
            orderData,
            justPlaced: placed,
            phone
        });
    });
});

// ── My Orders ────────────────────────────────────────────────────────
app.get('/my-orders', (req, res) => {
    const phone = (req.query.phone || '').trim();

    if (!phone) {
        return res.render('my-orders', { title: 'My Orders', orders: null, phone: '' });
    }

    db.query(
        'SELECT * FROM orders WHERE phone = ? ORDER BY created_at DESC',
        [phone],
        (err, rows) => {
            if (err) {
                console.error('❌ My-orders lookup error:', err.message);
                return res.render('my-orders', { title: 'My Orders', orders: [], phone });
            }

            const stepMap = {
                'Order Placed': 1, 'Confirmed': 2, 'Shipped': 3,
                'Out for Delivery': 4, 'Delivered': 5
            };

            const orders = rows.map(r => ({
                id:           r.order_id,
                status:       r.status,
                statusCode:   r.status.toLowerCase().replace(/ /g, '-').replace('order-', ''),
                step:         stepMap[r.status] || 1,
                amount:       r.amount,
                paymentMethod: r.payment_method,
                placedDate:   r.placed_date ? new Date(r.placed_date).toDateString() : 'N/A',
                deliveryDate: r.delivery_date ? new Date(r.delivery_date).toDateString() : 'N/A'
            }));

            res.render('my-orders', { title: 'My Orders', orders, phone });
        }
    );
});

// ── Profile ───────────────────────────────────────────────────────────
app.get('/profile', (req, res) => {
    const phone = (req.query.phone || '').trim();

    if (!phone) {
        return res.render('profile', { title: 'My Profile', user: null, orderCount: 0, phone: '' });
    }

    db.query('SELECT * FROM users WHERE phone = ?', [phone], (err, rows) => {
        if (err) {
            console.error('❌ Profile lookup error:', err.message);
            return res.render('profile', { title: 'My Profile', user: null, orderCount: 0, phone });
        }

        const user = rows[0] || null;

        db.query(
            'SELECT COUNT(*) AS cnt FROM orders WHERE phone = ?',
            [phone],
            (err2, cnt) => {
                const orderCount = err2 ? 0 : (cnt[0]?.cnt || 0);
                res.render('profile', { title: 'My Profile', user, orderCount, phone });
            }
        );
    });
});

// ── View all contacts (admin) ─────────────────────────────────────────
app.get('/contacts', (req, res) => {
    db.query('SELECT * FROM contacts ORDER BY created_at DESC', (err, results) => {
        if (err) return res.status(500).send('Database error');
        res.json(results);
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
