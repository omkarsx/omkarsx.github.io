(() => {
  const root = document.documentElement;
  const header = document.querySelector(".site-header");
  const navToggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".site-nav");
  const themeToggle = document.getElementById("themeToggle");
  const scrollProgress = document.getElementById("scrollProgress");
  const filterButtons = document.querySelectorAll(".filter-btn");
  const projectCards = document.querySelectorAll(".project-card");
  const copyEmailBtn = document.getElementById("copyEmailBtn");
  const copyStatus = document.getElementById("copyStatus");
  const emailLink = document.getElementById("emailLink");
  const localClock = document.getElementById("localClock");
  const journeyTimeline = document.getElementById("journeyTimeline");
  const timelineRailFill = document.getElementById("timelineRailFill");
  const timelineItems = Array.from(document.querySelectorAll(".timeline-item"));

  const contactForm = document.getElementById("contactForm");
  const statusEl = document.getElementById("formStatus");
  const yearEl = document.getElementById("currentYear");
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const messageInput = document.getElementById("message");

  const EMAILJS_CONFIG = {
    publicKey: "lMTFAcuD2JlvF_3AQ",
    serviceID: "service_v4u9b0q",
    templateID: "template_pn9akwp"
  };

  const THEME_KEY = "omkarx-theme";

  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  const updateThemeButton = (theme) => {
    if (!themeToggle) {
      return;
    }

    const icon = themeToggle.querySelector("i");
    const text = themeToggle.querySelector("span");

    if (theme === "light") {
      themeToggle.setAttribute("aria-pressed", "true");
      if (icon) {
        icon.className = "fa-solid fa-sun";
      }
      if (text) {
        text.textContent = "Light";
      }
    } else {
      themeToggle.setAttribute("aria-pressed", "false");
      if (icon) {
        icon.className = "fa-solid fa-moon";
      }
      if (text) {
        text.textContent = "Dark";
      }
    }
  };

  const applyTheme = (theme) => {
    root.setAttribute("data-theme", theme);
    updateThemeButton(theme);
  };

  const getInitialTheme = () => {
    const saved = window.localStorage.getItem(THEME_KEY);
    if (saved === "dark" || saved === "light") {
      return saved;
    }

    const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
    return prefersLight ? "light" : "dark";
  };

  applyTheme(getInitialTheme());

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const current = root.getAttribute("data-theme") === "light" ? "light" : "dark";
      const nextTheme = current === "dark" ? "light" : "dark";
      applyTheme(nextTheme);
      window.localStorage.setItem(THEME_KEY, nextTheme);
    });
  }

  const updateHeaderAndProgress = () => {
    if (header) {
      if (window.scrollY > 12) {
        header.classList.add("is-scrolled");
      } else {
        header.classList.remove("is-scrolled");
      }
    }

    if (scrollProgress) {
      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollableHeight > 0 ? (window.scrollY / scrollableHeight) * 100 : 0;
      scrollProgress.style.width = `${Math.min(Math.max(progress, 0), 100)}%`;
    }
  };

  updateHeaderAndProgress();
  window.addEventListener("scroll", updateHeaderAndProgress, { passive: true });

  if (navToggle && nav) {
    navToggle.addEventListener("click", () => {
      const expanded = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", String(!expanded));
      nav.classList.toggle("open", !expanded);
      navToggle.innerHTML = !expanded
        ? '<i class="fa-solid fa-xmark" aria-hidden="true"></i>'
        : '<i class="fa-solid fa-bars" aria-hidden="true"></i>';
    });
  }

  const closeNav = () => {
    if (!nav || !navToggle) {
      return;
    }

    nav.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.innerHTML = '<i class="fa-solid fa-bars" aria-hidden="true"></i>';
  };

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
      const href = anchor.getAttribute("href");
      if (!href || href === "#") {
        return;
      }

      const target = document.querySelector(href);
      if (!target) {
        return;
      }

      event.preventDefault();
      const offset = header ? header.offsetHeight : 0;
      const targetTop = href === "#top"
        ? 0
        : Math.max(target.getBoundingClientRect().top + window.scrollY - offset + 2, 0);
      window.scrollTo({ top: targetTop, behavior: "smooth" });
      closeNav();
    });
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 860) {
      closeNav();
    }
  });

  const revealNodes = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealNodes.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.18,
        rootMargin: "0px 0px -40px 0px"
      }
    );

    revealNodes.forEach((node) => observer.observe(node));
  } else {
    revealNodes.forEach((node) => node.classList.add("is-visible"));
  }

  if (journeyTimeline && timelineRailFill && timelineItems.length) {
    const updateTimelineState = () => {
      const viewportAnchor = window.innerHeight * 0.42;
      const timelineRect = journeyTimeline.getBoundingClientRect();
      const travelSpace = Math.max(journeyTimeline.offsetHeight - window.innerHeight * 0.35, 1);
      const covered = viewportAnchor - timelineRect.top;
      const progress = Math.min(Math.max(covered / travelSpace, 0), 1);
      timelineRailFill.style.transform = `scaleY(${progress})`;

      let activeItem = timelineRect.bottom < viewportAnchor
        ? timelineItems[timelineItems.length - 1]
        : timelineItems[0];
      let minDistance = Number.POSITIVE_INFINITY;

      timelineItems.forEach((item) => {
        const rect = item.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const distance = Math.abs(center - viewportAnchor);
        const isVisible = rect.bottom > 0 && rect.top < window.innerHeight;

        if (isVisible && distance < minDistance) {
          minDistance = distance;
          activeItem = item;
        }
      });

      timelineItems.forEach((item) => {
        item.classList.toggle("is-active", item === activeItem);
      });
    };

    let timelineTicking = false;
    const requestTimelineUpdate = () => {
      if (timelineTicking) {
        return;
      }

      timelineTicking = true;
      window.requestAnimationFrame(() => {
        updateTimelineState();
        timelineTicking = false;
      });
    };

    updateTimelineState();
    window.addEventListener("scroll", requestTimelineUpdate, { passive: true });
    window.addEventListener("resize", requestTimelineUpdate);
  }

  if (localClock) {
    const renderClock = () => {
      localClock.textContent = new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit"
      });
    };

    renderClock();
    window.setInterval(renderClock, 30000);
  }

  if (filterButtons.length && projectCards.length) {
    filterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const filter = button.dataset.filter || "all";

        filterButtons.forEach((btn) => {
          const isActive = btn === button;
          btn.classList.toggle("active", isActive);
          btn.setAttribute("aria-pressed", String(isActive));
        });

        projectCards.forEach((card) => {
          const category = card.dataset.category || "";
          const shouldShow = filter === "all" || category === filter;
          card.classList.toggle("is-hidden", !shouldShow);
        });
      });
    });
  }

  const setCopyStatus = (message, type = "") => {
    if (!copyStatus) {
      return;
    }

    copyStatus.textContent = message;
    copyStatus.classList.remove("success", "error");
    if (type) {
      copyStatus.classList.add(type);
    }
  };

  const fallbackCopyText = (value) => {
    const helper = document.createElement("textarea");
    helper.value = value;
    helper.setAttribute("readonly", "readonly");
    helper.style.position = "absolute";
    helper.style.left = "-9999px";
    document.body.appendChild(helper);
    helper.select();

    const copied = document.execCommand("copy");
    document.body.removeChild(helper);
    return copied;
  };

  if (copyEmailBtn && emailLink) {
    copyEmailBtn.addEventListener("click", async () => {
      const email = emailLink.textContent ? emailLink.textContent.trim() : "";
      if (!email) {
        setCopyStatus("Email not available.", "error");
        return;
      }

      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(email);
        } else {
          const copied = fallbackCopyText(email);
          if (!copied) {
            throw new Error("Fallback copy failed");
          }
        }

        setCopyStatus("Email copied to clipboard.", "success");
      } catch (error) {
        setCopyStatus("Could not copy email. Please copy manually.", "error");
      }
    });
  }

  const setFormStatus = (message, type = "") => {
    if (!statusEl) {
      return;
    }

    statusEl.textContent = message;
    statusEl.classList.remove("success", "error");
    if (type) {
      statusEl.classList.add(type);
    }
  };

  if (window.emailjs) {
    try {
      window.emailjs.init({ publicKey: EMAILJS_CONFIG.publicKey });
    } catch (error) {
      setFormStatus("Email service initialization failed. Please use direct email.", "error");
    }
  }

  if (!contactForm) {
    return;
  }

  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = nameInput ? nameInput.value.trim() : "";
    const email = emailInput ? emailInput.value.trim() : "";
    const message = messageInput ? messageInput.value.trim() : "";

    if (!name || !email || !message) {
      setFormStatus("Please fill all required fields.", "error");
      return;
    }

    const submitButton = contactForm.querySelector("button[type='submit']");
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Sending...";
    }

    if (!window.emailjs) {
      setFormStatus("Email service is unavailable right now. Please use the email link above.", "error");
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Send Message";
      }
      return;
    }

    try {
      await window.emailjs.send(EMAILJS_CONFIG.serviceID, EMAILJS_CONFIG.templateID, {
        name,
        email,
        message,
        sent_at: new Date().toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short"
        })
      });

      contactForm.reset();
      setFormStatus("Message sent successfully. I will reply soon.", "success");
    } catch (error) {
      setFormStatus("Could not send your message. Please try again or email directly.", "error");
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Send Message";
      }
    }
  });
})();
