// SUPABASE CONFIGURATION
const SUPABASE_URL = "https://tmremnyrfhrlusiykjno.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_SFLmJJ1EskVB8Me8DDnYpQ_oxkUKWyp";

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

let currentUser = null;
let authMode = 'login';

// =====================================================
// INITIALIZATION
// =====================================================

document.addEventListener('DOMContentLoaded', async () => {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) {
    console.error('Auth error:', error);
  }

  if (user) {
    currentUser = user;
    updateNavUI(true);
  } else {
    updateNavUI(false);
  }

  await loadBooks();
});

// =====================================================
// NAVIGATION
// =====================================================

window.showSection = function(sectionId) {
  document.querySelectorAll('.page-section').forEach(sec => {
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

// =====================================================
// AUTHENTICATION
// =====================================================

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
      : "Already have an account?";

  document.getElementById('auth-toggle-btn').innerText =
    authMode === 'login'
      ? 'Sign Up'
      : 'Login';

  document
    .getElementById('name-group')
    .classList.toggle('hidden', authMode === 'login');

  document
    .getElementById('gcash-group')
    .classList.toggle('hidden', authMode === 'login');
};

window.handleAuth = async function(e) {
  e.preventDefault();

  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;

  if (authMode === 'signup') {

    const fullName = document
      .getElementById('auth-name')
      .value
      .trim();

    const gcashNumber = document
      .getElementById('auth-gcash')
      .value
      .trim();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
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
        email,
        password
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

  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('Logout error:', error);
  }

  currentUser = null;

  updateNavUI(false);

  showSection('hero');
};

// =====================================================
// BOOK STORE
// =====================================================

async function loadBooks() {

  const { data: books, error } = await supabase
    .from('books')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Load books error:', error);

    const container = document.getElementById('book-grid');

    if (container) {
      container.innerHTML =
        '<p>Unable to load books.</p>';
    }

    return;
  }

  renderBooks(books || [], 'book-grid');
}

// =====================================================
// RENDER BOOKS
// =====================================================

function renderBooks(books, targetElementId) {

  const container =
    document.getElementById(targetElementId);

  if (!container) return;

  if (!books || books.length === 0) {

    container.innerHTML =
      '<p>No books available yet.</p>';

    return;
  }

  container.innerHTML = books.map(book => `

    <div class="book-card">

      <img
        src="${book.image_url}"
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
        class="btn btn-outline"
        onclick="viewBookDetails('${book.id}')"
      >
        View Details
      </button>

    </div>

  `).join('');
}

// =====================================================
// SEARCH
// =====================================================

window.filterBooks = function() {

  const input =
    document.getElementById('search-input');

  if (!input) return;

  const query =
    input.value.toLowerCase();

  document
    .querySelectorAll('#book-grid .book-card')
    .forEach(card => {

      const title =
        card.querySelector('h3')
          ?.innerText
          .toLowerCase() || '';

      const author =
        card.querySelector('.author')
          ?.innerText
          .toLowerCase() || '';

      card.style.display =
        (title.includes(query) ||
         author.includes(query))
          ? 'flex'
          : 'none';
    });
};

// =====================================================
// BOOK DETAILS
// =====================================================

window.viewBookDetails = async function(bookId) {

  try {

    const { data: book, error } =
      await supabase
        .from('books')
        .select('*, profiles(full_name)')
        .eq('id', bookId)
        .single();

    if (error) {

      console.error(
        'Book details error:',
        error
      );

      alert(
        'Unable to load book details: ' +
        error.message
      );

      return;
    }

    if (!book) {

      alert('Book not found.');

      return;
    }

    const container =
      document.getElementById(
        'details-container'
      );

    if (!container) return;

    const isOwner =
      currentUser &&
      currentUser.id === book.seller_id;

    container.innerHTML = `

      <div
        style="
          display:flex;
          gap:2rem;
          flex-wrap:wrap;
        "
      >

        <img
          src="${book.image_url}"
          alt="${book.title}"
          style="
            max-width:300px;
            width:100%;
            border-radius:12px;
          "
        >

        <div>

          <h2>${book.title}</h2>

          <p class="author">
            Author: ${book.author}
          </p>

          <p>
            Seller:
            ${book.profiles?.full_name || 'Anonymous'}
          </p>

          <h3
            class="price"
            style="margin:1rem 0;"
          >
            ₱${Number(book.price).toFixed(2)}
          </h3>

          <p style="margin-bottom:1.5rem;">
            ${book.description || 'No description available.'}
          </p>

          ${
            isOwner

            ? `

              <button
                class="btn btn-outline"
                onclick="deleteBook('${book.id}')"
                style="
                  color:#c0395a;
                  border-color:#c0395a;
                "
              >
                Delete Listing
              </button>

            `

            : `

              <button
                class="btn btn-primary"
                onclick="
                  initiatePayment(
                    '${book.id}',
                    ${Number(book.price)},
                    '${book.seller_id}'
                  )
                "
              >
                Buy Now with PayMongo
              </button>

            `
          }

        </div>

      </div>
    `;

    document.getElementById(
      'review-book-id'
    ).value = bookId;

    document
      .getElementById('add-review-form')
      .classList.toggle(
        'hidden',
        !currentUser
      );

    await loadReviews(bookId);

    showSection('book-details');

  } catch (err) {

    console.error(
      'View details error:',
      err
    );

    alert(
      'Something went wrong loading this book.'
    );
  }
};

// =====================================================
// DELETE BOOK
// =====================================================

window.deleteBook = async function(bookId) {

  if (!currentUser) {

    alert('Please login first.');

    return;
  }

  const confirmed = confirm(
    'Are you sure you want to delete this book listing?'
  );

  if (!confirmed) return;

  const { error } =
    await supabase
      .from('books')
      .delete()
      .eq('id', bookId)
      .eq('seller_id', currentUser.id);

  if (error) {

    console.error(
      'Delete book error:',
      error
    );

    alert(
      'Failed to delete book: ' +
      error.message
    );

    return;
  }

  alert(
    'Book deleted successfully!'
  );

  await loadBooks();

  showSection('dashboard');
};

// =====================================================
// REVIEWS
// =====================================================

async function loadReviews(bookId) {

  const container =
    document.getElementById(
      'reviews-list'
    );

  if (!container) return;

  const { data: reviews, error } =
    await supabase
      .from('reviews')
      .select('*')
      .eq('book_id', bookId)
      .order('created_at', {
        ascending: false
      });

  if (error) {

    console.error(
      'Review loading error:',
      error
    );

    container.innerHTML =
      '<p>Unable to load reviews.</p>';

    return;
  }

  if (!reviews || reviews.length === 0) {

    container.innerHTML =
      '<p>No reviews yet. Be the first to review!</p>';

    return;
  }

  container.innerHTML =
    reviews.map(r => `

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
          - ${'⭐'.repeat(
            Number(r.rating)
          )}
        </span>

        <p>
          ${r.comment}
        </p>

      </div>

    `).join('');
}

// =====================================================
// ADD REVIEW
// =====================================================

window.handleReviewSubmit = async function(e) {

  e.preventDefault();

  if (!currentUser) {

    alert(
      'Please login to leave a review.'
    );

    return;
  }

  const bookId =
    document.getElementById(
      'review-book-id'
    ).value;

  const rating =
    document.getElementById(
      'review-rating'
    ).value;

  const comment =
    document.getElementById(
      'review-comment'
    ).value
    .trim();

  if (!bookId || !comment) {

    alert(
      'Please complete your review.'
    );

    return;
  }

  const { error } =
    await supabase
      .from('reviews')
      .insert([{

        book_id: bookId,

        user_id: currentUser.id,

        rating: parseInt(rating),

        comment: comment

      }]);

  if (error) {

    console.error(
      'Review submit error:',
      error
    );

    alert(
      'Failed to post review: ' +
      error.message
    );

    return;
  }

  alert('Review posted!');

  document.getElementById(
    'review-comment'
  ).value = '';

  await loadReviews(bookId);
};

// =====================================================
// SELL / PUBLISH BOOK
// =====================================================

window.handleSellBook = async function(e) {

  e.preventDefault();

  if (!currentUser) {

    alert(
      'Please login to sell products.'
    );

    showSection('auth');

    return;
  }

  const title =
    document.getElementById(
      'book-title'
    ).value.trim();

  const author =
    document.getElementById(
      'book-author'
    ).value.trim();

  const price =
    document.getElementById(
      'book-price'
    ).value;

  const image_url =
    document.getElementById(
      'book-image'
    ).value.trim();

  const description =
    document.getElementById(
      'book-desc'
    ).value.trim();

  const { error } =
    await supabase
      .from('books')
      .insert([{

        seller_id: currentUser.id,

        title,

        author,

        price,

        image_url,

        description

      }]);

  if (error) {

    console.error(
      'Publish book error:',
      error
    );

    alert(
      'Failed to publish book: ' +
      error.message
    );

    return;
  }

  alert(
    'Book listed successfully!'
  );

  document.getElementById(
    'sell-book-form'
  ).reset();

  showSection('dashboard');
};

// =====================================================
// PAYMONGO
// =====================================================

window.initiatePayment = async function(
  bookId,
  amount,
  sellerId
) {

  if (!currentUser) {

    alert(
      'Please login to purchase items.'
    );

    return;
  }

  try {

    const response =
      await fetch(
        '/api/create-checkout',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json'
          },

          body: JSON.stringify({

            bookId,

            amount,

            sellerId,

            buyerId:
              currentUser.id

          })
        }
      );

    const session =
      await response.json();

    if (session.checkoutUrl) {

      window.location.href =
        session.checkoutUrl;

    } else {

      console.error(
        'Payment response:',
        session
      );

      alert(
        'Failed to create payment session.'
      );
    }

  } catch (err) {

    console.error(
      'Payment error:',
      err
    );

    alert(
      'Payment initiation failed: ' +
      err.message
    );
  }
};

// =====================================================
// DASHBOARD
// =====================================================

async function loadDashboard() {

  if (!currentUser) {

    showSection('auth');

    return;
  }

  document.getElementById(
    'welcome-message'
  ).innerText =
    Logged in as: ${currentUser.email};

  // -----------------------------
  // MY LISTINGS
  // -----------------------------

  const {
    data: myBooks,
    error: booksError
  } = await supabase
    .from('books')
    .select('*')
    .eq(
      'seller_id',
      currentUser.id
    )
    .order('created_at', {
      ascending: false
    });

  if (booksError) {

    console.error(
      'Dashboard books error:',
      booksError
    );

    renderBooks(
      [],
      'user-books-grid'
    );

  } else {

    renderBooks(
      myBooks || [],
      'user-books-grid'
    );
  }

  // -----------------------------
  // SALES HISTORY
  // -----------------------------

  const {
    data: sales,
    error: salesError
  } = await supabase
    .from('orders')
    .select(
      '*, books(title)'
    )
    .eq(
      'seller_id',
      currentUser.id
    )
    .order('created_at', {
      ascending: false
    });

  const salesContainer =
    document.getElementById(
      'sales-history-list'
    );

  if (salesError) {

    console.error(
      'Sales history error:',
      salesError
    );

    salesContainer.innerHTML =
      '<p>Unable to load sales history.</p>';

  } else {

    salesContainer.innerHTML =
      (sales && sales.length)

        ? sales.map(s => `

            <p>
              Sold
              <strong>
                ${s.books?.title || 'Book'}
              </strong>

              for
              ₱${Number(s.amount).toFixed(2)}

              [Status: ${s.status}]
            </p>

          `).join('')

        : '<p>No sales history found.</p>';
  }

  // -----------------------------
  // BOUGHT HISTORY
  // -----------------------------

  const {
    data: bought,
    error: boughtError
  } = await supabase
    .from('orders')
    .select(
      '*, books(title)'
    )
    .eq(
      'buyer_id',
      currentUser.id
    )
    .order('created_at', {
      ascending: false
    });

  const boughtContainer =
    document.getElementById(
      'bought-history-list'
    );

  if (boughtError) {

    console.error(
      'Bought history error:',
      boughtError
    );

    boughtContainer.innerHTML =
      '<p>Unable to load purchase history.</p>';

  } else {

    boughtContainer.innerHTML =
      (bought && bought.length)

        ? bought.map(b => `

            <p>
              Purchased
              <strong>
                ${b.books?.title || 'Book'}
              </strong>

              for
              ₱${Number(b.amount).toFixed(2)}

              [Status: ${b.status}]
            </p>

          `).join('')

        : '<p>No purchase history found.</p>';
  }
}

// =====================================================
// DASHBOARD TABS
// =====================================================

window.switchDashTab = function(
  tabName,
  event
) {

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

  if (
    event &&
    event.currentTarget
  ) {

    event.currentTarget.classList.add(
      'active'
    );

  }
};
