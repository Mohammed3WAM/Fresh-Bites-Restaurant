
document.addEventListener('DOMContentLoaded', () => {
    fetchMenu();
    setupCartInteractions();
    setupLanguageToggle();
});

let cart = [];
let menuData = [];
let currentLang = 'en';

async function fetchMenu() {
    const menuContainer = document.getElementById('menu-grid');

    if (menuContainer) menuContainer.innerHTML = '<p style="text-align:center;">Loading menu...</p>';

    try {
        const response = await fetch('content/menu.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!data || !data.menu_items || data.menu_items.length === 0) {
            if (menuContainer) menuContainer.innerHTML = '<p style="text-align:center;">Our menu is currently being updated. Please check back soon!</p>';
            return;
        }

        menuData = data.menu_items; // Store globally
        renderMenuItems(menuData);
        setupCategoryFilters(menuData);

    } catch (error) {
        console.error('Error fetching menu:', error);
        if (menuContainer) menuContainer.innerHTML = '<p style="text-align:center; color: red;">Failed to load menu data.</p>';
    }
}

function renderMenuItems(items) {
    const menuContainer = document.getElementById('menu-grid');
    if (!menuContainer) return;

    menuContainer.innerHTML = '';

    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'product-card fade-in-up';

        const imageSrc = item.image ? item.image : 'https://via.placeholder.com/400x300?text=Fresh+Bites';
        const price = parseFloat(item.price) || 0;

        // Handle Language
        const name = currentLang === 'ar' ? (item.name_ar || item.name_en) : (item.name_en || item.name);
        const desc = currentLang === 'ar' ? (item.desc_ar || item.desc_en) : (item.desc_en || item.description);

        // Escape quotes
        const safeName = name ? name.replace(/'/g, "\\'") : 'Unnamed';
        const safeImage = imageSrc.replace(/'/g, "\\'");

        card.innerHTML = `
            <div class="card-img-wrapper">
                <img src="${imageSrc}" alt="${name}" class="card-img" loading="lazy">
            </div>
            <div class="card-content">
                <div class="card-header">
                    <h3 class="card-title">${name}</h3>
                    <span class="card-price">${price} EGP</span>
                </div>
                <p class="card-desc">${desc}</p>
                <div style="margin-top: auto;">
                     <span class="card-badge" style="display:inline-block; margin-bottom:10px; font-size:0.8rem; color:#888; text-transform:uppercase; letter-spacing:1px;">${item.category}</span>
                     <button class="add-btn" onclick="addToCart('${safeName}', ${price}, '${safeImage}')">
                        ${currentLang === 'ar' ? 'أضف للطلب' : 'Add to Order'} <i class="fa-solid fa-plus"></i>
                     </button>
                </div>
            </div>
        `;
        menuContainer.appendChild(card);
    });
}

function setupCategoryFilters(allItems) {
    const filters = document.querySelectorAll('.filter-btn');
    filters.forEach(btn => {
        btn.addEventListener('click', () => {
            filters.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const category = btn.getAttribute('data-category');
            if (category === 'all') {
                renderMenuItems(allItems);
            } else {
                const filtered = allItems.filter(item => item.category.toLowerCase() === category);
                renderMenuItems(filtered);
            }
        });
    });
}

function setupLanguageToggle() {
    const langBtn = document.getElementById('lang-toggle');
    const langText = langBtn ? langBtn.querySelector('.lang-text') : null;
    const heroTitle = document.getElementById('hero-title');
    const heroSubtitle = document.getElementById('hero-subtitle');
    const heroCta = document.getElementById('hero-cta');
    const cartTitle = document.getElementById('cart-title');
    const totalLabel = document.getElementById('total-label');
    const viewCartText = document.getElementById('view-cart-text');
    const checkoutText = document.getElementById('checkout-text');

    if (langBtn) {
        langBtn.addEventListener('click', () => {
            // Toggle State
            currentLang = currentLang === 'en' ? 'ar' : 'en';

            // Update Toggle Button
            if (langText) langText.innerText = currentLang === 'en' ? 'AR' : 'EN';

            // Update Body Direction
            if (currentLang === 'ar') {
                document.body.classList.add('rtl');
                document.documentElement.lang = 'ar';
            } else {
                document.body.classList.remove('rtl');
                document.documentElement.lang = 'en';
            }

            // Update Static Content (Simple hardcoded translation for demo)
            if (currentLang === 'ar') {
                if (heroTitle) heroTitle.innerHTML = 'تذوق <span class="text-gradient">الطزاجة</span>';
                if (heroSubtitle) heroSubtitle.innerText = 'مكونات فاخرة، نكهات لا تنسى. اطلب الآن.';
                if (heroCta) heroCta.innerText = 'شاهد القائمة';
                if (cartTitle) cartTitle.innerText = 'طلبك';
                if (totalLabel) totalLabel.innerText = 'المجموع';
                if (viewCartText) viewCartText.innerText = 'عرض السلة';
                if (checkoutText) checkoutText.innerText = 'اطلب عبر واتساب';
            } else {
                if (heroTitle) heroTitle.innerHTML = 'Taste the <span class="text-gradient">Freshness</span>';
                if (heroSubtitle) heroSubtitle.innerText = 'Premium ingredients, unforgettable flavors. Order instantly.';
                if (heroCta) heroCta.innerText = 'View Menu';
                if (cartTitle) cartTitle.innerText = 'Your Order';
                if (totalLabel) totalLabel.innerText = 'Total';
                if (viewCartText) viewCartText.innerText = 'View Cart';
                if (checkoutText) checkoutText.innerText = 'Order via WhatsApp';
            }

            // Re-render Menu
            renderMenuItems(menuData);

            // Re-render Cart UI (buttons text update mainly if we had text there)
            // We call this to update the "Items" label to "عناصر" etc
            updateCartUI();
        });
    }
}

// --- Cart Logic ---

function addToCart(name, price, image) {
    const existingItem = cart.find(item => item.name === name);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ name, price, image, quantity: 1 });
    }
    updateCartUI();
}

function removeFromCart(name) {
    const existingItemIndex = cart.findIndex(item => item.name === name);
    if (existingItemIndex > -1) {
        if (cart[existingItemIndex].quantity > 1) {
            cart[existingItemIndex].quantity -= 1;
        } else {
            cart.splice(existingItemIndex, 1);
        }
    }
    updateCartUI();
}

function updateCartUI() {
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCountEl = document.getElementById('cart-count');
    if (cartCountEl) cartCountEl.innerText = totalCount;

    // Total Price
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const formattedTotal = `${totalPrice.toFixed(2)} EGP`;

    const itemsLabel = document.getElementById('items-label');
    const totalPriceEl = document.getElementById('total-price');
    const cartTotalPriceEl = document.getElementById('cart-total-price');

    // Labels
    if (itemsLabel) itemsLabel.innerText = currentLang === 'ar' ? `${totalCount} عناصر` : `${totalCount} Items`;
    if (totalPriceEl) totalPriceEl.innerText = formattedTotal;
    if (cartTotalPriceEl) cartTotalPriceEl.innerText = formattedTotal;

    // Visibility
    const orderBar = document.getElementById('order-bar');
    if (orderBar) {
        if (totalCount > 0) {
            orderBar.classList.add('visible');
        } else {
            orderBar.classList.remove('visible');
        }
    }

    // Modal List
    const cartItemsContainer = document.getElementById('cart-items');
    if (cartItemsContainer) {
        cartItemsContainer.innerHTML = '';

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = `<p style="text-align:center; color:#888; margin-top:20px;">${currentLang === 'ar' ? 'سلة الطلبات فارغة' : 'Your cart is empty.'}</p>`;
        } else {
            cart.forEach(item => {
                const safeName = item.name.replace(/'/g, "\\'");
                const itemEl = document.createElement('div');
                itemEl.className = 'cart-item';
                itemEl.innerHTML = `
                    <img src="${item.image}" alt="${item.name}">
                    <div class="item-details">
                        <div class="item-name">${item.name}</div>
                        <div class="item-price">${item.price} EGP</div>
                    </div>
                    <div class="item-controls">
                        <div class="qty-controls">
                            <button class="qty-btn" onclick="removeFromCart('${safeName}')">-</button>
                            <span>${item.quantity}</span>
                            <button class="qty-btn" onclick="addToCart('${safeName}', ${item.price}, '${item.image.replace(/'/g, "\\'")}')">+</button>
                        </div>
                    </div>
                `;
                cartItemsContainer.appendChild(itemEl);
            });
        }
    }
}

function setupCartInteractions() {
    const modal = document.getElementById('cart-modal');
    const closeBtn = document.getElementById('close-cart');
    const viewCartBtn = document.getElementById('view-cart-btn');
    const cartIconBtn = document.getElementById('cart-btn');
    const checkoutBtn = document.getElementById('whatsapp-checkout-btn');

    if (!modal) return;

    const openModal = () => modal.classList.add('open');
    const closeModal = () => modal.classList.remove('open');

    if (viewCartBtn) viewCartBtn.addEventListener('click', openModal);
    if (cartIconBtn) cartIconBtn.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    if (checkoutBtn) checkoutBtn.addEventListener('click', checkoutToWhatsApp);
}

function checkoutToWhatsApp() {
    const phoneNumber = "201060932857";

    if (cart.length === 0) {
        alert(currentLang === 'ar' ? "سلة الطلبات فارغة!" : "Your cart is empty!");
        return;
    }

    // Prompt 1: Physical Address (Mandatory)
    const addressPrompt = currentLang === 'ar'
        ? "من فضلك أدخل عنوان التوصيل بالتفصيل (المدينة، الشارع، رقم المبنى، الطابق).\nهذا الحقل إلزامي."
        : "Please enter your detailed Delivery Address (City, Street, Building, Floor).\nThis field is MANDATORY.";

    const address = prompt(addressPrompt);

    if (!address || address.trim() === "") {
        alert(currentLang === 'ar' ? "عفواً، يجب إدخال العنوان لإتمام الطلب." : "Error: Address is required to complete the order.");
        return;
    }

    // Prompt 2: Google Maps Link (Optional)
    const mapsPrompt = currentLang === 'ar'
        ? "أضف رابط موقعك على خرائط جوجل (اختياري).\nاتركه فارغاً إذا كنت لا تود المشاركة."
        : "Add Google Maps Location Link (OPTIONAL).\nLeave empty if you don't want to share.";

    const mapsLink = prompt(mapsPrompt);

    // Construct Message
    let messageText = currentLang === 'ar' ? "مرحباً، أود أن أطلب:\n\n" : "Hello, I would like to order:\n\n";

    cart.forEach(item => {
        messageText += `- ${item.name} (x${item.quantity}) : ${item.price * item.quantity} EGP\n`;
    });

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    messageText += currentLang === 'ar' ? `\n*الإجمالي: ${total.toFixed(2)} EGP*\n` : `\n*Total Order Value: ${total.toFixed(2)} EGP*\n`;

    messageText += currentLang === 'ar' ? `\n*عنوان التوصيل:* ${address}` : `\n*Delivery Address:* ${address}`;

    if (mapsLink && mapsLink.trim() !== "") {
        messageText += currentLang === 'ar' ? `\n*رابط الموقع:* ${mapsLink}` : `\n*Location Link:* ${mapsLink}`;
    }

    const encodedMessage = encodeURIComponent(messageText);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');
}
