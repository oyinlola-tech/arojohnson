const root = document.documentElement;
const body = document.body;
const themeToggle = document.getElementById("theme-toggle");
const themeLabel = document.querySelector(".theme-toggle__label");
const themeIconUse = document.querySelector(".theme-toggle__icon use");
const menuToggle = document.getElementById("menu-toggle");
const menuIconUse = menuToggle ? menuToggle.querySelector("use") : null;
const mobileMenu = document.getElementById("mobile-menu");
const siteHeader = document.getElementById("site-header");
const progressBar = document.getElementById("progress-bar");
const backToTop = document.getElementById("back-to-top");
const navLinks = Array.from(document.querySelectorAll(".desktop-nav a, .mobile-nav a"));
const sectionAnchors = Array.from(document.querySelectorAll("main section[id]"));
const faqTriggers = Array.from(document.querySelectorAll(".faq-trigger"));
const revealItems = Array.from(document.querySelectorAll(".reveal"));
const contactForm = document.getElementById("contact-form");
const formStatus = document.getElementById("form-status");
const submitButton = document.getElementById("submit-button");
const startedAtInput = document.getElementById("started-at");
const submitButtonText = submitButton ? submitButton.querySelector(".button-text") : null;
const submitButtonLoader = submitButton ? submitButton.querySelector(".button-loader") : null;
const themeColorMeta = document.querySelector('meta[name="theme-color"]');

const iconHref = (name) => `#${name}`;
const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

const getStoredTheme = () => {
    try {
        return localStorage.getItem("aro-theme");
    } catch (error) {
        return null;
    }
};

const getPreferredTheme = () => getStoredTheme() || (mediaQuery.matches ? "dark" : "light");

const setThemeUi = (theme) => {
    const isDark = theme === "dark";

    if (themeToggle) {
        themeToggle.setAttribute("aria-pressed", String(isDark));
    }

    if (themeLabel) {
        themeLabel.textContent = isDark ? "Light mode" : "Dark mode";
    }

    if (themeIconUse) {
        themeIconUse.setAttribute("href", iconHref(isDark ? "sun" : "moon"));
    }

    if (themeColorMeta) {
        themeColorMeta.setAttribute("content", isDark ? "#0b1220" : "#f8fafc");
    }
};

const applyTheme = (theme, persist = true) => {
    root.setAttribute("data-theme", theme);
    setThemeUi(theme);

    if (!persist) {
        return;
    }

    try {
        localStorage.setItem("aro-theme", theme);
    } catch (error) {
        console.warn("Theme preference could not be saved.", error);
    }
};

const setMenuState = (isOpen) => {
    if (!menuToggle || !mobileMenu) {
        return;
    }

    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
    mobileMenu.hidden = !isOpen;
    body.classList.toggle("is-menu-open", isOpen);

    if (menuIconUse) {
        menuIconUse.setAttribute("href", iconHref(isOpen ? "close" : "menu"));
    }
};

const updateScrollUi = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

    if (siteHeader) {
        siteHeader.classList.toggle("is-condensed", scrollTop > 24);
    }

    if (progressBar) {
        progressBar.style.width = `${progress}%`;
    }

    if (backToTop) {
        backToTop.hidden = scrollTop < 320;
    }
};

const updateActiveNav = () => {
    const currentPosition = window.scrollY + 200;
    let currentId = "";

    sectionAnchors.forEach((section) => {
        if (section.offsetTop <= currentPosition) {
            currentId = section.id;
        }
    });

    navLinks.forEach((link) => {
        const target = link.getAttribute("href");
        link.classList.toggle("is-active", currentId && target === `#${currentId}`);
    });
};

const setFormState = (isLoading) => {
    if (!submitButton || !submitButtonText || !submitButtonLoader) {
        return;
    }

    submitButton.disabled = isLoading;
    submitButtonText.hidden = isLoading;
    submitButtonLoader.hidden = !isLoading;
};

const setStatusMessage = (message, type) => {
    if (!formStatus) {
        return;
    }

    formStatus.textContent = message;
    formStatus.classList.remove("is-success", "is-error");

    if (type) {
        formStatus.classList.add(type === "success" ? "is-success" : "is-error");
    }
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

applyTheme(getPreferredTheme(), false);

if (themeToggle) {
    themeToggle.addEventListener("click", () => {
        const nextTheme = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
        applyTheme(nextTheme);
    });
}

if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener("change", (event) => {
        if (!getStoredTheme()) {
            applyTheme(event.matches ? "dark" : "light", false);
        }
    });
}

if (menuToggle && mobileMenu) {
    setMenuState(false);

    menuToggle.addEventListener("click", () => {
        const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
        setMenuState(!isOpen);
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            setMenuState(false);
        }
    });
}

navLinks.forEach((link) => {
    link.addEventListener("click", () => setMenuState(false));
});

window.addEventListener("scroll", () => {
    updateScrollUi();
    updateActiveNav();
});

window.addEventListener("resize", () => {
    if (window.innerWidth > 860) {
        setMenuState(false);
    }
});

updateScrollUi();
updateActiveNav();

if (backToTop) {
    backToTop.hidden = true;
    backToTop.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
}

if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) {
                return;
            }

            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.16 });

    revealItems.forEach((item) => revealObserver.observe(item));
} else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
}

faqTriggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
        const item = trigger.closest(".faq-item");
        const content = trigger.nextElementSibling;
        const isOpen = trigger.getAttribute("aria-expanded") === "true";

        faqTriggers.forEach((otherTrigger) => {
            const otherItem = otherTrigger.closest(".faq-item");
            const otherContent = otherTrigger.nextElementSibling;

            otherTrigger.setAttribute("aria-expanded", "false");
            otherItem?.classList.remove("is-open");

            if (otherContent) {
                otherContent.hidden = true;
            }
        });

        if (isOpen) {
            return;
        }

        trigger.setAttribute("aria-expanded", "true");
        item?.classList.add("is-open");

        if (content) {
            content.hidden = false;
        }
    });
});

if (startedAtInput) {
    startedAtInput.value = String(Date.now());
}

if (contactForm) {
    contactForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const formData = new FormData(contactForm);
        const payload = Object.fromEntries(formData.entries());

        if (!payload.name || !payload.email || !payload.service || !payload.message) {
            setStatusMessage("Please complete the required fields before sending your inquiry.", "error");
            return;
        }

        if (!isValidEmail(String(payload.email).trim())) {
            setStatusMessage("Please enter a valid email address.", "error");
            return;
        }

        if (String(payload.message).trim().length < 30) {
            setStatusMessage("Please share a bit more detail so the inquiry can be reviewed properly.", "error");
            return;
        }

        if (payload.website) {
            setStatusMessage("Spam protection was triggered. Please try again.", "error");
            return;
        }

        setFormState(true);
        setStatusMessage("Sending your inquiry...", null);

        try {
            const response = await fetch("/api/contact", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(result.error || "The inquiry could not be sent.");
            }

            contactForm.reset();

            if (startedAtInput) {
                startedAtInput.value = String(Date.now());
            }

            setStatusMessage("Your inquiry has been sent. The owner should review it shortly.", "success");
        } catch (error) {
            console.error(error);
            setStatusMessage("The form could not send right now. Please email hello@arojohnson.com instead.", "error");
        } finally {
            setFormState(false);
        }
    });
}
