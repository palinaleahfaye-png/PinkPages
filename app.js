```javascript
// ==========================================
// SUPABASE CONFIGURATION
// ==========================================

const SUPABASE_URL = "https://tmremnyrfhrlusiykjno.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_SFLmJJ1EskVB8Me8DDnYpQ_oxkUKWyp";

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

let currentUser = null;
let authMode = "login";


// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener("DOMContentLoaded", async function () {
  try {
    const {
      data: { user },
      error
    } = await supabase.auth.getUser();

    if (error) {
      console.error("Auth error:", error);
    }

    if (user) {
      currentUser = user;
      updateNavUI(true);
    } else {
      updateNavUI(false);
    }

    await loadBooks();

  } catch (err) {
    console.error("Initialization error:", err);
  }
});


// ==========================================
// NAVIGATION
// ==========================================

window.showSection = function (sectionId) {

  document
    .querySelectorAll(".page-section")
    .forEach(function (section) {
      section.classList.add("hidden");
    });

  const target = document.getElementById(sectionId);

  if (target) {
    target.classList.remove("hidden");
  }

  if (sectionId === "browse") {
    loadBooks();
  }

  if (sectionId === "dashboard") {
    loadDashboard();
  }
};


// ==========================================
// NAVIGATION UI
// ==========================================

function updateNavUI(isLoggedIn) {

  const loginBtn =
    document.getElementById("nav-login-btn");

  const logoutBtn =
    document.getElementById("nav-logout-btn");

  const dashboardBtn =
    document.getElementById("nav-dashboard");

  if (loginBtn) {
    loginBtn.classList.toggle(
      "hidden",
      isLoggedIn
    );
  }

  if (logoutBtn) {
    logoutBtn.classList.toggle(
      "hidden",
      !isLoggedIn
    );
  }

  if (dashboardBtn) {
    dashboardBtn.classList.toggle(
      "hidden",
      !isLoggedIn
    );
  }
}


// ==========================================
// AUTHENTICATION
// ==========================================

window.toggleAuthMode = function (e) {

  if (e) {
    e.preventDefault();
  }

  authMode =
    authMode === "login"
      ? "signup"
      : "login";

  const title =
    document.getElementById("auth-title");

  const submitBtn =
    document.getElementById("auth-submit-btn");

  const toggleText =
    document.getElementById("auth-toggle-text");

  const toggleBtn =
    document.getElementById("auth-toggle-btn");

  const nameGroup =
    document.getElementById("name-group");

  const gcashGroup =
    document.getElementById("gcash-group");

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
    nameGroup.classList.toggle(
      "hidden",
      authMode === "login"
    );
  }

  if (gcashGroup) {
    gcashGroup.classList.toggle(
      "hidden",
      authMode === "login"
    );
  }
};


window.handleAuth = async function (e) {

  e.preventDefault();

  const emailElement =
    document.getElementById("auth-email");

  const passwordElement =
    document.getElementById("auth-password");

  if (!emailElement || !passwordElement) {
    alert("Login form could not be found.");
    return;
  }

  const email =
    emailElement.value.trim();

  const password =
    passwordElement.value;

  if (!email || !password) {
    alert(
      "Please enter your email and password."
    );
    return;
  }


  // SIGN UP
  if (authMode === "signup") {

    const nameElement =
      document.getElementById("auth-name");

    const gcashElement =
      document.getElementById("auth-gcash");

    const fullName =
      nameElement
        ? nameElement.value.trim()
        : "";

    const gcashNumber =
      gcashElement
        ? gcashElement.value.trim()
        : "";

    const {
      data,
      error
    } = await supabase.auth.signUp({

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

    return;
  }


  // LOGIN
  const {
    data,
    error
  } = await supabase.auth.signInWithPassword({

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
};


// ==========================================
// LOGOUT
// ==========================================

window.handleLogout = async function () {

  try {

    const { error } =
      await supabase.auth.signOut();

    if (error) {
      console.error(
        "Logout error:",
        error
      );
    }

  } catch (err) {
    console.error(err);
  }

  currentUser = null;

  updateNavUI(false);

  showSection("hero");
};


// ==========================================
// BOOKS
// ==========================================

async function loadBooks() {

  const {
    data: books,
    error
  } = await supabase
    .from("books")
    .select("*")
    .order(
      "created_at",
      {
        ascending: false
      }
    );

  if (error) {

    console.error(
      "Load books error:",
      error
    );

    return;
  }

  renderBooks(
    books || [],
    "book-grid"
  );
}


// ==========================================
// RENDER BOOKS
// ==========================================

function renderBooks(
  books,
  targetElementId
) {

  const container =
    document.getElementById(
      targetElementId
    );

  if (!container) {

    console.warn(
      "Book container not found:",
      targetElementId
    );

    return;
  }

  if (!books || books.length === 0) {

    container.innerHTML =
      "<p>No books available.</p>";

    return;
  }

  container.innerHTML =
    books.map(function (book) {

      return `

        <div class="book-card">

          <img
            src="${book.image_url || ""}"
            alt="${book.title || "Book"}"
          >

          <h3>
            ${book.title || "Untitled Book"}
          </h3>

          <p class="author">
            by ${book.author || "Unknown Author"}
          </p>

          <p class="price">
            ₱${Number(book.price || 0).toFixed(2)}
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

    }).join("");
}


// ==========================================
// SEARCH / FILTER BOOKS
// ==========================================

window.filterBooks = function () {

  const searchInput =
    document.getElementById(
      "search-input"
    );

  if (!searchInput) return;

  const query =
    searchInput.value
      .toLowerCase()
      .trim();

  document
    .querySelectorAll(
      "#book-grid .book-card"
    )
    .forEach(function (card) {

      const title =
        card.querySelector("h3")
          ?.innerText
          .toLowerCase() || "";

      const author =
        card.querySelector(".author")
          ?.innerText
          .toLowerCase() || "";

      if (
        title.includes(query) ||
        author.includes(query)
      ) {
        card.style.display = "flex";
      } else {
        card.style.display = "none";
      }

    });
};


// ==========================================
// VIEW BOOK DETAILS
// ==========================================

window.viewBookDetails = async function (
  bookId
) {

  try {

    const {
      data: book,
      error
    } = await supabase
      .from("books")
      .select("*")
      .eq("id", bookId)
      .single();

    if (error) {

      console.error(
        "Book details error:",
        error
      );

      alert(
        "Unable to load book details: " +
        error.message
      );

      return;
    }

    if (!book) {

      alert(
        "Book not found."
      );

      return;
    }

    const container =
      document.getElementById(
        "details-container"
      );

    if (!container) {

      console.error(
        "details-container not found"
      );

      return;
    }

    container.innerHTML = `

      <div
        style="
          display:flex;
          gap:2rem;
          flex-wrap:wrap;
        "
      >

        <img
          src="${book.image_url || ""}"
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
            Author:
            ${book.author || "Unknown"}
          </p>

          <h3
            class="price"
            style="margin:1rem 0;"
          >
            ₱${Number(book.price || 0).toFixed(2)}
          </h3>

          <p
            style="margin-bottom:1.5rem;"
          >
            ${
              book.description ||
              "No description available."
            }
          </p>

          <button
            type="button"
            class="btn btn-primary"
            onclick="initiatePayment(
              '${book.id}',
              ${Number(book.price || 0)},
              '${book.seller_id}'
            )"
          >
            Buy Now with PayMongo
          </button>

        </div>

      </div>

    `;

    const reviewBookId =
      document.getElementById(
        "review-book-id"
      );

    if (reviewBookId) {
      reviewBookId.value = bookId;
    }

    const reviewForm =
      document.getElementById(
        "add-review-form"
      );

    if (reviewForm) {

      reviewForm.classList.toggle(
        "hidden",
        !currentUser
      );
    }

    await loadReviews(bookId);

    showSection(
      "book-details"
    );

  } catch (err) {

    console.error(
      "View details error:",
      err
    );

    alert(
      "Something went wrong loading this book."
    );
  }
};


// ==========================================
// LOAD REVIEWS
// ==========================================

async function loadReviews(
  bookId
) {

  const container =
    document.getElementById(
      "reviews-list"
    );

  if (!container) return;

  const {
    data: reviews,
    error
  } = await supabase
    .from("reviews")
    .select("*")
    .eq("book_id", bookId)
    .order(
      "created_at",
      {
        ascending: false
      }
    );

  if (error) {

    console.error(
      "Review loading error:",
      error
    );

    container.innerHTML =
      "<p>Unable to load reviews.</p>";

    return;
  }

  if (
    !reviews ||
    reviews.length === 0
  ) {

    container.innerHTML =
      "<p>No reviews yet. Be the first to review!</p>";

    return;
  }

  container.innerHTML =
    reviews.map(function (r) {

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
            -
            ${
              "⭐".repeat(
                Number(r.rating) || 0
              )
            }
          </span>

          <p>
            ${r.comment || ""}
          </p>

        </div>

      `;

    }).join("");
}


// ==========================================
// SUBMIT REVIEW
// ==========================================

window.handleReviewSubmit =
  async function (e) {

    e.preventDefault();

    if (!currentUser) {

      alert(
        "Please login to post a review."
      );

      return;
    }

    const bookId =
      document.getElementById(
        "review-book-id"
      )?.value;

    const rating =
      document.getElementById(
        "review-rating"
      )?.value;

    const comment =
      document.getElementById(
        "review-comment"
      )?.value
        .trim();

    if (
      !bookId ||
      !rating ||
      !comment
    ) {

      alert(
        "Please complete your review."
      );

      return;
    }

    const {
      error
    } = await supabase
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
        "Review submit error:",
        error
      );

      alert(
        error.message
      );

      return;
    }

    alert(
      "Review posted!"
    );

    const commentBox =
      document.getElementById(
        "review-comment"
      );

    if (commentBox) {
      commentBox.value = "";
    }

    await loadReviews(
      bookId
    );
  };


// ==========================================
// SELL NEW BOOK
// ==========================================

window.handleSellBook =
  async function (e) {

    e.preventDefault();

    if (!currentUser) {

      alert(
        "Please login to sell products."
      );

      return;
    }

    const title =
      document.getElementById(
        "book-title"
      )?.value
        .trim();

    const author =
      document.getElementById(
        "book-author"
      )?.value
        .trim();

    const price =
      document.getElementById(
        "book-price"
      )?.value;

    const image_url =
      document.getElementById(
        "book-image"
      )?.value
        .trim();

    const description =
      document.getElementById(
        "book-desc"
      )?.value
        .trim();

    if (
      !title ||
      !author ||
      !price
    ) {

      alert(
        "Please complete the required fields."
      );

      return;
    }

    const {
      error
    } = await supabase
      .from("books")
      .insert([
        {
          seller_id: currentUser.id,
          title: title,
          author: author,
          price: price,
          image_url: image_url,
          description: description
        }
      ]);

    if (error) {

      console.error(
        "Sell book error:",
        error
      );

      alert(
        error.message
      );

      return;
    }

    alert(
      "Book listed successfully!"
    );

    showSection(
      "dashboard"
    );
  };


// ==========================================
// PAYMONGO PAYMENT
// ==========================================

window.initiatePayment =
  async function (
    bookId,
    amount,
    sellerId
  ) {

    if (!currentUser) {

      alert(
        "Please login to purchase items."
      );

      return;
    }

    try {

      const response =
        await fetch(
          "/api/create-checkout",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({

              bookId: bookId,

              amount: amount,

              sellerId: sellerId,

              buyerId:
                currentUser.id

            })
          }
        );

      if (!response.ok) {

        throw new Error(
          "Payment server returned " +
          response.status
        );
      }

      const session =
        await response.json();

      if (
        session.checkoutUrl
      ) {

        window.location.href =
          session.checkoutUrl;

      } else {

        console.error(
          "Payment response:",
          session
        );

        alert(
          "Failed to create payment session."
        );
      }

    } catch (err) {

      console.error(
        "Payment error:",
        err
      );

      alert(
        "Payment initiation failed: " +
        err.message
      );
    }
  };


// ==========================================
// DASHBOARD
// ==========================================

async function loadDashboard() {

  if (!currentUser) {

    showSection(
      "auth"
    );

    return;
  }

  const welcome =
    document.getElementById(
      "welcome-message"
    );

  if (welcome) {

    welcome.innerText =
      `Logged in as: ${currentUser.email}`;
  }


  // ----------------------------------------
  // MY BOOKS
  // ----------------------------------------

  const {
    data: myBooks,
    error: booksError
  } = await supabase
    .from("books")
    .select("*")
    .eq(
      "seller_id",
      currentUser.id
    );

  if (booksError) {

    console.error(
      "Dashboard books error:",
      booksError
    );
  }

  renderBooks(
    myBooks || [],
    "user-books-grid"
  );


  // ----------------------------------------
  // SALES HISTORY
  // ----------------------------------------

  const {
    data: sales,
    error: salesError
  } = await supabase
    .from("orders")
    .select(
      "*, books(title)"
    )
    .eq(
      "seller_id",
      currentUser.id
    );

  if (salesError) {

    console.error(
      "Sales history error:",
      salesError
    );
  }

  const salesContainer =
    document.getElementById(
      "sales-history-list"
    );

  if (salesContainer) {

    salesContainer.innerHTML =
      sales && sales.length

        ? sales.map(function (s) {

            return `

              <p>

                Sold

                <strong>
                  ${
                    s.books?.title ||
                    "Book"
                  }
                </strong>

                for

                ₱${Number(
                  s.amount || 0
                ).toFixed(2)}

                [Status:
                ${
                  s.status ||
                  "Pending"
                }]

              </p>

            `;

          }).join("")

        : "<p>No sales history found.</p>";
  }


  // ----------------------------------------
  // PURCHASE HISTORY
  // ----------------------------------------

  const {
    data: bought,
    error: boughtError
  } = await supabase
    .from("orders")
    .select(
      "*, books(title)"
    )
    .eq(
      "buyer_id",
      currentUser.id
    );

  if (boughtError) {

    console.error(
      "Purchase history error:",
      boughtError
    );
  }

  const boughtContainer =
    document.getElementById(
      "bought-history-list"
    );

  if (boughtContainer) {

    boughtContainer.innerHTML =
      bought && bought.length

        ? bought.map(function (b) {

            return `

              <p>

                Purchased

                <strong>
                  ${
                    b.books?.title ||
                    "Book"
                  }
                </strong>

                for

                ₱${Number(
                  b.amount || 0
                ).toFixed(2)}

                [Status:
                ${
                  b.status ||
                  "Pending"
                }]

              </p>

            `;

          }).join("")

        : "<p>No purchase history found.</p>";
  }
}


// ==========================================
// DASHBOARD TABS
// ==========================================

window.switchDashTab =
  function (
    tabName,
    event
  ) {

    document
      .querySelectorAll(
        ".dash-tab-content"
      )
      .forEach(function (el) {

        el.classList.add(
          "hidden"
        );

      });


    document
      .querySelectorAll(
        ".tab-btn"
      )
      .forEach(function (btn) {

        btn.classList.remove(
          "active"
        );

      });


    const tab =
      document.getElementById(
        "tab-" + tabName
      );

    if (tab) {

      tab.classList.remove(
        "hidden"
      );
    }


    if (
      event &&
      event.currentTarget
    ) {

      event.currentTarget.classList.add(
        "active"
      );
    }
  };


// ==========================================
// SUPABASE AUTH STATE LISTENER
// ==========================================

supabase.auth.onAuthStateChange(
  function (event, session) {

    if (session?.user) {

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
