// SUPABASE CONFIGURATION
const SUPABASE_URL = "https://tmremnyrfhrlusiykjno.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_SFLmJJ1EskVB8Me8DDnYpQ_oxkUKWyp";

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

let currentUser = null;
let authMode = 'login';

// =========================
// INITIALIZATION
// =========================
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      currentUser = user;
      updateNavUI(true);
    } else {
      updateNavUI(false);
    }

    loadBooks();
  } catch (error) {
    console.error('Initialization error:', error);
  }
});

// =========================
// NAVIGATION
// =========================
window.showSection = function(sectionId) {
  document.querySelectorAll('.page-section').forEach(function(sec) {
    sec.classList.add('hidden');
  });

  const target = document.getElementById(sectionId);

  if (target) {
    target.classList.remove('hidden');
  }

  if (sectionId === 'browse') {
    loadBooks();
  }

  if (sectionId === 'dashboard') {
    loadDashboard();
  }
};

function updateNavUI(isLoggedIn) {
  const loginBtn = document.getElementById('nav-login-btn');
  const logoutBtn = document.getElementById('nav-logout-btn');
  const dashboardBtn = document.getElementById('nav-dashboard');

  if (loginBtn) {
    loginBtn.classList.toggle('hidden', isLoggedIn);
  }

  if (logoutBtn) {
    logoutBtn.classList.toggle('hidden', !isLoggedIn);
  }

  if (dashboardBtn) {
    dashboardBtn.classList.toggle('hidden', !isLoggedIn);
  }
}

// =========================
// AUTHENTICATION
// =========================
window.toggleAuthMode = function(e) {
  e.preventDefault();

  authMode = authMode === 'login' ? 'signup' : 'login';

  document.getElementById('auth-title').innerText =
    authMode === 'login'
      ? 'Login to PinkPages'
      : 'Sign Up for PinkPages';

  document.getElementById('auth-submit-btn').innerText =
    authMode === 'login'
      ? 'Login'
      : 'Sign Up';

  document.getElementById('auth-toggle-text').innerText =
    authMode === 'login'
      ? "Don't have an account?"
      : 'Already have an account?';

  document.getElementById('auth-toggle-btn').innerText =
    authMode === 'login'
      ? 'Sign Up'
      : 'Login';

  document.getElementById('name-group').classList.toggle(
    'hidden',
    authMode === 'login'
  );

  document.getElementById('gcash-group').classList.toggle(
    'hidden',
    authMode === 'login'
  );
};

window.handleAuth = async function(e) {
  e.preventDefault();

  const email = document.getElementById('auth-email').value;
  const password = document.getElementById('auth-password').value;

  if (authMode === 'signup') {
    const fullName = document.getElementById('auth-name').value;
    const gcashNumber = document.getElementById('auth-gcash').value;

    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: fullName,
          gcash_number: gcashNumber
        }
      }
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert(
      'Signup successful! Please check your email to confirm registration.'
    );

  } else {
    const { data, error } =
      await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

    if (error) {
      alert(error.message);
      return;
    }

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

// =========================
// BOOKS
// =========================
async function loadBooks() {
  const { data: books, error } = await supabase
    .from('books')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Books loading error:', error);
    return;
  }

  renderBooks(books || [], 'book-grid');
}

function renderBooks(books, targetElementId) {
  const container = document.getElementById(targetElementId);

  if (!container) {
    return;
  }

  if (!books || books.length === 0) {
    container.innerHTML = '<p>No books available yet.</p>';
    return;
  }

  container.innerHTML = books.map(function(book) {
    return `
      <div class="book-card">
        <img
          src="${book.image_url || ''}"
          alt="${book.title}"
        >

        <h3>${book.title}</h3>

        <p class="author">
          by ${book.author}
        </p>

        <p class="price">
          ₱${Number(book.price).toFixed(2)}
        </p>

        <button
          type="button"
          class="btn btn-outline"
          onclick="viewBookDetails('${book.id}')"
        >
          View Details
        </button>
      </div>
    `;
  }).join('');
}

window.filterBooks = function() {
  const input = document.getElementById('search-input');

  if (!input) {
    return;
  }

  const query = input.value.toLowerCase();

  document
    .querySelectorAll('#book-grid .book-card')
    .forEach(function(card) {

      const title =
        card.querySelector('h3')?.innerText.toLowerCase() || '';

      const author =
        card.querySelector('.author')?.innerText.toLowerCase() || '';

      card.style.display =
        title.includes(query) || author.includes(query)
          ? 'flex'
          : 'none';
    });
};

// =========================
// BOOK DETAILS
// =========================
window.viewBookDetails = async function(bookId) {
  try {
    const { data: book, error } = await supabase
      .from('books')
      .select('*')
      .eq('id', bookId)
      .single();

    if (error) {
      console.error('Book details error:', error);
      alert('Unable to load book details: ' + error.message);
      return;
    }

    if (!book) {
      alert('Book not found.');
      return;
    }

    const container =
      document.getElementById('details-container');

    container.innerHTML = `
      <div style="display:flex; gap:2rem; flex-wrap:wrap;">

        <img
          src="${book.image_url || ''}"
          alt="${book.title}"
          style="max-width:300px; width:100%; border-radius:12px;"
        >

        <div>

          <h2>${book.title}</h2>

          <p class="author">
            Author: ${book.author}
          </p>

          <h3 class="price" style="margin:1rem 0;">
            ₱${Number(book.price).toFixed(2)}
          </h3>

          <p style="margin-bottom:1.5rem;">
            ${book.description || 'No description available.'}
          </p>

          <button
            type="button"
            class="btn btn-primary"
            onclick="initiatePayment(
              '${book.id}',
              ${Number(book.price)},
              '${book.seller_id}'
            )"
          >
            Buy Now with PayMongo
          </button>

        </div>
      </div>
    `;

    document.getElementById('review-book-id').value = bookId;

    document
      .getElementById('add-review-form')
      .classList.toggle('hidden', !currentUser);

    await loadReviews(bookId);

    showSection('book-details');

  } catch (err) {
    console.error('View details error:', err);
    alert('Something went wrong loading this book.');
  }
};

// =========================
// REVIEWS
// =========================
async function loadReviews(bookId) {
  const container =
    document.getElementById('reviews-list');

  const { data: reviews, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('book_id', bookId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Review loading error:', error);
    container.innerHTML =
      '<p>Unable to load reviews.</p>';
    return;
  }

  if (!reviews || reviews.length === 0) {
    container.innerHTML =
      '<p>No reviews yet. Be the first to review!</p>';
    return;
  }

  container.innerHTML = reviews.map(function(r) {
    return `
      <div
        style="
          background:white;
          padding:1rem;
          margin:0.5rem 0;
          border-radius:8px;
        "
      >
        <strong>Customer</strong>

        <span>
          - ${'⭐'.repeat(Number(r.rating))}
        </span>

        <p>${r.comment}</p>
      </div>
    `;
  }).join('');
}

window.handleReviewSubmit = async function(e) {
  e.preventDefault();

  if (!currentUser) {
    alert('Please login to leave a review.');
    return;
  }

  const bookId =
    document.getElementById('review-book-id').value;

  const rating =
    document.getElementById('review-rating').value;

  const comment =
    document.getElementById('review-comment').value;

  const { error } = await supabase
    .from('reviews')
    .insert([{
      book_id: bookId,
      user_id: currentUser.id,
      rating: parseInt(rating),
      comment: comment
    }]);

  if (error) {
    alert(error.message);
    return;
  }

  alert('Review posted!');

  document.getElementById('review-comment').value = '';

  await loadReviews(bookId);
};

// =========================
// SELL BOOK
// =========================
window.handleSellBook = async function(e) {
  e.preventDefault();

  if (!currentUser) {
    alert('Please login to sell products.');
    showSection('auth');
    return;
  }

  const title =
    document.getElementById('book-title').value;

  const author =
    document.getElementById('book-author').value;

  const price =
    document.getElementById('book-price').value;

  const image_url =
    document.getElementById('book-image').value;

  const description =
    document.getElementById('book-desc').value;

  const { error } = await supabase
    .from('books')
    .insert([{
      seller_id: currentUser.id,
      title: title,
      author: author,
      price: price,
      image_url: image_url,
      description: description
    }]);

  if (error) {
    console.error('Book insert error:', error);
    alert(error.message);
    return;
  }

  alert('Book listed successfully!');

  document.getElementById('sell-book-form').reset();

  showSection('dashboard');
};

// =========================
// PAYMONGO
// =========================
window.initiatePayment = async function(
  bookId,
  amount,
  sellerId
) {
  if (!currentUser) {
    alert('Please login to purchase items.');
    showSection('auth');
    return;
  }

  try {
    const response = await fetch(
      '/api/create-checkout',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bookId: bookId,
          amount: amount,
          sellerId: sellerId,
          buyerId: currentUser.id
        })
      }
    );

    const session = await response.json();

    if (session.checkoutUrl) {
      window.location.href = session.checkoutUrl;
    } else {
      alert(
        session.error ||
        'Failed to create payment session.'
      );
    }

  } catch (err) {
    console.error('Payment error:', err);

    alert(
      'Payment initiation failed: ' +
      err.message
    );
  }
};

// =========================
// DASHBOARD
// =========================
async function loadDashboard() {
  if (!currentUser) {
    showSection('auth');
    return;
  }

  document.getElementById('welcome-message').innerText =
    Logged in as: ${currentUser.email};

  // MY LISTINGS
  const { data: myBooks, error: booksError } =
    await supabase
      .from('books')
      .select('*')
      .eq('seller_id', currentUser.id);

  if (booksError) {
    console.error('My books error:', booksError);
  }

  renderBooks(
    myBooks || [],
    'user-books-grid'
  );

  // SALES HISTORY
  const { data: sales, error: salesError } =
    await supabase
      .from('orders')
      .select('*, books(title)')
      .eq('seller_id', currentUser.id);

  if (salesError) {
    console.error('Sales history error:', salesError);
  }

  const salesContainer =
    document.getElementById('sales-history-list');

  if (sales && sales.length) {

    salesContainer.innerHTML =
      sales.map(function(s) {
        return `
          <p>
            Sold
            <strong>
              ${s.books?.title || 'Unknown Book'}
            </strong>

            for ₱${s.amount}

            [Status: ${s.status}]
          </p>
        `;
      }).join('');

  } else {

    salesContainer.innerHTML =
      '<p>No sales history found.</p>';
  }

  // BOUGHT HISTORY
  const { data: bought, error: boughtError } =
    await supabase
      .from('orders')
      .select('*, books(title)')
      .eq('buyer_id', currentUser.id);

  if (boughtError) {
    console.error(
      'Bought history error:',
      boughtError
    );
  }

  const boughtContainer =
    document.getElementById('bought-history-list');

  if (bought && bought.length) {

    boughtContainer.innerHTML =
      bought.map(function(b) {
        return `
          <p>
            Purchased
            <strong>
              ${b.books?.title || 'Unknown Book'}
            </strong>

            for ₱${b.amount}

            [Status: ${b.status}]
          </p>
        `;
      }).join('');

  } else {

    boughtContainer.innerHTML =
      '<p>No purchase history found.</p>';
  }
}

// =========================
// DASHBOARD TABS
// =========================
window.switchDashTab = function(tabName, event) {

  document
    .querySelectorAll('.dash-tab-content')
    .forEach(function(el) {
      el.classList.add('hidden');
    });

  document
    .querySelectorAll('.tab-btn')
    .forEach(function(btn) {
      btn.classList.remove('active');
    });

  const tab =
    document.getElementById(
      'tab-' + tabName
    );

  if (tab) {
    tab.classList.remove('hidden');
  }

  if (event && event.currentTarget) {
    event.currentTarget.classList.add('active');
  }
};
