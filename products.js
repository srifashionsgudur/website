(function () {
  "use strict";

  const WHATSAPP_NUMBER = "91XXXXXXXXXX";
  const WHATSAPP_BASE = `https://wa.me/${WHATSAPP_NUMBER}`;
  const qs = (selector, scope = document) => scope.querySelector(selector);
  const qsa = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const messageUrl = (name) => `${WHATSAPP_BASE}?text=${encodeURIComponent(`Hi Sri Fashions Boutique, I want to enquire about ${name}.`)}`;

  function initCatalogue() {
    const grid = qs("[data-products-grid]");
    if (!grid) return;

    const products = qsa("[data-product]", grid);
    const search = qs("#catalogue-search");
    const sort = qs("#catalogue-sort");
    const filters = qsa("[data-products-filter]");
    const resultCount = qs("[data-products-result-count]");
    const empty = qs("[data-products-empty]");
    const wishlistCount = qs("[data-products-wishlist-count]");
    const enquiryCount = qs("[data-products-enquiry-count]");
    let activeFilter = "all";
    let wishlistTotal = 0;
    let enquiryTotal = 0;

    products.forEach((product, index) => {
      product.dataset.index = String(index);
    });

    const updateResults = () => {
      const query = (search?.value || "").trim().toLowerCase();
      let visible = 0;

      products.forEach((product) => {
        const name = (product.dataset.name || "").toLowerCase();
        const category = product.dataset.category || "";
        const body = product.innerText.toLowerCase();
        const categoryMatch = activeFilter === "all" || category === activeFilter;
        const searchMatch = !query || name.includes(query) || body.includes(query);
        const isVisible = categoryMatch && searchMatch;

        product.classList.toggle("is-hidden", !isVisible);
        if (isVisible) visible += 1;
      });

      if (resultCount) resultCount.textContent = String(visible);
      if (empty) empty.hidden = visible !== 0;
    };

    const sortProducts = () => {
      const order = sort?.value || "featured";
      const sorted = [...products].sort((a, b) => {
        if (order === "new") {
          return Number(b.dataset.sort === "new") - Number(a.dataset.sort === "new") || (a.dataset.name || "").localeCompare(b.dataset.name || "");
        }
        if (order === "occasion") {
          return Number(b.dataset.sort === "occasion") - Number(a.dataset.sort === "occasion") || (a.dataset.category || "").localeCompare(b.dataset.category || "");
        }
        return Number(a.dataset.index || 0) - Number(b.dataset.index || 0);
      });
      sorted.forEach((product) => grid.appendChild(product));
      updateResults();
    };

    filters.forEach((button) => {
      button.addEventListener("click", () => {
        filters.forEach((item) => {
          item.classList.remove("is-active");
          item.setAttribute("aria-pressed", "false");
        });
        button.classList.add("is-active");
        button.setAttribute("aria-pressed", "true");
        activeFilter = button.dataset.productsFilter || "all";
        updateResults();
      });
    });

    search?.addEventListener("input", updateResults);
    sort?.addEventListener("change", sortProducts);

    products.forEach((product) => {
      const name = product.dataset.name || "boutique product";
      const enquiry = qs("[data-products-enquiry]", product);
      const wishlist = qs("[data-products-wishlist]", product);

      if (enquiry) {
        enquiry.href = messageUrl(name);
        enquiry.addEventListener("click", () => {
          enquiryTotal += 1;
          if (enquiryCount) enquiryCount.textContent = String(enquiryTotal);
          window.sriFashionsLastEvent = { eventName: "product_enquiry", details: { product_name: name } };
        });
      }

      wishlist?.addEventListener("click", () => {
        const active = wishlist.classList.toggle("is-active");
        wishlist.textContent = active ? "♥" : "♡";
        wishlist.setAttribute("aria-label", `${active ? "Remove" : "Add"} ${name} ${active ? "from" : "to"} wishlist`);
        wishlistTotal += active ? 1 : -1;
        if (wishlistCount) wishlistCount.textContent = String(Math.max(0, wishlistTotal));
      });
    });

    qs("[data-wishlist-summary]")?.addEventListener("click", () => {
      window.sriFashionsLastEvent = { eventName: "wishlist_summary_click", details: { count: wishlistTotal } };
    });

    qs("[data-enquiry-summary]")?.addEventListener("click", () => {
      window.sriFashionsLastEvent = { eventName: "enquiry_bag_summary_click", details: { count: enquiryTotal } };
    });

    updateResults();
  }

  function initQuickView() {
    const modal = qs("[data-product-modal]");
    if (!modal) return;

    const dialog = qs(".quick-view-dialog", modal);
    const image = qs("[data-modal-image]", modal);
    const title = qs("[data-modal-title]", modal);
    const category = qs("[data-modal-category]", modal);
    const availability = qs("[data-modal-availability]", modal);
    const description = qs("[data-modal-description]", modal);
    const enquiry = qs("[data-modal-enquiry]", modal);
    let lastFocus = null;

    const focusableSelector = "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])";

    const openModal = (product, opener) => {
      const productImage = qs("img", product);
      const productName = product.dataset.name || "boutique product";
      lastFocus = opener;

      if (image && productImage) {
        image.src = productImage.currentSrc || productImage.src;
        image.alt = productImage.alt || productName;
      }
      if (title) title.textContent = productName;
      if (category) category.textContent = product.dataset.category || "Boutique product";
      if (availability) availability.textContent = product.dataset.availability || "Available for enquiry";
      if (description) description.textContent = product.dataset.description || "";
      if (enquiry) enquiry.href = messageUrl(productName);

      modal.hidden = false;
      document.body.classList.add("has-modal");
      const focusable = qsa(focusableSelector, dialog);
      (focusable[0] || dialog).focus();
    };

    const closeModal = () => {
      modal.hidden = true;
      document.body.classList.remove("has-modal");
      if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
    };

    qsa("[data-product]").forEach((product) => {
      product.addEventListener("click", (event) => {
        if (event.target.closest("a, button")) return;
        openModal(product, product);
      });
    });

    qsa("[data-quick-view]").forEach((button) => {
      button.addEventListener("click", () => {
        const product = button.closest("[data-product]");
        if (product) openModal(product, button);
      });
    });

    enquiry?.addEventListener("click", () => {
      const current = Number(qs("[data-products-enquiry-count]")?.textContent || 0) + 1;
      const count = qs("[data-products-enquiry-count]");
      if (count) count.textContent = String(current);
    });

    qsa("[data-modal-close]", modal).forEach((item) => item.addEventListener("click", closeModal));

    document.addEventListener("keydown", (event) => {
      if (modal.hidden) return;
      if (event.key === "Escape") {
        closeModal();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = qsa(focusableSelector, dialog);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initCatalogue();
    initQuickView();
  });
})();
