/* ============================================================
   XYZ Saree Centre — main client JS
   • Hero image slider
   • Scroll-reveal animations
   • Cart (localStorage) — add, remove, update qty, badge
   • Payment tab switcher
   • Navbar active-link highlight
   • Card / expiry format masking
   ============================================================ */

/* ── Cart helpers (shared across all pages) ─────────────────── */
const Cart = {
    KEY: 'xyz_cart',

    getAll() {
        try { return JSON.parse(localStorage.getItem(this.KEY)) || []; }
        catch { return []; }
    },

    save(items) {
        localStorage.setItem(this.KEY, JSON.stringify(items));
    },

    add(name, price) {
        const items = this.getAll();
        const existing = items.find(i => i.name === name);
        if (existing) {
            existing.qty += 1;
        } else {
            items.push({ name, price: parseFloat(price), qty: 1 });
        }
        this.save(items);
    },

    remove(name) {
        this.save(this.getAll().filter(i => i.name !== name));
    },

    updateQty(name, qty) {
        const items = this.getAll();
        const item = items.find(i => i.name === name);
        if (item) {
            item.qty = Math.max(1, qty);
            this.save(items);
        }
    },

    total() {
        return this.getAll().reduce((s, i) => s + i.price * i.qty, 0);
    },

    count() {
        return this.getAll().reduce((s, i) => s + i.qty, 0);
    },

    clear() {
        localStorage.removeItem(this.KEY);
    }
};

/* ── User phone (stored after checkout for profile/orders) ──── */
const UserPhone = {
    KEY: 'xyz_user_phone',
    get()      { return localStorage.getItem(this.KEY) || ''; },
    set(phone) { if (phone) localStorage.setItem(this.KEY, phone); },
    clear()    { localStorage.removeItem(this.KEY); }
};

/* ── Update navbar badge ──────────────────────────────────── */
function updateBadge() {
    const badge = document.getElementById('cartBadge');
    if (!badge) return;
    const count = Cart.count();
    badge.textContent = count;
    badge.style.display = count === 0 ? 'none' : 'inline-flex';
    // bump animation
    badge.classList.add('bump');
    setTimeout(() => badge.classList.remove('bump'), 300);
}

document.addEventListener('DOMContentLoaded', () => {

    // ── 1. Navbar: mark active link ────────────────────────────
    const currentPath = window.location.pathname;
    document.querySelectorAll('.navbar ul li a').forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });

    // ── 1b. Wire Profile nav button with saved phone ────────────
    const profileBtn = document.getElementById('profileNavBtn');
    if (profileBtn) {
        const savedPhone = UserPhone.get();
        if (savedPhone) {
            profileBtn.href = `/profile?phone=${encodeURIComponent(savedPhone)}`;
            const label = document.getElementById('profileNavLabel');
            if (label) label.textContent = ' My Profile';
        }
    }

    // ── 1c. Save phone from URL after checkout redirect ─────────
    const urlParams = new URLSearchParams(window.location.search);
    const phoneFromUrl = urlParams.get('phone');
    if (phoneFromUrl) {
        UserPhone.set(phoneFromUrl);
        // Also pre-fill profile/my-orders lookup forms if present
        const phoneInput = document.querySelector('#phoneForm input[name="phone"]');
        if (phoneInput && !phoneInput.value) phoneInput.value = phoneFromUrl;
    }

    // ── 1d. Auto-fill lookup forms with saved phone ─────────────
    const phoneInput = document.querySelector('#phoneForm input[name="phone"]');
    if (phoneInput && !phoneInput.value) {
        const saved = UserPhone.get();
        if (saved) phoneInput.value = saved;
    }

    // Initial badge render
    updateBadge();

    // ── 2. Hero Slider ─────────────────────────────────────────
    const slides = document.querySelectorAll('.hero-slide');
    const dots   = document.querySelectorAll('.hero-dot');

    if (slides.length) {
        let current = 0;

        function goTo(n) {
            slides[current].classList.remove('active');
            dots[current]?.classList.remove('active');
            current = (n + slides.length) % slides.length;
            slides[current].classList.add('active');
            dots[current]?.classList.add('active');
        }

        let timer = setInterval(() => goTo(current + 1), 5000);

        dots.forEach(dot => {
            dot.addEventListener('click', () => {
                clearInterval(timer);
                goTo(parseInt(dot.dataset.index, 10));
                timer = setInterval(() => goTo(current + 1), 5000);
            });
        });
    }

    // ── 3. Scroll-reveal ───────────────────────────────────────
    const revealEls = document.querySelectorAll('.reveal');

    if (revealEls.length && 'IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12 });
        revealEls.forEach(el => io.observe(el));
    } else {
        revealEls.forEach(el => el.classList.add('visible'));
    }

    // ── 4. Add-to-Cart (product pages) ────────────────────────
    const toast = document.getElementById('cartToast');

    document.querySelectorAll('.btn-cart').forEach(btn => {
        btn.addEventListener('click', () => {
            const name  = btn.dataset.name  || 'Item';
            const price = btn.dataset.price || '0';

            Cart.add(name, price);
            updateBadge();

            if (toast) {
                toast.textContent = `✅ "${name}" added to cart!`;
                toast.classList.add('show');
                setTimeout(() => toast.classList.remove('show'), 2800);
            }
        });
    });

    // ── 5. Cart Page logic ─────────────────────────────────────
    const cartContainer = document.getElementById('cartItems');
    const cartEmpty     = document.getElementById('cartEmpty');
    const cartTotalEl   = document.getElementById('cartTotal');
    const cartCountEl   = document.getElementById('cartCount');

    if (cartContainer) {
        renderCart();
    }

    function renderCart() {
        const items = Cart.getAll();
        cartContainer.innerHTML = '';

        if (!items.length) {
            cartEmpty.style.display    = 'block';
            cartContainer.style.display = 'none';
            if (cartTotalEl) cartTotalEl.textContent = '₹ 0';
            if (cartCountEl) cartCountEl.textContent = '0 items';
            return;
        }

        cartEmpty.style.display    = 'none';
        cartContainer.style.display = 'block';

        items.forEach(item => {
            const row = document.createElement('div');
            row.className = 'cart-row';
            row.innerHTML = `
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">₹ ${item.price.toLocaleString('en-IN')}</div>
                <div class="cart-item-qty">
                    <button class="qty-btn" data-action="dec" data-name="${item.name}">−</button>
                    <span class="qty-val">${item.qty}</span>
                    <button class="qty-btn" data-action="inc" data-name="${item.name}">+</button>
                </div>
                <div class="cart-item-subtotal">₹ ${(item.price * item.qty).toLocaleString('en-IN')}</div>
                <button class="cart-remove" data-name="${item.name}" title="Remove">✕</button>
            `;
            cartContainer.appendChild(row);
        });

        // Qty controls
        cartContainer.querySelectorAll('.qty-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const name = btn.dataset.name;
                const itm  = Cart.getAll().find(i => i.name === name);
                if (!itm) return;
                const newQty = btn.dataset.action === 'inc' ? itm.qty + 1 : itm.qty - 1;
                if (newQty < 1) {
                    Cart.remove(name);
                } else {
                    Cart.updateQty(name, newQty);
                }
                updateBadge();
                renderCart();
            });
        });

        // Remove buttons
        cartContainer.querySelectorAll('.cart-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                Cart.remove(btn.dataset.name);
                updateBadge();
                renderCart();
            });
        });

        // Update totals
        const total = Cart.total();
        const count = Cart.count();
        if (cartTotalEl) cartTotalEl.textContent = `₹ ${total.toLocaleString('en-IN')}`;
        if (cartCountEl) cartCountEl.textContent = `${count} item${count !== 1 ? 's' : ''}`;
    }

    // Clear cart button
    const clearBtn = document.getElementById('clearCartBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            Cart.clear();
            updateBadge();
            renderCart();
        });
    }

    // ── 6. Payment tab switcher ────────────────────────────────
    const payTabs = document.querySelectorAll('.pay-tab input[type="radio"]');

    function showPaySection(value) {
        ['card-fields', 'upi-fields', 'cod-fields'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
        const map = { card: 'card-fields', upi: 'upi-fields', cod: 'cod-fields' };
        const target = document.getElementById(map[value]);
        if (target) target.style.display = 'block';
    }

    if (payTabs.length) {
        const checked = document.querySelector('.pay-tab input[type="radio"]:checked');
        if (checked) showPaySection(checked.value);
        payTabs.forEach(radio => {
            radio.addEventListener('change', () => showPaySection(radio.value));
        });
    }

    // ── 7. Card number formatting ──────────────────────────────
    const cardInput = document.querySelector('input[name="card_number"]');
    if (cardInput) {
        cardInput.addEventListener('input', () => {
            let v = cardInput.value.replace(/\D/g, '').slice(0, 16);
            cardInput.value = v.match(/.{1,4}/g)?.join(' ') || v;
        });
    }

    // ── 8. Card expiry formatting ──────────────────────────────
    const expiryInput = document.querySelector('input[name="card_expiry"]');
    if (expiryInput) {
        expiryInput.addEventListener('input', () => {
            let v = expiryInput.value.replace(/\D/g, '').slice(0, 4);
            if (v.length >= 3) v = v.slice(0, 2) + ' / ' + v.slice(2);
            expiryInput.value = v;
        });
    }

});
