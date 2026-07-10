const apiBase = "/api";

const getToken = () => localStorage.getItem("homeSellingToken");
const setToken = (token) => localStorage.setItem("homeSellingToken", token);
const clearToken = () => localStorage.removeItem("homeSellingToken");

const decodeToken = (token) => {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch (error) {
    return null;
  }
};

const getTokenPayload = () => {
  const token = getToken();
  return token ? decodeToken(token) : null;
};

const getUserId = (user) => user?._id || user?.id || user?.userId || "";

const isAdminUser = () => {
  const payload = getTokenPayload();
  return payload?.isAdmin === true;
};

const getAuthHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const showMessage = (message, type = "success") => {
  const messageBox = document.getElementById("messageBox");
  if (!messageBox) {
    alert(message);
    return;
  }
  messageBox.innerHTML = `<div class="alert alert-${type} mt-3">${message}</div>`;
};

const isLebanesePhone = (phone) => {
  if (!phone) return false;

  const cleaned = phone.replace(/[\s\-()]/g, "");

  return /^(?:\+961|00961|961)?(?:3\d{6}|(?:70|71|76|78|79|81)\d{6})$|^0(?:3\d{6}|(?:70|71|76|78|79|81)\d{6})$/.test(
    cleaned,
  );
};

const renderNav = () => {
  const navAuth = document.getElementById("navAuth");
  if (!navAuth) return;

  const token = getToken();
  if (token) {
    navAuth.innerHTML = `
      <li class="nav-item"><a class="nav-link" href="homes.html">Homes</a></li>
      <li class="nav-item"><a class="nav-link" href="favorites.html">Favorites</a></li>
      <li class="nav-item"><a class="nav-link" href="my-listings.html">My Listings</a></li>
      <li class="nav-item"><a class="nav-link" href="add-home.html">Add Home</a></li>
      <li class="nav-item"><a class="nav-link" href="my-chats.html">Messages</a></li>
      <li class="nav-item"><a class="nav-link" href="profile.html">Profile</a></li>
      ${isAdminUser() ? '<li class="nav-item"><a class="nav-link" href="admin-dashboard.html">Admin</a></li>' : ""}
      <li class="nav-item"><a class="nav-link" id="logoutLink" href="index.html">Logout</a></li>
    `;
  } else {
    navAuth.innerHTML = `
      <li class="nav-item"><a class="nav-link" href="homes.html">Homes</a></li>
      <li class="nav-item"><a class="nav-link" href="auth.html">Login</a></li>

    `;
  }

  const logoutLink = document.getElementById("logoutLink");
  if (logoutLink) {
    logoutLink.addEventListener("click", (event) => {
      event.preventDefault();
      clearToken();
      window.location.href = "index.html";
    });
  }
};

const parseQuery = () => {
  const params = new URLSearchParams(window.location.search);
  return Object.fromEntries(params.entries());
};

const fetchHomes = async () => {
  try {
    const response = await fetch(`${apiBase}/homes`);
    return await response.json();
  } catch (error) {
    console.error(error);
    return [];
  }
};

const fetchUserFavorites = async () => {
  try {
    const response = await fetch(`${apiBase}/users/favorites`, {
      headers: { ...getAuthHeaders() },
    });
    if (response.ok) {
      const favorites = await response.json();
      return favorites.map((home) => home._id);
    }
    return [];
  } catch (error) {
    console.error(error);
    return [];
  }
};

const fetchUsers = async () => {
  try {
    const response = await fetch(`${apiBase}/users`, {
      headers: { ...getAuthHeaders() },
    });
    if (!response.ok) {
      return [];
    }
    return await response.json();
  } catch (error) {
    console.error(error);
    return [];
  }
};

const createAdminUser = async (name, email, phone, password) => {
  try {
    const response = await fetch(`${apiBase}/auth/admin`, {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, phone, password }),
    });

    return { ok: response.ok, data: await response.json() };
  } catch (error) {
    console.error(error);
    return { ok: false, data: { message: "Could not create admin", error } };
  }
};

const setUserAdminStatus = async (userId, isAdmin) => {
  try {
    const response = await fetch(`${apiBase}/users/${userId}/admin`, {
      method: "PATCH",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ isAdmin }),
    });

    return { ok: response.ok, data: await response.json() };
  } catch (error) {
    console.error(error);
    return { ok: false, data: { message: "Failed to update admin status" } };
  }
};

const deleteUser = async (userId) => {
  try {
    const response = await fetch(`${apiBase}/users/${userId}`, {
      method: "DELETE",
      headers: { ...getAuthHeaders() },
    });

    return { ok: response.ok, data: await response.json() };
  } catch (error) {
    console.error(error);
    return { ok: false, data: { message: "Unable to delete user" } };
  }
};

const formatCurrency = (value) => {
  return `$${Number(value || 0).toLocaleString()}`;
};

const getDaysAgo = (dateValue) => {
  const date = new Date(dateValue);
  const diff = Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / 86400000),
  );
  if (diff === 0) return "today";
  if (diff === 1) return "1 day ago";
  return `${diff} days ago`;
};

const createHomeCard = (home, showFavorite = true) => {
  const imageUrl = home.mainImage || home.images?.[0] || "images/no-image.jpg";

  const publishDate = home.createdAt
    ? new Date(home.createdAt).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Unknown date";

  return `
    <div class="col-md-6 col-lg-4 mb-4">
      <div class="card home-card h-100">
        <img src="${imageUrl}" class="property-image w-100" alt="${home.title}" />

        <div class="card-body">
          <h5 class="card-title">${home.title}</h5>

          <p class="text-muted mb-1">${home.location}</p>

          <small class="text-muted d-block mb-2">
            Posted on ${publishDate}
          </small>

          <p class="h5 text-brand mb-3">
            $${home.price.toLocaleString()}
          </p>

          <div class="d-flex justify-content-between small text-muted mb-3">
            <span>${home.bedrooms} bd</span>
            <span>${home.bathrooms} ba</span>
            <span>${home.area} sqft</span>
          </div>

          <div class="d-flex justify-content-between align-items-center">
            <button
              type="button"
              class="btn btn-outline-dark btn-sm view-details-btn"
              data-id="${home._id}"
            >
              View details
            </button>

            ${
              showFavorite
                ? `<button class="btn btn-light btn-sm favorite-btn" data-id="${home._id}">&#9825;</button>`
                : ""
            }
          </div>
        </div>
      </div>
    </div>
  `;
};

const attachFavoriteButtons = () => {
  document.querySelectorAll(".favorite-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const homeId = button.dataset.id;
      const isLiked = button.classList.contains("liked");
      const method = isLiked ? "DELETE" : "POST";
      try {
        const response = await fetch(`${apiBase}/users/favorites/${homeId}`, {
          method,
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
        });
        const data = await response.json();
        if (!response.ok) {
          return showMessage(
            data.message || "Please login to manage favorites",
            "danger",
          );
        }
        if (isLiked) {
          button.classList.remove("liked");
          button.innerHTML = "&#9825;";
          showMessage("Removed from favorites");
        } else {
          button.classList.add("liked");
          button.innerHTML = "&#9829;";
          showMessage("Added to favorites");
        }
      } catch (error) {
        console.error(error);
        showMessage("Unable to update favorite", "danger");
      }
    });
  });
};

const setFavoriteStates = async () => {
  const favoriteIds = await fetchUserFavorites();
  document.querySelectorAll(".favorite-btn").forEach((button) => {
    const homeId = button.dataset.id;
    if (favoriteIds.includes(homeId)) {
      button.classList.add("liked");
      button.innerHTML = "&#9829;";
    }
  });
};

const attachDetailButtons = () => {
  document.querySelectorAll(".view-details-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const homeId = button.dataset.id;
      await openHomeDetailsModal(homeId);
    });
  });
};

const openHomeDetailsModal = async (homeId) => {
  try {
    const response = await fetch(`${apiBase}/homes/${homeId}`);
    const home = await response.json();

    if (!response.ok) {
      return showMessage(home.message || "Unable to load details", "danger");
    }

    let modalContainer = document.getElementById("detailsModalContainer");
    if (!modalContainer) {
      modalContainer = document.createElement("div");
      modalContainer.id = "detailsModalContainer";
      document.body.appendChild(modalContainer);
    }

    modalContainer.innerHTML = `
      <div class="modal fade" id="homeDetailsModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header border-0">
              <div>
                <h5 class="modal-title">${home.title}</h5>
                <p class="text-muted mb-1">${home.location}</p>
                <p class="text-brand mb-0">Contact: ${home.ownerPhone}</p>
              </div>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>

            <div class="modal-body">
              <div id="homeDetailsCarousel" class="carousel slide mb-4" data-bs-ride="carousel">
                <div class="carousel-inner rounded overflow-hidden shadow-sm">
                  ${
                    home.images.length
                      ? home.images
                          .map(
                            (src, index) => `
                              <div class="carousel-item ${index === 0 ? "active" : ""}">
                                <img src="${src}" class="d-block w-100 detail-carousel-image" alt="${home.title}" />
                              </div>
                            `,
                          )
                          .join("")
                      : `
                        <div class="carousel-item active">
                          <img src="https://via.placeholder.com/800x450?text=No+Image" class="d-block w-100 detail-carousel-image" alt="No image" />
                        </div>
                      `
                  }
                </div>

                ${
                  home.images.length > 1
                    ? `
                      <button class="carousel-control-prev" type="button" data-bs-target="#homeDetailsCarousel" data-bs-slide="prev">
                        <span class="carousel-control-prev-icon"></span>
                      </button>

                      <button class="carousel-control-next" type="button" data-bs-target="#homeDetailsCarousel" data-bs-slide="next">
                        <span class="carousel-control-next-icon"></span>
                      </button>
                    `
                    : ""
                }
              </div>

              ${
                home.images.length > 1
                  ? `
                    <div class="row g-2 mb-4 details-thumbnails">
                      ${home.images
                        .map(
                          (src, index) => `
                            <div class="col-3">
                              <img
                                src="${src}"
                                class="img-fluid rounded thumbnail-image"
                                data-bs-target="#homeDetailsCarousel"
                                data-bs-slide-to="${index}"
                                alt="${home.title}"
                              />
                            </div>
                          `,
                        )
                        .join("")}
                    </div>
                  `
                  : ""
              }

              ${
                home.videos?.length
                  ? `
      <div class="mb-4">
        <h5 class="mb-3">Property Videos</h5>
        <div class="row g-3">
          ${home.videos
            .map(
              (video) => `
                <div class="col-md-6">
                  <video controls class="w-100 rounded shadow-sm">
                    <source src="${video}" type="video/mp4">
                    Your browser does not support the video tag.
                  </video>
                </div>
              `,
            )
            .join("")}
        </div>
      </div>
    `
                  : ""
              }
              <p class="text-muted mb-3">${home.description}</p>

              <div class="row mb-3">
                <div class="col-6">
                  <strong>Price</strong><br />
                  $${home.price.toLocaleString()}
                </div>

                <div class="col-6">
                  <strong>Area</strong><br />
                  ${home.area} sqft
                </div>
              </div>

              <div class="row text-muted mb-3">
                <div class="col-6 mb-2">
                  Bedrooms: <strong>${home.bedrooms}</strong>
                </div>

                <div class="col-6 mb-2">
                  Bathrooms: <strong>${home.bathrooms}</strong>
                </div>
              </div>

              <button
                class="btn btn-brand w-100 start-chat-btn"
                data-id="${home._id}"
              >
                Chat with Owner
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    const modalElement = document.getElementById("homeDetailsModal");
    const modal = new bootstrap.Modal(modalElement);
    modal.show();

    document
      .querySelector(".start-chat-btn")
      ?.addEventListener("click", async () => {
        if (!getToken()) {
          window.location.href = "auth.html";
          return;
        }

        try {
          const chatResponse = await fetch(
            `${apiBase}/chat/start/${home._id}`,
            {
              method: "POST",
              headers: {
                ...getAuthHeaders(),
              },
            },
          );

          const chatData = await chatResponse.json();
          console.log("CHAT RESPONSE:", chatData);
          console.log("STATUS:", chatResponse.status);
          if (!chatResponse.ok) {
            return showMessage(
              chatData.message || "Could not start chat",
              "danger",
            );
          }

          window.location.href = `chat.html?id=${chatData._id}`;
        } catch (error) {
          console.error(error);
          showMessage("Could not open chat", "danger");
        }
      });
  } catch (error) {
    console.error(error);
    showMessage("Unable to open details", "danger");
  }
};

const loadFeaturedHomes = async () => {
  const container = document.getElementById("featuredHomes");
  if (!container) return;
  const homes = await fetchHomes();
  container.innerHTML = homes
    .slice(0, 3)
    .map((home) => createHomeCard(home))
    .join("");
  attachFavoriteButtons();
  attachDetailButtons();
  setFavoriteStates();
};

const loadHomesPage = async () => {
  const homesGrid = document.getElementById("homesGrid");
  const searchInput = document.getElementById("searchInput");
  if (!homesGrid) return;

  const homes = await fetchHomes();
  const renderList = (list) => {
    homesGrid.innerHTML = list.length
      ? list.map((home) => createHomeCard(home)).join("")
      : '<div class="col-12"><p class="text-muted">No homes found.</p></div>';
    attachFavoriteButtons();
    attachDetailButtons();
    setFavoriteStates();
  };

  renderList(homes);
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const value = searchInput.value.toLowerCase().trim();
      const searchWords = value.split(/\s+/).filter(Boolean);

      const filtered = homes.filter((home) => {
        const searchTarget = `${home.title} ${home.location}`.toLowerCase();
        return searchWords.every((word) => searchTarget.includes(word));
      });

      renderList(filtered);
    });
  }
};

const loadHomeDetailsPage = async () => {
  const detailContainer = document.getElementById("detailsContainer");
  const params = parseQuery();
  if (!detailContainer || !params.id) return;

  try {
    const response = await fetch(`${apiBase}/homes/${params.id}`);
    const home = await response.json();
    if (!response.ok) {
      return (detailContainer.innerHTML =
        '<p class="text-danger">Property not found.</p>');
    }

    const hasImages = home.images.length > 0;
    const images = hasImages
      ? home.images
          .map(
            (src) =>
              `<div class="col-md-4 mb-3"><img src="${src}" class="img-fluid rounded" alt="${home.title}" /></div>`,
          )
          .join("")
      : '<p class="text-muted">No images available.</p>';

    const galleryButton = hasImages
      ? `<button type="button" class="btn btn-brand mb-4" data-bs-toggle="modal" data-bs-target="#galleryModal">View gallery</button>`
      : "";

    detailContainer.innerHTML = `
      <div class="row mb-4">
        <div class="col-md-8">
          <h2>${home.title}</h2>
          <p class="text-muted">${home.location}</p>
        </div>
        <div class="col-md-4 text-md-end">
          <p class="h4 text-brand">$${home.price.toLocaleString()}</p>
        </div>
      </div>
      ${galleryButton}
      <div class="row mb-4">${images}</div>
      <div class="bg-white rounded shadow-sm p-4">
        <h5>Property details</h5>
        <p>${home.description}</p>
        <div class="row text-muted">
          <div class="col-sm-4 mb-3">Bedrooms: <strong>${home.bedrooms}</strong></div>
          <div class="col-sm-4 mb-3">Bathrooms: <strong>${home.bathrooms}</strong></div>
          <div class="col-sm-4 mb-3">Area: <strong>${home.area} sqft</strong></div>
        </div>
      </div>
    `;

    const modalContainer = document.getElementById("modalContainer");
    if (modalContainer && hasImages) {
      modalContainer.innerHTML = `
        <div class="modal fade" id="galleryModal" tabindex="-1" aria-hidden="true">
          <div class="modal-dialog modal-xl modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-header">
                <div>
                  <h5 class="modal-title">${home.title}</h5>
                  <p class="text-muted mb-0">${home.location}</p>
                </div>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body">
                <div id="galleryCarousel" class="carousel slide" data-bs-ride="carousel">
                  <div class="carousel-indicators">
                    ${home.images
                      .map(
                        (src, index) =>
                          `<button type="button" data-bs-target="#galleryCarousel" data-bs-slide-to="${index}" ${index === 0 ? 'class="active" aria-current="true"' : ""} aria-label="Slide ${index + 1}"></button>`,
                      )
                      .join("")}
                  </div>
                  <div class="carousel-inner">
                    ${home.images
                      .map(
                        (src, index) =>
                          `<div class="carousel-item ${index === 0 ? "active" : ""}">
                             <img src="${src}" class="d-block w-100 rounded" alt="${home.title} image ${index + 1}" />
                           </div>`,
                      )
                      .join("")}
                  </div>
                  <button class="carousel-control-prev" type="button" data-bs-target="#galleryCarousel" data-bs-slide="prev">
                    <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                    <span class="visually-hidden">Previous</span>
                  </button>
                  <button class="carousel-control-next" type="button" data-bs-target="#galleryCarousel" data-bs-slide="next">
                    <span class="carousel-control-next-icon" aria-hidden="true"></span>
                    <span class="visually-hidden">Next</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }
  } catch (error) {
    console.error(error);
    detailContainer.innerHTML =
      '<p class="text-danger">Error loading details.</p>';
  }
};

const loadFavoritesPage = async () => {
  const favoritesGrid = document.getElementById("favoritesGrid");

  if (!favoritesGrid) return;

  try {
    const response = await fetch(`${apiBase}/users/favorites`, {
      headers: {
        ...getAuthHeaders(),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      showMessage(data.message || "Please login to view favorites", "danger");
      return;
    }

    if (!data.length) {
      favoritesGrid.innerHTML = `
        <div class="col-12">
          <div class="alert alert-light border">
            No favorite homes yet.
          </div>
        </div>
      `;
      return;
    }

    favoritesGrid.innerHTML = data
      .map((home) => createHomeCard(home, true))
      .join("");

    attachFavoriteButtons();
    attachDetailButtons();
    setFavoriteStates();
  } catch (error) {
    console.error(error);

    favoritesGrid.innerHTML = `
      <div class="col-12">
        <div class="alert alert-danger">
          Unable to load favorites.
        </div>
      </div>
    `;
  }
};

const createMyListingCard = (home) => {
  const imageUrl = home.mainImage || home.images?.[0] || "images/no-image.jpg";

  return `
    <div class="col-md-6 col-lg-4 mb-4">
      <div class="card home-card h-100">
        <img src="${imageUrl}" class="property-image w-100" alt="${home.title}" />
        <div class="card-body">
          <h5 class="card-title">${home.title}</h5>
          <p class="text-muted mb-2">${home.location}</p>
          <p class="text-brand mb-2">$${home.price.toLocaleString()}</p>
          <p class="small text-muted mb-3">Contact: ${home.ownerPhone}</p>
          <div class="d-flex justify-content-between align-items-center mb-3">
            <button type="button" class="btn btn-outline-dark btn-sm view-details-btn" data-id="${home._id}">View</button>
            <div>
              <a href="add-home.html?id=${home._id}" class="btn btn-sm btn-outline-brand me-2">Edit</a>
              <button class="btn btn-sm btn-danger delete-my-home" data-id="${home._id}">Delete</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
};

const createDraftListingCard = (home) => {
  const imageUrl = home.mainImage || home.images?.[0] || "images/no-image.jpg";

  return `
    <div class="col-md-6 col-lg-4 mb-4">
      <div class="card home-card h-100 border-warning">
        <div class="position-absolute top-0 end-0 p-2">
          <span class="badge bg-warning text-dark">Draft</span>
        </div>
        <img src="${imageUrl}" class="property-image w-100" alt="${home.title}" />
        <div class="card-body">
          <h5 class="card-title">${home.title}</h5>
          <p class="text-muted mb-2">${home.location}</p>
          <p class="text-brand mb-2">$${home.price.toLocaleString()}</p>
          <p class="small text-muted mb-3">Contact: ${home.ownerPhone}</p>
          <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <button type="button" class="btn btn-outline-dark btn-sm view-details-btn" data-id="${home._id}">View</button>
            <div class="d-flex gap-2">
              <a href="add-home.html?id=${home._id}" class="btn btn-sm btn-outline-brand">Edit</a>
              <button class="btn btn-sm btn-success publish-draft-btn" data-id="${home._id}">Publish</button>
              <button class="btn btn-sm btn-danger delete-my-home" data-id="${home._id}">Delete</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
};

const loadMyListingsPage = async () => {
  const publishedGrid = document.getElementById("publishedListingsGrid");
  const draftsGrid = document.getElementById("draftsListingsGrid");

  if (!publishedGrid || !draftsGrid) return;

  // Check if user is logged in
  if (!getToken()) {
    publishedGrid.innerHTML =
      '<div class="col-12"><p class="text-danger">Please log in to view your listings.</p></div>';
    draftsGrid.innerHTML =
      '<div class="col-12"><p class="text-danger">Please log in to view your drafts.</p></div>';
    return;
  }

  try {
    const response = await fetch(`${apiBase}/homes/my`, {
      headers: { ...getAuthHeaders() },
    });
    const data = await response.json();
    if (!response.ok) {
      publishedGrid.innerHTML =
        '<div class="col-12"><p class="text-danger">Unable to load your listings.</p></div>';
      draftsGrid.innerHTML =
        '<div class="col-12"><p class="text-danger">Unable to load your drafts.</p></div>';
      return;
    }

    // Separate published and draft homes
    const publishedHomes = data.filter((home) => home.status !== "draft");
    const draftHomes = data.filter((home) => home.status === "draft");

    // Render published homes
    publishedGrid.innerHTML = publishedHomes.length
      ? publishedHomes.map((home) => createMyListingCard(home)).join("")
      : '<div class="col-12"><p class="text-muted">You have no published homes yet.</p></div>';

    // Render draft homes
    draftsGrid.innerHTML = draftHomes.length
      ? draftHomes.map((home) => createDraftListingCard(home)).join("")
      : '<div class="col-12"><p class="text-muted">You have no draft homes yet.</p></div>';

    attachDetailButtons();

    // Handle delete buttons for both published and draft homes
    document.querySelectorAll(".delete-my-home").forEach((button) => {
      button.addEventListener("click", async () => {
        const homeId = button.dataset.id;
        try {
          const response = await fetch(`${apiBase}/homes/${homeId}`, {
            method: "DELETE",
            headers: { ...getAuthHeaders() },
          });
          const result = await response.json();
          if (!response.ok) {
            return showMessage(
              result.message || "Unable to delete home",
              "danger",
            );
          }
          showMessage("Home deleted successfully");
          loadMyListingsPage();
        } catch (error) {
          console.error(error);
          showMessage("Failed to delete home", "danger");
        }
      });
    });

    // Handle publish draft buttons
    document.querySelectorAll(".publish-draft-btn").forEach((button) => {
      button.addEventListener("click", async () => {
        const homeId = button.dataset.id;
        try {
          const response = await fetch(`${apiBase}/homes/${homeId}/publish`, {
            method: "POST",
            headers: { ...getAuthHeaders() },
          });
          const result = await response.json();
          if (!response.ok) {
            return showMessage(
              result.message || "Unable to publish home",
              "danger",
            );
          }
          showMessage("Home published successfully");
          loadMyListingsPage();
        } catch (error) {
          console.error(error);
          showMessage("Failed to publish home", "danger");
        }
      });
    });
  } catch (error) {
    console.error(error);
    const publishedGrid = document.getElementById("publishedListingsGrid");
    const draftsGrid = document.getElementById("draftsListingsGrid");
    if (publishedGrid) {
      publishedGrid.innerHTML =
        '<div class="col-12"><p class="text-danger">Unable to load your listings.</p></div>';
    }
    if (draftsGrid) {
      draftsGrid.innerHTML =
        '<div class="col-12"><p class="text-danger">Unable to load your drafts.</p></div>';
    }
  }
};

const handleLoginPage = () => {
  const loginForm = document.getElementById("loginForm");
  if (!loginForm) return;

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = loginForm.email.value.trim();
    const password = loginForm.password.value.trim();

    try {
      const response = await fetch(`${apiBase}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        return showMessage(data.message || "Login failed", "danger");
      }
      setToken(data.token);
      window.location.href = "homes.html";
    } catch (error) {
      console.error(error);
      showMessage("Unable to login", "danger");
    }
  });
};

const handleRegisterPage = () => {
  const registerForm = document.getElementById("registerForm");
  if (!registerForm) return;

  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = registerForm.name.value.trim();
    const email = registerForm.email.value.trim();
    const phone = registerForm.phone.value.trim();
    const password = registerForm.password.value.trim();
    const confirmPassword = registerForm.confirmPassword.value.trim();

    const registerMessageBox = document.getElementById("registerMessageBox");

    if (password !== confirmPassword) {
      registerMessageBox.innerHTML = `<div style="color:red;">Passwords do not match.</div>`;
      return;
    }

    try {
      const response = await fetch(`${apiBase}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        registerMessageBox.innerHTML = `<div style="color:red;">${data.message || "Registration failed"}</div>`;
        return;
      }

      setToken(data.token);
      window.location.href = "homes.html";
    } catch (error) {
      console.error(error);
      registerMessageBox.innerHTML = `<div style="color:red;">Unable to register</div>`;
    }
  });
};

const handleAddHomePage = async () => {
  const homeForm = document.getElementById("homeForm");
  if (!homeForm) return;

  // Check if user is logged in
  if (!getToken()) {
    window.location.href = "auth.html";
    return;
  }

  window.selectedImages = [];

  const imagesInput = document.getElementById("imagesInput");
  const mainImageIndex = document.getElementById("mainImageIndex");
  const preview = document.getElementById("newImagesPreview");

  const renderSelectedImages = () => {
    if (!mainImageIndex || !preview) return;

    preview.innerHTML = "";
    mainImageIndex.innerHTML = "";

    if (!window.selectedImages.length) {
      mainImageIndex.innerHTML = `<option value="0">Image 1</option>`;
      return;
    }

    window.selectedImages.forEach((file, index) => {
      const url = URL.createObjectURL(file);

      mainImageIndex.innerHTML += `
        <option value="${index}">
          Image ${index + 1} - ${file.name}
        </option>
      `;

      preview.innerHTML += `
        <div class="col-md-4">
          <div class="border rounded p-2 h-100">
            <img
              src="${url}"
              class="media-preview-img rounded mb-2"
              alt="New image"
            />

            <p class="small text-muted mb-2">${file.name}</p>

            <button
              type="button"
              class="btn btn-sm btn-danger"
              onclick="removeSelectedImage(${index})"
            >
              Remove
            </button>
          </div>
        </div>
      `;
    });
  };

  imagesInput?.addEventListener("change", () => {
    window.selectedImages.push(...Array.from(imagesInput.files));
    imagesInput.value = "";
    renderSelectedImages();
  });

  window.removeSelectedImage = (index) => {
    window.selectedImages.splice(index, 1);
    renderSelectedImages();
  };

  const params = parseQuery();
  const isEdit = Boolean(params.id);

  const formTitle = document.getElementById("formTitle");
  if (isEdit && formTitle) {
    formTitle.innerText = "Edit Home Listing";
  }

  if (isEdit) {
    try {
      const response = await fetch(`${apiBase}/homes/${params.id}`);
      const home = await response.json();

      if (response.ok) {
        homeForm.title.value = home.title;
        homeForm.location.value = home.location;
        homeForm.price.value = home.price;
        homeForm.bedrooms.value = home.bedrooms;
        homeForm.bathrooms.value = home.bathrooms;
        homeForm.area.value = home.area;
        homeForm.description.value = home.description;
        homeForm.ownerPhone.value = home.ownerPhone || "";

        const existingImagesBox = document.getElementById("existingImagesBox");
        const existingVideosBox = document.getElementById("existingVideosBox");

        if (existingImagesBox && home.images?.length) {
          existingImagesBox.innerHTML = `
            <label class="form-label">Existing Images</label>
            <div class="row g-3">
              ${home.images
                .map(
                  (img) => `
                    <div class="col-md-4">
                      <div class="border rounded p-2 h-100">
                        <img src="${img}" class="media-preview-img rounded mb-2" />

                        <div class="form-check">
                          <input
                            class="form-check-input"
                            type="checkbox"
                            name="deleteImages"
                            value="${img}"
                          />
                          <label class="form-check-label">
                            Delete image
                          </label>
                        </div>

                        <div class="form-check">
                          <input
                            class="form-check-input"
                            type="radio"
                            name="selectedMainImage"
                            value="${img}"
                            ${home.mainImage === img ? "checked" : ""}
                          />
                          <label class="form-check-label">
                            Main image
                          </label>
                        </div>
                      </div>
                    </div>
                  `,
                )
                .join("")}
            </div>
          `;
        }

        if (existingVideosBox && home.videos?.length) {
          existingVideosBox.innerHTML = `
            <label class="form-label">Existing Videos</label>
            <div class="row g-3">
              ${home.videos
                .map(
                  (video) => `
                    <div class="col-md-6">
                      <div class="border rounded p-2 h-100">
                        <video controls class="media-video rounded mb-2">
                          <source src="${video}" type="video/mp4">
                        </video>

                        <div class="form-check">
                          <input
                            class="form-check-input"
                            type="checkbox"
                            name="deleteVideos"
                            value="${video}"
                          />
                          <label class="form-check-label">
                            Delete video
                          </label>
                        </div>
                      </div>
                    </div>
                  `,
                )
                .join("")}
            </div>
          `;
        }
      }
    } catch (error) {
      console.error(error);
    }
  }

  homeForm.addEventListener("submit", async (event) => {
    event.preventDefault();
  });

  const submitHomeForm = async (status) => {
    const formData = new FormData(homeForm);
    formData.append("status", status);

    if (window.selectedImages?.length) {
      window.selectedImages.forEach((file) => {
        formData.append("images", file);
      });
    }

    const ownerPhone = homeForm.ownerPhone?.value.trim();
    if (ownerPhone && !isLebanesePhone(ownerPhone)) {
      return showMessage(
        "Phone must be a valid Lebanese number, e.g. +96170123456 or 03123456.",
        "danger",
      );
    }

    const url = isEdit ? `${apiBase}/homes/${params.id}` : `${apiBase}/homes`;

    const method = isEdit ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: formData,
      });

      const contentType = response.headers.get("content-type") || "";
      const data = contentType.includes("application/json")
        ? await response.json()
        : { message: await response.text() };
      console.log("SAVE HOME RESPONSE:", data);
      console.log("SAVE HOME STATUS:", response.status);
      if (!response.ok) {
        return showMessage(
          data.message || `Could not save home (${response.status})`,
          "danger",
        );
      }

      const statusText = status === "draft" ? "saved as draft" : "posted";
      showMessage(`Home ${statusText} successfully`);
      window.location.href = "my-listings.html";
    } catch (error) {
      console.error(error);
      showMessage(
        "Submission failed: network error or server is unavailable",
        "danger",
      );
    }
  };

  const saveDraftBtn = document.getElementById("saveDraftBtn");
  const postBtn = document.getElementById("postBtn");

  if (saveDraftBtn) {
    saveDraftBtn.addEventListener("click", (event) => {
      event.preventDefault();
      submitHomeForm("draft");
    });
  }

  if (postBtn) {
    postBtn.addEventListener("click", (event) => {
      event.preventDefault();
      submitHomeForm("published");
    });
  }
};

const loadAdminDashboard = async () => {
  const dashboardContainer = document.getElementById("dashboardOverview");
  if (!dashboardContainer) return;

  // Clear admin form fields
  const newAdminName = document.getElementById("newAdminName");
  const newAdminEmail = document.getElementById("newAdminEmail");
  const newAdminPhone = document.getElementById("newAdminPhone");
  const newAdminPassword = document.getElementById("newAdminPassword");

  if (newAdminName) {
    newAdminName.value = "";
    newAdminName.removeAttribute("placeholder");
  }
  if (newAdminEmail) {
    newAdminEmail.value = "";
    newAdminEmail.removeAttribute("placeholder");
  }
  if (newAdminPhone) {
    newAdminPhone.value = "";
  }
  if (newAdminPassword) {
    newAdminPassword.value = "";
    newAdminPassword.removeAttribute("placeholder");
  }

  if (!getToken()) {
    window.location.href = "auth.html";
    return;
  }

  if (!isAdminUser()) {
    alert("Access denied. Admin only.");
    window.location.href = "index.html";
    return;
  }

  const homes = await fetchHomes();
  const users = await fetchUsers();

  const totalHomes = homes.length;
  const totalUsers = users.length;
  const averagePrice = totalHomes
    ? homes.reduce((sum, home) => sum + Number(home.price || 0), 0) / totalHomes
    : 0;
  const newThisWeek = homes.filter((home) => {
    const created = new Date(home.createdAt);
    return (Date.now() - created.getTime()) / 86400000 <= 7;
  }).length;

  document.getElementById("totalHomes").innerText = totalHomes;
  document.getElementById("totalUsers").innerText = totalUsers;
  document.getElementById("averagePrice").innerText = formatCurrency(
    Math.round(averagePrice),
  );
  document.getElementById("newThisWeek").innerText = newThisWeek;

  document.getElementById("listingsSummary").innerText =
    totalHomes > 0 ? `${totalHomes} active listings` : "No listings available.";
  document.getElementById("usersSummary").innerText =
    totalUsers > 0
      ? `${totalUsers} registered users`
      : "No users available yet.";

  const homeTableBody = document.getElementById("homeTableBody");
  if (homeTableBody) {
    homeTableBody.innerHTML = homes.length
      ? homes
          .slice(0, 8)
          .map((home) => {
            return `
              <tr>
                <td>
                  <div class="d-flex align-items-center gap-3">
                    <img src="${home.mainImage || home.images?.[0] || "images/no-image.jpg"}" alt="${home.title}" class="rounded-3" style="width: 80px; height: 60px; object-fit: cover;" />
                    <div>
                      <strong>${home.title}</strong>
                      <div class="text-muted small">${home.description?.slice(0, 45) || "No description"}</div>
                    </div>
                  </div>
                </td>
                <td>${home.location}</td>
                <td>${formatCurrency(home.price)}</td>
                <td>${home.bedrooms} bd · ${home.bathrooms} ba</td>
                <td>${getDaysAgo(home.createdAt)}</td>
                <td>
                  <div class="d-flex gap-2 justify-content-end">
                    <button class="btn btn-sm btn-outline-dark view-details-btn" data-id="${home._id}">View</button>
                    <a href="add-home.html?id=${home._id}" class="btn btn-sm btn-outline-brand">Edit</a>
                    <button class="btn btn-sm btn-danger delete-home" data-id="${home._id}">Delete</button>
                  </div>
                </td>
              </tr>
            `;
          })
          .join("")
      : `<tr><td colspan="6" class="text-muted">No listings have been created yet.</td></tr>`;

    attachDetailButtons();
  }

  document.querySelectorAll(".delete-home").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!confirm("Are you sure you want to delete this home?")) return;

      const homeId = button.dataset.id;

      const response = await fetch(`${apiBase}/homes/${homeId}`, {
        method: "DELETE",
        headers: { ...getAuthHeaders() },
      });

      const data = await response.json();

      if (!response.ok) {
        return showMessage(data.message || "Unable to delete", "danger");
      }

      showMessage("Home deleted successfully");
      loadAdminDashboard();
    });
  });

  const adminTableBody = document.getElementById("adminTableBody");
  const userTableBody = document.getElementById("userTableBody");

  const adminRows = users.filter((user) => user.isAdmin);
  const standardRows = users.filter((user) => !user.isAdmin);

  if (adminTableBody) {
    adminTableBody.innerHTML = adminRows.length
      ? adminRows
          .map((user) => {
            const userId = getUserId(user);
            const isCurrentUser = getTokenPayload()?.userId === userId;
            const revokeDisabled = isCurrentUser ? "disabled" : "";
            return `
              <tr>
                <td>${user.name || "—"}</td>
                <td>${user.email}</td>
                <td>${user.phone || "—"}</td>
                <td>
                  <div class="d-flex gap-2 justify-content-end">
                    <button class="btn btn-sm btn-outline-danger admin-revoke-btn" data-id="${userId}" ${revokeDisabled}>
                      ${isCurrentUser ? "Current admin" : "Revoke"}
                    </button>
                    <button class="btn btn-sm btn-outline-secondary admin-delete-btn" data-id="${userId}" ${revokeDisabled}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            `;
          })
          .join("")
      : `<tr><td colspan="4" class="text-muted">No admins found.</td></tr>`;

    document.querySelectorAll(".admin-revoke-btn").forEach((button) => {
      button.addEventListener("click", async () => {
        const userId = button.dataset.id;
        if (!confirm("Revoke admin access for this admin?")) return;

        const { ok, data } = await setUserAdminStatus(userId, false);
        if (!ok) {
          showMessage(
            data.message || "Could not revoke admin status",
            "danger",
          );
          return;
        }

        showMessage("Admin status revoked", "success");
        loadAdminDashboard();
      });
    });

    document.querySelectorAll(".admin-delete-btn").forEach((button) => {
      button.addEventListener("click", async () => {
        const userId = button.dataset.id;
        if (!confirm("Delete this admin account permanently?")) return;

        const { ok, data } = await deleteUser(userId);
        if (!ok) {
          showMessage(data.message || "Could not delete admin", "danger");
          return;
        }

        showMessage("Admin deleted successfully", "success");
        loadAdminDashboard();
      });
    });
  }

  if (userTableBody) {
    userTableBody.innerHTML = standardRows.length
      ? standardRows
          .map((user) => {
            const userId = getUserId(user);
            return `
              <tr>
                <td>${user.name || "—"}</td>
                <td>${user.email}</td>
                <td>${user.phone || "—"}</td>
                <td>${user.favorites?.length || 0}</td>
                <td>
                  <div class="d-flex gap-2 justify-content-end">
                    <button class="btn btn-sm btn-outline-brand user-promote-btn" data-id="${userId}">
                      Make admin
                    </button>
                    <button class="btn btn-sm btn-outline-danger user-delete-btn" data-id="${userId}">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            `;
          })
          .join("")
      : `<tr><td colspan="5" class="text-muted">No standard users available.</td></tr>`;

    document.querySelectorAll(".user-promote-btn").forEach((button) => {
      button.addEventListener("click", async () => {
        const userId = button.dataset.id;
        if (!confirm("Promote this user to admin?")) return;

        const { ok, data } = await setUserAdminStatus(userId, true);
        if (!ok) {
          showMessage(data.message || "Could not promote user", "danger");
          return;
        }

        showMessage("User promoted to admin", "success");
        loadAdminDashboard();
      });
    });

    document.querySelectorAll(".user-delete-btn").forEach((button) => {
      button.addEventListener("click", async () => {
        const userId = button.dataset.id;
        if (!confirm("Delete this user permanently?")) return;

        const { ok, data } = await deleteUser(userId);
        if (!ok) {
          showMessage(data.message || "Could not delete user", "danger");
          return;
        }

        showMessage("User deleted successfully", "success");
        loadAdminDashboard();
      });
    });
  }

  const topLocationsElement = document.getElementById("topLocations");
  const priceDistributionElement = document.getElementById("priceDistribution");
  const recentActivityElement = document.getElementById("recentActivity");

  const locationCounts = homes.reduce((acc, home) => {
    if (!home.location) return acc;
    acc[home.location] = (acc[home.location] || 0) + 1;
    return acc;
  }, {});
  const topLocations = Object.entries(locationCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const bedroomCounts = homes.reduce((acc, home) => {
    const key = `${home.bedrooms} bd`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  if (priceDistributionElement) {
    priceDistributionElement.innerHTML =
      Object.entries(bedroomCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([label, count]) => {
          const width = totalHomes
            ? Math.max(10, Math.min(100, (count / totalHomes) * 100))
            : 10;
          return `
          <div class="analytics-bar-group mb-3">
            <div class="d-flex justify-content-between small mb-1 text-muted">
              <span>${label}</span>
              <span>${count}</span>
            </div>
            <div class="analytics-bar bg-light rounded-pill">
              <div class="analytics-bar-fill bg-brand" style="width: ${width}%"></div>
            </div>
          </div>
        `;
        })
        .join("") ||
      `<p class="text-muted small mb-0">No data available yet.</p>`;
  }

  if (topLocationsElement) {
    topLocationsElement.innerHTML = topLocations.length
      ? topLocations
          .map(
            ([location, count]) =>
              `<div class="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <strong>${location}</strong>
                  <p class="text-muted small mb-0">${count} listings</p>
                </div>
                <span class="badge bg-brand bg-opacity-10 text-brand">${count}</span>
              </div>`,
          )
          .join("")
      : `<p class="text-muted small mb-0">No location data yet.</p>`;
  }

  if (recentActivityElement) {
    const activityItems = [];
    activityItems.push(
      `Loaded ${totalHomes} listing${totalHomes !== 1 ? "s" : ""} and ${totalUsers} user${totalUsers !== 1 ? "s" : ""}.`,
    );
    activityItems.push(
      `Average property value is ${formatCurrency(Math.round(averagePrice))}.`,
    );
    if (newThisWeek) {
      activityItems.push(
        `${newThisWeek} new listing${newThisWeek !== 1 ? "s" : ""} added this week.`,
      );
    }
    if (topLocations.length) {
      activityItems.push(
        `Top location: ${topLocations[0][0]} with ${topLocations[0][1]} listings.`,
      );
    }
    homes
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 3)
      .forEach((home) => {
        activityItems.push(
          `Listing "${home.title}" was added ${getDaysAgo(home.createdAt)}.`,
        );
      });
    users.slice(0, 2).forEach((user) => {
      activityItems.push(
        `User ${user.email} is ${user.isAdmin ? "an admin" : "active"}.`,
      );
    });

    recentActivityElement.innerHTML = activityItems
      .slice(0, 6)
      .map(
        (item) => `<li class="list-group-item border-0 px-0 py-2">${item}</li>`,
      )
      .join("");
  }

  const refreshButton = document.getElementById("refreshAdminDashboard");
  if (refreshButton) {
    refreshButton.onclick = (event) => {
      event.preventDefault();
      loadAdminDashboard();
    };
  }

  const addAdminButton = document.getElementById("addAdminButton");
  if (addAdminButton) {
    addAdminButton.addEventListener("click", async (event) => {
      event.preventDefault();

      const name = document.getElementById("newAdminName")?.value.trim();
      const email = document.getElementById("newAdminEmail")?.value.trim();
      const phone = document.getElementById("newAdminPhone")?.value.trim();
      const password = document.getElementById("newAdminPassword")?.value;

      if (!name || !email || !password) {
        showMessage("Name, email, and password are required", "danger");
        return;
      }

      const { ok, data } = await createAdminUser(name, email, phone, password);
      if (!ok) {
        showMessage(data.message || "Unable to create admin", "danger");
        return;
      }

      showMessage("Admin created successfully", "success");
      document.getElementById("newAdminName").value = "";
      document.getElementById("newAdminEmail").value = "";
      document.getElementById("newAdminPhone").value = "";
      document.getElementById("newAdminPassword").value = "";
      loadAdminDashboard();
    });
  }
};

const initChatbot = () => {
  const chatbotToggle = document.getElementById("chatbotToggle");
  const chatbotBox = document.getElementById("chatbotBox");
  const chatbotClose = document.getElementById("chatbotClose");
  const botInput = document.getElementById("botInput");

  if (!chatbotToggle || !chatbotBox) return;

  chatbotToggle.addEventListener("click", () => {
    chatbotBox.style.display =
      chatbotBox.style.display === "block" ? "none" : "block";
  });

  chatbotClose?.addEventListener("click", () => {
    chatbotBox.style.display = "none";
  });

  botInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      askBot();
    }
  });
};

function askBotPreset(text) {
  const input = document.getElementById("botInput");
  if (!input) return;
  input.value = text;
  input.focus();
}

async function askBot() {
  const input = document.getElementById("botInput");
  const messages = document.getElementById("chatbotMessages");
  const homesGrid = document.getElementById("homesGrid");

  if (!input || !messages) return;

  const text = input.value.trim();

  if (!text) return;

  messages.innerHTML += `
    <div class="user-message">${text}</div>
  `;

  input.value = "";

  try {
    const response = await fetch(`${apiBase}/chatbot/ask`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: text }),
    });

    const data = await response.json();

    messages.innerHTML += `
      <div class="bot-message">${data.reply}</div>
    `;

    if (homesGrid && data.homes) {
      homesGrid.innerHTML = data.homes.length
        ? data.homes.map((home) => createHomeCard(home)).join("")
        : `<div class="col-12">
            <p class="text-muted">No homes found.</p>
          </div>`;

      attachFavoriteButtons();
      attachDetailButtons();
      setFavoriteStates();
    }

    messages.scrollTop = messages.scrollHeight;
  } catch (error) {
    console.error(error);

    messages.innerHTML += `
      <div class="bot-message">
        Sorry, something went wrong.
      </div>
    `;
  }
}

async function resetHomesFilter() {
  const homesGrid = document.getElementById("homesGrid");
  const messages = document.getElementById("chatbotMessages");
  const input = document.getElementById("botInput");

  if (!homesGrid) return;

  const homes = await fetchHomes();

  homesGrid.innerHTML = homes.length
    ? homes.map((home) => createHomeCard(home)).join("")
    : `<div class="col-12">
        <p class="text-muted">No homes found.</p>
      </div>`;

  attachFavoriteButtons();
  attachDetailButtons();
  setFavoriteStates();

  if (input) input.value = "";

  if (messages) {
    messages.innerHTML += `
      <div class="bot-message">
        All homes are shown again.
      </div>
    `;
    messages.scrollTop = messages.scrollHeight;
  }
}

const handleFeedbackForm = () => {
  const feedbackForm = document.getElementById("feedbackForm");
  const feedbackMessage = document.getElementById("feedbackMessage");

  if (!feedbackForm) return;

  feedbackForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(feedbackForm);

    const body = {
      name: formData.get("name"),
      email: formData.get("email"),
      message: formData.get("message"),
    };

    try {
      const response = await fetch(`${apiBase}/feedbacks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        feedbackMessage.innerHTML = `<div class="alert alert-danger">${data.message}</div>`;
        return;
      }

      feedbackMessage.innerHTML = `<div class="alert alert-success">Feedback submitted successfully. It will appear after admin approval.</div>`;
      feedbackForm.reset();
    } catch (error) {
      console.error(error);
      feedbackMessage.innerHTML = `<div class="alert alert-danger">Could not submit feedback.</div>`;
    }
  });
};

const loadShownFeedbacks = async () => {
  const shownFeedbacks = document.getElementById("shownFeedbacks");

  if (!shownFeedbacks) return;

  try {
    const response = await fetch(`${apiBase}/feedbacks/shown`);
    const feedbacks = await response.json();

    const feedbackSlides = [];
    for (let i = 0; i < feedbacks.length; i += 3) {
      feedbackSlides.push(feedbacks.slice(i, i + 3));
    }

    shownFeedbacks.innerHTML = feedbackSlides.length
      ? `
          <div id="feedbackCarousel" class="carousel slide" data-bs-ride="carousel">
            <div class="carousel-indicators">
              ${feedbackSlides
                .map(
                  (_slide, index) => `
                    <button
                      type="button"
                      data-bs-target="#feedbackCarousel"
                      data-bs-slide-to="${index}"
                      class="${index === 0 ? "active" : ""}"
                      aria-current="${index === 0 ? "true" : "false"}"
                      aria-label="Slide ${index + 1}"
                    ></button>
                  `,
                )
                .join("")}
            </div>

            <div class="carousel-inner">
              ${feedbackSlides
                .map(
                  (slide, index) => `
                    <div class="carousel-item ${index === 0 ? "active" : ""}">
                      <div class="row g-4">
                        ${slide
                          .map(
                            (feedback) => `
                              <div class="col-md-4">
                                <div class="card border-0 shadow-sm h-100">
                                  <div class="card-body p-5 text-center">
                                    <h5 class="card-title fw-bold">${feedback.name}</h5>
                                    <p class="card-text fs-5">${feedback.message}</p>
                                    <small class="text-muted">${new Date(feedback.createdAt).toLocaleDateString()}</small>
                                  </div>
                                </div>
                              </div>
                            `,
                          )
                          .join("")}
                      </div>
                    </div>
                  `,
                )
                .join("")}
            </div>

            <button class="carousel-control-prev" type="button" data-bs-target="#feedbackCarousel" data-bs-slide="prev">
              <span class="carousel-control-prev-icon bg-dark rounded-circle p-3" aria-hidden="true"></span>
              <span class="visually-hidden">Previous</span>
            </button>
            <button class="carousel-control-next" type="button" data-bs-target="#feedbackCarousel" data-bs-slide="next">
              <span class="carousel-control-next-icon bg-dark rounded-circle p-3" aria-hidden="true"></span>
              <span class="visually-hidden">Next</span>
            </button>
          </div>
        `
      : `<div class="col-12"><p class="text-muted">No feedbacks yet.</p></div>`;
  } catch (error) {
    console.error(error);
  }
};

const loadAdminFeedbacks = async () => {
  const feedbackAdminList = document.getElementById("feedbackAdminList");
  const feedbackAdminMessage = document.getElementById("feedbackAdminMessage");

  if (!feedbackAdminList) return;

  try {
    const response = await fetch(`${apiBase}/feedbacks/admin`, {
      headers: { ...getAuthHeaders() },
    });

    if (!response.ok) {
      feedbackAdminList.innerHTML = `<div class="col-12"><p class="text-danger">Unable to load feedbacks.</p></div>`;
      return;
    }

    const feedbacks = await response.json();

    feedbackAdminList.innerHTML = feedbacks.length
      ? feedbacks
          .map(
            (feedback) => `
            <div class="col-12">
              <div class="card border-0 shadow-sm">
                <div class="card-body">
                  <div class="d-flex justify-content-between align-items-start gap-3">
                    <div>
                      <h5 class="fw-bold mb-1">${feedback.name}</h5>
                      <p class="text-muted mb-1">${feedback.email || "No email provided"}</p>
                      <p class="mb-0">${feedback.message}</p>
                    </div>
                    <div class="d-flex gap-2">
                      <button class="btn btn-sm btn-outline-brand toggle-feedback-btn" data-id="${feedback._id}">
                        ${feedback.isShown ? "Hide" : "Show"}
                      </button>
                      <button class="btn btn-sm btn-outline-danger delete-feedback-btn" data-id="${feedback._id}">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          `,
          )
          .join("")
      : `<div class="col-12"><p class="text-muted">No feedbacks submitted yet.</p></div>`;

    document.querySelectorAll(".toggle-feedback-btn").forEach((button) => {
      button.addEventListener("click", async () => {
        const feedbackId = button.dataset.id;
        try {
          const response = await fetch(
            `${apiBase}/feedbacks/admin/${feedbackId}/toggle`,
            {
              method: "PUT",
              headers: { ...getAuthHeaders() },
            },
          );

          if (!response.ok) {
            feedbackAdminMessage.innerHTML = `<div class="alert alert-danger">Could not update feedback.</div>`;
            return;
          }

          feedbackAdminMessage.innerHTML = `<div class="alert alert-success">Feedback updated.</div>`;
          loadAdminFeedbacks();
        } catch (error) {
          console.error(error);
          feedbackAdminMessage.innerHTML = `<div class="alert alert-danger">Could not update feedback.</div>`;
        }
      });
    });

    document.querySelectorAll(".delete-feedback-btn").forEach((button) => {
      button.addEventListener("click", async () => {
        const feedbackId = button.dataset.id;
        if (!confirm("Delete this feedback permanently?")) return;

        try {
          const response = await fetch(
            `${apiBase}/feedbacks/admin/${feedbackId}`,
            {
              method: "DELETE",
              headers: { ...getAuthHeaders() },
            },
          );

          if (!response.ok) {
            feedbackAdminMessage.innerHTML = `<div class="alert alert-danger">Could not delete feedback.</div>`;
            return;
          }

          feedbackAdminMessage.innerHTML = `<div class="alert alert-success">Feedback deleted.</div>`;
          loadAdminFeedbacks();
        } catch (error) {
          console.error(error);
          feedbackAdminMessage.innerHTML = `<div class="alert alert-danger">Could not delete feedback.</div>`;
        }
      });
    });
  } catch (error) {
    console.error(error);
    feedbackAdminList.innerHTML = `<div class="col-12"><p class="text-danger">Could not load feedbacks.</p></div>`;
  }
};

const initApp = () => {
  renderNav();
  loadFeaturedHomes();
  loadHomesPage();
  loadHomeDetailsPage();
  loadFavoritesPage();
  handleLoginPage();
  handleRegisterPage();
  handleAddHomePage();
  loadAdminDashboard();
  loadMyListingsPage();
  handleFeedbackForm();
  loadShownFeedbacks();
  loadAdminFeedbacks();
  initChatbot();
};

document.addEventListener("DOMContentLoaded", initApp);
