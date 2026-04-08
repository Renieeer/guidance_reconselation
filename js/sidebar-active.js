// Global sidebar active state handler
function initSidebarActive() {
    const url = window.location.href;
    const menuLinks = document.querySelectorAll('.sidebar-menu a');
    
    menuLinks.forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');
        if (href && url.includes(href)) {
            link.classList.add('active');
        }
    });
}

// Run when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSidebarActive);
} else {
    initSidebarActive();
}
