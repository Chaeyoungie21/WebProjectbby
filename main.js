// Initialize users array from localStorage or empty array if none exists
const users = JSON.parse(localStorage.getItem('users')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser'));
let favorites = new Set(JSON.parse(localStorage.getItem('favorites')) || []);
let cart = [];

// Image data
const images = [/* (image array same as you provided, omitted for brevity) */];

// Auth functions
function signup(event) {
    event.preventDefault();
    
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;

    if (password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }

    const userExists = users.find(user => user.email === email);
    if (userExists) {
        showNotification('User already exists', 'error');
        return;
    }

    const newUser = { name, email, password };
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    showNotification('Signup successful! Please login.', 'success');
    switchForm('login');
}

function login(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    const user = users.find(user => user.email === email && user.password === password);
    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        updateAuthUI();
        closeAuthModal();
        showNotification('Welcome back!', 'success');
    } else {
        showNotification('Invalid email or password', 'error');
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    cart = [];
    updateCart();
    updateAuthUI();
    showNotification('Logged out successfully', 'info');
}

// Auth UI functions
function showAuthModal(type) {
    document.getElementById('authModal').style.display = 'block';
    document.getElementById('loginForm').classList.toggle('hidden', type !== 'login');
    document.getElementById('signupForm').classList.toggle('hidden', type !== 'signup');
}

function closeAuthModal() {
    document.getElementById('authModal').style.display = 'none';
}

function switchForm(type) {
    showAuthModal(type);
}

function updateAuthUI() {
    const authButtons = document.getElementById('authButtons');
    const userInfo = document.getElementById('userInfo');
    const userEmail = document.getElementById('userEmail');

    if (currentUser) {
        authButtons.classList.add('hidden');
        userInfo.classList.remove('hidden');
        userEmail.textContent = currentUser.email;
    } else {
        authButtons.classList.remove('hidden');
        userInfo.classList.add('hidden');
        userEmail.textContent = '';
    }
}

// Filter and display functions
function filterImages() {
    const categoryFilter = document.getElementById('categoryFilter').value;
    const priceFilter = document.getElementById('priceFilter').value;
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    let filteredImages = images.filter(image => {
        const matchesSearch = image.title.toLowerCase().includes(searchTerm) || 
                              image.description.toLowerCase().includes(searchTerm);
        const matchesCategory = categoryFilter === 'all' || image.category === categoryFilter;

        let matchesPrice = true;
        if (priceFilter === '0-50') matchesPrice = image.price <= 50;
        else if (priceFilter === '50-100') matchesPrice = image.price > 50 && image.price <= 100;
        else if (priceFilter === '100+') matchesPrice = image.price > 100;

        return matchesSearch && matchesCategory && matchesPrice;
    });

    displayImages(filteredImages);
}

function displayImages(imagesToShow = images) {
    const imageGrid = document.getElementById('imageGrid');
    imageGrid.innerHTML = '';

    imagesToShow.forEach(image => {
        const card = document.createElement('div');
        card.className = 'image-card';
        card.innerHTML = `
            <div class="image-container">
                <img src="${image.url}" alt="${image.title}">
                <button class="favorite-btn ${favorites.has(image.id) ? 'active' : ''}" 
                        onclick="toggleFavorite(${image.id})">❤</button>
                <div class="quick-view" onclick="showQuickView(${image.id})">Quick View</div>
            </div>
            <div class="image-info">
                <h3>${image.title}</h3>
                <div class="image-category">${image.category}</div>
                <p class="description">${image.description}</p>
                <p class="price">$${image.price.toFixed(2)}</p>
                <div class="button-group">
                    <button class="buy-btn" onclick="buyNow(${image.id})">Buy Now</button>
                    <button onclick="addToCart(${image.id})">Add to Cart</button>
                </div>
            </div>
        `;
        imageGrid.appendChild(card);
    });
}

function buyNow(imageId) {
    if (!currentUser) {
        showNotification('Please login to make a purchase', 'info');
        showAuthModal('login');
        return;
    }

    const image = images.find(img => img.id === imageId);
    if (image) {
        cart = [image];
        updateCart();
        toggleCart();
        initiateCheckout();
        showNotification('Proceeding to checkout!', 'success');
    }
}

function toggleFavorite(imageId) {
    if (!currentUser) {
        showNotification('Please login to add favorites', 'info');
        showAuthModal('login');
        return;
    }

    if (favorites.has(imageId)) {
        favorites.delete(imageId);
        showNotification('Removed from favorites', 'info');
    } else {
        favorites.add(imageId);
        showNotification('Added to favorites', 'success');
    }

    localStorage.setItem('favorites', JSON.stringify(Array.from(favorites)));
    displayImages();
}

function showQuickView(imageId) {
    const image = images.find(img => img.id === imageId);
    if (!image) return;

    const modal = document.getElementById('quickViewModal');
    document.getElementById('quickViewImg').src = image.url;
    document.getElementById('quickViewTitle').textContent = image.title;
    document.getElementById('quickViewCategory').textContent = image.category;
    document.getElementById('quickViewDescription').textContent = image.description;
    document.getElementById('quickViewPrice').textContent = `$${image.price.toFixed(2)}`;
    document.getElementById('quickViewAddToCart').onclick = () => addToCart(image.id);

    modal.style.display = 'block';
}

function closeQuickView() {
    document.getElementById('quickViewModal').style.display = 'none';
}

// Cart functions
function addToCart(imageId) {
    if (!currentUser) {
        showNotification('Please login to add items to cart', 'info');
        showAuthModal('login');
        return;
    }

    const image = images.find(img => img.id === imageId);
    if (image) {
        cart.push(image);
        updateCart();
        showNotification('Added to cart!', 'success');
    }
}

function updateCart() {
    const cartItems = document.getElementById('cartItems');
    const cartCount = document.getElementById('cartCount');
    const cartTotal = document.getElementById('cartTotal');
    
    cartCount.textContent = cart.length;
    cartItems.innerHTML = '';
    
    let total = 0;
    cart.forEach((item, index) => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <img src="${item.url}" alt="${item.title}">
            <div class="cart-item-info">
                <h3>${item.title}</h3>
                <p>$${item.price.toFixed(2)}</p>
            </div>
            <button class="remove-button" onclick="removeFromCart(${index})">×</button>
        `;
        cartItems.appendChild(cartItem);
        total += item.price;
    });
    
    cartTotal.textContent = total.toFixed(2);
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCart();
    showNotification('Item removed from cart', 'info');
}

function toggleCart() {
    const cartPanel = document.getElementById('cartPanel');
    cartPanel.classList.toggle('active');
}

// Checkout and payment
function initiateCheckout() {
    if (!currentUser) {
        showNotification('Please login to checkout', 'info');
        showAuthModal('login');
        return;
    }

    if (cart.length === 0) {
        showNotification('Your cart is empty!', 'error');
        return;
    }

    document.getElementById('paymentForm').classList.remove('hidden');
    document.getElementById('checkoutBtn').classList.add('hidden');
}

function processPayment(event) {
    event.preventDefault();
    
    const cardName = document.getElementById('cardName').value;
    const cardNumber = document.getElementById('cardNumber').value;
    const cardExpiry = document.getElementById('cardExpiry').value;
    const cardCVC = document.getElementById('cardCVC').value;

    const total = cart.reduce((sum, item) => sum + item.price, 0);
    showNotification(`Payment successful! Total paid: $${total.toFixed(2)}`, 'success');

    cart = [];
    updateCart();
    toggleCart();

    document.getElementById('paymentForm').classList.add('hidden');
    document.getElementById('checkoutBtn').classList.remove('hidden');

    document.getElementById('cardName').value = '';
    document.getElementById('cardNumber').value = '';
    document.getElementById('cardExpiry').value = '';
    document.getElementById('cardCVC').value = '';
}

// Notifications
function showNotification(message, type) {
    const container = document.getElementById('notificationContainer');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    container.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// Search input binding
document.getElementById('searchInput').addEventListener('input', filterImages);

// Initialization
displayImages();
updateAuthUI();

// Close modals on outside click
window.onclick = function(event) {
    if (event.target === document.getElementById('quickViewModal')) {
        closeQuickView();
    }
    if (event.target === document.getElementById('authModal')) {
        closeAuthModal();
    }
};
