// CONFIGURATION
const SUPABASE_URL = "https://tmremnyrfhrlusiykjno.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_SFLmJJ1EskVB8Me8DDnYpQ_oxkUKWyp";

// Initialize Supabase Client securely
const supabase = window.supabase?.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;
let authMode = 'login'; // 'login' or 'signup'

// UTILITY: Sanitize HTML to prevent XSS attacks
function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// UTILITY: UI Notification handler
function showNotification(message, isError = false) {
  const toast = document.getElementById('toast-notification');
  if (toast) {
    toast.textContent = message;
    toast.className = isError ? 'toast toast-error' : 'toast toast-success';
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
  } else {
    alert(message);
  }
}

// INITIALIZATION
document.addEventListener('DOMContentLoaded', async () => {
  if (!supabase) {
    console.error("Supabase client failed to initialize.");
    return;
  }
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    
    currentUser = user;
    updateNavUI(!!currentUser);
  } catch (err) {
    console.warn("Auth status check failed:", err.message);
    updateNavUI(false);
  }

  await loadBooks();
});

// NAVIGATION CONTROLLER
window.showSection = function(sectionId) {
  document.querySelectorAll('.page-section').forEach(sec => sec.classList.add('hidden'));
  const target = document.getElementById(sectionId);
  if (target) {
    target.classList.remove('hidden');
  }

  if (sectionId === 'browse') loadBooks();
  if (sectionId === 'dashboard') loadDashboard();
};

function updateNavUI(isLoggedIn) {
  const toggleVisibility = (id, condition) => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('hidden', condition);
  };

  toggleVisibility('nav-login-btn', isLoggedIn);
  toggleVisibility('nav-logout-btn', !isLoggedIn);
  toggleVisibility('nav-dashboard', !isLoggedIn);
}

// AUTHENTICATION MANAGEMENT
window.toggleAuthMode = function(e) {
  if (e) e.preventDefault();
  authMode = authMode === 'login' ? 'signup' : 'login';

  const isLogin = authMode === 'login';
  
  document.getElementById('auth-title').innerText = isLogin ? 'Login to PinkPages' : 'Sign Up for PinkPages';
  document.getElementById('auth-submit-btn').innerText = isLogin ? 'Login' : 'Sign Up';
  document.getElementById('auth-toggle-text').innerText = isLogin ? "Don't have an account?" : "Already have an account?";
  document.getElementById('auth-toggle-btn').innerText = isLogin ? "Sign Up" : "Login";

  document.getElementById('name-group')?.classList.toggle('hidden', isLogin);
  document.getElementById('gcash-group')?.classList.toggle('hidden', isLogin);
};

window.handleAuth = async function(e) {
  if (e) e.preventDefault();

  const email = document.getElementById('auth-email')?.value.trim();
  const password = document.getElementById('auth-password')?.value;
  const submitBtn = document.getElementById('auth-submit-btn');

  if (!email || !password) {
    return showNotification('Please enter both email and password.', true);
  }

  try {
    if (submitBtn) submitBtn.disabled = true;

    if (authMode === 'signup') {
      const fullName = document.getElementById('auth-name')?.value.trim();
      const gcashNumber = document.getElementById('auth-gcash')?.value.trim();

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, gcash_number: gcashNumber } }
      });

      if (error) throw error;
      showNotification('Signup successful! Please check your email to confirm registration.');
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      currentUser = data.user;
      updateNavUI(true);
      window.showSection('dashboard');
    }
  } catch (err) {
    showNotification(err.message, true);
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
};

window.handleLogout = async function() {
  try {
    await supabase.auth.signOut();
    currentUser = null;
    updateNavUI(false);
    window.showSection('hero');
    showNotification('Logged out successfully.');
  } catch (err) {
    showNotification('Logout error: ' + err.message, true);
  }
};

// BOOKS DATA LAYER
async function loadBooks() {
  const container = document.getElementById('book-grid');
  if (container) container.innerHTML = '<p class="loading">Loading books...</p>';

  try {
    const { data: books, error } = await supabase
      .from('books')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    renderBooks(books, 'book-grid');
  } catch (err) {
    console.error("Error loading books:", err);
    if (container) container.innerHTML = '<p class="error">Failed to load books.</p>';
  }
}

function renderBooks(books, targetElementId) {
  const container = document.getElementById(targetElementId);
  if (!container) return;

  if (!books || books.length === 0) {
    container.innerHTML = "<p>No books available.</p>";
    return;
  }

  container.innerHTML = books.map(book => `
    <div class="book-card">
      <img 
        src="${escapeHtml(book.image_url || 'https://via.placeholder.com/150')}" 
        alt="${escapeHtml(book.title || 'Book Cover')}"
        loading="lazy"
      >
      <h3>${escapeHtml(book.title || 'Untitled')}</h3>
      <p class="author">by ${escapeHtml(book.author || 'Unknown')}</p>
      <p class="price">₱${Number(book.price || 0).toFixed(2)}</p>
      <button 
        type="button" 
        class="btn btn-outline" 
        onclick="window.viewBookDetails('${book.id}')">
        View Details
      </button>
    </div>
  `).join('');
}

window.filterBooks = function() {
  const query = document.getElementById('search-input')?.value.toLowerCase() || '';
  document.querySelectorAll('#book-grid .book-card').forEach(card => {
    const title = card.querySelector('h3')?.innerText.toLowerCase() || '';
    const author = card.querySelector('.author')?.innerText.toLowerCase() || '';
    const matches = title.includes(query) || author.includes(query);
    card.style.display = matches ? 'flex' : 'none';
  });
};

// DETAILS & REVIEW MANAGEMENT
window.viewBookDetails = async function(bookId) {
  const container = document.getElementById('details-container');
  if (container) container.innerHTML = '<p class="loading">Loading details...</p>';

  try {
    const { data: book, error } = await supabase
      .from('books')
      .select('*, profiles(full_name)')
      .eq('id', bookId)
      .single();

    if (error || !book) throw new Error("Unable to retrieve book details.");

    if (container) {
      container.innerHTML = `
        <div style="display: flex; gap: 2rem; flex-wrap: wrap;">
          <img src="${escapeHtml(book.image_url)}" style="max-width: 300px; border-radius: 12px;" alt="${escapeHtml(book.title)}">
          <div>
            <h2>${escapeHtml(book.title)}</h2>
            <p class="author">Author: ${escapeHtml(book.author)}</p>
            <p>Seller: ${escapeHtml(book.profiles?.full_name || 'Anonymous')}</p>
            <h3 class="price" style="margin: 1rem 0;">₱${parseFloat(book.price).toFixed(2)}</h3>
            <p style="margin-bottom: 1.5rem;">${escapeHtml(book.description)}</p>
            <button class="btn btn-primary" onclick="window.initiatePayment('${book.id}', ${book.price}, '${book.seller_id}')">
              Buy Now with PayMongo
            </button>
          </div>
        </div>
      `;
    }

    const reviewBookInput = document.getElementById('review-book-id');
    const reviewForm = document.getElementById('add-review-form');
    
    if (reviewBookInput) reviewBookInput.value = bookId;
    if (reviewForm) reviewForm.classList.toggle('hidden', !currentUser);

    await loadReviews(bookId);
    window.showSection('book-details');
  } catch (err) {
    showNotification(err.message, true);
  }
};

async function loadReviews(bookId) {
  const container = document.getElementById('reviews-list');
  if (!container) return;

  try {
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('*, profiles(full_name)')
      .eq('book_id', bookId);

    if (error) throw error;

    if (!reviews || reviews.length === 0) {
      container.innerHTML = '<p>No reviews yet. Be the first to review!</p>';
      return;
    }

    container.innerHTML = reviews.map(r => `
      <div style="background: #f9f9f9; padding: 1rem; margin: 0.5rem 0; border-radius: 8px;">
        <strong>${escapeHtml(r.profiles?.full_name || 'User')}</strong> - ${'⭐'.repeat(r.rating || 5)}
        <p>${escapeHtml(r.comment)}</p>
      </div>
    `).join('');
  } catch (err) {
    console.error("Error loading reviews:", err);
  }
}

window.handleReviewSubmit = async function(e) {
  if (e) e.preventDefault();
  if (!currentUser) return showNotification('Please login to post a review.', true);

  const bookId = document.getElementById('review-book-id')?.value;
  const rating = document.getElementById('review-rating')?.value;
  const comment = document.getElementById('review-comment')?.value;

  try {
    const { error } = await supabase.from('reviews').insert([{
      book_id: bookId,
      user_id: currentUser.id,
      rating: parseInt(rating, 10),
      comment: comment
    }]);

    if (error) throw error;
    showNotification('Review posted successfully!');
    await loadReviews(bookId);
  } catch (err) {
    showNotification(err.message, true);
  }
};

// SELLER API
window.handleSellBook = async function(e) {
  if (e) e.preventDefault();
  if (!currentUser) return showNotification('Please login to list items.', true);

  const title = document.getElementById('book-title')?.value;
  const author = document.getElementById('book-author')?.value;
  const price = document.getElementById('book-price')?.value;
  const image_url = document.getElementById('book-image')?.value;
  const description = document.getElementById('book-desc')?.value;

  try {
    const { error } = await supabase.from('books').insert([{
      seller_id: currentUser.id,
      title, author, price: parseFloat(price), image_url, description
    }]);

    if (error) throw error;
    showNotification('Book listed successfully!');
    window.showSection('dashboard');
  } catch (err) {
    showNotification(err.message, true);
  }
};

// CHECKOUT INTEGRATION
window.initiatePayment = async function(bookId, amount, sellerId) {
  if (!currentUser) return showNotification('Please login to purchase items.', true);

  try {
    const response = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookId, amount, sellerId, buyerId: currentUser.id })
    });

    const session = await response.json();
    if (session.checkoutUrl) {
      window.location.href = session.checkoutUrl;
    } else {
      throw new Error(session.message || 'Failed to create payment session.');
    }
  } catch (err) {
    showNotification('Payment process failed: ' + err.message, true);
  }
};

// DASHBOARD WORKFLOWS
async function loadDashboard() {
  if (!currentUser) return window.showSection('auth');

  const welcomeMsg = document.getElementById('welcome-message');
  if (welcomeMsg) welcomeMsg.innerText = `Logged in as: ${currentUser.email}`;

  try {
    // User Listings
    const { data: myBooks } = await supabase.from('books').select('*').eq('seller_id', currentUser.id);
    renderBooks(myBooks || [], 'user-books-grid');

    // Sales
    const { data: sales } = await supabase.from('orders').select('*, books(title)').eq('seller_id', currentUser.id);
    const salesList = document.getElementById('sales-history-list');
    if (salesList) {
      salesList.innerHTML = (sales && sales.length)
        ? sales.map(s => `<p>Sold <strong>${escapeHtml(s.books?.title)}</strong> for ₱${s.amount} [Status: ${escapeHtml(s.status)}]</p>`).join('')
        : '<p>No sales history found.</p>';
    }

    // Purchases
    const { data: bought } = await supabase.from('orders').select('*, books(title)').eq('buyer_id', currentUser.id);
    const boughtList = document.getElementById('bought-history-list');
    if (boughtList) {
      boughtList.innerHTML = (bought && bought.length)
        ? bought.map(b => `<p>Purchased <strong>${escapeHtml(b.books?.title)}</strong> for ₱${b.amount} [Status: ${escapeHtml(b.status)}]</p>`).join('')
        : '<p>No purchase history found.</p>';
    }
  } catch (err) {
    console.error("Dashboard loading error:", err);
  }
}

window.switchDashTab = function(tabName, event) {
  document.querySelectorAll('.dash-tab-content').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

  const tab = document.getElementById('tab-' + tabName);
  if (tab) tab.classList.remove('hidden');
  if (event) event.currentTarget.classList.add('active');
};
