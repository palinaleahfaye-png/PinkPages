```javascript
// =====================================================
// PINKPAGES - APP.JS
// =====================================================

// SUPABASE CONFIGURATION
const SUPABASE_URL = "https://tmremnyrfhrlusiykjno.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_SFLmJJ1EskVB8Me8DDnYpQ_oxkUKWyp";

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

let currentUser = null;
let authMode = "login";

// =====================================================
// INITIALIZATION
// =====================================================

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      console.error("Auth error:", error);
      currentUser = null;
      updateNavUI(false);
    } else if (data && data.user) {
      currentUser = data.user;
      updateNavUI(true);
    } else {
      currentUser = null;
      updateNavUI(false);
    }

    await loadBooks();
  } catch (error) {
    console.error("Initialization error:", error);
  }
});

// =====================================================
// NAVIGATION
// =====================================================

window.showSection = function (sectionId) {
  document.querySelectorAll(".page-section").forEach(function (section) {
    section.classList.add("hidden");
  });

  const target = document.getElementById(sectionId);

  if (target) {
    target.classList.remove("hidden");
  } else {
    console.error("Section not found:", sectionId);
  }

  if (sectionId === "browse") {
    loadBooks();
  }

  if (sectionId === "dashboard") {
    loadDashboard();
  }
};

// =====================================================
// NAVIGATION UI
// =====================================================

function updateNavUI(isLoggedIn) {
  const loginBtn = document.getElementById("nav-login-btn");
  const logoutBtn = document.getElementById("nav-logout-btn");
  const dashboardBtn = document.getElementById("nav-dashboard");

  if (loginBtn) {
    loginBtn.classList.toggle("hidden", isLoggedIn);
  }

  if (logoutBtn) {
    logoutBtn.classList.toggle("hidden", !isLoggedIn);
  }

  if (dashboardBtn) {
    dashboardBtn.classList.toggle("hidden", !isLoggedIn);
  }
}

// =====================================================
// AUTHENTICATION
// =====================================================

window.toggleAuthMode = function (e) {
  if (e) {
    e.preventDefault();
  }

  authMode = authMode === "login" ? "signup" : "login";

  const title = document.getElementById("auth-title");
  const submitBtn = document.getElementById("auth-submit-btn");
  const toggleText = document.getElementById("auth-toggle-text");
  const toggleBtn = document.getElementById("auth-toggle-btn");
  const nameGroup = document.getElementById("name-group");
  const gcashGroup = document.getElementById("gcash-group");

  if (title) {
    title.innerText =
      authMode === "login"
        ? "Login to PinkPages"
        : "Sign Up for PinkPages";
  }

  if (submitBtn) {
    submitBtn.innerText =
      authMode === "login"
        ? "Login"
        : "Sign Up";
  }

  if (toggleText) {
    toggleText.innerText =
      authMode === "login"
        ? "Don't have an account?"
        : "Already have an account?";
  }

  if (toggleBtn) {
    toggleBtn.innerText =
      authMode === "login"
        ? "Sign Up"
        : "Login";
  }

  if (nameGroup) {
    nameGroup.classList.toggle("hidden", authMode === "login");
  }

  if (gcashGroup) {
    gcashGroup.classList.toggle("hidden", authMode === "login");
  }
};

window.handleAuth = async function (e) {
  if (e) {
    e.preventDefault();
  }

  const emailElement = document.getElementById("auth-email");
  const passwordElement = document.getElementById("auth-password");

  if (!emailElement || !passwordElement) {
    alert("Login form could not be found.");
    return;
  }

  const email = emailElement.value.trim();
  const password = passwordElement.value;

  if (!email || !password) {
    alert("Please enter your email and password.");
    return;
  }

  try {
    if (authMode === "signup") {
      const nameElement = document.getElementById("auth-name");
      const gcashElement = document.getElementById("auth-gcash");

      const fullName = nameElement ? nameElement.value.trim() : "";
      const gcashNumber = gcashElement ? gcashElement.value.trim() : "";

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
        "Signup successful! Please check your email to confirm registration."
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

      showSection("dashboard");
    }

  } catch (error) {
    console.error("Authentication error:", error);
    alert("Something went wrong. Please try again.");
  }
};

// =====================================================
// LOGOUT
// =====================================================

window.handleLogout = async function () {
  try {
    await supabase.auth.signOut();

    currentUser = null;

    updateNavUI(false);

    showSection("hero");

  } catch (error) {
    console.error("Logout error:", error);
    alert("Unable to logout.");
  }
};

// =====================================================
// LOAD BOOKS
// =====================================================

async function loadBooks() {
  const container = document.getElementById("book-grid");

  try {
    const { data: books, error } = await supabase
      .from("books")
      .select("*")
      .order("created_at", {
        ascending: false
      });

    if (error) {
      console.error("Load books error:", error);

      if (container) {
        container.innerHTML =
          "<p>Unable to load books right now.</p>";
      }

      return;
    }

    renderBooks(books || [], "book-grid");

  } catch (error) {
    console.error("Unexpected load books error:", error);
  }
}

// =====================================================
// RENDER BOOKS
// =====================================================

function renderBooks(books, targetElementId) {
  const container = document.getElementById(targetElementId);

  if (!container) {
    console.error("Book container not found:", targetElementId);
    return;
  }

  if (!books || books.length === 0) {
    container.innerHTML = "<p>No books available yet.</p>";
    return;
  }

  container.innerHTML = books
    .map(function (book) {
      const safeTitle = book.title || "Untitled Book";
      const safeAuthor = book.author || "Unknown Author";
      const safeImage =
        book.image_url ||
        "https://via.placeholder.com/300x400?text=No+Cover";

      const safePrice = Number(book.price || 0).toFixed(2);

      return `
        <div class="book-card">

          <img
            src="${safeImage}"
            alt="${safeTitle}"
          >

          <h3>${safeTitle}</h3>

          <p class="author">
            by ${safeAuthor}
          </p>

          <p class="price">
            ₱${safePrice}
          </p>

          <button
            type="button"
            class="btn btn-outline"
            onclick="window.viewBookDetails('${book.id}')"
          >
            View Details
          </button>

        </div>
      `;
    })
    .join("");
}

// =====================================================
// SEARCH / FILTER
// =====================================================

window.filterBooks = function () {
  const searchInput = document.getElementById("search-input");

  if (!searchInput) {
    return;
  }

  const query = searchInput.value.toLowerCase().trim();

  document
    .querySelectorAll("#book-grid .book-card")
    .forEach(function (card) {

      const titleElement = card.querySelector("h3");
      const authorElement = card.querySelector(".author");

      const title = titleElement
        ? titleElement.innerText.toLowerCase()
        : "";

      const author = authorElement
        ? authorElement.innerText.toLowerCase()
        : "";

      card.style.display =
        title.includes(query) || author.includes(query)
          ? "flex"
          : "none";
    });
};

// =====================================================
// VIEW BOOK DETAILS
// =====================================================

window.viewBookDetails = async function (bookId) {

  console.log("Opening book:", bookId);

  try {

    const { data: book, error } = await supabase
      .from("books")
      .select("*")
      .eq("id", bookId)
      .single();

    if (error) {
      console.error("Book details error:", error);

      alert(
        "Unable to load book details: " +
        error.message
      );

      return;
    }

    if (!book) {
      alert("Book not found.");
      return;
    }

    const container =
      document.getElementById("details-container");

    if (!container) {
      console.error(
        "details-container was not found in HTML."
      );

      alert(
        "Book details section is missing from the page."
      );

      return;
    }

    const image =
      book.image_url ||
      "https://via.placeholder.com/300x400?text=No+Cover";

    const price =
      Number(book.price || 0).toFixed(2);

    container.innerHTML = `

      <div
        style="
          display:flex;
          gap:2rem;
          flex-wrap:wrap;
          align-items:flex-start;
        "
      >

        <img
          src="${image}"
          alt="${book.title || "Book"}"
          style="
            max-width:300px;
            width:100%;
            border-radius:12px;
          "
        >

        <div>

          <h2>
            ${book.title || "Untitled Book"}
          </h2>

          <p class="author">
            Author: ${book.author || "Unknown Author"}
          </p>

          <h3
            class="price"
            style="margin:1rem 0;"
          >
            ₱${price}
          </h3>

          <p style="margin-bottom:1.5rem;">
            ${
              book.description ||
              "No description available."
            }
          </p>

          <button
            type="button"
            class="btn btn-primary"
            onclick="
              window.initiatePayment(
                '${book.id}',
                ${Number(book.price || 0)},
                '${book.seller_id}'
              )
            "
          >
            Buy Now with PayMongo
          </button>

        </div>

      </div>

    `;

    // Review form
    const reviewBookId =
      document.getElementById("review-book-id");

    if (reviewBookId) {
      reviewBookId.value = bookId;
    }

    const reviewForm =
      document.getElementById("add-review-form");

    if (reviewForm) {
      reviewForm.classList.toggle(
        "hidden",
        !currentUser
      );
    }

    await loadReviews(bookId);

    showSection("book-details");

  } catch (error) {

    console.error(
      "Unexpected view details error:",
      error
    );

    alert(
      "Something went wrong loading this book."
    );
  }
};

// =====================================================
// REVIEWS
// =====================================================

async function loadReviews(bookId) {

  const container =
    document.getElementById("reviews-list");

  if (!container) {
    console.error("reviews-list not found.");
    return;
  }

  try {

    const { data: reviews, error } =
      await supabase
        .from("reviews")
        .select("*")
        .eq("book_id", bookId)
        .order("created_at", {
          ascending: false
        });

    if (error) {

      console.error(
        "Review loading error:",
        error
      );

      container.innerHTML =
        "<p>Unable to load reviews.</p>";

      return;
    }

    if (!reviews || reviews.length === 0) {

      container.innerHTML =
        "<p>No reviews yet. Be the first to review!</p>";

      return;
    }

    container.innerHTML = reviews
      .map(function (review) {

        const rating =
          Math.max(
            0,
            Math.min(
              5,
              Number(review.rating || 0)
            )
          );

        return `
          <div
            style="
              background:white;
              padding:1rem;
              margin:0.5rem 0;
              border-radius:8px;
            "
          >

            <strong>
              Customer
            </strong>

            <span>
              - ${"⭐".repeat(rating)}
            </span>

            <p>
              ${review.comment || ""}
            </p>

          </div>
        `;
      })
      .join("");

  } catch (error) {

    console.error(
      "Unexpected review error:",
      error
    );

    container.innerHTML =
      "<p>Unable to load reviews.</p>";
  }
}

// =====================================================
// SUBMIT REVIEW
// =====================================================

window.handleReviewSubmit = async function (e) {

  if (e) {
    e.preventDefault();
  }

  if (!currentUser) {
    alert("Please login to leave a review.");
    return;
  }

  const bookId =
    document.getElementById("review-book-id").value;

  const rating =
    document.getElementById("review-rating").value;

  const comment =
    document.getElementById("review-comment").value.trim();

  if (!bookId) {
    alert("Book information is missing.");
    return;
  }

  if (!rating) {
    alert("Please select a rating.");
    return;
  }

  if (!comment) {
    alert("Please write a comment.");
    return;
  }

  try {

    const { error } =
      await supabase
        .from("reviews")
        .insert([
          {
            book_id: bookId,
            user_id: currentUser.id,
            rating: parseInt(rating),
            comment: comment
          }
        ]);

    if (error) {
      console.error(
        "Review insert error:",
        error
      );

      alert(error.message);
      return;
    }

    alert("Review posted!");

    document.getElementById(
      "review-comment"
    ).value = "";

    await loadReviews(bookId);

  } catch (error) {

    console.error(
      "Unexpected review error:",
      error
    );

    alert(
      "Something went wrong posting your review."
    );
  }
};

// =====================================================
// SELL BOOK
// =====================================================

window.handleSellBook = async function (e) {

  if (e) {
    e.preventDefault();
  }

  if (!currentUser) {
    alert("Please login to sell products.");
    return;
  }

  const title =
    document.getElementById("book-title").value.trim();

  const author =
    document.getElementById("book-author").value.trim();

  const price =
    document.getElementById("book-price").value;

  const image_url =
    document.getElementById("book-image").value.trim();

  const description =
    document.getElementById("book-desc").value.trim();

  if (!title || !author || !price) {
    alert(
      "Please complete the title, author, and price."
    );
    return;
  }

  try {

    const { error } =
      await supabase
        .from("books")
        .insert([
          {
            seller_id: currentUser.id,
            title: title,
            author: author,
            price: Number(price),
            image_url: image_url,
            description: description
          }
        ]);

    if (error) {

      console.error(
        "Sell book error:",
        error
      );

      alert(error.message);
      return;
    }

    alert("Book listed successfully!");

    await loadDashboard();

    showSection("dashboard");

  } catch (error) {

    console.error(
      "Unexpected sell error:",
      error
    );

    alert(
      "Something went wrong listing your book."
    );
  }
};

// =====================================================
// PAYMONGO
// =====================================================

window.initiatePayment = async function (
  bookId,
  amount,
  sellerId
) {

  if (!currentUser) {
    alert("Please login to purchase items.");
    return;
  }

  try {

    const response =
      await fetch("/api/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          bookId: bookId,
          amount: amount,
          sellerId: sellerId,
          buyerId: currentUser.id
        })
      });

    if (!response.ok) {
      throw new Error(
        "Payment server returned an error."
      );
    }

    const session =
      await response.json();

    if (session.checkoutUrl) {

      window.location.href =
        session.checkoutUrl;

    } else {

      alert(
        "Failed to create payment session."
      );
    }

  } catch (error) {

    console.error(
      "Payment error:",
      error
    );

    alert(
      "Payment initiation failed: " +
      error.message
    );
  }
};

// =====================================================
// DASHBOARD
// =====================================================

async function loadDashboard() {

  if (!currentUser) {
    showSection("auth");
    return;
  }

  try {

    const welcome =
      document.getElementById(
        "welcome-message"
      );

    if (welcome) {
      welcome.innerText =
        "Logged in as: " +
        currentUser.email;
    }

    // -------------------------------
    // MY PRODUCTS
    // -------------------------------

    const {
      data: myBooks,
      error: booksError
    } = await supabase
      .from("books")
      .select("*")
      .eq(
        "seller_id",
        currentUser.id
      )
      .order("created_at", {
        ascending: false
      });

    if (booksError) {

      console.error(
        "My products error:",
        booksError
      );

      const myBooksContainer =
        document.getElementById(
          "user-books-grid"
        );

      if (myBooksContainer) {
        myBooksContainer.innerHTML =
          "<p>Unable to load your products.</p>";
      }

    } else {

      renderBooks(
        myBooks || [],
        "user-books-grid"
      );
    }

    // -------------------------------
    // SALES HISTORY
    // -------------------------------

    const {
      data: sales,
      error: salesError
    } = await supabase
      .from("orders")
      .select("*, books(title)")
      .eq(
        "seller_id",
        currentUser.id
      );

    const salesContainer =
      document.getElementById(
        "sales-history-list"
      );

    if (salesContainer) {

      if (salesError) {

        console.error(
          "Sales history error:",
          salesError
        );

        salesContainer.innerHTML =
          "<p>Unable to load sales history.</p>";

      } else if (
        sales &&
        sales.length > 0
      ) {

        salesContainer.innerHTML =
          sales
            .map(function (sale) {

              return `
                <p>
                  Sold
                  <strong>
                    ${
                      sale.books?.title ||
                      "Unknown Book"
                    }
                  </strong>

                  for
                  ₱${sale.amount}

                  [Status:
                  ${sale.status}]
                </p>
              `;
            })
            .join("");

      } else {

        salesContainer.innerHTML =
          "<p>No sales history found.</p>";
      }
    }

    // -------------------------------
    // PURCHASE HISTORY
    // -------------------------------

    const {
      data: bought,
      error: boughtError
    } = await supabase
      .from("orders")
      .select("*, books(title)")
      .eq(
        "buyer_id",
        currentUser.id
      );

    const boughtContainer =
      document.getElementById(
        "bought-history-list"
      );

    if (boughtContainer) {

      if (boughtError) {

        console.error(
          "Purchase history error:",
          boughtError
        );

        boughtContainer.innerHTML =
          "<p>Unable to load purchase history.</p>";

      } else if (
        bought &&
        bought.length > 0
      ) {

        boughtContainer.innerHTML =
          bought
            .map(function (purchase) {

              return `
                <p>
                  Purchased
                  <strong>
                    ${
                      purchase.books?.title ||
                      "Unknown Book"
                    }
                  </strong>

                  for
                  ₱${purchase.amount}

                  [Status:
                  ${purchase.status}]
                </p>
              `;
            })
            .join("");

      } else {

        boughtContainer.innerHTML =
          "<p>No purchase history found.</p>";
      }
    }

  } catch (error) {

    console.error(
      "Dashboard error:",
      error
    );
  }
}

// =====================================================
// DASHBOARD TABS
// =====================================================

window.switchDashTab = function (
  tabName,
  event
) {

  document
    .querySelectorAll(".dash-tab-content")
    .forEach(function (element) {
      element.classList.add("hidden");
    });

  document
    .querySelectorAll(".tab-btn")
    .forEach(function (button) {
      button.classList.remove("active");
    });

  const tab =
    document.getElementById(
      "tab-" + tabName
    );

  if (tab) {
    tab.classList.remove("hidden");
  }

  // IMPORTANT:
  // Only use event if HTML actually passes it.
  if (
    event &&
    event.currentTarget
  ) {
    event.currentTarget.classList.add(
      "active"
    );
  }
};

// =====================================================
// SUPABASE AUTH STATE
// =====================================================

supabase.auth.onAuthStateChange(
  function (event, session) {

    if (session && session.user) {

      currentUser =
        session.user;

      updateNavUI(true);

    } else {

      currentUser = null;

      updateNavUI(false);
    }
  }
);
```
