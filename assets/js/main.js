const root = document.documentElement;
const themeToggle = document.getElementById("theme-toggle");
const themeLabel = document.querySelector(".theme-toggle__label");
const themeIcon = document.querySelector(".theme-toggle__icon i");
const menuToggle = document.getElementById("menu-toggle");
const mobileMenu = document.getElementById("mobile-menu");
const siteHeader = document.getElementById("site-header");
const progressBar = document.getElementById("progress-bar");
const backToTop = document.getElementById("back-to-top");
const navLinks = Array.from(document.querySelectorAll(".desktop-nav a, .mobile-nav a"));
const sectionAnchors = Array.from(document.querySelectorAll("main section[id]"));
const faqTriggers = Array.from(document.querySelectorAll(".faq-trigger"));
const revealItems = Array.from(document.querySelectorAll(".reveal"));
const counterItems = Array.from(document.querySelectorAll("[data-counter]"));
const contactForm = document.getElementById("contact-form");
const formStatus = document.getElementById("form-status");
const submitButton = document.getElementById("submit-button");
const submitButtonText = submitButton ? submitButton.querySelector(".button-text") : null;
const submitButtonLoader = submitButton ? submitButton.querySelector(".button-loader") : null;
const themeColorMeta = document.querySelector('meta[name="theme-color"]');

const setThemeUi = (theme) => {
    const isDark = theme === "dark";

    if (themeToggle) {
        themeToggle.setAttribute("aria-pressed", String(isDark));
    }

    if (themeLabel) {
        themeLabel.textContent = isDark ? "Light" : "Dark";
    }

    if (themeIcon) {
        themeIcon.className = isDark ? "fa fa-sun-o" : "fa fa-moon-o";
    }

    if (themeColorMeta) {
        themeColorMeta.setAttribute("content", isDark ? "#0d141c" : "#f7f5ef");
    }
};

const applyTheme = (theme) => {
    root.setAttribute("data-theme", theme);
    setThemeUi(theme);

    try {
        localStorage.setItem("aro-theme", theme);
    } catch (error) {
        console.warn("Theme preference could not be saved.", error);
    }
};

setThemeUi(root.getAttribute("data-theme") || "light");

if (themeToggle) {
    themeToggle.addEventListener("click", () => {
        const nextTheme = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
        applyTheme(nextTheme);
    });
}

if (menuToggle && mobileMenu) {
    menuToggle.addEventListener("click", () => {
        const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
        menuToggle.setAttribute("aria-expanded", String(!isOpen));
        mobileMenu.hidden = isOpen;
    });
}

navLinks.forEach((link) => {
    link.addEventListener("click", () => {
        if (menuToggle && mobileMenu && !mobileMenu.hidden) {
            menuToggle.setAttribute("aria-expanded", "false");
            mobileMenu.hidden = true;
        }
    });
});

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
};

const updateActiveNav = () => {
    const currentPosition = window.scrollY + 180;
    let currentId = "";

    sectionAnchors.forEach((section) => {
        if (section.offsetTop <= currentPosition) {
            currentId = section.id;
        }
    });

    navLinks.forEach((link) => {
        const target = link.getAttribute("href");
        const isMatch = currentId && target === `#${currentId}`;
        link.classList.toggle("is-active", isMatch);
        if (!isMatch && target === "#top" && currentId === "") {
            link.classList.add("is-active");
        }
    });
};

window.addEventListener("scroll", () => {
    updateScrollUi();
    updateActiveNav();
});

updateScrollUi();
updateActiveNav();

if (backToTop) {
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
    }, { threshold: 0.18 });

    revealItems.forEach((item) => revealObserver.observe(item));

    const counterObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) {
                return;
            }

            const counter = entry.target;
            const rawValue = counter.getAttribute("data-counter") || "0";
            const numericValue = Number.parseInt(rawValue, 10);
            const suffix = counter.textContent.replace(/[0-9]/g, "").trim() || "+";
            const duration = 1400;
            const start = performance.now();

            const tick = (timestamp) => {
                const progress = Math.min((timestamp - start) / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                const currentValue = Math.floor(eased * numericValue);

                counter.textContent = `${currentValue}${suffix}`;

                if (progress < 1) {
                    window.requestAnimationFrame(tick);
                } else {
                    counter.textContent = `${numericValue}${suffix}`;
                }
            };

            window.requestAnimationFrame(tick);
            observer.unobserve(counter);
        });
    }, { threshold: 0.45 });

    counterItems.forEach((item) => counterObserver.observe(item));
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
            if (otherItem) {
                otherItem.classList.remove("is-open");
            }
            if (otherContent) {
                otherContent.hidden = true;
            }
        });

        if (isOpen) {
            return;
        }

        trigger.setAttribute("aria-expanded", "true");
        if (item) {
            item.classList.add("is-open");
        }
        if (content) {
            content.hidden = false;
        }
    });
});

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

if (contactForm) {
    contactForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const formData = new FormData(contactForm);
        const payload = Object.fromEntries(formData.entries());

        if (!payload.name || !payload.email || !payload.service || !payload.message) {
            setStatusMessage("Please complete the required fields before sending your inquiry.", "error");
            return;
        }

        if (payload.website) {
            setStatusMessage("Spam protection triggered. Please try again.", "error");
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
                throw new Error(result.error || "Your message could not be sent right now.");
            }

            contactForm.reset();
            setStatusMessage("Your inquiry has been sent successfully. You should receive a reply soon.", "success");
        } catch (error) {
            console.error(error);
            setStatusMessage("The form could not send right now. Please email hello@arojohnson.com instead.", "error");
        } finally {
            setFormState(false);
        }
    });
}
