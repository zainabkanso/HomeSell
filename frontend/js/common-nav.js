const commonNavbarHtml = `
<nav class="navbar navbar-expand-lg navbar-light bg-white shadow-sm py-3 sticky-top">
  <div class="container">
    <a class="navbar-brand fw-bold text-brand" href="index.html">HomeSell</a>
    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navMenu">
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="navMenu">
      <ul class="navbar-nav ms-auto align-items-center gap-2" id="navAuth"></ul>
    </div>
  </div>
</nav>
`;

const insertCommonNavbar = () => {
  const placeholder = document.getElementById("navPlaceholder");
  if (!placeholder) return;
  placeholder.innerHTML = commonNavbarHtml;
};

const initializeCommonNavbar = () => {
  insertCommonNavbar();
  if (typeof window.renderNav === "function") {
    window.renderNav();
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeCommonNavbar);
} else {
  initializeCommonNavbar();
}

window.addEventListener("load", () => {
  if (typeof window.renderNav === "function") {
    window.renderNav();
  }
});
