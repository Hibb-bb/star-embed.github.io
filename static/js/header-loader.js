// Header Loader Script
// This script loads the header.html file into any element with id="header-container"

document.addEventListener('DOMContentLoaded', function() {
    // Load header into the header container
    // Calculate the path to header.html based on current location
    const currentPath = window.location.pathname;
    let headerPath = '/header.html';
    
    // If we're in a subdirectory, adjust the path
    if (currentPath.includes('/static/')) {
        headerPath = '../../header.html';
    } else if (currentPath.includes('/')) {
        headerPath = '/header.html';
    }
    
    fetch(headerPath)
        .then(response => response.text())
        .then(data => {
            const headerContainer = document.getElementById('header-container');
            if (headerContainer) {
                headerContainer.innerHTML = data;
            }
        })
        .catch(error => {
            console.error('Error loading header:', error);
        });
});
