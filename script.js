/**
 * Shubham Dixit Resume Website - Main JavaScript
 * Handles interactivity, animations, and form functionality
 */

(function() {
    'use strict';

    // ========================================
    // Configuration
    // ========================================
    const CONFIG = {
        animationThreshold: 0.1,
        debounceDelay: 100,
        formspreeEndpoint: 'https://formspree.io/f/YOUR_FORM_ID', // Replace with actual Formspree ID
        emailJSConfig: {
            serviceId: 'YOUR_SERVICE_ID',
            templateId: 'YOUR_TEMPLATE_ID',
            publicKey: 'YOUR_PUBLIC_KEY'
        }
    };

    // ========================================
    // DOM Elements
    // ========================================
    const elements = {
        fadeElements: document.querySelectorAll('.fade-in'),
        skillBars: document.querySelectorAll('.skill-progress'),
        timelineHeaders: document.querySelectorAll('.timeline-header'),
        toolToggleBtns: document.querySelectorAll('.toggle-btn'),
        toolChips: document.querySelectorAll('.tool-chip'),
        contactForm: document.getElementById('contact-form'),
        formStatus: document.getElementById('form-status'),
        backToTopBtn: document.getElementById('back-to-top')
    };

    // ========================================
    // Utility Functions
    // ========================================
    
    /**
     * Debounce function to limit rapid function calls
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Announce message to screen readers
     */
    function announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            announcement.remove();
        }, 1000);
    }

    // ========================================
    // Scroll Animation (Fade In)
    // ========================================
    function initScrollAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    
                    // Animate skill bars if they're in this section
                    const skillBars = entry.target.querySelectorAll('.skill-progress');
                    skillBars.forEach(bar => {
                        const width = bar.dataset.width;
                        setTimeout(() => {
                            bar.style.width = `${width}%`;
                        }, 200);
                    });
                    
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: CONFIG.animationThreshold,
            rootMargin: '0px 0px -50px 0px'
        });

        elements.fadeElements.forEach(el => observer.observe(el));
    }

    // ========================================
    // Timeline Accordion
    // ========================================
    function initTimelineAccordion() {
        elements.timelineHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const content = document.getElementById(header.getAttribute('aria-controls'));
                const isExpanded = header.getAttribute('aria-expanded') === 'true';
                
                // Close all other items
                elements.timelineHeaders.forEach(otherHeader => {
                    if (otherHeader !== header) {
                        otherHeader.setAttribute('aria-expanded', 'false');
                        const otherContent = document.getElementById(otherHeader.getAttribute('aria-controls'));
                        if (otherContent) {
                            otherContent.hidden = true;
                        }
                    }
                });
                
                // Toggle current item
                header.setAttribute('aria-expanded', !isExpanded);
                content.hidden = isExpanded;
                
                // Announce change to screen readers
                const companyName = header.querySelector('.company-name').textContent;
                announceToScreenReader(
                    isExpanded 
                        ? `${companyName} details collapsed` 
                        : `${companyName} details expanded`
                );
            });
            
            // Keyboard navigation
            header.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    header.click();
                }
            });
        });
    }

    // ========================================
    // Tools Filter Toggle
    // ========================================
    function initToolsFilter() {
        elements.toolToggleBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const category = btn.dataset.category;
                
                // Update button states
                elements.toolToggleBtns.forEach(b => {
                    b.classList.remove('active');
                    b.setAttribute('aria-selected', 'false');
                });
                btn.classList.add('active');
                btn.setAttribute('aria-selected', 'true');
                
                // Filter chips
                elements.toolChips.forEach(chip => {
                    const chipCategory = chip.dataset.category;
                    if (category === 'all' || chipCategory === category || chipCategory === 'all') {
                        chip.classList.remove('hidden');
                    } else {
                        chip.classList.add('hidden');
                    }
                });
                
                // Announce change
                announceToScreenReader(`Showing ${category === 'all' ? 'all tools' : category + ' tools'}`);
            });
        });
    }

    // ========================================
    // Contact Form
    // ========================================
    function initContactForm() {
        if (!elements.contactForm) return;

        elements.contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Validate form
            if (!validateForm()) {
                return;
            }
            
            const formData = new FormData(elements.contactForm);
            const name = formData.get('name');
            const email = formData.get('email');
            const message = formData.get('message');
            
            // Show loading state
            const submitBtn = elements.contactForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            submitBtn.disabled = true;
            
            try {
                // Try Formspree first (if configured)
                if (CONFIG.formspreeEndpoint && !CONFIG.formspreeEndpoint.includes('YOUR_FORM_ID')) {
                    const response = await fetch(CONFIG.formspreeEndpoint, {
                        method: 'POST',
                        body: formData,
                        headers: {
                            'Accept': 'application/json'
                        }
                    });
                    
                    if (response.ok) {
                        showFormStatus('success', 'Thank you! Your message has been sent successfully.');
                        elements.contactForm.reset();
                    } else {
                        throw new Error('Form submission failed');
                    }
                } else {
                    // Fallback to mailto
                    const mailtoLink = `mailto:dixitshubham75@gmail.com?subject=Website Contact from ${encodeURIComponent(name)}&body=${encodeURIComponent(`From: ${name}\nEmail: ${email}\n\nMessage:\n${message}`)}`;
                    window.location.href = mailtoLink;
                    showFormStatus('success', 'Opening your email client...');
                }
            } catch (error) {
                console.error('Form submission error:', error);
                showFormStatus('error', 'There was an error sending your message. Please try the email link below.');
            } finally {
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
            }
        });
        
        // Real-time validation
        const inputs = elements.contactForm.querySelectorAll('.form-input');
        inputs.forEach(input => {
            input.addEventListener('blur', () => validateField(input));
            input.addEventListener('input', () => {
                const errorEl = input.parentNode.querySelector('.form-error');
                if (errorEl) errorEl.textContent = '';
            });
        });
    }

    function validateForm() {
        let isValid = true;
        const inputs = elements.contactForm.querySelectorAll('.form-input[required]');
        
        inputs.forEach(input => {
            if (!validateField(input)) {
                isValid = false;
            }
        });
        
        return isValid;
    }

    function validateField(input) {
        const errorEl = input.parentNode.querySelector('.form-error');
        let errorMessage = '';
        
        if (!input.value.trim()) {
            errorMessage = 'This field is required';
        } else if (input.type === 'email' && !isValidEmail(input.value)) {
            errorMessage = 'Please enter a valid email address';
        }
        
        if (errorEl) {
            errorEl.textContent = errorMessage;
        }
        
        input.setAttribute('aria-invalid', errorMessage ? 'true' : 'false');
        
        return !errorMessage;
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function showFormStatus(type, message) {
        if (!elements.formStatus) return;
        
        elements.formStatus.className = `form-status ${type}`;
        elements.formStatus.textContent = message;
        
        announceToScreenReader(message);
        
        if (type === 'success') {
            setTimeout(() => {
                elements.formStatus.className = 'form-status';
                elements.formStatus.textContent = '';
            }, 5000);
        }
    }

    // ========================================
    // Back to Top Button
    // ========================================
    function initBackToTop() {
        if (!elements.backToTopBtn) return;

        const toggleBackToTop = debounce(() => {
            const shouldShow = window.scrollY > 300;
            elements.backToTopBtn.hidden = !shouldShow;
        }, CONFIG.debounceDelay);

        window.addEventListener('scroll', toggleBackToTop);
        
        elements.backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
            
            // Set focus to skip link for accessibility
            const skipLink = document.querySelector('.skip-link');
            if (skipLink) {
                skipLink.focus();
            }
        });
    }

    // ========================================
    // Keyboard Navigation Enhancements
    // ========================================
    function initKeyboardNav() {
        // Add keyboard navigation for tool chips
        elements.toolChips.forEach(chip => {
            chip.setAttribute('tabindex', '0');
            chip.setAttribute('role', 'button');
        });
        
        // Handle Escape key to close expanded timeline items
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                elements.timelineHeaders.forEach(header => {
                    header.setAttribute('aria-expanded', 'false');
                    const content = document.getElementById(header.getAttribute('aria-controls'));
                    if (content) {
                        content.hidden = true;
                    }
                });
            }
        });
    }

    // ========================================
    // Initialize Skill Bars Animation
    // ========================================
    function initSkillBars() {
        // Initial animation check for skill bars already in view
        const skillsSection = document.querySelector('.skills-container');
        if (skillsSection) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        elements.skillBars.forEach((bar, index) => {
                            setTimeout(() => {
                                bar.style.width = `${bar.dataset.width}%`;
                            }, index * 100);
                        });
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.5 });
            
            observer.observe(skillsSection);
        }
    }

    // ========================================
    // Analytics (Optional)
    // ========================================
    function initAnalytics() {
        // Track key interactions (placeholder for actual implementation)
        const trackEvent = (category, action, label) => {
            if (typeof gtag === 'function') {
                gtag('event', action, {
                    'event_category': category,
                    'event_label': label
                });
            }
            // Console log for debugging
            console.log('Analytics Event:', { category, action, label });
        };

        // Track PDF downloads
        const downloadBtn = document.querySelector('[download]');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                trackEvent('Resume', 'Download', 'PDF');
            });
        }

        // Track contact form submissions
        if (elements.contactForm) {
            elements.contactForm.addEventListener('submit', () => {
                trackEvent('Contact', 'Submit', 'Contact Form');
            });
        }

        // Track LinkedIn clicks
        const linkedInLink = document.querySelector('a[href*="linkedin.com"]');
        if (linkedInLink) {
            linkedInLink.addEventListener('click', () => {
                trackEvent('Social', 'Click', 'LinkedIn');
            });
        }
    }

    // ========================================
    // Initialize Everything
    // ========================================
    function init() {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initAll);
        } else {
            initAll();
        }
    }

    function initAll() {
        initScrollAnimations();
        initTimelineAccordion();
        initToolsFilter();
        initContactForm();
        initBackToTop();
        initKeyboardNav();
        initSkillBars();
        initAnalytics();
        
        // Add loaded class to body for potential CSS hooks
        document.body.classList.add('js-loaded');
        
        console.log('Resume website initialized successfully!');
    }

    // Start initialization
    init();

})();