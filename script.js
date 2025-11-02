// ===== GLOBAL VARIABLES AND CONFIGURATION =====
const CONFIG = {
    // API endpoints
    API: {
        CONTACT: 'https://api.simplifai-1.com/contact',
        NEWSLETTER: 'https://api.simplifai-1.com/newsletter',
        ANALYTICS: 'https://api.simplifai-1.com/analytics',
        BLOG: 'https://api.simplifai-1.com/blog',
        PORTFOLIO: 'https://api.simplifai-1.com/portfolio'
    },
    
    // Animation settings
    ANIMATION: {
        DURATION: 300,
        EASING: 'easeInOutCubic',
        SCROLL_OFFSET: 100,
        STAGGER_DELAY: 100
    },
    
    // Performance settings
    PERFORMANCE: {
        LAZY_LOAD_THRESHOLD: 200,
        DEBOUNCE_DELAY: 300,
        THROTTLE_DELAY: 100
    },
    
    // Analytics
    ANALYTICS: {
        TRACKING_ID: 'GA_MEASUREMENT_ID',
        ENABLED: true
    }
};

// ===== UTILITY FUNCTIONS =====
const Utils = {
    // Debounce function for performance optimization
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Throttle function for scroll events
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // Smooth scroll to element
    scrollToElement(element, offset = 0) {
        const targetPosition = element.offsetTop - offset;
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    },

    // Check if element is in viewport
    isInViewport(element, threshold = 0.1) {
        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        const windowWidth = window.innerWidth || document.documentElement.clientWidth;
        
        const vertInView = (rect.top <= windowHeight * (1 - threshold)) && ((rect.top + rect.height) >= windowHeight * threshold);
        const horInView = (rect.left <= windowWidth * (1 - threshold)) && ((rect.left + rect.width) >= windowWidth * threshold);
        
        return (vertInView && horInView);
    },

    // Generate random ID
    generateId() {
        return 'id_' + Math.random().toString(36).substr(2, 9);
    },

    // Format currency
    formatCurrency(amount, currency = 'USD') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount);
    },

    // Format date
    formatDate(date, options = {}) {
        const defaultOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(date);
    },

    // Local storage helpers
    storage: {
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (e) {
                console.warn('LocalStorage not available:', e);
            }
        },
        
        get(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (e) {
                console.warn('LocalStorage not available:', e);
                return defaultValue;
            }
        },
        
        remove(key) {
            try {
                localStorage.removeItem(key);
            } catch (e) {
                console.warn('LocalStorage not available:', e);
            }
        }
    }
};

// ===== NOTIFICATION SYSTEM =====
class NotificationSystem {
    constructor() {
        this.container = null;
        this.notifications = [];
        this.init();
    }

    init() {
        this.container = document.createElement('div');
        this.container.className = 'notification-container';
        this.container.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            z-index: 10000;
            pointer-events: none;
        `;
        document.body.appendChild(this.container);
    }

    show(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        const id = Utils.generateId();
        
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            background: ${this.getBackgroundColor(type)};
            color: white;
            padding: 16px 20px;
            border-radius: 12px;
            margin-bottom: 12px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 300px;
            max-width: 400px;
            transform: translateX(400px);
            transition: transform 0.3s ease;
            pointer-events: all;
            cursor: pointer;
        `;

        const icon = this.getIcon(type);
        notification.innerHTML = `
            <span style="font-size: 20px;">${icon}</span>
            <span style="flex: 1;">${message}</span>
            <button style="background: none; border: none; color: white; cursor: pointer; font-size: 18px;">×</button>
        `;

        this.container.appendChild(notification);
        this.notifications.push({ id, element: notification });

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Auto remove
        setTimeout(() => {
            this.remove(id);
        }, duration);

        // Manual close
        notification.querySelector('button').addEventListener('click', () => {
            this.remove(id);
        });

        return id;
    }

    remove(id) {
        const notification = this.notifications.find(n => n.id === id);
        if (notification) {
            notification.element.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (notification.element.parentNode) {
                    notification.element.parentNode.removeChild(notification.element);
                }
                this.notifications = this.notifications.filter(n => n.id !== id);
            }, 300);
        }
    }

    getBackgroundColor(type) {
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        return colors[type] || colors.info;
    }

    getIcon(type) {
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        return icons[type] || icons.info;
    }
}

// ===== LOADING SCREEN =====
class LoadingScreen {
    constructor() {
        this.element = document.getElementById('loading-screen');
        this.progressBar = this.element?.querySelector('.loading-progress');
        this.init();
    }

    init() {
        if (!this.element) return;
        
        // Simulate loading progress
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 30;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                setTimeout(() => this.hide(), 500);
            }
            this.updateProgress(progress);
        }, 200);
    }

    updateProgress(progress) {
        if (this.progressBar) {
            this.progressBar.style.width = `${progress}%`;
        }
    }

    hide() {
        if (this.element) {
            this.element.classList.add('fade-out');
            setTimeout(() => {
                this.element.style.display = 'none';
            }, 500);
        }
    }
}

// ===== PARTICLE SYSTEM =====
class ParticleSystem {
    constructor() {
        this.container = document.getElementById('particles-js');
        this.particles = [];
        this.init();
    }

    init() {
        if (!this.container) return;
        
        // Initialize particles.js if available
        if (typeof particlesJS !== 'undefined') {
            particlesJS('particles-js', {
                particles: {
                    number: {
                        value: 80,
                        density: {
                            enable: true,
                            value_area: 800
                        }
                    },
                    color: {
                        value: '#ffffff'
                    },
                    shape: {
                        type: 'circle'
                    },
                    opacity: {
                        value: 0.5,
                        random: false
                    },
                    size: {
                        value: 3,
                        random: true
                    },
                    line_linked: {
                        enable: true,
                        distance: 150,
                        color: '#ffffff',
                        opacity: 0.4,
                        width: 1
                    },
                    move: {
                        enable: true,
                        speed: 6,
                        direction: 'none',
                        random: false,
                        straight: false,
                        out_mode: 'out',
                        bounce: false
                    }
                },
                interactivity: {
                    detect_on: 'canvas',
                    events: {
                        onhover: {
                            enable: true,
                            mode: 'repulse'
                        },
                        onclick: {
                            enable: true,
                            mode: 'push'
                        },
                        resize: true
                    },
                    modes: {
                        repulse: {
                            distance: 100,
                            duration: 0.4
                        },
                        push: {
                            particles_nb: 4
                        }
                    }
                },
                retina_detect: true
            });
        }
    }
}

// ===== NAVIGATION SYSTEM =====
class NavigationSystem {
    constructor() {
        this.header = document.querySelector('.header');
        this.navLinks = document.querySelectorAll('.nav-link');
        this.mobileToggle = document.querySelector('.mobile-menu-toggle');
        this.navMenu = document.querySelector('.nav-menu');
        this.isScrolling = false;
        this.init();
    }

    init() {
        this.setupScrollEffects();
        this.setupMobileMenu();
        this.setupSmoothScrolling();
        this.setupActiveNavigation();
    }

    setupScrollEffects() {
        const handleScroll = Utils.throttle(() => {
            const scrollTop = window.pageYOffset;
            
            // Header background effect
            if (scrollTop > 100) {
                this.header.classList.add('scrolled');
            } else {
                this.header.classList.remove('scrolled');
            }
            
            // Update active navigation
            this.updateActiveNavigation();
        }, CONFIG.PERFORMANCE.THROTTLE_DELAY);

        window.addEventListener('scroll', handleScroll);
    }

    setupMobileMenu() {
        if (!this.mobileToggle || !this.navMenu) return;

        this.mobileToggle.addEventListener('click', () => {
            this.mobileToggle.classList.toggle('active');
            this.navMenu.classList.toggle('active');
            document.body.style.overflow = this.navMenu.classList.contains('active') ? 'hidden' : '';
        });

        // Close menu when clicking on links
        this.navLinks.forEach(link => {
            link.addEventListener('click', () => {
                this.mobileToggle.classList.remove('active');
                this.navMenu.classList.remove('active');
                document.body.style.overflow = '';
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.header.contains(e.target) && this.navMenu.classList.contains('active')) {
                this.mobileToggle.classList.remove('active');
                this.navMenu.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    setupSmoothScrolling() {
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href.startsWith('#')) {
                    e.preventDefault();
                    const target = document.querySelector(href);
                    if (target) {
                        const headerHeight = this.header.offsetHeight;
                        Utils.scrollToElement(target, headerHeight + 20);
                    }
                }
            });
        });
    }

    setupActiveNavigation() {
        const sections = document.querySelectorAll('section[id]');
        
        const updateActive = () => {
            const scrollTop = window.pageYOffset + 150;
            
            sections.forEach(section => {
                const top = section.offsetTop;
                const height = section.offsetHeight;
                const id = section.getAttribute('id');
                const correspondingLink = document.querySelector(`.nav-link[href="#${id}"]`);
                
                if (correspondingLink) {
                    if (scrollTop >= top && scrollTop < top + height) {
                        this.navLinks.forEach(link => link.classList.remove('active'));
                        correspondingLink.classList.add('active');
                    }
                }
            });
        };

        window.addEventListener('scroll', Utils.throttle(updateActive, CONFIG.PERFORMANCE.THROTTLE_DELAY));
    }

    updateActiveNavigation() {
        // This is called from scroll handler
        const scrollTop = window.pageYOffset + 150;
        const sections = document.querySelectorAll('section[id]');
        
        sections.forEach(section => {
            const top = section.offsetTop;
            const height = section.offsetHeight;
            const id = section.getAttribute('id');
            const correspondingLink = document.querySelector(`.nav-link[href="#${id}"]`);
            
            if (correspondingLink) {
                if (scrollTop >= top && scrollTop < top + height) {
                    this.navLinks.forEach(link => link.classList.remove('active'));
                    correspondingLink.classList.add('active');
                }
            }
        });
    }
}

// ===== ANIMATION SYSTEM =====
class AnimationSystem {
    constructor() {
        this.observer = null;
        this.animatedElements = new Set();
        this.init();
    }

    init() {
        this.setupIntersectionObserver();
        this.setupScrollAnimations();
        this.setupCounterAnimations();
        this.setupTypingEffect();
    }

    setupIntersectionObserver() {
        const options = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.animatedElements.has(entry.target)) {
                    this.animateElement(entry.target);
                    this.animatedElements.add(entry.target);
                }
            });
        }, options);

        // Observe elements with animation classes
        document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right, .scale-in').forEach(el => {
            this.observer.observe(el);
        });
    }

    animateElement(element) {
        const animationClass = Array.from(element.classList).find(cls => 
            cls.startsWith('fade-') || cls.startsWith('slide-') || cls.startsWith('scale-')
        );

        if (animationClass) {
            element.style.opacity = '1';
            element.style.transform = 'none';
        }
    }

    setupScrollAnimations() {
        // Add animation classes to elements
        const elementsToAnimate = [
            { selector: '.service-card', animation: 'fade-in' },
            { selector: '.portfolio-item', animation: 'fade-in' },
            { selector: '.blog-card', animation: 'fade-in' },
            { selector: '.tech-item', animation: 'scale-in' },
            { selector: '.value-item', animation: 'slide-in-left' },
            { selector: '.about-stat', animation: 'slide-in-right' }
        ];

        elementsToAnimate.forEach(({ selector, animation }) => {
            document.querySelectorAll(selector).forEach((el, index) => {
                el.classList.add(animation);
                el.style.opacity = '0';
                el.style.transform = this.getTransform(animation);
                el.style.transition = `all ${CONFIG.ANIMATION.DURATION}ms ${CONFIG.ANIMATION.EASING}`;
                el.style.transitionDelay = `${index * CONFIG.ANIMATION.STAGGER_DELAY}ms`;
                
                if (this.observer) {
                    this.observer.observe(el);
                }
            });
        });
    }

    getTransform(animation) {
        const transforms = {
            'fade-in': 'translateY(30px)',
            'slide-in-left': 'translateX(-30px)',
            'slide-in-right': 'translateX(30px)',
            'scale-in': 'scale(0.9)'
        };
        return transforms[animation] || 'translateY(30px)';
    }

    setupCounterAnimations() {
        const counters = document.querySelectorAll('.stat-number[data-target]');
        
        const animateCounter = (counter) => {
            const target = parseInt(counter.getAttribute('data-target'));
            const duration = 2000;
            const step = target / (duration / 16);
            let current = 0;
            
            const updateCounter = () => {
                current += step;
                if (current < target) {
                    counter.textContent = Math.floor(current);
                    requestAnimationFrame(updateCounter);
                } else {
                    counter.textContent = target;
                }
            };
            
            updateCounter();
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        });

        counters.forEach(counter => observer.observe(counter));
    }

    setupTypingEffect() {
        const heroTitle = document.querySelector('.hero-title');
        if (!heroTitle) return;

        const text = heroTitle.textContent;
        heroTitle.textContent = '';
        heroTitle.style.opacity = '1';

        let index = 0;
        const typeWriter = () => {
            if (index < text.length) {
                heroTitle.textContent += text.charAt(index);
                index++;
                setTimeout(typeWriter, 100);
            }
        };

        setTimeout(typeWriter, 1000);
    }
}

// ===== FORM SYSTEM =====
class FormSystem {
    constructor() {
        this.contactForm = document.getElementById('contactForm');
        this.notificationSystem = new NotificationSystem();
        this.init();
    }

    init() {
        if (this.contactForm) {
            this.setupContactForm();
        }
        this.setupFormValidation();
    }

    setupContactForm() {
        this.contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!this.validateForm(this.contactForm)) {
                this.notificationSystem.show('Please fill in all required fields correctly.', 'error');
                return;
            }

            const formData = new FormData(this.contactForm);
            const data = Object.fromEntries(formData.entries());
            
            // Show loading state
            const submitBtn = this.contactForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            submitBtn.disabled = true;

            try {
                // Simulate API call
                await this.sendContactForm(data);
                
                this.notificationSystem.show('Message sent successfully! We\'ll get back to you soon.', 'success');
                this.contactForm.reset();
                
                // Track conversion
                this.trackConversion('contact_form_submission');
                
            } catch (error) {
                this.notificationSystem.show('Failed to send message. Please try again.', 'error');
                console.error('Contact form error:', error);
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    setupFormValidation() {
        const inputs = document.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input);
            });
            
            input.addEventListener('input', () => {
                if (input.classList.contains('error')) {
                    this.validateField(input);
                }
            });
        });
    }

    validateForm(form) {
        const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
        let isValid = true;
        
        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });
        
        return isValid;
    }

    validateField(field) {
        const value = field.value.trim();
        const type = field.type;
        let isValid = true;
        let message = '';

        // Remove previous error
        field.classList.remove('error');
        const existingError = field.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        // Required validation
        if (field.hasAttribute('required') && !value) {
            isValid = false;
            message = 'This field is required';
        }
        
        // Email validation
        else if (type === 'email' && value && !this.isValidEmail(value)) {
            isValid = false;
            message = 'Please enter a valid email address';
        }
        
        // Phone validation
        else if (type === 'tel' && value && !this.isValidPhone(value)) {
            isValid = false;
            message = 'Please enter a valid phone number';
        }

        if (!isValid) {
            field.classList.add('error');
            const errorElement = document.createElement('span');
            errorElement.className = 'error-message';
            errorElement.textContent = message;
            errorElement.style.cssText = `
                color: #ef4444;
                font-size: 14px;
                margin-top: 4px;
                display: block;
            `;
            field.parentNode.appendChild(errorElement);
        }

        return isValid;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidPhone(phone) {
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
    }

    async sendContactForm(data) {
        // Simulate API call
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Simulate success
                if (Math.random() > 0.1) {
                    resolve({ success: true });
                } else {
                    reject(new Error('Network error'));
                }
            }, 2000);
        });
    }

    trackConversion(event) {
        // Google Analytics event tracking
        if (typeof gtag !== 'undefined') {
            gtag('event', event, {
                event_category: 'engagement',
                event_label: 'contact_form'
            });
        }
    }
}

// ===== PORTFOLIO SYSTEM =====
class PortfolioSystem {
    constructor() {
        this.filterButtons = document.querySelectorAll('.filter-btn');
        this.portfolioItems = document.querySelectorAll('.portfolio-item');
        this.init();
    }

    init() {
        this.setupFiltering();
        this.setupPortfolioModals();
    }

    setupFiltering() {
        this.filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                const filter = button.getAttribute('data-filter');
                
                // Update active button
                this.filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Filter items
                this.portfolioItems.forEach(item => {
                    const category = item.getAttribute('data-category');
                    
                    if (filter === 'all' || category === filter) {
                        item.style.display = 'block';
                        setTimeout(() => {
                            item.style.opacity = '1';
                            item.style.transform = 'scale(1)';
                        }, 10);
                    } else {
                        item.style.opacity = '0';
                        item.style.transform = 'scale(0.8)';
                        setTimeout(() => {
                            item.style.display = 'none';
                        }, 300);
                    }
                });
            });
        });
    }

    setupPortfolioModals() {
        const viewButtons = document.querySelectorAll('.portfolio-view');
        
        viewButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const project = button.getAttribute('data-project');
                this.showProjectModal(project);
            });
        });
    }

    showProjectModal(projectId) {
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'project-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;

        const content = document.createElement('div');
        content.style.cssText = `
            background: white;
            border-radius: 16px;
            max-width: 800px;
            max-height: 90vh;
            overflow-y: auto;
            padding: 40px;
            position: relative;
            transform: scale(0.9);
            transition: transform 0.3s ease;
        `;

        content.innerHTML = `
            <button style="position: absolute; top: 20px; right: 20px; background: none; border: none; font-size: 24px; cursor: pointer;">×</button>
            <h2 style="margin-bottom: 20px;">${this.getProjectTitle(projectId)}</h2>
            <p style="line-height: 1.6; color: #666;">Detailed project information would go here. This could include case studies, technical details, results, and testimonials.</p>
        `;

        modal.appendChild(content);
        document.body.appendChild(modal);

        // Animate in
        setTimeout(() => {
            modal.style.opacity = '1';
            content.style.transform = 'scale(1)';
        }, 10);

        // Close handlers
        const closeModal = () => {
            modal.style.opacity = '0';
            content.style.transform = 'scale(0.9)';
            setTimeout(() => {
                document.body.removeChild(modal);
            }, 300);
        };

        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        content.querySelector('button').addEventListener('click', closeModal);
    }

    getProjectTitle(projectId) {
        const titles = {
            'medical-diagnosis': 'Medical AI Diagnosis System',
            'fraud-detection': 'Real-Time Fraud Detection',
            'recommendation-engine': 'AI Recommendation Engine',
            'predictive-maintenance': 'Predictive Maintenance System',
            'trading-algorithm': 'AI Trading Algorithm',
            'drug-discovery': 'AI Drug Discovery Platform'
        };
        return titles[projectId] || 'Project Details';
    }
}

// ===== THEME SYSTEM =====
class ThemeSystem {
    constructor() {
        this.themeToggle = document.querySelector('.theme-toggle');
        this.currentTheme = Utils.storage.get('theme', 'light');
        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.setupThemeToggle();
    }

    setupThemeToggle() {
        if (!this.themeToggle) return;

        this.themeToggle.addEventListener('click', () => {
            this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
            this.applyTheme(this.currentTheme);
            Utils.storage.set('theme', this.currentTheme);
        });
    }

    applyTheme(theme) {
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
            this.themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            document.body.classList.remove('dark-mode');
            this.themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        }
    }
}

// ===== COOKIE CONSENT SYSTEM =====
class CookieConsentSystem {
    constructor() {
        this.consentBanner = document.getElementById('cookieConsent');
        this.hasConsent = Utils.storage.get('cookieConsent', false);
        this.init();
    }

    init() {
        if (!this.hasConsent && this.consentBanner) {
            setTimeout(() => {
                this.consentBanner.classList.add('show');
            }, 2000);
        }

        this.setupEventListeners();
    }

    setupEventListeners() {
        const acceptBtn = document.getElementById('acceptCookies');
        const rejectBtn = document.getElementById('rejectCookies');
        const customizeBtn = document.getElementById('customizeCookies');

        if (acceptBtn) {
            acceptBtn.addEventListener('click', () => {
                this.acceptAll();
            });
        }

        if (rejectBtn) {
            rejectBtn.addEventListener('click', () => {
                this.rejectAll();
            });
        }

        if (customizeBtn) {
            customizeBtn.addEventListener('click', () => {
                this.showCustomizationModal();
            });
        }
    }

    acceptAll() {
        Utils.storage.set('cookieConsent', true);
        Utils.storage.set('cookiePreferences', {
            analytics: true,
            marketing: true,
            functional: true
        });
        this.hideBanner();
        this.enableAnalytics();
    }

    rejectAll() {
        Utils.storage.set('cookieConsent', false);
        Utils.storage.set('cookiePreferences', {
            analytics: false,
            marketing: false,
            functional: true
        });
        this.hideBanner();
    }

    showCustomizationModal() {
        // Implementation for cookie customization modal
        const notificationSystem = new NotificationSystem();
        notificationSystem.show('Cookie customization modal would appear here.', 'info');
    }

    hideBanner() {
        if (this.consentBanner) {
            this.consentBanner.classList.remove('show');
        }
    }

    enableAnalytics() {
        // Enable Google Analytics or other tracking
        if (CONFIG.ANALYTICS.ENABLED && typeof gtag !== 'undefined') {
            gtag('consent', 'update', {
                analytics_storage: 'granted'
            });
        }
    }
}

// ===== BACK TO TOP SYSTEM =====
class BackToTopSystem {
    constructor() {
        this.button = document.querySelector('.back-to-top');
        this.init();
    }

    init() {
        if (!this.button) return;

        this.setupScrollListener();
        this.setupClickHandler();
    }

    setupScrollListener() {
        const handleScroll = Utils.throttle(() => {
            const scrollTop = window.pageYOffset;
            
            if (scrollTop > 500) {
                this.button.classList.add('visible');
            } else {
                this.button.classList.remove('visible');
            }
        }, CONFIG.PERFORMANCE.THROTTLE_DELAY);

        window.addEventListener('scroll', handleScroll);
    }

    setupClickHandler() {
        this.button.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

// ===== PERFORMANCE MONITORING =====
class PerformanceMonitor {
    constructor() {
        this.metrics = {};
        this.init();
    }

    init() {
        this.measurePageLoad();
        this.measureUserInteractions();
    }

    measurePageLoad() {
        window.addEventListener('load', () => {
            if ('performance' in window) {
                const navigation = performance.getEntriesByType('navigation')[0];
                this.metrics.pageLoad = {
                    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                    loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
                    totalLoad: navigation.loadEventEnd - navigation.fetchStart
                };
                
                console.log('Page Load Metrics:', this.metrics.pageLoad);
            }
        });
    }

    measureUserInteractions() {
        // Track interaction delays
        document.addEventListener('click', (e) => {
            const startTime = performance.now();
            
            requestAnimationFrame(() => {
                const endTime = performance.now();
                const interactionDelay = endTime - startTime;
                
                if (interactionDelay > 100) {
                    console.warn('Slow interaction detected:', interactionDelay + 'ms');
                }
            });
        });
    }
}

// ===== LAZY LOADING SYSTEM =====
class LazyLoadingSystem {
    constructor() {
        this.images = document.querySelectorAll('img[loading="lazy"]');
        this.init();
    }

    init() {
        if ('IntersectionObserver' in window) {
            this.setupIntersectionObserver();
        } else {
            this.loadAllImages();
        }
    }

    setupIntersectionObserver() {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    this.loadImage(img);
                    imageObserver.unobserve(img);
                }
            });
        }, {
            rootMargin: `${CONFIG.PERFORMANCE.LAZY_LOAD_THRESHOLD}px`
        });

        this.images.forEach(img => imageObserver.observe(img));
    }

    loadImage(img) {
        const src = img.getAttribute('data-src') || img.src;
        
        // Create new image to test loading
        const tempImg = new Image();
        tempImg.onload = () => {
            img.src = src;
            img.classList.add('loaded');
        };
        tempImg.src = src;
    }

    loadAllImages() {
        this.images.forEach(img => this.loadImage(img));
    }
}

// ===== MAIN APPLICATION =====
class SimplifAIApp {
    constructor() {
        this.systems = [];
        this.init();
    }

    init() {
        // Initialize all systems
        this.systems = [
            new LoadingScreen(),
            new ParticleSystem(),
            new NavigationSystem(),
            new AnimationSystem(),
            new FormSystem(),
            new PortfolioSystem(),
            new ThemeSystem(),
            new CookieConsentSystem(),
            new BackToTopSystem(),
            new PerformanceMonitor(),
            new LazyLoadingSystem()
        ];

        // Setup global error handling
        this.setupErrorHandling();
        
        // Setup service worker for PWA
        this.setupServiceWorker();
        
        console.log('SimplifAI-1 Website initialized successfully');
    }

    setupErrorHandling() {
        window.addEventListener('error', (e) => {
            console.error('Global error:', e.error);
            // Track errors in analytics
            this.trackError(e.error);
        });

        window.addEventListener('unhandledrejection', (e) => {
            console.error('Unhandled promise rejection:', e.reason);
            this.trackError(e.reason);
        });
    }

    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('Service Worker registered:', registration);
                })
                .catch(error => {
                    console.log('Service Worker registration failed:', error);
                });
        }
    }

    trackError(error) {
        // Track errors in analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'exception', {
                description: error.message,
                fatal: false
            });
        }
    }
}

// ===== INITIALIZATION =====
// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    new SimplifAIApp();
});

// Export for external use if needed
window.SimplifAI = {
    Utils,
    NotificationSystem,
    SimplifAIApp
};