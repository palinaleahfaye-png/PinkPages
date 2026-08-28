// SUPABASE CONFIGURATION
// Replace these with your actual Supabase project credentials
const SUPABASE_URL = "https://tmremnyrfhrlusiykjno.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_SFLmJJ1EskVB8Me8DDnYpQ_oxkUKWyp";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;
let authMode = 'login'; // 'login' or 'signup'

// INITIALIZATION
document.addEventListener('DOMContentLoaded', async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) { 
    currentUser = user;
    updateNavUI(true);
  } else {
    updateNavUI(false);
  }
  loadBooks();
});

// NAVIGATION LOGIC
window.showSection = function(sectionId) {
  document.querySelectorAll('.page-section').forEach(sec => sec.classList.add('hidden'));
  const target = document.getElementById(sectionId);
  if (target) target.classList.remove('hidden');

  if (sectionId === 'browse') loadBooks();
  if (sectionId === 'dashboard') loadDashboard();
};

function updateNavUI(isLoggedIn) {
  document.getElementById('nav-login-btn').classList.toggle('hidden', isLoggedIn);
  document.getElementById('nav-logout-btn').classList.toggle('hidden', !isLoggedIn);
  document.getElementById('nav-dashboard').classList.toggle('hidden', !isLoggedIn);
}

// AUTHENTICATION LOGIC
window.toggleAuthMode = function(e) {
  e.preventDefault();
  authMode = authMode === 'login' ? 'signup' : 'login';
  
  document.getElementById('auth-title').innerText = authMode === 'login' ? 'Login to PinkPages' : 'Sign Up for PinkPages';
  document.getElementById('auth-submit-btn').innerText = authMode === 'login' ? 'Login' : 'Sign Up';
  document.getElementById('auth-toggle-text').innerText = authMode === 'login' ? "Don't have an account?" : "Already have an account?";
  document.getElementById('auth-toggle-btn').innerText = authMode === 'login' ? "Sign Up" : "Login";
  
  document.getElementById('name-group').classList.toggle('hidden', authMode === 'login');
  document.getElementById('gcash-group').classList.toggle('hidden', authMode === 'login');
};

window.handleAuth = async function(e) {
  e.preventDefault();
  const email = document.getElementById('auth-email').value;
  const password = document.getElementById('auth-password').value;

  if (authMode === 'signup') {
    const fullName = document.getElementById('auth-name').value;
    const gcashNumber = document.getElementById('auth-gcash').value;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, gcash_number: gcashNumber }
      }
    });

    if (error) return alert(error.message);
    alert('Signup successful! Please check your email to confirm registration.');
  } else {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return alert(error.message);
    currentUser = data.user;
    updateNavUI(true);
    showSection('dashboard');
  }
};

window.handleLogout = async function() {
  await supabase.auth.signOut();
  currentUser = null;
  updateNavUI(false);
  showSection('hero');
};

// BOOKS STORE & LISTINGS
async function loadBooks() {
  const { data: books, error } = await supabase
    .from('books')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return console.error(error);
  renderBooks(books, 'book-grid');
}

function renderBooks(books, targetElementId) {
  const container = document.getElementById(targetElementId);
  container.innerHTML = books.map(book => `
    <div class="book-card">
      <img src="${book.image_url}" alt="${book.title}">
      <h3>${book.title}</h3>
      <p class="author">by ${book.author}</p>
      <p class="price">₱${parseFloat(book.price).toFixed(2)}</p>
      <button class="btn btn-outline" onclick="viewBookDetails('${book.id}')">View Details</button>
    </div>
  `).join('');
}

window.filterBooks = function() {
  const query = document.getElementById('search-input').value.toLowerCase();
  document.querySelectorAll('#book-grid .book-card').forEach(card => {
    const title = card.querySelector('h3').innerText.toLowerCase();
    const author = card.querySelector('.author').innerText.toLowerCase();
    card.style.display = (title.includes(query) || author.includes(query)) ? 'flex' : 'none';
  });
};

// BOOK DETAILS, REVIEWS & PAYMONGO PAYMENT
window.viewBookDetails = async function(bookId) {
  const { data: book } = await supabase.from('books').select('*, profiles(full_name)').eq('id', bookId).single();
  if (!book) return;

  const container = document.getElementById('details-container');
  container.innerHTML = `
    <div style="display: flex; gap: 2rem; flex-wrap: wrap;">
      <img src="${book.image_url}" style="max-width: 300px; border-radius: 12px;">
      <div>
        <h2>${book.title}</h2>
        <p class="author">Author: ${book.author}</p>
        <p>Seller: ${book.profiles?.full_name || 'Anonymous'}</p>
        <h3 class="price" style="margin: 1rem 0;">₱${parseFloat(book.price).toFixed(2)}</h3>
        <p style="margin-bottom: 1.5rem;">${book.description}</p>
        <button class="btn btn-primary" onclick="initiatePayment('${book.id}', ${book.price}, '${book.seller_id}')">Buy Now with PayMongo</button>
      </div>
    </div>
  `;

  document.getElementById('review-book-id').value = bookId;
  document.getElementById('add-review-form').classList.toggle('hidden', !currentUser);
  loadReviews(bookId);
  showSection('book-details');
};

async function loadReviews(bookId) {
  const { data: reviews } = await supabase
    .from('reviews')
    .select('*, profiles(full_name)')
    .eq('book_id', bookId);

  const container = document.getElementById('reviews-list');
  if (!reviews || reviews.length === 0) {
    container.innerHTML = '<p>No reviews yet. Be the first to review!</p>';
    return;
  }

  container.innerHTML = reviews.map(r => `
    <div style="background: white; padding: 1rem; margin: 0.5rem 0; border-radius: 8px;">
      <strong>${r.profiles?.full_name || 'User'}</strong> - ${'⭐'.repeat(r.rating)}
      <p>${r.comment}</p>
    </div>
  `).join('');
}

window.handleReviewSubmit = async function(e) {
  e.preventDefault();
  const bookId = document.getElementById('review-book-id').value;
  const rating = document.getElementById('review-rating').value;
  const comment = document.getElementById('review-comment').value;

  const { error } = await supabase.from('reviews').insert([{
    book_id: bookId,
    user_id: currentUser.id,
    rating: parseInt(rating),
    comment: comment
  }]);

  if (error) return alert(error.message);
  alert('Review posted!');
  loadReviews(bookId);
};

// SELL NEW PRODUCT
window.handleSellBook = async function(e) {
  e.preventDefault();
  if (!currentUser) return alert('Please login to sell products.');

  const title = document.getElementById('book-title').value;
  const author = document.getElementById('book-author').value;
  const price = document.getElementById('book-price').value;
  const image_url = document.getElementById('book-image').value;
  const description = document.getElementById('book-desc').value;

  const { error } = await supabase.from('books').insert([{
    seller_id: currentUser.id,
    title, author, price, image_url, description
  }]);

  if (error) return alert(error.message);
  alert('Book listed successfully!');
  showSection('dashboard');
};

// PAYMONGO PAYMENT PROCESS (SERVERLESS FETCH)
window.initiatePayment = async function(bookId, amount, sellerId) {
  if (!currentUser) return alert('Please login to purchase items.');

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
      alert('Failed to create payment session.');
    }
  } catch (err) {
    alert('Payment initiation failed: ' + err.message);
  }
};

// DASHBOARD MANAGEMENT
async function loadDashboard() {
  if (!currentUser) return showSection('auth');
  document.getElementById('welcome-message').innerText = `Logged in as: ${currentUser.email}`;

  // User's own product listings
  const { data: myBooks } = await supabase.from('books').select('*').eq('seller_id', currentUser.id);
  renderBooks(myBooks || [], 'user-books-grid');

  // Sales History
  const { data: sales } = await supabase.from('orders').select('*, books(title)').eq('seller_id', currentUser.id);
  document.getElementById('sales-history-list').innerHTML = (sales && sales.length)
    ? sales.map(s => `<p>Sold <strong>${s.books?.title}</strong> for ₱${s.amount} [Status: ${s.status}]</p>`).join('')
    : '<p>No sales history found.</p>';

  // Bought History
  const { data: bought } = await supabase.from('orders').select('*, books(title)').eq('buyer_id', currentUser.id);
  document.getElementById('bought-history-list').innerHTML = (bought && bought.length)
    ? bought.map(b => `<p>Purchased <strong>${b.books?.title}</strong> for ₱${b.amount} [Status: ${b.status}]</p>`).join('')
    : '<p>No purchase history found.</p>';
}


window.switchDashTab = function(tabName, event) {
  document.querySelectorAll('.dash-tab-content').forEach(function(el) {
    el.classList.add('hidden');
  });

  document.querySelectorAll('.tab-btn').forEach(function(btn) {
    btn.classList.remove('active');
  });

  const tab = document.getElementById('tab-' + tabName);

  if (tab) {
    tab.classList.remove('hidden');
  }

  if (event && event.currentTarget) {
    event.currentTarget.classList.add('active');
  }
};
