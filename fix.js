// =====================================================================
// FIX.JS - Completa o codigo cortado do script.js
// =====================================================================

// 1) Redefine displaySearchResults completa (a do script.js esta cortada)
function displaySearchResults(data) {
    if (!DOM.searchResults) return;
    DOM.searchResults.style.display = 'block';
    DOM.searchResults.innerHTML = '';

    var totalFound = data.total_found || 0;
    var header = document.createElement('div');
    header.className = 'results-header';
    header.innerHTML = '<h3>Resultados da Busca</h3><div class="results-summary"><span class="summary-item info">Total encontrado: ' + totalFound + '</span></div>';
    DOM.searchResults.appendChild(header);

    // Update counters in parent section
    var elFound = document.getElementById('totalFound');
    var elCats = document.getElementById('totalCategories');

    var findings = data.findings || [];
    if (findings.length === 0) {
        var empty = document.createElement('p');
        empty.style.cssText = 'text-align:center;color:#888;padding:20px;';
        empty.textContent = 'Nenhum resultado encontrado.';
        DOM.searchResults.appendChild(empty);
        if (elFound) elFound.textContent = '0';
        if (elCats) elCats.textContent = '0';
        return;
    }

    var grouped = {};
    for (var i = 0; i < findings.length; i++) {
        var cat = findings[i].category || 'general';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(findings[i]);
    }

    var groupKeys = Object.keys(grouped);
    if (elFound) elFound.textContent = String(findings.length);
    if (elCats) elCats.textContent = String(groupKeys.length);

    for (var g = 0; g < groupKeys.length; g++) {
        var gKey = groupKeys[g];
        var gItems = grouped[gKey];
        var catBlock = document.createElement('div');
        catBlock.className = 'search-category';
        var catLabel = (categoryLabels && categoryLabels[gKey]) ? categoryLabels[gKey] : gKey;
        var catHeader = document.createElement('div');
        catHeader.className = 'error-category-header';
        catHeader.innerHTML = '<strong>' + escapeHTML(catLabel) + '</strong> <span>(' + gItems.length + ' itens)</span>';
        catBlock.appendChild(catHeader);

        var catList = document.createElement('div');
        catList.className = 'search-list';
        for (var j = 0; j < gItems.length; j++) {
            var findItem = gItems[j];
            var searchItem = document.createElement('div');
            searchItem.className = 'search-item';
            var html = '';
            if (findItem.type) html += '<strong>' + escapeHTML(findItem.type) + ':</strong> ';
            if (findItem.value) html += escapeHTML(findItem.value);
            if (findItem.details) html += ' <small>(' + escapeHTML(findItem.details) + ')</small>';
            if (!findItem.value && !findItem.type) html = escapeHTML(JSON.stringify(findItem));
            searchItem.innerHTML = html;
            catList.appendChild(searchItem);
        }
        catBlock.appendChild(catList);
        DOM.searchResults.appendChild(catBlock);
    }

    // Show parent section
    var parentSection = document.getElementById('searchResultsSection');
    if (parentSection) parentSection.style.display = 'block';

    // Hide progress after 2s
    setTimeout(function() {
        if (DOM.searchProgress) DOM.searchProgress.style.display = 'none';
    }, 2000);
}

// 2) Wrap displayErrorResults to show section + hide progress + update counters
(function() {
    var _orig = displayErrorResults;
    displayErrorResults = function(data) {
        _orig(data);
        var parentSection = document.getElementById('errorResultsSection');
        if (parentSection) parentSection.style.display = 'block';

        var totalE = 0, totalW = 0;
        if (data.summary) {
            totalE = data.summary.total_errors || 0;
            totalW = data.summary.total_warnings || 0;
        }
        var elErrors = document.getElementById('totalErrors');
        var elWarnings = document.getElementById('totalWarnings');
        if (elErrors) elErrors.textContent = String(totalE);
        if (elWarnings) elWarnings.textContent = String(totalW);

        setTimeout(function() {
            if (DOM.errorProgress) DOM.errorProgress.style.display = 'none';
        }, 2000);
    };
})();

// 3) Clear functions
function clearErrorResults() {
    var parentSection = document.getElementById('errorResultsSection');
    if (parentSection) parentSection.style.display = 'none';
    if (DOM.errorResults) { DOM.errorResults.style.display = 'none'; DOM.errorResults.innerHTML = ''; }
    if (DOM.errorProgress) DOM.errorProgress.style.display = 'none';
    if (DOM.errorProgressFill) DOM.errorProgressFill.style.width = '0%';
    if (DOM.errorProgressText) DOM.errorProgressText.textContent = '';
    var elErrors = document.getElementById('totalErrors');
    var elWarnings = document.getElementById('totalWarnings');
    if (elErrors) elErrors.textContent = '0';
    if (elWarnings) elWarnings.textContent = '0';
    state.lastErrorReport = null;
    showToast('Resultados limpos.', 'info');
}

function clearSearchResults() {
    var parentSection = document.getElementById('searchResultsSection');
    if (parentSection) parentSection.style.display = 'none';
    if (DOM.searchResults) { DOM.searchResults.style.display = 'none'; DOM.searchResults.innerHTML = ''; }
    if (DOM.searchProgress) DOM.searchProgress.style.display = 'none';
    if (DOM.searchProgressFill) DOM.searchProgressFill.style.width = '0%';
    if (DOM.searchProgressText) DOM.searchProgressText.textContent = '';
    var elFound = document.getElementById('totalFound');
    var elCats = document.getElementById('totalCategories');
    if (elFound) elFound.textContent = '0';
    if (elCats) elCats.textContent = '0';
    state.lastSearchReport = null;
    showToast('Resultados limpos.', 'info');
}

// 4) Fix backup progress bar hiding
(function() {
    var _origBackup = backupSite;
    backupSite = function() {
        _origBackup();
        var check = setInterval(function() {
            if (DOM.backupProgressText && (DOM.backupProgressText.textContent.indexOf('concludo') >= 0 || DOM.backupProgressText.textContent.indexOf('concluido') >= 0)) {
                setTimeout(function() {
                    if (DOM.backupProgress) DOM.backupProgress.style.display = 'none';
                    if (DOM.backupProgressFill) DOM.backupProgressFill.style.width = '0%';
                    if (DOM.backupProgressText) DOM.backupProgressText.textContent = '';
                }, 3000);
                clearInterval(check);
            }
        }, 1000);
        setTimeout(function() { clearInterval(check); }, 120000);
    };
})();

// 5) EVENT LISTENERS
function setupEventListeners() {
    console.log('Setting up event listeners...');

    if (DOM.btnAuth) DOM.btnAuth.addEventListener('click', function() { authenticate(); });
    if (DOM.authTokenInput) DOM.authTokenInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') authenticate(); });
    if (DOM.btnTogglePassword) DOM.btnTogglePassword.addEventListener('click', function() { togglePasswordVisibility(); });
    if (DOM.btnLogout) DOM.btnLogout.addEventListener('click', function() { logout(); });

    if (DOM.btnOpen) DOM.btnOpen.addEventListener('click', function() { openSite(); });
    if (DOM.urlInput) DOM.urlInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') openSite(); });

    if (DOM.btnScreenshot) DOM.btnScreenshot.addEventListener('click', function() { takeScreenshot(); });
    if (DOM.btnLogin) DOM.btnLogin.addEventListener('click', function() { openInteraction(); });
    if (DOM.btnScroll) DOM.btnScroll.addEventListener('click', function() { scrollPage('down'); });
    if (DOM.btnClose) DOM.btnClose.addEventListener('click', function() { closeSession(); });

    var btnScrollUp2 = document.getElementById('btnScrollUp2');
    var btnScrollDown2 = document.getElementById('btnScrollDown2');
    if (btnScrollUp2) btnScrollUp2.addEventListener('click', function() { scrollPage('up'); });
    if (btnScrollDown2) btnScrollDown2.addEventListener('click', function() { scrollPage('down'); });
    if (DOM.btnScrollUp) DOM.btnScrollUp.addEventListener('click', function() { scrollPage('up'); });
    if (DOM.btnScrollDown) DOM.btnScrollDown.addEventListener('click', function() { scrollPage('down'); });

    if (DOM.btnCloseInteract) DOM.btnCloseInteract.addEventListener('click', function() { closeInteraction(); });
    if (DOM.btnAutoLogin) DOM.btnAutoLogin.addEventListener('click', function() { autoLogin(); });
    if (DOM.btnToggleAutoLoginPassword) DOM.btnToggleAutoLoginPassword.addEventListener('click', function() { toggleAutoLoginPassword(); });

    if (DOM.btnOpenSiteTab) DOM.btnOpenSiteTab.addEventListener('click', function() { openSiteInNewTab(); });
    if (DOM.btnCopyCommand) DOM.btnCopyCommand.addEventListener('click', function() { copyCommandToClipboard(); });
    if (DOM.btnSyncCookies) DOM.btnSyncCookies.addEventListener('click', function() { syncCookies(); });
    if (DOM.btnGetSeleniumCookies) DOM.btnGetSeleniumCookies.addEventListener('click', function() { getSeleniumCookies(); });

    var btnRefreshSelenium = document.getElementById('btnRefreshSelenium');
    if (btnRefreshSelenium) btnRefreshSelenium.addEventListener('click', function() { refreshSeleniumPage(); });
    if (DOM.btnRefreshPreview) DOM.btnRefreshPreview.addEventListener('click', function() { refreshPreview(); });

    var livePreviewContainer = document.getElementById('livePreviewContainer');
    var livePreviewImg = document.getElementById('livePreviewImg');
    if (livePreviewContainer && livePreviewImg) {
        livePreviewContainer.addEventListener('click', function(e) {
            if (!state.sessionId) { showToast('Abra um site primeiro.', 'warning'); return; }
            var rect = livePreviewImg.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return;
            var scaleX = 1920 / rect.width;
            var scaleY = 1080 / rect.height;
            var realX = Math.round((e.clientX - rect.left) * scaleX);
            var realY = Math.round((e.clientY - rect.top) * scaleY);
            clickOnPage(realX, realY);
        });
    }

    var btnRemoteType = document.getElementById('btnRemoteType');
    var btnRemoteEnter = document.getElementById('btnRemoteEnter');
    var remoteTextInput = document.getElementById('remoteTextInput');
    if (btnRemoteType) btnRemoteType.addEventListener('click', function() { if (!remoteTextInput || !remoteTextInput.value) { showToast('Digite algo.', 'warning'); return; } typeOnPage(remoteTextInput.value, false); });
    if (btnRemoteEnter) btnRemoteEnter.addEventListener('click', function() { if (!remoteTextInput) return; typeOnPage(remoteTextInput.value, true); });
    if (remoteTextInput) remoteTextInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') { e.preventDefault(); typeOnPage(remoteTextInput.value, true); } });

    var btnRemoteTab = document.getElementById('btnRemoteTab');
    var btnRemoteEsc = document.getElementById('btnRemoteEsc');
    var btnRemoteBack = document.getElementById('btnRemoteBack');
    var btnRemoteForward = document.getElementById('btnRemoteForward');
    if (btnRemoteTab) btnRemoteTab.addEventListener('click', function() { if (!state.sessionId) return; apiJSON('/type-text','POST',{session_id:state.sessionId,text:'\uE004',press_enter:false,clear_first:false}).then(function(d){if(d.screenshot)updateAllPreviewsBase64(d.screenshot);showToast('Tab!','info');}).catch(function(e){showToast('Erro: '+e.message,'error');}); });
    if (btnRemoteEsc) btnRemoteEsc.addEventListener('click', function() { if (!state.sessionId) return; apiJSON('/type-text','POST',{session_id:state.sessionId,text:'\uE00C',press_enter:false,clear_first:false}).then(function(d){if(d.screenshot)updateAllPreviewsBase64(d.screenshot);showToast('Esc!','info');}).catch(function(e){showToast('Erro: '+e.message,'error');}); });
    if (btnRemoteBack) btnRemoteBack.addEventListener('click', function() { if (!state.sessionId) return; apiJSON('/navigate','POST',{session_id:state.sessionId,url:'javascript:history.back()'}).then(function(){setTimeout(refreshPreview,500);}).catch(function(){setTimeout(refreshPreview,500);}); });
    if (btnRemoteForward) btnRemoteForward.addEventListener('click', function() { if (!state.sessionId) return; apiJSON('/navigate','POST',{session_id:state.sessionId,url:'javascript:history.forward()'}).then(function(){setTimeout(refreshPreview,500);}).catch(function(){setTimeout(refreshPreview,500);}); });

    var btnLoginCancel = document.getElementById('btnLoginCancel');
    var btnLoginDone = document.getElementById('btnLoginDone');
    if (btnLoginCancel) btnLoginCancel.addEventListener('click', function() { closeInteraction(); });
    if (btnLoginDone) btnLoginDone.addEventListener('click', function() { finishLogin(); });

    if (DOM.btnBackup) DOM.btnBackup.addEventListener('click', function() { backupSite(); });
    if (DOM.btnCheckErrors) DOM.btnCheckErrors.addEventListener('click', function() { checkErrors(); });
    if (DOM.btnSearch) DOM.btnSearch.addEventListener('click', function() { searchSite(); });

    if (DOM.btnDownloadErrors) DOM.btnDownloadErrors.addEventListener('click', function() { downloadErrorReport(); });
    if (DOM.btnDownloadSearch) DOM.btnDownloadSearch.addEventListener('click', function() { downloadSearchReport(); });
    if (DOM.btnClearErrors) DOM.btnClearErrors.addEventListener('click', function() { clearErrorResults(); });
    if (DOM.btnClearSearch) DOM.btnClearSearch.addEventListener('click', function() { clearSearchResults(); });

    console.log('All event listeners registered.');
}

// 6) INITIALIZATION
async function init() {
    console.log('Initializing...');
    try {
        if (typeof BACKEND_CONFIG !== 'undefined' && BACKEND_CONFIG && BACKEND_CONFIG.BACKEND_URL) {
            state.backendUrl = BACKEND_CONFIG.BACKEND_URL.replace(/\/+$/, '');
        } else {
            var cr = await fetch('config.js');
            var ct = await cr.text();
            var um = ct.match(/BACKEND_URL\s*[:=]\s*['"]([^'"]+)['"]/);
            if (um && um[1]) state.backendUrl = um[1].replace(/\/+$/, '');
            else { var hm = ct.match(/(https:\/\/[^\s'"]+\.hf\.space)/); if (hm) state.backendUrl = hm[1].replace(/\/+$/, ''); }
            if (!state.backendUrl) { showToast('Backend URL nao encontrada', 'error'); return; }
        }
        console.log('Backend URL:', state.backendUrl);
    } catch (e) { showToast('Erro config: ' + e.message, 'error'); return; }

    // Fix status element IDs
    if (!DOM.serverStatus) DOM.serverStatus = document.getElementById('serverStatusText');
    if (!DOM.sessionBadge) DOM.sessionBadge = document.getElementById('sessionBadgeText');

    try {
        var sr = await fetch(state.backendUrl + '/');
        var sd = await sr.json();
        console.log('Server:', sd);
        updateServerStatus(true);
        showToast('Servidor conectado!', 'success');
        if (sd.auth_required === true) {
            var tk = localStorage.getItem('backup_auth_token');
            if (tk) {
                try {
                    var vr = await fetch(state.backendUrl + '/auth/verify', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+tk}, body:'{}' });
                    if (vr.ok) { state.token = tk; hideAuthModal(); updateSessionBadge(true); }
                    else { localStorage.removeItem('backup_auth_token'); showAuthModal(); }
                } catch(ve) { localStorage.removeItem('backup_auth_token'); showAuthModal(); }
            } else { showAuthModal(); }
        } else { hideAuthModal(); updateSessionBadge(true); }
    } catch (e) { updateServerStatus(false); showToast('Servidor offline', 'error'); }

    try { await checkExtension(); } catch(e) {}
    console.log('Init complete.');
}

// 7) STARTUP
(function() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() { setupDOM(); setupEventListeners(); init(); });
    } else {
        setupDOM(); setupEventListeners(); init();
    }
})();
