// cart.js — Brock Interior Designs · v4
// VAT: 15.5% on subtotal | Paynow fee: 2.5% on (subtotal + VAT)

'use strict';

let cart = [];

/* ─── CONSTANTS ─────────────────────────────────────────── */
const VAT_RATE    = 0.155;
const PAYNOW_RATE = 0.025;
const WA_NUMBER   = '263780793585';

/* ─── TOTALS ─────────────────────────────────────────────── */
function calcTotals(method) {
    const subtotal    = cart.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0);
    const vat         = subtotal * VAT_RATE;
    const paynow_fee  = method === 'paynow' ? (subtotal + vat) * PAYNOW_RATE : 0;
    const grand_total = subtotal + vat + paynow_fee;
    return { subtotal, vat, paynow_fee, grand_total };
}

/* ─── PERSISTENCE ────────────────────────────────────────── */
function loadCart() {
    try {
        const saved = localStorage.getItem('brock_cart');
        cart = saved ? JSON.parse(saved) : [];
        if (!Array.isArray(cart)) cart = [];
    } catch (e) { cart = []; }
    updateCartUI();
}

function saveCart() {
    try { localStorage.setItem('brock_cart', JSON.stringify(cart)); } catch (e) {}
    updateCartUI();
}

/* ─── WA QUOTE HELPER ────────────────────────────────────── */
function openWAQuote(name) {
    const msg = encodeURIComponent(
        'Hi Brock Interior Designs! \uD83D\uDC4B\n\n' +
        'I\u2019d like to request a quote for: *' + name + '*\n\n' +
        'Could you please provide pricing and availability?\n\nThank you!'
    );
    window.open('https://wa.me/' + WA_NUMBER + '?text=' + msg, '_blank');
}

/* ─── MUTATIONS ──────────────────────────────────────────── */
function cartAdd(item) {
    if ((item.type || 'product') === 'service') { openWAQuote(item.name); return; }
    const existing = cart.find(i => i.id === item.id);
    if (existing) { existing.qty = (existing.qty || 1) + 1; }
    else          { cart.push({ ...item, qty: 1 }); }
    saveCart();
    showToast('\u2713 ' + item.name + ' added to cart');
}

function cartAddQty(item, qty) {
    if ((item.type || 'product') === 'service') { openWAQuote(item.name); return; }
    qty = parseInt(qty) || 1;
    const existing = cart.find(i => i.id === item.id);
    if (existing) { existing.qty = (existing.qty || 1) + qty; }
    else          { cart.push({ ...item, qty }); }
    saveCart();
    showToast('\u2713 ' + item.name + ' added to cart');
}

function changeQty(index, delta) {
    if (!cart[index]) return;
    const nq = (cart[index].qty || 1) + delta;
    if (nq <= 0) cart.splice(index, 1);
    else         cart[index].qty = nq;
    saveCart();
}

function removeItem(index) { cart.splice(index, 1); saveCart(); }
function clearCart()       { cart = []; saveCart(); }

/* ─── UI ─────────────────────────────────────────────────── */
function updateCartUI() {
    const total = cart.reduce((s, i) => s + (i.qty || 1), 0);
    const t     = calcTotals('whatsapp');

    document.querySelectorAll('#cartCount, .cart-count, #cartFabCount').forEach(el => {
        if (!el) return;
        el.textContent = total;
        el.classList.toggle('visible', total > 0);
    });
    document.querySelectorAll('#cartTotal, .cart-subtotal-val').forEach(el => {
        if (el) el.textContent = '$' + t.subtotal.toFixed(2);
    });
    document.querySelectorAll('#cartItemCount').forEach(el => {
        if (el) el.textContent = total + ' ' + (total === 1 ? 'item' : 'items');
    });
    const cb = document.getElementById('cartClearBtn');
    if (cb) cb.style.display = cart.length ? 'block' : 'none';

    const itemsEl = document.getElementById('cartItems');
    if (!itemsEl) return;

    if (!cart.length) {
        itemsEl.innerHTML = `
            <div class="cart-empty" id="cartEmpty">
                <div class="cart-empty-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                        <line x1="3" y1="6" x2="21" y2="6"/>
                        <path d="M16 10a4 4 0 01-8 0"/>
                    </svg>
                </div>
                <h3>Your cart is empty</h3>
                <p>Browse our curated collection.</p>
                <a href="shop.html" class="cart-empty-cta" onclick="closeCart()">Shop Now</a>
            </div>`;
        const f = document.getElementById('cartFooter');
        if (f) f.style.display = 'none';
        return;
    }

    itemsEl.innerHTML = cart.map((item, idx) => `
        <div class="cart-item">
            <div class="cart-item-img">
                ${item.img
                    ? `<img src="${escHtml(item.img)}" alt="${escHtml(item.name)}" style="width:100%;height:100%;object-fit:cover;" loading="lazy" onerror="this.style.display='none'">`
                    : '<div style="width:100%;height:100%;background:#2a2418;display:flex;align-items:center;justify-content:center;"><span style="color:var(--gold);">\u25C6</span></div>'}
            </div>
            <div class="cart-item-info">
                <div class="cart-item-cat">${escHtml(item.cat || '')}</div>
                <div class="cart-item-name">${escHtml(item.name)}</div>
                <div class="cart-item-price-row">
                    <span class="cart-item-price">$${((item.price || 0) * (item.qty || 1)).toFixed(2)}</span>
                    <div class="cart-qty-ctrl">
                        <button class="cart-qty-btn" onclick="changeQty(${idx},-1)" aria-label="Decrease">\u2212</button>
                        <span class="cart-qty-num">${item.qty || 1}</span>
                        <button class="cart-qty-btn" onclick="changeQty(${idx},1)" aria-label="Increase">+</button>
                    </div>
                </div>
                <button class="cart-item-remove" onclick="removeItem(${idx})">Remove</button>
            </div>
        </div>`).join('');

    const f = document.getElementById('cartFooter');
    if (f) f.style.display = 'block';
}

/* ─── TOAST ──────────────────────────────────────────────── */
function showToast(msg, dur) {
    const el = document.getElementById('cartToast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), dur || 2500);
}

/* ─── DRAWER ─────────────────────────────────────────────── */
function openCart() {
    document.getElementById('cartDrawer')?.classList.add('open');
    document.getElementById('cartOverlay')?.classList.add('open');
    document.body.style.overflow = 'hidden';
}
function closeCart() {
    document.getElementById('cartDrawer')?.classList.remove('open');
    document.getElementById('cartOverlay')?.classList.remove('open');
    document.body.style.overflow = '';
}

/* ─── CHECKOUT ───────────────────────────────────────────── */
window.openCheckout = function () {
    if (!cart.length) { showToast('Your cart is empty', 2000); return; }
    closeCart();
    const ck = document.getElementById('ckSummary');
    if (ck) ck.innerHTML = cart.map(i => `
        <div style="display:flex;gap:12px;align-items:center;padding:8px 0;border-bottom:1px solid var(--ivory-dark);">
            <div style="width:48px;height:60px;background:var(--deep2);flex-shrink:0;overflow:hidden;">
                ${i.img ? `<img src="${escHtml(i.img)}" style="width:100%;height:100%;object-fit:cover;" loading="lazy">` : ''}
            </div>
            <div style="flex:1;min-width:0;">
                <div style="font-family:'Cormorant Garamond',serif;font-size:15px;color:var(--deep);">${escHtml(i.name)}</div>
                <div style="font-size:10px;color:var(--light-mid);">Qty: ${i.qty || 1}</div>
            </div>
            <div style="font-family:'Cormorant Garamond',serif;font-size:16px;color:var(--deep);">$${((i.price||0)*(i.qty||1)).toFixed(2)}</div>
        </div>`).join('');
    updateCheckoutTotals('whatsapp');
    const m = document.getElementById('checkoutModal');
    if (m) { m.style.display = 'block'; document.body.style.overflow = 'hidden'; }
};

function updateCheckoutTotals(method) {
    const t  = calcTotals(method);
    const el = document.getElementById('ckTotalsBreakdown');
    if (!el) return;
    el.innerHTML = `
        <div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--ivory-dark);font-size:13px;"><span style="color:var(--mid);">Subtotal</span><span>$${t.subtotal.toFixed(2)}</span></div>
        <div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--ivory-dark);font-size:13px;"><span style="color:var(--mid);">VAT (15.5%)</span><span>$${t.vat.toFixed(2)}</span></div>
        ${t.paynow_fee > 0 ? `<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--ivory-dark);font-size:13px;"><span style="color:var(--mid);">Paynow fee (2.5%)</span><span>$${t.paynow_fee.toFixed(2)}</span></div>` : ''}
        <div style="display:flex;justify-content:space-between;padding:10px 0;">
            <span style="font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--mid);align-self:center;">Grand Total</span>
            <span style="font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:300;color:var(--deep);">$${t.grand_total.toFixed(2)}</span>
        </div>`;
    const leg = document.getElementById('ckTotal');
    if (leg) leg.textContent = '$' + t.grand_total.toFixed(2);
}

window.closeCheckout = function () {
    const m = document.getElementById('checkoutModal');
    if (m) m.style.display = 'none';
    document.body.style.overflow = '';
};

/* ─── SUPABASE REFS ──────────────────────────────────────── */
const _SB_URL = 'https://ilipyvttomtjyeojkhiy.supabase.co';
const _SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsaXB5dnR0b210anllb2praGl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNTQzMTcsImV4cCI6MjA5NDczMDMxN30.d51V2SEzk4h-tLJe8wE2-WzKlRalbUlMASPl6RtFy8E';

async function saveOrderToSupabase(name, phone, method, notes) {
    const t = calcTotals(method);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000); // 8s timeout
    try {
        await fetch(_SB_URL + '/rest/v1/orders', {
            method: 'POST',
            signal: ctrl.signal,
            headers: { 'apikey': _SB_KEY, 'Authorization': 'Bearer ' + _SB_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
            body: JSON.stringify({
                customer_name: name, phone, notes: notes || null,
                items: JSON.stringify(cart),
                subtotal: +t.subtotal.toFixed(2), vat: +t.vat.toFixed(2),
                paynow_fee: +t.paynow_fee.toFixed(2), grand_total: +t.grand_total.toFixed(2),
                total: +t.grand_total.toFixed(2), payment_method: method,
                order_status: 'new', payment_status: 'pending'
            })
        });
    } catch (e) { console.warn('Order save failed:', e); } finally { clearTimeout(timer); }
}

/* ─── CHECKOUT: WHATSAPP ─────────────────────────────────── */
window.checkoutWhatsApp = function () {
    const submitBtns = document.querySelectorAll('#checkoutModal button');
    submitBtns.forEach(b => b.disabled = true);
    setTimeout(() => submitBtns.forEach(b => b.disabled = false), 4000);
    const name  = (document.getElementById('ckName')?.value  || '').trim();
    const phone = (document.getElementById('ckPhone')?.value || '').trim();
    const notes = (document.getElementById('ckNotes')?.value || '').trim();
    const errEl = document.getElementById('ckError');
    if (!name || !phone) {
        if (errEl) { errEl.textContent = 'Please enter your name and phone number.'; errEl.style.display = 'block'; }
        return;
    }
    if (phone.replace(/[\s\-\+\(\)]/g,'').length < 7) {
        if (errEl) { errEl.textContent = 'Please enter a valid phone number.'; errEl.style.display = 'block'; }
        return;
    }
    if (errEl) errEl.style.display = 'none';
    const t     = calcTotals('whatsapp');
    const lines = cart.map(i => `\u2022 ${i.name} x${i.qty||1} \u2014 $${((i.price||0)*(i.qty||1)).toFixed(2)}`).join('\n');
    const msg   = `Hi Brock Interior Designs! \uD83D\uDC4B\n\nOrder from: ${name}\nPhone: ${phone}\n\n*Order Details:*\n${lines}\n\n*Subtotal: $${t.subtotal.toFixed(2)} USD*\n*VAT (15.5%): $${t.vat.toFixed(2)} USD*\n*Grand Total: $${t.grand_total.toFixed(2)} USD*\n\n${notes ? 'Notes: ' + notes : ''}`;
    saveOrderToSupabase(name, phone, 'whatsapp', notes);
    window.open('https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(msg), '_blank');
    window.closeCheckout();
    clearCart();
    showToast('Order sent via WhatsApp! \u2713', 4000);
};

/* ─── CHECKOUT: PAYNOW ───────────────────────────────────── */
window.checkoutPaynow = function () {
    const name  = (document.getElementById('ckName')?.value  || '').trim();
    const phone = (document.getElementById('ckPhone')?.value || '').trim();
    const notes = (document.getElementById('ckNotes')?.value || '').trim();
    const errEl = document.getElementById('ckError');
    if (!name || !phone) {
        if (errEl) { errEl.textContent = 'Please enter your name and phone number.'; errEl.style.display = 'block'; }
        return;
    }
    if (phone.replace(/[\s\-\+\(\)]/g,'').length < 7) {
        if (errEl) { errEl.textContent = 'Please enter a valid phone number.'; errEl.style.display = 'block'; }
        return;
    }
    if (errEl) errEl.style.display = 'none';
    updateCheckoutTotals('paynow');
    saveOrderToSupabase(name, phone, 'paynow', notes);
    const ov = document.getElementById('paynowOverlay');
    if (ov) {
        ov.style.display = 'flex';
        setTimeout(() => {
            ov.style.display = 'none';
            window.closeCheckout();
            clearCart();
            showToast('Redirecting to Paynow\u2026 (integration pending)', 4000);
        }, 2000);
    }
};

/* ─── HELPERS ────────────────────────────────────────────── */
function escHtml(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
window.escHtml = escHtml;

/* ─── INIT ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    loadCart();

    document.getElementById('cartBtn')?.addEventListener('click', openCart);
    document.getElementById('cartClose')?.addEventListener('click', closeCart);
    document.getElementById('cartOverlay')?.addEventListener('click', closeCart);
    document.getElementById('cartFab')?.addEventListener('click', openCart);

    document.querySelectorAll('[data-payment-method]').forEach(b =>
        b.addEventListener('mouseenter', () => updateCheckoutTotals(b.dataset.paymentMethod))
    );
    document.getElementById('checkoutModal')?.addEventListener('click', function(e) {
        if (e.target === this) window.closeCheckout();
    });

    /* Mobile nav */
    const mobMenu = document.getElementById('mobMenu');
    if (mobMenu) {
        const open  = () => { mobMenu.classList.add('open'); document.getElementById('mobOverlay')?.classList.add('active'); document.body.style.overflow = 'hidden'; };
        const close = () => { mobMenu.classList.remove('open'); document.getElementById('mobOverlay')?.classList.remove('active'); document.body.style.overflow = ''; };
        document.getElementById('hamburger')?.addEventListener('click', open);
        document.getElementById('mobClose')?.addEventListener('click', close);
        document.getElementById('mobOverlay')?.addEventListener('click', close);
    }
});
