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

// Run when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSidebarActive);
    document.addEventListener('DOMContentLoaded', initSidebarGroups);
} else {
    initSidebarActive();
    initSidebarGroups();
}

