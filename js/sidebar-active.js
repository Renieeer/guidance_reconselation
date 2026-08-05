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

// Collapsible nav groups (e.g. "School Control" on the SDO sidebar).
// Collapsed by default; clicking the label toggles it, and it opens itself
// automatically if one of its own links is the current page. No-ops on
// sidebars with no .sidebar-group elements.
function initSidebarGroups() {
    document.querySelectorAll('.sidebar-group').forEach(group => {
        if (group.querySelector('.sidebar-submenu a.active')) {
            group.classList.add('is-open');
        }

        const toggle = group.querySelector('.sidebar-group-toggle');
        if (toggle) {
            toggle.addEventListener('click', () => {
                group.classList.toggle('is-open');
            });
        }
    });
}

// Mobile hamburger toggle: opens/closes the off-canvas sidebar by flipping
// a class on <body> (see the .sidebar-toggle / body.sidebar-open rules in
// style.css). No-ops on pages without a .sidebar-toggle button.
function initSidebarToggle() {
    const toggle = document.querySelector('.sidebar-toggle');
    const overlay = document.querySelector('.sidebar-overlay');
    if (!toggle) return;

    const closeSidebar = () => document.body.classList.remove('sidebar-open');

    toggle.addEventListener('click', () => {
        document.body.classList.toggle('sidebar-open');
    });

    overlay?.addEventListener('click', closeSidebar);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeSidebar();
    });

    // Close automatically after tapping a nav link (the link navigation
    // itself unloads the page, but this avoids a flash of the drawer
    // staying open on back/forward-cache restores).
    document.querySelectorAll('.sidebar-menu a').forEach((link) => {
        link.addEventListener('click', closeSidebar);
    });

    // Don't leave the drawer stuck "open" if the window is resized past
    // the mobile breakpoint while it was open.
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) closeSidebar();
    });
}

// Run when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSidebarActive);
    document.addEventListener('DOMContentLoaded', initSidebarGroups);
    document.addEventListener('DOMContentLoaded', initSidebarToggle);
} else {
    initSidebarActive();
    initSidebarGroups();
    initSidebarToggle();
}

