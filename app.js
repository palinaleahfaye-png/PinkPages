window.handleSellBook = async function(e) {
  e.preventDefault();

  // Get the actual logged-in user directly from Supabase
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    alert('Please login first before publishing a book.');
    return;
  }

  const title = document.getElementById('book-title').value.trim();
  const author = document.getElementById('book-author').value.trim();
  const price = parseFloat(document.getElementById('book-price').value);
  const image_url = document.getElementById('book-image').value.trim();
  const description = document.getElementById('book-desc').value.trim();

  if (!title || !author || !price || !image_url || !description) {
    alert('Please complete all fields.');
    return;
  }

  const { data, error } = await supabase
    .from('books')
    .insert([{
      seller_id: user.id,
      title: title,
      author: author,
      price: price,
      image_url: image_url,
      description: description
    }])
    .select()
    .single();

  if (error) {
    console.error('Publish book error:', error);
    alert('Failed to publish book: ' + error.message);
    return;
  }

  alert('Book listed successfully! 📚💕');

  document.getElementById('sell-book-form').reset();

  showSection('dashboard');
};
// SUPABASE CONFIGURATION
const SUPABASE_URL = "https://tmremnyrfhrlusiykjno.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_SFLmJJ1EskVB8Me8DDnYpQ_oxkUKWyp";

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

let currentUser = null;
let authMode = 'login';

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
  document.getElementById('nav-login-btn').classList.toggle(
    'hidden',
    isLoggedIn
  );

  document.getElementById('nav-logout-btn').classList.toggle(
    'hidden',
    !isLoggedIn
  );

  document.getElementById('nav-dashboard').classList.toggle(
    'hidden',
    !isLoggedIn
  );
}

// AUTHENTICATION LOGIC
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

    const { error } = await supabase.auth.signUp({
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
    .order('created_at', {
      ascending: false
    });

  if (error) {
    console.error('Load books error:', error);
    return;
  }

  renderBooks(books || [], 'book-grid');
}

function renderBooks(books, targetElementId) {
  const container =
    document.getElementById(targetElementId);

  if (!container) return;

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
        ₱${parseFloat(book.price).toFixed(2)}
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

window.filterBooks = function() {
  const query =
    document.getElementById('search-input').value
      .toLowerCase();

  document
    .querySelectorAll('#book-grid .book-card')
    .forEach(card => {

      const title =
        card.querySelector('h3')
          .innerText
          .toLowerCase();

      const author =
        card.querySelector('.author')
          .innerText
          .toLowerCase();

      card.style.display =
        (title.includes(query) ||
         author.includes(query))
          ? 'flex'
          : 'none';
    });
};

// BOOK DETAILS, REVIEWS & PAYMONGO
window.viewBookDetails = async function(bookId) {

  const { data: book, error } =
    await supabase
      .from('books')
      .select('*, profiles(full_name)')
      .eq('id', bookId)
      .single();

  if (error || !book) {
    console.error(error);
    return;
  }

  const container =
    document.getElementById('details-container');

  container.innerHTML = `
    <div style="
      display: flex;
      gap: 2rem;
      flex-wrap: wrap;
    ">

      <img
        src="${book.image_url}"
        style="
          max-width: 300px;
          border-radius: 12px;
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
          style="margin: 1rem 0;"
        >
          ₱${parseFloat(book.price).toFixed(2)}
        </h3>

        <p style="margin-bottom: 1.5rem;">
          ${book.description}
        </p>

        <button
          class="btn btn-primary"
          onclick="
            initiatePayment(
              '${book.id}',
              ${book.price},
              '${book.seller_id}'
            )
          "
        >
          Buy Now with PayMongo
        </button>

      </div>
    </div>
  `;

  document.getElementById('review-book-id').value =
    bookId;

  document.getElementById('add-review-form')
    .classList.toggle(
      'hidden',
      !currentUser
    );

  loadReviews(bookId);

  showSection('book-details');
};

// REVIEWS
async function loadReviews(bookId) {

  const { data: reviews, error } =
    await supabase
      .from('reviews')
      .select('*, profiles(full_name)')
      .eq('book_id', bookId);

  if (error) {
    console.error(error);
  }

  const container =
    document.getElementById('reviews-list');

  if (!reviews || reviews.length === 0) {

    container.innerHTML =
      '<p>No reviews yet. Be the first to review!</p>';

    return;
  }

  container.innerHTML = reviews.map(r => `
    <div style="
      background: white;
      padding: 1rem;
      margin: 0.5rem 0;
      border-radius: 8px;
    ">

      <strong>
        ${r.profiles?.full_name || 'User'}
      </strong>

      -
      ${'⭐'.repeat(r.rating)}

      <p>
        ${r.comment}
      </p>

    </div>
  `).join('');
}

window.handleReviewSubmit = async function(e) {

  e.preventDefault();

  const bookId =
    document.getElementById('review-book-id').value;

  const rating =
    document.getElementById('review-rating').value;

  const comment =
    document.getElementById('review-comment').value;

  if (!currentUser) {
    alert('Please login to leave a review.');
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
    alert(error.message);
    return;
  }

  alert('Review posted!');

  loadReviews(bookId);
};

// SELL NEW PRODUCT
window.handleSellBook = async function(e) {

  e.preventDefault();

  // Get the real authenticated user
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    alert(
      'Please login first before publishing a book.'
    );
    return;
  }

  const title =
    document.getElementById('book-title')
      .value
      .trim();

  const author =
    document.getElementById('book-author')
      .value
      .trim();

  const price =
    parseFloat(
      document.getElementById('book-price').value
    );

  const image_url =
    document.getElementById('book-image')
      .value
      .trim();

  const description =
    document.getElementById('book-desc')
      .value
      .trim();

  if (
    !title ||
    !author ||
    !price ||
    !image_url ||
    !description
  ) {
    alert('Please complete all fields.');
    return;
  }

  const { error } =
    await supabase
      .from('books')
      .insert([{
        seller_id: user.id,
        title: title,
        author: author,
        price: price,
        image_url: image_url,
        description: description
      }]);

  if (error) {

    console.error(
      'Publish book error:',
      error
    );

    alert(
      'Publish failed: ' +
      error.message
    );

    return;
  }

  alert(
    'Book listed successfully! 📚💕'
  );

  document
    .getElementById('sell-book-form')
    .reset();

  showSection('dashboard');
};

// PAYMONGO PAYMENT PROCESS
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
            buyerId: currentUser.id
          })
        }
      );

    const session =
      await response.json();

    if (session.checkoutUrl) {

      window.location.href =
        session.checkoutUrl;

    } else {

      alert(
        'Failed to create payment session.'
      );
    }

  } catch (err) {

    alert(
      'Payment initiation failed: ' +
      err.message
    );
  }
};

// DASHBOARD MANAGEMENT
async function loadDashboard() {

  if (!currentUser) {
    showSection('auth');
    return;
  }

  document.getElementById(
    'welcome-message'
  ).innerText =
    Logged in as: ${currentUser.email};

  // User's own product listings
  const {
    data: myBooks,
    error: myBooksError
  } = await supabase
    .from('books')
    .select('*')
    .eq('seller_id', currentUser.id);

  if (myBooksError) {
    console.error(
      'My books error:',
      myBooksError
    );
  }

  renderBooks(
    myBooks || [],
    'user-books-grid'
  );

  // Sales History
  const {
    data: sales,
    error: salesError
  } = await supabase
    .from('orders')
    .select('*, books(title)')
    .eq(
      'seller_id',
      currentUser.id
    );

  if (salesError) {
    console.error(
      'Sales history error:',
      salesError
    );
  }

  document.getElementById(
    'sales-history-list'
  ).innerHTML =
    (sales && sales.length)
      ? sales.map(s => `
          <p>
            Sold
            <strong>
              ${s.books?.title}
            </strong>
            for ₱${s.amount}
            [Status: ${s.status}]
          </p>
        `).join('')
      : '<p>No sales history found.</p>';

  // Bought History
  const {
    data: bought,
    error: boughtError
  } = await supabase
    .from('orders')
    .select('*, books(title)')
    .eq(
      'buyer_id',
      currentUser.id
    );

  if (boughtError) {
    console.error(
      'Bought history error:',
      boughtError
    );
  }

  document.getElementById(
    'bought-history-list'
  ).innerHTML =
    (bought && bought.length)
      ? bought.map(b => `
          <p>
            Purchased
            <strong>
              ${b.books?.title}
            </strong>
            for ₱${b.amount}
            [Status: ${b.status}]
          </p>
        `).join('')
      : '<p>No purchase history found.</p>';
}

// DASHBOARD TABS
window.switchDashTab = function(
  tabName,
  event
) {

  document
    .querySelectorAll('.dash-tab-content')
    .forEach(el => {
      el.classList.add('hidden');
    });

  document
    .querySelectorAll('.tab-btn')
    .forEach(btn => {
      btn.classList.remove('active');
    });

  const tab =
    document.getElementById(
      tab-${tabName}
    );

  if (tab) {
    tab.classList.remove('hidden');
  }

  if (event) {
    event.currentTarget.classList.add(
      'active'
    );
  }
};
