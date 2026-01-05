document.addEventListener('DOMContentLoaded', () => {
    fetchMenu();
});

async function fetchMenu() {
    const menuContainer = document.getElementById('menu-grid'); // Using your existing ID

    // Show a loading state or clear
    if (menuContainer) menuContainer.innerHTML = '<p style="text-align:center;">Loading menu...</p>';

    try {
        const response = await fetch('content/menu.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Handle empty file or no items
        if (!data || !data.menu_items || data.menu_items.length === 0) {
            if (menuContainer) menuContainer.innerHTML = '<p style="text-align:center;">Our menu is currently being updated. Please check back soon!</p>';
            return;
        }

        renderMenuItems(data.menu_items);

    } catch (error) {
        console.error('Error fetching menu:', error);
        if (menuContainer) menuContainer.innerHTML = '<p style="text-align:center; color: red;">Failed to load menu data.</p>';
    }
}

function renderMenuItems(items) {
    const menuContainer = document.getElementById('menu-grid');
    if (!menuContainer) return;

    menuContainer.innerHTML = ''; // Clear loading text

    items.forEach(item => {
        // Create Card
        const card = document.createElement('div');
        card.className = 'product-card fade-in-up';

        // Fallback for missing image
        const imageSrc = item.image ? item.image : 'https://via.placeholder.com/400x300?text=Fresh+Bites';

        card.innerHTML = `
            <div class="card-img-wrapper">
                <img src="${imageSrc}" alt="${item.name}" class="card-img" loading="lazy">
            </div>
            <div class="card-content">
                <div class="card-header">
                    <h3 class="card-title">${item.name}</h3>
                    <span class="card-price">${item.price} EGP</span>
                </div>
                <p class="card-desc">${item.description}</p>
                <span class="card-badge" style="font-size:0.8rem; color:#888; text-transform:uppercase; letter-spacing:1px;">${item.category}</span>
                <!-- Optional: Add to Cart Button could go here -->
            </div>
        `;
        menuContainer.appendChild(card);
    });
}
