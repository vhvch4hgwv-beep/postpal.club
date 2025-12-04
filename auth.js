/**
 * PostPal Auth Module
 * Client-side authentication using localStorage
 * 
 * Usage:
 * - Include this script on all pages that need auth checking
 * - Call PostPalAuth.isSubscribed() to check subscription status
 * - Call PostPalAuth.subscribe() after successful payment
 * - Call PostPalAuth.logout() to sign out
 */

const PostPalAuth = {
    // Storage key for subscription status
    STORAGE_KEY: 'postpalUserStatus',
    TIMESTAMP_KEY: 'postpalSubscribedAt',

    /**
     * Check if user has an active subscription
     * @returns {boolean}
     */
    isSubscribed: function() {
        return localStorage.getItem(this.STORAGE_KEY) === 'subscribed';
    },

    /**
     * Mark user as subscribed (call after successful payment)
     * Stores subscription status and timestamp
     */
    subscribe: function() {
        localStorage.setItem(this.STORAGE_KEY, 'subscribed');
        localStorage.setItem(this.TIMESTAMP_KEY, new Date().toISOString());
        console.log('[PostPal Auth] User marked as subscribed');
    },

    /**
     * Log out the user
     * Clears subscription status and redirects to pricing
     * @param {string} redirectUrl - Optional custom redirect URL
     */
    logout: function(redirectUrl = 'pricing.html') {
        localStorage.removeItem(this.STORAGE_KEY);
        localStorage.removeItem(this.TIMESTAMP_KEY);
        console.log('[PostPal Auth] User logged out');
        window.location.href = redirectUrl;
    },

    /**
     * Get subscription timestamp
     * @returns {string|null} ISO date string or null
     */
    getSubscribedAt: function() {
        return localStorage.getItem(this.TIMESTAMP_KEY);
    },

    /**
     * Protect a page - redirect to pricing if not subscribed
     * Call this at the top of protected pages
     * @param {string} redirectUrl - URL to redirect to if not subscribed
     */
    requireSubscription: function(redirectUrl = 'pricing.html') {
        if (!this.isSubscribed()) {
            console.log('[PostPal Auth] Access denied - redirecting to pricing');
            window.location.href = redirectUrl;
            return false;
        }
        return true;
    },

    /**
     * Check URL for debug parameter to simulate subscription
     * Use: ?debug_subscribe=1 to mark as subscribed
     * Use: ?debug_logout=1 to clear subscription
     */
    handleDebugParams: function() {
        const urlParams = new URLSearchParams(window.location.search);
        
        if (urlParams.get('debug_subscribe') === '1') {
            this.subscribe();
            console.log('[PostPal Auth] Debug: User subscribed via URL param');
            // Redirect to dashboard without the debug param
            window.location.href = 'courses.html';
            return true;
        }
        
        if (urlParams.get('debug_logout') === '1') {
            this.logout();
            return true;
        }
        
        return false;
    },

    /**
     * Update navigation CTAs based on subscription status
     * Looks for elements with data-auth-cta attribute
     */
    updateNavCTAs: function() {
        const ctaElements = document.querySelectorAll('[data-auth-cta]');
        const isSubscribed = this.isSubscribed();

        ctaElements.forEach(el => {
            if (isSubscribed) {
                el.textContent = el.dataset.authSubscribed || 'Open Dashboard';
                el.href = el.dataset.authSubscribedHref || 'courses.html';
            } else {
                el.textContent = el.dataset.authLoggedout || 'Get PostPal';
                el.href = el.dataset.authLoggedoutHref || 'pricing.html';
            }
        });
    },

    /**
     * Initialize auth module
     * - Checks for debug params
     * - Updates nav CTAs
     */
    init: function() {
        // Handle debug params first (may redirect)
        if (this.handleDebugParams()) {
            return;
        }
        
        // Update any auth-aware CTAs
        this.updateNavCTAs();
        
        console.log('[PostPal Auth] Initialized. Subscribed:', this.isSubscribed());
    }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => PostPalAuth.init());
} else {
    PostPalAuth.init();
}
