# SARASWATI Saree Centre 

A full-stack **Node.js / Express** web application for an Indian saree retail business. Built with **Pug** templates, **MySQL** database, and vanilla JS for client-side interactivity.

---

## ✨ Features

| Feature | Details |
|---|---|
| **Hero Slider** | Auto-rotating 4-image banner with dot navigation |
| **Collections** | Bridal, Traditional & Handloom product galleries |
| **Shopping Cart** | Add / remove / update quantity, persisted in `localStorage` |
| **Cart Badge** | Live item count on the navbar cart icon |
| **Checkout** | Delivery address + 3 payment modes (Card, UPI, Cash on Delivery) |
| **Order Tracking** | Visual 5-step progress tracker searched by Order ID |
| **My Orders** | View all past orders linked to a mobile number |
| **My Profile** | View saved delivery details and order count by mobile number |
| **Contact Form** | Saves enquiries to MySQL |
| **Scroll Animations** | Elements fade-up as you scroll (IntersectionObserver) |
| **Responsive Design** | Flexbox / wrapping layouts for mobile & desktop |

---

## 🗂 Project Structure

```
saree/
├── app.js                  # Express server + all routes
├── package.json
├── views/                  # Pug templates
│   ├── demo.pug            # Base layout (navbar + footer)
│   ├── index.pug           # Homepage (hero slider + collections)
│   ├── about.pug           # About + timeline
│   ├── service.pug         # Services
│   ├── bridal.pug          # Bridal collection
│   ├── traditional.pug     # Traditional sarees
│   ├── handloom.pug        # Handloom sarees
│   ├── contact.pug         # Contact form
│   ├── cart.pug            # Shopping cart
│   ├── checkout.pug        # Payment / checkout
│   ├── order-tracking.pug  # Order tracking
│   ├── my-orders.pug       # Order history (by phone)
│   └── profile.pug         # User profile (by phone)
└── static/                 # CSS, JS, images
    ├── style.css            # Global styles (navbar, footer, vars)
    ├── home.css             # Hero slider + homepage sections
    ├── about.css            # About page + timeline
    ├── service.css          # Services page
    ├── common.css           # Product cards + cart toast
    ├── contact.css          # Contact page
    ├── cart.css             # Cart page
    ├── payment.css          # Checkout / payment page
    ├── tracking.css         # Order tracking page
    ├── profile.css          # Profile & My Orders pages
    └── index.js             # All client-side JS
```

---

## 🚀 Getting Started

### 1. Prerequisites

- [Node.js](https://nodejs.org) v18 or higher
- MySQL running locally on port 3306

### 2. Create the database

Open MySQL and run:

```sql
CREATE DATABASE IF NOT EXISTS saree_center;
```

> The app auto-creates the `contacts`, `orders`, and `users` tables on first start.

### 3. Configure your MySQL credentials

Open [`app.js`](app.js) and update your credentials:

```js
const db = mysql.createConnection({
    host:     'localhost',
    user:     'root',
    password: 'your_password',   // ← update this
    database: 'saree_center'
});
```

### 4. Install dependencies

```bash
npm install
```

### 5. Run the server

```bash
# Development (auto-restarts on save)
npm run dev

# Production
npm start
```

### 6. Open in browser

```
http://localhost:800
```

---

## 🌐 All Routes

| Method | URL | Description |
|---|---|---|
| GET | `/` | Homepage with hero slider |
| GET | `/about` | About page + timeline |
| GET | `/services` | Services offered |
| GET | `/bridal` | Bridal saree collection |
| GET | `/traditional` | Traditional sarees |
| GET | `/handloom` | Handloom sarees |
| GET | `/contact` | Contact form |
| POST | `/contact` | Save contact enquiry to DB |
| GET | `/cart` | Shopping cart (localStorage-based) |
| GET | `/checkout` | Checkout / payment page |
| POST | `/checkout` | Place order → save to DB → redirect to tracker |
| GET | `/order-tracking` | Track order by Order ID |
| GET | `/my-orders?phone=` | View all orders for a mobile number |
| GET | `/profile?phone=` | View saved profile for a mobile number |
| GET | `/contacts` | (Admin) View all contact enquiries as JSON |

---

## 🛒 How the Cart Works

The cart is entirely **client-side** using `localStorage` — no login required.

1. Browse any collection page (Bridal / Traditional / Handloom)
2. Click **Add to Cart** on any product — it's saved to `localStorage`
3. The navbar **🛒 Cart** badge updates live with item count
4. Visit `/cart` to see all items, adjust quantities, or remove items
5. Click **Proceed to Checkout** to go to the payment page

Cart data persists across page reloads and browser sessions until cleared.

---

## 💳 Payment Methods

On the checkout page three methods are available:

| Method | Details |
|---|---|
| 💳 Credit / Debit Card | Card number (auto-formatted), expiry (MM/YY), CVV |
| 📱 UPI | UPI ID field (e.g. `name@upi`) |
| 📦 Cash on Delivery | Pay on arrival; ₹49 handling charge |

After placing an order you are redirected to the **Order Tracking** page with your Order ID pre-filled and quick links to **My Orders** and **My Profile**.

---

## 📦 Order Tracking

1. Go to `/order-tracking` (or click **Track Order** in the navbar)
2. Enter your Order ID (format: `XYZ-XXXXXX`)
3. See a **5-step visual progress bar**: Order Placed → Confirmed → Shipped → Out for Delivery → Delivered

---

## 👤 Profile & Order History

These features work without any login system — your **mobile number** is the identifier.

### How it works
1. Place an order at `/checkout` — your name, address, city, PIN and phone are saved automatically to the `users` table.
2. After placing the order you are redirected to Order Tracking. The navbar **Profile** button is wired to your phone automatically (saved in `localStorage`).
3. Visit `/profile?phone=YOUR_NUMBER` to see your saved delivery details and total order count.
4. Visit `/my-orders?phone=YOUR_NUMBER` to see every order you've placed with status badges and tracking links.

> **Tip:** On any profile/orders page the mobile field is pre-filled from `localStorage` — just hit **View Orders** or **View Profile** without typing.

---

## 🗃 Database Schema

```sql
-- Contact enquiries
CREATE TABLE contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nam VARCHAR(100),
    locality VARCHAR(150),
    mobile VARCHAR(20),
    choice VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders placed via checkout
CREATE TABLE orders (
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
);

-- User profiles (auto-created/updated on every checkout)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phone VARCHAR(20) UNIQUE NOT NULL,
    full_name VARCHAR(100),
    address TEXT,
    city VARCHAR(100),
    pincode VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express 5 |
| Templates | Pug 3 |
| Database | MySQL 2 |
| Styling | Vanilla CSS (CSS variables, flexbox, animations) |
| Client JS | Vanilla JS (localStorage, IntersectionObserver) |

---

## 📄 License

ISC — © 2024 Abhinandan Kumar / SARASWATI Saree Centre
