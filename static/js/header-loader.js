// Header Loader Script
// This script loads the header.html file into any element with id="header-container"

document.addEventListener('DOMContentLoaded', function() {
    // Load header into the header container
    fetch('header.html')
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
