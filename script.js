(function () {
  "use strict";

  // Replace this number before launch. All WhatsApp CTAs use this value.
  const WHATSAPP_NUMBER = "91XXXXXXXXXX";
  const WHATSAPP_BASE = `https://wa.me/${WHATSAPP_NUMBER}`;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const qs = (selector, scope = document) => scope.querySelector(selector);
  const qsa = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  const encodeMessage = (message) => `${WHATSAPP_BASE}?text=${encodeURIComponent(message)}`;

  function trackConversion(eventName, details = {}) {
    // Google Analytics / Meta Pixel placeholder:
    // gtag("event", eventName, details);
    // fbq("trackCustom", eventName, details);
    window.sriFashionsLastEvent = { eventName, details };
  }

  function initHeaderAndMenu() {
    const header = qs("[data-header]");
    const toggle = qs(".nav-toggle");
    const menu = qs("[data-nav-menu]");

    const updateHeader = () => {
      header.classList.toggle("is-scrolled", window.scrollY > 24);
    };

    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });

    if (!toggle || !menu) return;

    const closeMenu = () => {
      menu.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open menu");
    };

    toggle.addEventListener("click", () => {
      const isOpen = menu.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
      toggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
    });

    qsa("a", menu).forEach((link) => link.addEventListener("click", closeMenu));

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });
  }

  function initWhatsAppLinks() {
    qsa("[data-whatsapp-link]").forEach((link) => {
      link.addEventListener("click", () => {
        trackWhatsAppClick(link.dataset.event || "whatsapp_click");
      });
    });
  }

  function trackWhatsAppClick(source) {
    trackConversion("whatsapp_click", { source });
  }

  function initProductDiscovery() {
    if (document.body.classList.contains("products-page")) return;

    const productGrid = qs("[data-product-grid]");
    const products = qsa("[data-product]");
    const filterButtons = qsa("[data-filter]");
    const searchInput = qs("#product-search");
    const sortSelect = qs("#product-sort");
    const emptyState = qs("[data-empty-state]");
    const wishlistCount = qs("[data-wishlist-count]");
    const cartCount = qs("[data-cart-count]");
    let activeFilter = "all";
    let wishlistTotal = 0;
    let enquiryTotal = 0;

    if (!productGrid || products.length === 0) return;

    products.forEach((product) => {
      const name = product.dataset.name || "boutique product";
      const enquiry = qs("[data-product-enquiry]", product);
      const wishlistToggle = qs("[data-wishlist-toggle]", product);

      if (enquiry) {
        enquiry.href = encodeMessage(`Hi Sri Fashions Boutique, I want to enquire about ${name}`);
        enquiry.addEventListener("click", () => {
          enquiryTotal += 1;
          if (cartCount) cartCount.textContent = String(enquiryTotal);
          trackConversion("product_enquiry", { product_name: name });
        });
      }

      if (wishlistToggle) {
        wishlistToggle.addEventListener("click", () => {
          const active = wishlistToggle.classList.toggle("is-active");
          wishlistToggle.innerHTML = "&hearts;";
          wishlistToggle.setAttribute("aria-label", `${active ? "Remove" : "Add"} ${name} ${active ? "from" : "to"} wishlist`);
          wishlistTotal += active ? 1 : -1;
          if (wishlistCount) wishlistCount.textContent = String(Math.max(wishlistTotal, 0));
        });
      }
    });

    function applyFilters() {
      const query = (searchInput?.value || "").trim().toLowerCase();
      let visibleCount = 0;

      products.forEach((product) => {
        const name = (product.dataset.name || "").toLowerCase();
        const category = product.dataset.category || "";
        const text = product.innerText.toLowerCase();
        const matchesCategory = activeFilter === "all" || category === activeFilter;
        const matchesSearch = !query || name.includes(query) || text.includes(query);
        const visible = matchesCategory && matchesSearch;

        product.classList.toggle("is-hidden", !visible);
        if (visible) visibleCount += 1;
      });

      if (emptyState) emptyState.hidden = visibleCount !== 0;
    }

    filterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        filterButtons.forEach((item) => {
          item.classList.remove("is-active");
          item.setAttribute("aria-pressed", "false");
        });
        button.classList.add("is-active");
        button.setAttribute("aria-pressed", "true");
        activeFilter = button.dataset.filter || "all";
        applyFilters();
      });
    });

    searchInput?.addEventListener("input", applyFilters);

    sortSelect?.addEventListener("change", () => {
      const sorted = [...products].sort((a, b) => {
        if (sortSelect.value === "az") return (a.dataset.name || "").localeCompare(b.dataset.name || "");
        if (sortSelect.value === "category") return (a.dataset.category || "").localeCompare(b.dataset.category || "");
        return 0;
      });
      sorted.forEach((product) => productGrid.appendChild(product));
      applyFilters();
    });

    qs("[data-wishlist-button]")?.addEventListener("click", () => {
      trackConversion("wishlist_placeholder_click", { count: wishlistTotal });
      alert("Wishlist placeholder: connect this to saved products when ecommerce backend is added.");
    });

    qs("[data-cart-button]")?.addEventListener("click", () => {
      trackConversion("cart_placeholder_click", { count: enquiryTotal });
      alert("Enquiry bag placeholder: WhatsApp enquiries are tracked here for this static version.");
    });

    applyFilters();
  }

  function initNewsletterPlaceholder() {
    const form = qs(".newsletter form");
    if (!form) return;

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      trackConversion("newsletter_placeholder_submit");
      alert("Updates placeholder: connect this form to WhatsApp, email, or CRM before launch.");
    });
  }

  function initAnimations() {
    if (prefersReducedMotion) return;
    if (!window.gsap || !window.ScrollTrigger) return;

    gsap.registerPlugin(ScrollTrigger);

    if (window.Lenis) {
      const lenis = new Lenis({
        duration: 1.05,
        smoothWheel: true,
        wheelMultiplier: 0.86,
        touchMultiplier: 1.1
      });

      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }

    const title = qs("[data-word-reveal]");
    if (title && !title.dataset.prepared) {
      title.dataset.prepared = "true";
      title.innerHTML = title.textContent
        .trim()
        .split(/\s+/)
        .map((word) => `<span class="word"><span class="word-inner">${word}</span></span>`)
        .join(" ");

      gsap.from(qsa(".word-inner", title), {
        yPercent: 110,
        duration: 1.05,
        ease: "power4.out",
        stagger: 0.09,
        delay: 0.2
      });
    }

    // Hero parallax: only transforms the image layer, keeping text crawlable and layout stable.
    gsap.to("[data-hero-bg]", {
      yPercent: 12,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: true
      }
    });

    qsa("[data-float-card]").forEach((card, index) => {
      gsap.to(card, {
        y: index % 2 ? -14 : 14,
        duration: 2.6 + index * 0.35,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true
      });
    });

    gsap.utils.toArray(".reveal").forEach((element) => {
      gsap.from(element, {
        y: 34,
        opacity: 0,
        duration: 0.82,
        ease: "power3.out",
        scrollTrigger: {
          trigger: element,
          start: "top 86%",
          once: true
        }
      });
    });

    const journeySection = qs("[data-journey-section]");
    const progressPath = journeySection ? qs("[data-journey-progress]", journeySection) : null;
    const journeyCards = journeySection ? qsa("[data-journey-card]", journeySection) : [];
    const journeyNodes = journeySection ? qsa("[data-journey-node]", journeySection) : [];

    if (journeySection && progressPath && journeyCards.length) {
      const journeyMedia = gsap.matchMedia();

      // S-journey path draw: the SVG path is measured once in its own viewBox units,
      // then ScrollTrigger scrubs strokeDashoffset from full length to zero.
      journeyMedia.add("(min-width: 768px)", () => {
        const pathLength = progressPath.getTotalLength();
        gsap.set(progressPath, {
          strokeDasharray: pathLength,
          strokeDashoffset: pathLength
        });
        gsap.set(journeyNodes, { opacity: 0.28, scale: 0.68, transformOrigin: "50% 50%" });
        gsap.set(journeyCards, { autoAlpha: 0, y: 28 });

        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: journeySection,
            start: "top 72%",
            end: "bottom 34%",
            scrub: 0.85,
            invalidateOnRefresh: true
          }
        });

        timeline.to(progressPath, { strokeDashoffset: 0, ease: "none", duration: 1 }, 0);

        journeyCards.forEach((card, index) => {
          const pathPoint = 0.06 + (index / Math.max(journeyCards.length - 1, 1)) * 0.86;
          const cardPoint = Math.max(0.02, pathPoint - 0.16);
          const node = journeyNodes[index];
          if (node) {
            timeline.to(node, { opacity: 1, scale: 1, duration: 0.08, ease: "power2.out" }, pathPoint);
          }
          timeline.to(card, { autoAlpha: 1, y: 0, duration: 0.12, ease: "power2.out" }, cardPoint);
        });

        return () => {
          timeline.scrollTrigger && timeline.scrollTrigger.kill();
          timeline.kill();
          gsap.set([progressPath, journeyNodes, journeyCards], { clearProps: "all" });
        };
      });

      journeyMedia.add("(max-width: 767px)", () => {
        const tweens = journeyCards.map((card) => gsap.from(card, {
          y: 22,
          autoAlpha: 0,
          duration: 0.68,
          ease: "power3.out",
          scrollTrigger: {
            trigger: card,
            start: "top 88%",
            once: true
          }
        }));

        return () => {
          tweens.forEach((tween) => {
            tween.scrollTrigger && tween.scrollTrigger.kill();
            tween.kill();
          });
          gsap.set(journeyCards, { clearProps: "all" });
        };
      });
    }

    qsa("img").forEach((image) => {
      if (!image.complete) {
        image.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
        image.addEventListener("error", () => ScrollTrigger.refresh(), { once: true });
      }
    });

    let refreshTimer = 0;
    window.addEventListener("resize", () => {
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 180);
    }, { passive: true });

    if (window.matchMedia("(min-width: 861px)").matches) {
      qsa("[data-parallax-layer]").forEach((layer, index) => {
        const speed = Number(layer.dataset.speed || 0);
        gsap.to(layer, {
          yPercent: speed,
          ease: "none",
          scrollTrigger: {
            trigger: ".story",
            start: "top bottom",
            end: "bottom top",
            scrub: true
          }
        });
        gsap.to(layer, {
          y: index % 2 ? -8 : 8,
          duration: 3.2 + index * 0.25,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true
        });
      });
    }
  }

  function init() {
    initHeaderAndMenu();
    initWhatsAppLinks();
    initProductDiscovery();
    initNewsletterPlaceholder();
    window.addEventListener("load", initAnimations, { once: true });
  }

  init();

  window.trackWhatsAppClick = trackWhatsAppClick;
})();
