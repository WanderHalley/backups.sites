// ===================== FIX: Complete missing code =====================

// Fix displaySearchResults ending
(function() {
    var _origDisplaySearch = displaySearchResults;
    displaySearchResults = function(data) {
        _origDisplaySearch(data);
        // Hide progress bar after 2 seconds
        setTimeout(function() {
            if (DOM.searchProgress) DOM.searchProgress.style.display = 'none';
        }, 2000);
    };
})();

// Fix displayErrorResults - hide progress
(function() {
    var _origDisplayErrors = displayErrorResults;
    displayErrorResults = function(data) {
        _origDisplayErrors(data);
        // Hide progress bar after 2 seconds
        setTimeout(function() {
            if (DOM.errorProgress) DOM.errorProgress.style.display = 'none';
        }, 2000);
    };
})();

// Fix backupSite - hide progress after download
(function() {
    var _origBackup = backupSite;
    backupSite = function() {
        _origBackup();
        // Check every 2 seconds if backup finished, then hide bar
        var checkInterval = setInterval(function() {
            if (DOM.backupProgressText && DOM.backupProgressText.textContent.indexOf('concludo') >= 0) {
                setTimeout(function() {
                    if (DOM.backupProgress) DOM.backupProgress.style.display = 'none';
                    if (DOM.backupProgressFill) DOM.backupProgressFill.style.width = '0%';
                    if (DOM.backupProgressText) DOM.backupProgressText.textContent = '';
                }, 3000);
                clearInterval(checkInterval);
            }
        }, 2000);
        // Safety: stop checking after 120 seconds
        setTimeout(function() { clearInterval(checkInterval); }, 120000);
    };
})();
