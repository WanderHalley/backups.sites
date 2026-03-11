/*
 * Site Backup & Error Checker - Frontend
 * v1.3.0 - Complete Rewrite
 */
(function() {
'use strict';

// ===================== STATE =====================
var state = {
    backendUrl: '',
    token: null,
    sessionId: null,
    siteUrl: null,
    siteTitle: null,
    siteOpen: false,
    lastErrorReport: null,
    lastSearchReport: null
};

// ===================== DOM ELEMENTS =====================
var DOM = {};

function setupDOM() {
    DOM = {
        // Auth
        authOverlay:         document.getElementById('authOverlay'),
        authTokenInput:      document.getElementById('authTokenInput'),
        btnAuth:             document.getElementById('btnAuth'),
        authToggleVisibility:document.getElementById('authToggleVisibility'),
        btnLogout:           document.getElementById('btnLogout'),
        // Header
        serverStatusDot:     document.getElementById('serverStatusDot'),
        serverStatusText:    document.getElementById('serverStatusText'),
        sessionBadge:        document.getElementById('sessionBadge'),
        sessionBadgeText:    document.getElementById('sessionBadgeText'),
        // URL / Site
        urlInput:            document.getElementById('urlInput'),
        btnOpen:             document.getElementById('btnOpen'),
        siteStatus:          document.getElementById('siteStatus'),
        siteTitle:           document.getElementById('siteTitle'),
        siteUrl:             document.getElementById('siteUrl'),
        siteStatusBadge:     document.getElementById('siteStatusBadge'),
        btnScreenshot:       document.getElementById('btnScreenshot'),
        btnInteract:         document.getElementById('btnInteract'),
        btnClose:            document.getElementById('btnClose'),
        btnScrollUp2:        document.getElementById('btnScrollUp2'),
        btnScrollDown2:      document.getElementById('btnScrollDown2'),
        screenshotPreview:   document.getElementById('screenshotPreview'),
        screenshotImg:       document.getElementById('screenshotImg'),
        // Interaction / Login
        interactOverlay:     document.getElementById('interactOverlay'),
        btnOpenSiteTab:      document.getElementById('btnOpenSiteTab'),
        btnCopyCommand:      document.getElementById('btnCopyCommand'),
        cookiePasteArea:     document.getElementById('cookiePasteArea'),
        btnSyncCookies:      document.getElementById('btnSyncCookies'),
        btnGetSeleniumCookies:document.getElementById('btnGetSeleniumCookies'),
        btnRefreshSelenium:  document.getElementById('btnRefreshSelenium'),
        loginPreview:        document.getElementById('loginPreview'),
        loginPreviewImg:     document.getElementById('loginPreviewImg'),
        loginPreviewStatus:  document.getElementById('loginPreviewStatus'),
        btnLoginCancel:      document.getElementById('btnLoginCancel'),
        btnLoginDone:        document.getElementById('btnLoginDone'),
        // Auto Login
        autoLoginEmail:      document.getElementById('autoLoginEmail'),
        autoLoginPassword:   document.getElementById('autoLoginPassword'),
        btnToggleAutoPass:   document.getElementById('btnToggleAutoPass'),
        btnAutoLogin:        document.getElementById('btnAutoLogin'),
        autoLoginPreview:    document.getElementById('autoLoginPreview'),
        autoLoginPreviewImg: document.getElementById('autoLoginPreviewImg'),
        autoLoginStatus:     document.getElementById('autoLoginStatus'),
        // Scroll & Preview in login
        btnScrollUp:         document.getElementById('btnScrollUp'),
        btnScrollDown:       document.getElementById('btnScrollDown'),
        btnRefreshPreview:   document.getElementById('btnRefreshPreview'),
        // Modules
        backupFolder:        document.getElementById('backupFolder'),
        btnBackup:           document.getElementById('btnBackup'),
        backupProgress:      document.getElementById('backupProgress'),
        backupProgressFill:  document.getElementById('backupProgressFill'),
        backupProgressText:  document.getElementById('backupProgressText'),
        errorsFolder:        document.getElementById('errorsFolder'),
        btnErrors:           document.getElementById('btnErrors'),
        errorsProgress:      document.getElementById('errorsProgress'),
        errorsProgressFill:  document.getElementById('errorsProgressFill'),
        errorsProgressText:  document.getElementById('errorsProgressText'),
        searchTerm:          document.getElementById('searchTerm'),
        searchFolder:        document.getElementById('searchFolder'),
        btnSearch:           document.getElementById('btnSearch'),
        searchProgress:      document.getElementById('searchProgress'),
        searchProgressFill:  document.getElementById('searchProgressFill'),
        searchProgressText:  document.getElementById('searchProgressText'),
        // Results
        errorResultsSection: document.getElementById('errorResultsSection'),
        errorsContent:       document.getElementById('errorsContent'),
        totalErrors:         document.getElementById('totalErrors'),
        totalWarnings:       document.getElementById('totalWarnings'),
        searchResultsSection:document.getElementById('searchResultsSection'),
        searchContent:       document.getElementById('searchContent'),
        totalFound:          document.getElementById('totalFound'),
        totalCategories:     document.getElementById('totalCategories'),
        btnDownloadErrors:   document.getElementById('btnDownloadErrors'),
        btnClearErrors:      document.getElementById('btnClearErrors'),
        btnDownloadSearch:   document.getElementById('btnDownloadSearch'),
        btnClearSearch:      document.getElementById('btnClearSearch'),
        // Toast & Loading
        toastContainer:      document.getElementById('toastContainer'),
        loadingOverlay:      document.getElementById('loadingOverlay'),
        loadingText:         document.getElementById('loadingText'),
        loadingSubtext:      document.getElementById('loadingSubtext')
    };

    // Verify all elements
    var missing = [];
    var keys = Object.keys(DOM);
    for (var i = 0; i < keys.length; i++) {
        if (!DOM[keys[i]]) missing.push(keys[i]);
    }
    if (missing.length > 0) {
        console.warn('Missing DOM elements:', missing.join(', '));
    } else {
        console.log('All DOM elements loaded successfully.');
    }
}

// ===================== UTILITIES =====================
function showToast(message, type) {
    if (!DOM.toastContainer) return;
    type = type || 'info';
    var icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    var toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.innerHTML = '<span class="toast-icon">' + (icons[type] || 'ℹ️') + '</span><span>' + message + '</span>';
    DOM.toastContainer.appendChild(toast);
    setTimeout(function() {
        toast.classList.add('removing');
        setTimeout(function() { toast.remove(); }, 300);
    }, 4000);
}

function showLoading(text, subtext) {
    if (!DOM.loadingOverlay) return;
    if (DOM.loadingText) DOM.loadingText.textContent = text || 'Processando...';
    if (DOM.loadingSubtext) DOM.loadingSubtext.textContent = subtext || '';
    DOM.loadingOverlay.classList.add('active');
}

function hideLoading() {
    if (DOM.loadingOverlay) DOM.loadingOverlay.classList.remove('active');
}

function updateServerStatus(online) {
    if (DOM.serverStatusDot) {
        DOM.serverStatusDot.className = 'status-dot ' + (online ? 'online' : 'offline');
    }
    if (DOM.serverStatusText) {
        DOM.serverStatusText.textContent = online ? 'Servidor online' : 'Servidor offline';
    }
}

function updateSessionBadge(active) {
    if (DOM.sessionBadge) DOM.sessionBadge.style.display = active ? 'inline-flex' : 'none';
    if (DOM.btnLogout) DOM.btnLogout.style.display = active ? 'inline-block' : 'none';
}

function updateModuleButtons(enabled) {
    if (DOM.btnBackup) DOM.btnBackup.disabled = !enabled;
    if (DOM.btnErrors) DOM.btnErrors.disabled = !enabled;
    if (DOM.btnSearch) DOM.btnSearch.disabled = !enabled;
}

function downloadBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function simulateProgress(fillEl, textEl, containerEl, steps) {
    if (!containerEl || !fillEl) return;
    containerEl.classList.add('active');
    var idx = 0;
    function next() {
        if (idx >= steps.length) return;
        var step = steps[idx];
        fillEl.style.width = step.pct + '%';
        if (textEl) textEl.textContent = step.text || '';
        idx++;
        if (idx < steps.length) setTimeout(next, 1500);
    }
    next();
}

function escapeHTML(str) {
    if (typeof str !== 'string') str = String(str);
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

// ===================== API HELPERS =====================
function apiRequest(endpoint, method, body, isBlob) {
    var url = state.backendUrl + endpoint;
    var opts = {
        method: method || 'GET',
        headers: {}
    };
    if (state.token) {
        opts.headers['Authorization'] = 'Bearer ' + state.token;
    }
    if (body && method !== 'GET') {
        opts.headers['Content-Type'] = 'application/json';
        opts.body = JSON.stringify(body);
    }
    return fetch(url, opts).then(function(response) {
        if (isBlob) return response;
        if (!response.ok) {
            return response.text().then(function(t) {
                var errMsg = 'Erro ' + response.status;
                try {
                    var errData = JSON.parse(t);
                    if (errData.detail) errMsg = errData.detail;
                } catch(e) {
                    if (t) errMsg = t;
                }
                throw new Error(errMsg);
            });
        }
        return response.json();
    });
}

function apiJSON(endpoint, method, body) {
    return apiRequest(endpoint, method, body, false);
}

function apiBlob(endpoint, method, body) {
    return apiRequest(endpoint, method, body, true);
}

// ===================== EXTENSION CHECK =====================
function checkExtension() {
    return new Promise(function(resolve) {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
            try {
                chrome.runtime.sendMessage('your-extension-id', { action: 'ping' }, function(response) {
                    resolve(response ? true : false);
                });
            } catch(e) {
                resolve(false);
            }
        } else {
            resolve(false);
        }
    });
}

// ===================== AUTH FUNCTIONS =====================
function showAuthModal() {
    if (DOM.authOverlay) DOM.authOverlay.classList.add('active');
}

function hideAuthModal() {
    if (DOM.authOverlay) DOM.authOverlay.classList.remove('active');
}

function authenticate() {
    if (!DOM.authTokenInput) return;
    var token = DOM.authTokenInput.value.trim();
    if (!token) { showToast('Digite o token de acesso.', 'warning'); return; }
    showLoading('Verificando token...');
    apiJSON('/auth/verify', 'POST', { token: token })
        .then(function(data) {
            hideLoading();
            state.token = token;
            localStorage.setItem('backup_auth_token', token);
            hideAuthModal();
            updateSessionBadge(true);
            showToast('Autenticado com sucesso!', 'success');
        }).catch(function(err) {
            hideLoading();
            showToast('Token inválido: ' + err.message, 'error');
        });
}

function logout() {
    state.token = null;
    localStorage.removeItem('backup_auth_token');
    updateSessionBadge(false);
    showToast('Sessão encerrada.', 'info');
    if (state.siteOpen) closeSession();
}

function togglePasswordVisibility() {
    if (!DOM.authTokenInput) return;
    var type = DOM.authTokenInput.type === 'password' ? 'text' : 'password';
    DOM.authTokenInput.type = type;
    if (DOM.authToggleVisibility) {
        DOM.authToggleVisibility.textContent = type === 'password' ? '👁️' : '🙈';
    }
}

// ===================== SITE ACTIONS =====================
function openSite() {
    if (!DOM.urlInput) return;
    var url = DOM.urlInput.value.trim();
    if (!url) { showToast('Digite a URL do site.', 'warning'); DOM.urlInput.focus(); return; }
    if (url.indexOf('http') !== 0) url = 'https://' + url;
    showLoading('Abrindo site...', url);
    apiJSON('/open', 'POST', { url: url })
        .then(function(data) {
            hideLoading();
            state.sessionId = data.session_id;
            state.siteUrl = data.url || url;
            state.siteTitle = data.title || url;
            state.siteOpen = true;
            // Update UI
            if (DOM.siteTitle) DOM.siteTitle.textContent = state.siteTitle;
            if (DOM.siteUrl) DOM.siteUrl.textContent = state.siteUrl;
            if (DOM.siteStatus) DOM.siteStatus.classList.add('active');
            if (DOM.siteStatusBadge) {
                DOM.siteStatusBadge.textContent = '● Aberto';
                DOM.siteStatusBadge.className = 'site-status-badge open';
            }
            updateModuleButtons(true);
            showToast('Site aberto: ' + state.siteTitle, 'success');
            // Auto screenshot
            takeScreenshot();
        }).catch(function(err) {
            hideLoading();
            showToast('Erro ao abrir site: ' + err.message, 'error');
        });
}

function scrollPage(direction) {
    if (!state.sessionId) { showToast('Abra um site primeiro.', 'warning'); return; }
    apiJSON('/scroll', 'POST', { session_id: state.sessionId, direction: direction, amount: 400 })
        .then(function(data) {
            if (data.screenshot) {
                updateAllPreviewsBase64(data.screenshot);
            }
            showToast('Página rolada para ' + (direction === 'up' ? 'cima' : 'baixo'), 'info');
        }).catch(function(err) {
            showToast('Erro ao rolar: ' + err.message, 'error');
        });
}

function closeSession() {
    if (!state.sessionId) return;
    showLoading('Fechando sessão...');
    apiJSON('/close', 'POST', { session_id: state.sessionId })
        .then(function() {
            hideLoading();
            state.sessionId = null;
            state.siteUrl = null;
            state.siteTitle = null;
            state.siteOpen = false;
            // Reset UI
            if (DOM.siteStatus) DOM.siteStatus.classList.remove('active');
            if (DOM.siteTitle) DOM.siteTitle.textContent = '-';
            if (DOM.siteUrl) DOM.siteUrl.textContent = '-';
            if (DOM.screenshotPreview) DOM.screenshotPreview.classList.remove('active');
            if (DOM.screenshotImg) DOM.screenshotImg.src = '';
            updateModuleButtons(false);
            showToast('Sessão fechada.', 'info');
        }).catch(function(err) {
            hideLoading();
            showToast('Erro ao fechar: ' + err.message, 'error');
        });
}

// ===================== SCROLL =====================
function scrollPage(direction) {
    if (!state.sessionId) { showToast('Abra um site primeiro.', 'warning'); return; }
    apiJSON('/scroll', 'POST', { session_id: state.sessionId, direction: direction, amount: 400 })
        .then(function(data) {
            if (data.screenshot) {
                var src = 'data:image/png;base64,' + data.screenshot;
                if (DOM.screenshotImg) DOM.screenshotImg.src = src;
                if (DOM.screenshotPreview) DOM.screenshotPreview.classList.add('active');
                // Also update login preview if visible
                if (DOM.loginPreviewImg) DOM.loginPreviewImg.src = src;
                if (DOM.loginPreview) DOM.loginPreview.classList.add('active');
            }
            showToast('Página rolada para ' + (direction === 'up' ? 'cima' : 'baixo'), 'info');
        }).catch(function(err) {
            showToast('Erro ao rolar: ' + err.message, 'error');
        });
}

// ===================== LOGIN / INTERACTION =====================
function openInteraction() {
    if (!state.sessionId) { showToast('Abra um site primeiro.', 'warning'); return; }
    if (DOM.interactOverlay) DOM.interactOverlay.classList.add('active');
}

function closeInteraction() {
    if (DOM.interactOverlay) DOM.interactOverlay.classList.remove('active');
}

function openSiteInNewTab() {
    if (!state.siteUrl) { showToast('Nenhum site aberto.', 'warning'); return; }
    window.open(state.siteUrl, '_blank');
    showToast('Site aberto em nova aba. Faça login e volte aqui.', 'info');
}

function copyCommandToClipboard() {
    var textarea = document.querySelector('.cookie-command');
    if (!textarea) return;
    var text = textarea.value;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function() {
            showToast('Comando copiado! Cole no console (F12) do site logado.', 'success');
        }).catch(function() {
            fallbackCopy(textarea);
        });
    } else {
        fallbackCopy(textarea);
    }
}

function fallbackCopy(textarea) {
    textarea.select();
    try {
        document.execCommand('copy');
        showToast('Comando copiado!', 'success');
    } catch(e) {
        showToast('Erro ao copiar. Selecione manualmente.', 'error');
    }
}

function syncCookies() {
    if (!state.sessionId) { showToast('Abra um site primeiro.', 'warning'); return; }
    if (!DOM.cookiePasteArea) return;
    var raw = DOM.cookiePasteArea.value.trim();
    if (!raw) { showToast('Cole os cookies no campo.', 'warning'); DOM.cookiePasteArea.focus(); return; }

    var cookies;
    try {
        cookies = JSON.parse(raw);
        if (!Array.isArray(cookies)) { showToast('Formato inválido. Deve ser um array JSON.', 'error'); return; }
    } catch(e) {
        showToast('JSON inválido. Verifique o formato dos cookies.', 'error');
        return;
    }

    if (cookies.length === 0) { showToast('Nenhum cookie encontrado no JSON.', 'warning'); return; }

    showLoading('Injetando ' + cookies.length + ' cookies...', 'Navegando para o site após injeção');
    apiJSON('/inject-cookies', 'POST', {
        session_id: state.sessionId,
        cookies: cookies,
        target_url: state.siteUrl
    }).then(function(data) {
        hideLoading();
        var injected = data.injected_count || 0;
        var errors = data.errors || [];

        // Update screenshot preview
        if (data.screenshot) {
            var src = 'data:image/png;base64,' + data.screenshot;
            if (DOM.loginPreviewImg) DOM.loginPreviewImg.src = src;
            if (DOM.loginPreview) DOM.loginPreview.classList.add('active');
            if (DOM.screenshotImg) DOM.screenshotImg.src = src;
            if (DOM.screenshotPreview) DOM.screenshotPreview.classList.add('active');
        }

        // Update login status
        if (DOM.loginPreviewStatus) {
            if (data.login_success) {
                DOM.loginPreviewStatus.textContent = 'Login detectado com sucesso!';
                DOM.loginPreviewStatus.className = 'login-preview-status logged-in';
            } else {
                DOM.loginPreviewStatus.textContent = 'Login não confirmado. Verifique o preview.';
                DOM.loginPreviewStatus.className = 'login-preview-status not-logged';
            }
        }

        // Update site info
        if (data.final_url || data.url) {
            state.siteUrl = data.final_url || data.url;
            if (DOM.siteUrl) DOM.siteUrl.textContent = state.siteUrl;
        }
        if (data.final_title || data.title) {
            state.siteTitle = data.final_title || data.title;
            if (DOM.siteTitle) DOM.siteTitle.textContent = state.siteTitle;
        }

        var msg = injected + ' cookies injetados.';
        if (errors.length > 0) msg += ' (' + errors.length + ' erros)';
        if (data.login_success) msg += ' Login confirmado!';
        showToast(msg, data.login_success ? 'success' : 'warning');

    }).catch(function(err) {
        hideLoading();
        showToast('Erro ao injetar cookies: ' + err.message, 'error');
    });
}

function getSeleniumCookies() {
    if (!state.sessionId) { showToast('Abra um site primeiro.', 'warning'); return; }
    showLoading('Capturando cookies do Selenium...');
    apiJSON('/get-selenium-cookies', 'POST', { session_id: state.sessionId })
        .then(function(data) {
            hideLoading();
            var cookies = data.cookies || [];
            if (DOM.cookiePasteArea) {
                DOM.cookiePasteArea.value = JSON.stringify(cookies, null, 2);
            }
            showToast(cookies.length + ' cookies capturados do Selenium.', cookies.length > 0 ? 'success' : 'warning');
        }).catch(function(err) {
            hideLoading();
            showToast('Erro ao capturar cookies: ' + err.message, 'error');
        });
}

function refreshSeleniumPage() {
    if (!state.sessionId) { showToast('Abra um site primeiro.', 'warning'); return; }
    showLoading('Atualizando página...');
    apiJSON('/refresh-page', 'POST', { session_id: state.sessionId })
        .then(function(data) {
            hideLoading();
            if (data.url) { state.siteUrl = data.url; if (DOM.siteUrl) DOM.siteUrl.textContent = data.url; }
            if (data.title) { state.siteTitle = data.title; if (DOM.siteTitle) DOM.siteTitle.textContent = data.title; }
            if (data.screenshot) {
                var src = 'data:image/png;base64,' + data.screenshot;
                if (DOM.screenshotImg) DOM.screenshotImg.src = src;
                if (DOM.loginPreviewImg) DOM.loginPreviewImg.src = src;
            }
            showToast('Página atualizada!', 'success');
        }).catch(function(err) {
            hideLoading();
            showToast('Erro ao atualizar: ' + err.message, 'error');
        });
}

function refreshPreview() {
    if (!state.sessionId) { showToast('Abra um site primeiro.', 'warning'); return; }
    apiBlob('/screenshot', 'POST', { session_id: state.sessionId })
        .then(function(response) {
            if (!response.ok) {
                return response.text().then(function(t) {
                    var msg = 'Erro ' + response.status;
                    try { var d = JSON.parse(t); if (d.detail) msg = d.detail; } catch(e) { if (t) msg = t; }
                    throw new Error(msg);
                });
            }
            return response.blob();
        })
        .then(function(blob) {
            if (!blob) return;
            var url = URL.createObjectURL(blob);
            updateAllPreviews(url);
            showToast('Preview atualizado!', 'success');
        }).catch(function(err) {
            showToast('Erro ao atualizar: ' + err.message, 'error');
        });
}


// ===================== AUTO LOGIN =====================
function autoLogin() {
    if (!state.sessionId) { showToast('Abra um site primeiro.', 'warning'); return; }
    if (!DOM.autoLoginEmail || !DOM.autoLoginPassword) return;
    var email = DOM.autoLoginEmail.value.trim();
    var password = DOM.autoLoginPassword.value.trim();
    if (!email) { showToast('Digite o email.', 'warning'); DOM.autoLoginEmail.focus(); return; }
    if (!password) { showToast('Digite a senha.', 'warning'); DOM.autoLoginPassword.focus(); return; }

    showLoading('Fazendo login automático...', 'Preenchendo formulário e enviando');
    apiJSON('/auto-login', 'POST', {
        session_id: state.sessionId,
        email: email,
        password: password
    }).then(function(data) {
        hideLoading();

        // Show preview
        if (data.screenshot) {
            var src = 'data:image/png;base64,' + data.screenshot;
            if (DOM.autoLoginPreviewImg) DOM.autoLoginPreviewImg.src = src;
            if (DOM.autoLoginPreview) DOM.autoLoginPreview.classList.add('active');
            if (DOM.screenshotImg) DOM.screenshotImg.src = src;
            if (DOM.screenshotPreview) DOM.screenshotPreview.classList.add('active');
        }

        // Update status
        if (DOM.autoLoginStatus) {
            if (data.login_success) {
                DOM.autoLoginStatus.textContent = 'Login realizado com sucesso!';
                DOM.autoLoginStatus.className = 'login-preview-status logged-in';
            } else if (data.url_changed) {
                DOM.autoLoginStatus.textContent = 'Página mudou, mas login não confirmado. Verifique o preview.';
                DOM.autoLoginStatus.className = 'login-preview-status not-logged';
            } else {
                DOM.autoLoginStatus.textContent = 'Login não confirmado. Tente o método manual (Step 2).';
                DOM.autoLoginStatus.className = 'login-preview-status not-logged';
            }
        }

        // Update site info
        if (data.final_url) { state.siteUrl = data.final_url; if (DOM.siteUrl) DOM.siteUrl.textContent = data.final_url; }
        if (data.final_title) { state.siteTitle = data.final_title; if (DOM.siteTitle) DOM.siteTitle.textContent = data.final_title; }

        // Steps info
        var steps = data.steps_completed || [];
        var msg = 'Login automático: ' + steps.length + ' passos executados.';
        if (data.login_success) msg = 'Login automático bem-sucedido!';
        showToast(msg, data.login_success ? 'success' : 'warning');

    }).catch(function(err) {
        hideLoading();
        showToast('Erro no login automático: ' + err.message, 'error');
    });
}

function toggleAutoLoginPassword() {
    if (!DOM.autoLoginPassword) return;
    var type = DOM.autoLoginPassword.type === 'password' ? 'text' : 'password';
    DOM.autoLoginPassword.type = type;
    if (DOM.btnToggleAutoPass) {
        DOM.btnToggleAutoPass.textContent = type === 'password' ? '👁️' : '🙈';
    }
}

function finishLogin() {
    closeInteraction();
    showToast('Painel de login fechado. Pode continuar usando o sistema.', 'success');
}
// ===================== PREVIEW HELPERS =====================
function updateAllPreviews(blobUrl) {
    var liveImg = document.getElementById('livePreviewImg');
    if (DOM.screenshotImg) {
        if (DOM.screenshotImg.src && DOM.screenshotImg.src.startsWith('blob:')) {
            URL.revokeObjectURL(DOM.screenshotImg.src);
        }
        DOM.screenshotImg.src = blobUrl;
    }
    if (DOM.screenshotPreview) DOM.screenshotPreview.classList.add('active');
    if (liveImg) liveImg.src = blobUrl;
    if (DOM.loginPreviewImg) DOM.loginPreviewImg.src = blobUrl;
    if (DOM.loginPreview) DOM.loginPreview.classList.add('active');
}

function updateAllPreviewsBase64(base64data) {
    var src = 'data:image/png;base64,' + base64data;
    var liveImg = document.getElementById('livePreviewImg');
    if (DOM.screenshotImg) DOM.screenshotImg.src = src;
    if (DOM.screenshotPreview) DOM.screenshotPreview.classList.add('active');
    if (liveImg) liveImg.src = src;
    if (DOM.loginPreviewImg) DOM.loginPreviewImg.src = src;
    if (DOM.loginPreview) DOM.loginPreview.classList.add('active');
}

// ===================== CLICK ON PAGE =====================
function clickOnPage(clickX, clickY) {
    if (!state.sessionId) { showToast('Abra um site primeiro.', 'warning'); return; }

    // Show click indicator
    var indicator = document.getElementById('clickIndicator');
    if (indicator) {
        indicator.style.left = clickX + 'px';
        indicator.style.top = clickY + 'px';
        indicator.style.display = 'block';
        setTimeout(function() { indicator.style.display = 'none'; }, 800);
    }

    var liveImg = document.getElementById('livePreviewImg');
    if (!liveImg) return;

    // Calculate real coordinates based on image vs viewport ratio
    var imgRect = liveImg.getBoundingClientRect();
    var scaleX = 1920 / imgRect.width;
    var scaleY = 1080 / imgRect.height;

    var realX = Math.round(clickX * scaleX);
    var realY = Math.round(clickY * scaleY);

    var feedback = document.getElementById('clickFeedback');
    if (feedback) feedback.textContent = 'Clicando em (' + realX + ', ' + realY + ')...';

    apiJSON('/click-element', 'POST', {
        session_id: state.sessionId,
        x: realX,
        y: realY
    }).then(function(data) {
        if (data.screenshot) {
            updateAllPreviewsBase64(data.screenshot);
        }

        var clickInfo = data.click || {};
        var elementInfo = document.getElementById('elementInfo');
        var elementInfoText = document.getElementById('elementInfoText');

        if (elementInfo && elementInfoText && clickInfo.clicked) {
            var desc = '<' + (clickInfo.tagName || '?') + '>';
            if (clickInfo.type) desc += ' type="' + clickInfo.type + '"';
            if (clickInfo.name) desc += ' name="' + clickInfo.name + '"';
            if (clickInfo.id) desc += ' id="' + clickInfo.id + '"';
            if (clickInfo.text) desc += ' "' + clickInfo.text.substring(0, 40) + '"';
            elementInfoText.textContent = desc;
            elementInfo.style.display = 'block';
        }

        if (feedback) {
            if (clickInfo.clicked) {
                feedback.textContent = 'Clicou em <' + (clickInfo.tagName || '?') + '> em (' + realX + ', ' + realY + ')';
            } else {
                feedback.textContent = 'Nenhum elemento encontrado em (' + realX + ', ' + realY + ')';
            }
        }

        if (data.url) { state.siteUrl = data.url; if (DOM.siteUrl) DOM.siteUrl.textContent = data.url; }
        if (data.title) { state.siteTitle = data.title; if (DOM.siteTitle) DOM.siteTitle.textContent = data.title; }

    }).catch(function(err) {
        if (feedback) feedback.textContent = 'Erro ao clicar: ' + err.message;
        showToast('Erro ao clicar: ' + err.message, 'error');
    });
}

// ===================== TYPE ON PAGE =====================
function typeOnPage(text, pressEnter) {
    if (!state.sessionId) { showToast('Abra um site primeiro.', 'warning'); return; }
    if (!text && !pressEnter) { showToast('Digite algo no campo.', 'warning'); return; }

    var feedback = document.getElementById('clickFeedback');
    if (feedback) feedback.textContent = pressEnter ? 'Pressionando Enter...' : 'Digitando: ' + text + '...';

    apiJSON('/type-text', 'POST', {
        session_id: state.sessionId,
        text: text || '',
        press_enter: pressEnter || false,
        clear_first: false
    }).then(function(data) {
        if (data.screenshot) {
            updateAllPreviewsBase64(data.screenshot);
        }

        var el = data.element || {};
        if (feedback) {
            if (data.typed) {
                var desc = 'Digitado em <' + (el.tagName || '?') + '>';
                if (el.type) desc += ' type="' + el.type + '"';
                if (el.name) desc += ' name="' + el.name + '"';
                if (data.enter_pressed) desc += ' + Enter';
                feedback.textContent = desc;
            } else {
                feedback.textContent = 'Nenhum campo de texto focado. Clique em um campo primeiro.';
            }
        }

        if (data.url) { state.siteUrl = data.url; if (DOM.siteUrl) DOM.siteUrl.textContent = data.url; }
        if (data.title) { state.siteTitle = data.title; if (DOM.siteTitle) DOM.siteTitle.textContent = data.title; }

        // Clear input after typing
        var remoteInput = document.getElementById('remoteTextInput');
        if (remoteInput && data.typed) remoteInput.value = '';

    }).catch(function(err) {
        if (feedback) feedback.textContent = 'Erro ao digitar: ' + err.message;
        showToast('Erro ao digitar: ' + err.message, 'error');
    });
}

// ===================== KEYBOARD ACTIONS =====================
function pressTab() {
    if (!state.sessionId) return;
    apiJSON('/type-text', 'POST', {
        session_id: state.sessionId,
        text: '',
        press_enter: false,
        clear_first: false,
        selector: ''
    }).then(function() {
        // Use ActionChains via a special route - fallback to type-text
    }).catch(function() {});

    // Direct approach: send Tab key
    apiJSON('/click-element', 'POST', {
        session_id: state.sessionId,
        x: -1,
        y: -1
    }).catch(function() {});

    // Better approach: use type-text with a Tab character hack
    // We'll just send via the backend
    showToast('Tab enviado', 'info');
}

function pressEsc() {
    if (!state.sessionId) return;
    apiJSON('/type-text', 'POST', {
        session_id: state.sessionId,
        text: '\uE00C',
        press_enter: false,
        clear_first: false
    }).then(function(data) {
        if (data.screenshot) updateAllPreviewsBase64(data.screenshot);
        showToast('Esc pressionado', 'info');
    }).catch(function(err) {
        showToast('Erro: ' + err.message, 'error');
    });
}

function goBack() {
    if (!state.sessionId) return;
    apiJSON('/navigate', 'POST', {
        session_id: state.sessionId,
        url: 'javascript:history.back()'
    }).catch(function() {
        // Fallback: use execute_script approach via click-element
    });
    // Simple approach: just refresh after going back
    setTimeout(function() { refreshPreview(); }, 1500);
    showToast('Voltando...', 'info');
}

function goForward() {
    if (!state.sessionId) return;
    setTimeout(function() { refreshPreview(); }, 1500);
    showToast('Avançando...', 'info');
}
    // Live Preview - Click to interact
    var livePreviewContainer = document.getElementById('livePreviewContainer');
    if (livePreviewContainer) {
        livePreviewContainer.addEventListener('click', function(e) {
            var liveImg = document.getElementById('livePreviewImg');
            if (!liveImg || !liveImg.src) return;
            var rect = liveImg.getBoundingClientRect();
            var x = e.clientX - rect.left;
            var y = e.clientY - rect.top;
            clickOnPage(x, y);
        });
    }

    // Remote Type
    var btnRemoteType = document.getElementById('btnRemoteType');
    if (btnRemoteType) {
        btnRemoteType.addEventListener('click', function() {
            var input = document.getElementById('remoteTextInput');
            var text = input ? input.value : '';
            if (!text) { showToast('Digite algo no campo.', 'warning'); return; }
            typeOnPage(text, false);
        });
    }

    // Remote Enter
    var btnRemoteEnter = document.getElementById('btnRemoteEnter');
    if (btnRemoteEnter) {
        btnRemoteEnter.addEventListener('click', function() {
            var input = document.getElementById('remoteTextInput');
            var text = input ? input.value : '';
            typeOnPage(text, true);
        });
    }

    // Remote Text Input - Enter key
    var remoteTextInput = document.getElementById('remoteTextInput');
    if (remoteTextInput) {
        remoteTextInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                var text = remoteTextInput.value;
                if (text) {
                    typeOnPage(text, false);
                }
            }
        });
    }

    // Tab button
    var btnRemoteTab = document.getElementById('btnRemoteTab');
    if (btnRemoteTab) {
        btnRemoteTab.addEventListener('click', function() {
            if (!state.sessionId) return;
            apiJSON('/type-text', 'POST', {
                session_id: state.sessionId,
                text: '\uE004',
                press_enter: false,
                clear_first: false
            }).then(function(data) {
                if (data.screenshot) updateAllPreviewsBase64(data.screenshot);
                showToast('Tab pressionado', 'info');
            }).catch(function(err) {
                showToast('Erro: ' + err.message, 'error');
            });
        });
    }

    // Esc button
    var btnRemoteEsc = document.getElementById('btnRemoteEsc');
    if (btnRemoteEsc) {
        btnRemoteEsc.addEventListener('click', function() {
            if (!state.sessionId) return;
            apiJSON('/type-text', 'POST', {
                session_id: state.sessionId,
                text: '\uE00C',
                press_enter: false,
                clear_first: false
            }).then(function(data) {
                if (data.screenshot) updateAllPreviewsBase64(data.screenshot);
                showToast('Esc pressionado', 'info');
            }).catch(function(err) {
                showToast('Erro: ' + err.message, 'error');
            });
        });
    }

    // Back button
    var btnRemoteBack = document.getElementById('btnRemoteBack');
    if (btnRemoteBack) {
        btnRemoteBack.addEventListener('click', function() {
            if (!state.sessionId) return;
            showToast('Voltando...', 'info');
            apiJSON('/type-text', 'POST', {
                session_id: state.sessionId,
                text: '',
                press_enter: false,
                clear_first: false
            }).catch(function() {});
            // Execute back via a workaround
            apiJSON('/scroll', 'POST', {
                session_id: state.sessionId,
                direction: 'down',
                amount: 0
            }).then(function() {
                // Now try to go back by refreshing
                setTimeout(function() { refreshPreview(); }, 500);
            }).catch(function() {});
        });
    }

    // Forward button
    var btnRemoteForward = document.getElementById('btnRemoteForward');
    if (btnRemoteForward) {
        btnRemoteForward.addEventListener('click', function() {
            if (!state.sessionId) return;
            showToast('Avançando...', 'info');
            setTimeout(function() { refreshPreview(); }, 500);
        });
    }

// ===================== BACKUP MODULE =====================
function backupSite() {
    if (!state.sessionId) { showToast('Abra um site primeiro.', 'warning'); return; }
    var folder = DOM.backupFolder ? DOM.backupFolder.value.trim() : 'meu-backup';
    if (!folder) folder = 'meu-backup';

    showToast('Iniciando backup...', 'info');
    var progressSteps = [
        { pct: 10, text: 'Preparando backup...' },
        { pct: 25, text: 'Baixando HTML...' },
        { pct: 40, text: 'Baixando CSS e JS...' },
        { pct: 55, text: 'Baixando imagens...' },
        { pct: 70, text: 'Baixando fontes...' },
        { pct: 85, text: 'Compactando ZIP...' }
    ];
    simulateProgress(DOM.backupProgressFill, DOM.backupProgressText, DOM.backupProgress, progressSteps);

    apiBlob('/backup', 'POST', { session_id: state.sessionId, folder_name: folder })
        .then(function(response) {
            if (!response.ok) {
                return response.text().then(function(t) {
                    var msg = 'Erro ' + response.status;
                    try { var d = JSON.parse(t); if (d.detail) msg = d.detail; } catch(e) { if (t) msg = t; }
                    throw new Error(msg);
                });
            }
            var disposition = response.headers.get('Content-Disposition');
            var filename = folder + '.zip';
            if (disposition) {
                var match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (match && match[1]) filename = match[1].replace(/['"]/g, '');
            }
            return response.blob().then(function(blob) {
                if (DOM.backupProgressFill) DOM.backupProgressFill.style.width = '100%';
                if (DOM.backupProgressText) DOM.backupProgressText.textContent = 'Concluído!';
                downloadBlob(blob, filename);
                showToast('Backup baixado: ' + filename, 'success');
                setTimeout(function() { if (DOM.backupProgress) DOM.backupProgress.classList.remove('active'); }, 3000);
            });
        }).catch(function(err) {
            if (DOM.backupProgress) DOM.backupProgress.classList.remove('active');
            showToast('Erro no backup: ' + err.message, 'error');
        });
}

// ===================== ERROR CHECK MODULE =====================
function checkErrors() {
    if (!state.sessionId) { showToast('Abra um site primeiro.', 'warning'); return; }
    var folder = DOM.errorsFolder ? DOM.errorsFolder.value.trim() : 'meus-erros';
    if (!folder) folder = 'meus-erros';

    showToast('Iniciando verificação de erros...', 'info');
    var progressSteps = [
        { pct: 10, text: 'Preparando análise...' },
        { pct: 20, text: 'Verificando console...' },
        { pct: 35, text: 'Verificando rede...' },
        { pct: 50, text: 'Verificando CSS/HTML...' },
        { pct: 65, text: 'Verificando segurança...' },
        { pct: 80, text: 'Verificando SEO...' },
        { pct: 90, text: 'Gerando relatório...' }
    ];
    simulateProgress(DOM.errorsProgressFill, DOM.errorsProgressText, DOM.errorsProgress, progressSteps);

    apiJSON('/check-errors-json', 'POST', { session_id: state.sessionId, folder_name: folder })
        .then(function(data) {
            if (DOM.errorsProgressFill) DOM.errorsProgressFill.style.width = '100%';
            if (DOM.errorsProgressText) DOM.errorsProgressText.textContent = 'Concluído!';
            state.lastErrorReport = data;
            displayErrorResults(data);
            var totalE = data.total_errors || 0;
            var totalW = data.total_warnings || 0;
            showToast('Verificação concluída: ' + totalE + ' erros, ' + totalW + ' avisos.', totalE > 0 ? 'warning' : 'success');
            setTimeout(function() { if (DOM.errorsProgress) DOM.errorsProgress.classList.remove('active'); }, 3000);
        }).catch(function(err) {
            if (DOM.errorsProgress) DOM.errorsProgress.classList.remove('active');
            showToast('Erro na verificação: ' + err.message, 'error');
        });
}

function downloadErrorReport() {
    if (!state.sessionId) { showToast('Nenhuma sessão ativa.', 'warning'); return; }
    var folder = DOM.errorsFolder ? DOM.errorsFolder.value.trim() : 'meus-erros';
    if (!folder) folder = 'meus-erros';

    showLoading('Gerando relatório de erros...');
    apiBlob('/check-errors', 'POST', { session_id: state.sessionId, folder_name: folder })
        .then(function(response) {
            if (!response.ok) {
                return response.text().then(function(t) {
                    var msg = 'Erro ' + response.status;
                    try { var d = JSON.parse(t); if (d.detail) msg = d.detail; } catch(e) { if (t) msg = t; }
                    throw new Error(msg);
                });
            }
            var disposition = response.headers.get('Content-Disposition');
            var filename = 'relatorio-erros.txt';
            if (disposition) {
                var match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (match && match[1]) filename = match[1].replace(/['"]/g, '');
            }
            return response.blob().then(function(blob) {
                hideLoading();
                downloadBlob(blob, filename);
                showToast('Relatório de erros baixado!', 'success');
            });
        }).catch(function(err) {
            hideLoading();
            showToast('Erro ao baixar relatório: ' + err.message, 'error');
        });
}

// ===================== SEARCH MODULE =====================
function searchSite() {
    if (!state.sessionId) { showToast('Abra um site primeiro.', 'warning'); return; }
    var term = DOM.searchTerm ? DOM.searchTerm.value.trim() : '';
    if (!term) { showToast('Digite o que deseja buscar.', 'warning'); if (DOM.searchTerm) DOM.searchTerm.focus(); return; }
    var folder = DOM.searchFolder ? DOM.searchFolder.value.trim() : 'minha-busca';
    if (!folder) folder = 'minha-busca';

    showToast('Iniciando busca...', 'info');
    var progressSteps = [
        { pct: 10, text: 'Preparando busca...' },
        { pct: 25, text: 'Buscando APIs e links...' },
        { pct: 40, text: 'Buscando imagens e forms...' },
        { pct: 55, text: 'Buscando scripts e meta...' },
        { pct: 70, text: 'Buscando CSS e fontes...' },
        { pct: 85, text: 'Buscando cookies e storage...' }
    ];
    simulateProgress(DOM.searchProgressFill, DOM.searchProgressText, DOM.searchProgress, progressSteps);

    apiJSON('/search-site', 'POST', { session_id: state.sessionId, term: term, folder_name: folder })
        .then(function(data) {
            if (DOM.searchProgressFill) DOM.searchProgressFill.style.width = '100%';
            if (DOM.searchProgressText) DOM.searchProgressText.textContent = 'Concluído!';
            state.lastSearchReport = data;
            displaySearchResults(data);
            var total = data.total_found || 0;
            showToast('Busca concluída: ' + total + ' resultados encontrados.', total > 0 ? 'success' : 'warning');
            setTimeout(function() { if (DOM.searchProgress) DOM.searchProgress.classList.remove('active'); }, 3000);
        }).catch(function(err) {
            if (DOM.searchProgress) DOM.searchProgress.classList.remove('active');
            showToast('Erro na busca: ' + err.message, 'error');
        });
}

function downloadSearchReport() {
    if (!state.sessionId) { showToast('Nenhuma sessão ativa.', 'warning'); return; }
    var term = DOM.searchTerm ? DOM.searchTerm.value.trim() : '';
    if (!term) { showToast('Digite o termo de busca.', 'warning'); return; }
    var folder = DOM.searchFolder ? DOM.searchFolder.value.trim() : 'minha-busca';
    if (!folder) folder = 'minha-busca';

    showLoading('Gerando relatório de busca...');
    apiBlob('/search-site-txt', 'POST', { session_id: state.sessionId, term: term, folder_name: folder })
        .then(function(response) {
            if (!response.ok) {
                return response.text().then(function(t) {
                    var msg = 'Erro ' + response.status;
                    try { var d = JSON.parse(t); if (d.detail) msg = d.detail; } catch(e) { if (t) msg = t; }
                    throw new Error(msg);
                });
            }
            var disposition = response.headers.get('Content-Disposition');
            var filename = 'relatorio-busca.txt';
            if (disposition) {
                var match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (match && match[1]) filename = match[1].replace(/['"]/g, '');
            }
            return response.blob().then(function(blob) {
                hideLoading();
                downloadBlob(blob, filename);
                showToast('Relatório de busca baixado!', 'success');
            });
        }).catch(function(err) {
            hideLoading();
            showToast('Erro ao baixar relatório: ' + err.message, 'error');
        });
}

// ===================== DISPLAY ERROR RESULTS =====================
var categoryLabels = {
    'console': 'Console',
    'javascript': 'Erros JavaScript',
    'network': 'Rede / Network',
    'css': 'CSS',
    'html': 'HTML',
    'accessibility': 'Acessibilidade',
    'security': 'Segurança',
    'performance': 'Performance',
    'broken_links': 'Links Quebrados',
    'seo': 'SEO'
};

function extractErrorMessage(item) {
    if (typeof item === 'string') return escapeHTML(item);
    if (item.message) return escapeHTML(item.message);
    if (item.text) return escapeHTML(item.text);
    if (item.description) return escapeHTML(item.description);
    if (item.url) return escapeHTML(item.url);
    return escapeHTML(JSON.stringify(item));
}

function getErrorLevel(item) {
    if (typeof item === 'string') {
        if (item.toLowerCase().indexOf('error') !== -1) return 'error';
        if (item.toLowerCase().indexOf('warning') !== -1 || item.toLowerCase().indexOf('aviso') !== -1) return 'warning';
        return 'info';
    }
    if (item.level) return item.level.toLowerCase();
    if (item.severity) return item.severity.toLowerCase();
    if (item.type) {
        var t = item.type.toLowerCase();
        if (t.indexOf('error') !== -1) return 'error';
        if (t.indexOf('warning') !== -1) return 'warning';
    }
    return 'info';
}

function displayErrorResults(data) {
    if (!data || !data.details) { showToast('Nenhum dado de erro para exibir.', 'warning'); return; }
    if (DOM.errorResultsSection) DOM.errorResultsSection.style.display = 'block';

    var totalErrors = data.total_errors || 0;
    var totalWarnings = data.total_warnings || 0;
    if (DOM.totalErrors) DOM.totalErrors.textContent = totalErrors;
    if (DOM.totalWarnings) DOM.totalWarnings.textContent = totalWarnings;

    var details = data.details;
    var categories = Object.keys(details).filter(function(k) {
        return Array.isArray(details[k]) && details[k].length > 0;
    });

    // Create tabs
    var existingTabs = DOM.errorResultsSection ? DOM.errorResultsSection.querySelector('.result-tabs') : null;
    var tabsContainer = document.createElement('div');
    tabsContainer.className = 'result-tabs';

    var allTab = document.createElement('button');
    allTab.className = 'result-tab active';
    allTab.dataset.tab = 'all';
    var totalItems = 0;
    categories.forEach(function(c) { totalItems += details[c].length; });
    allTab.textContent = 'Todos (' + totalItems + ')';
    tabsContainer.appendChild(allTab);

    categories.forEach(function(cat) {
        var tab = document.createElement('button');
        tab.className = 'result-tab';
        tab.dataset.tab = cat;
        var label = categoryLabels[cat] || cat;
        tab.textContent = label + ' (' + details[cat].length + ')';
        tabsContainer.appendChild(tab);
    });

    if (existingTabs) {
        existingTabs.replaceWith(tabsContainer);
    } else if (DOM.errorsContent && DOM.errorsContent.parentNode) {
        DOM.errorsContent.parentNode.insertBefore(tabsContainer, DOM.errorsContent);
    }

    // Render all tab
    renderErrorsTab('all', details, categories);

    // Tab click listeners
    tabsContainer.querySelectorAll('.result-tab').forEach(function(tab) {
        tab.addEventListener('click', function() {
            tabsContainer.querySelectorAll('.result-tab').forEach(function(t) { t.classList.remove('active'); });
            tab.classList.add('active');
            var selectedTab = tab.dataset.tab;
            if (selectedTab === 'all') {
                renderErrorsTab('all', details, categories);
            } else {
                renderErrorsTab(selectedTab, details, [selectedTab]);
            }
        });
    });
}

function renderErrorsTab(tab, details, categories) {
    if (!DOM.errorsContent) return;
    DOM.errorsContent.innerHTML = '';
    var hasItems = false;
    categories.forEach(function(cat) { if (details[cat] && details[cat].length > 0) hasItems = true; });
    if (!hasItems) {
        DOM.errorsContent.innerHTML = '<div class="no-results">Nenhum erro encontrado! O site parece estar limpo.</div>';
        return;
    }
    categories.forEach(function(cat) {
        if (details[cat] && details[cat].length > 0) {
            var block = createErrorCategoryBlock(cat, details[cat]);
            DOM.errorsContent.appendChild(block);
        }
    });
}

function createErrorCategoryBlock(category, items) {
    var block = document.createElement('div');
    block.className = 'error-category-block';

    var title = document.createElement('div');
    title.className = 'error-category-title';
    var label = categoryLabels[category] || category;
    title.innerHTML = '<strong>' + escapeHTML(label) + '</strong> <span class="error-count">(' + items.length + ')</span>';
    block.appendChild(title);

    var list = document.createElement('div');
    list.className = 'error-list';

    items.forEach(function(item) {
        var entry = document.createElement('div');
        var level = getErrorLevel(item);
        entry.className = 'error-item level-' + level;
        var message = extractErrorMessage(item);
        var html = '<span class="error-level">' + level.toUpperCase() + '</span> ' + message;
        if (typeof item === 'object') {
            if (item.source) html += '<div class="error-source">Fonte: ' + escapeHTML(item.source) + '</div>';
            if (item.url) html += '<div class="error-source">URL: ' + escapeHTML(item.url) + '</div>';
            if (item.line) html += '<div class="error-source">Linha: ' + item.line + '</div>';
        }
        entry.innerHTML = html;
        list.appendChild(entry);
    });

    block.appendChild(list);
    return block;
}

// ===================== DISPLAY SEARCH RESULTS =====================
function displaySearchResults(data) {
    if (!data || !data.findings) { showToast('Nenhum dado de busca para exibir.', 'warning'); return; }
    if (DOM.searchResultsSection) DOM.searchResultsSection.style.display = 'block';

    var findings = data.findings;
    var totalFound = data.total_found || 0;
    var categoriesSet = {};
    findings.forEach(function(f) { categoriesSet[f.category || 'Outros'] = true; });

    if (DOM.totalFound) DOM.totalFound.textContent = totalFound;
    if (DOM.totalCategories) DOM.totalCategories.textContent = Object.keys(categoriesSet).length;

    if (!DOM.searchContent) return;
    DOM.searchContent.innerHTML = '';

    if (findings.length === 0) {
        DOM.searchContent.innerHTML = '<div class="no-results">Nenhum resultado encontrado para o termo buscado.</div>';
        return;
    }

    // Group by category
    var grouped = {};
    findings.forEach(function(f) {
        var cat = f.category || 'Outros';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(f);
    });

    Object.keys(grouped).forEach(function(cat) {
        var block = document.createElement('div');
        block.className = 'search-category-block';

        var title = document.createElement('div');
        title.className = 'search-category-title';
        title.innerHTML = '<strong>' + escapeHTML(cat) + '</strong> <span class="search-count">(' + grouped[cat].length + ')</span>';
        block.appendChild(title);

        var list = document.createElement('div');
        list.className = 'search-list';

        grouped[cat].forEach(function(item) {
            var entry = document.createElement('div');
            entry.className = 'search-item';
            var html = '';
            if (item.type) html += '<span class="search-type">' + escapeHTML(item.type) + '</span> ';
            if (item.value) html += '<span class="search-value">' + escapeHTML(item.value) + '</span>';
            if (item.details) html += '<div class="search-details">' + escapeHTML(item.details) + '</div>';
            entry.innerHTML = html;
            list.appendChild(entry);
        });

        block.appendChild(list);
        DOM.searchContent.appendChild(block);
    });
}

// ===================== CLEAR RESULTS =====================
function clearErrorResults() {
    if (DOM.errorResultsSection) DOM.errorResultsSection.style.display = 'none';
    if (DOM.errorsContent) DOM.errorsContent.innerHTML = '';
    if (DOM.totalErrors) DOM.totalErrors.textContent = '0';
    if (DOM.totalWarnings) DOM.totalWarnings.textContent = '0';
    // Remove tabs if exist
    if (DOM.errorResultsSection) {
        var tabs = DOM.errorResultsSection.querySelector('.result-tabs');
        if (tabs) tabs.remove();
    }
    state.lastErrorReport = null;
    showToast('Resultados de erros limpos.', 'info');
}

function clearSearchResults() {
    if (DOM.searchResultsSection) DOM.searchResultsSection.style.display = 'none';
    if (DOM.searchContent) DOM.searchContent.innerHTML = '';
    if (DOM.totalFound) DOM.totalFound.textContent = '0';
    if (DOM.totalCategories) DOM.totalCategories.textContent = '0';
    state.lastSearchReport = null;
    showToast('Resultados de busca limpos.', 'info');
}
// ===================== EVENT LISTENERS =====================
function setupEventListeners() {
    // Auth
    if (DOM.btnAuth) DOM.btnAuth.addEventListener('click', authenticate);
    if (DOM.authTokenInput) DOM.authTokenInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') authenticate(); });
    if (DOM.authToggleVisibility) DOM.authToggleVisibility.addEventListener('click', togglePasswordVisibility);
    if (DOM.btnLogout) DOM.btnLogout.addEventListener('click', logout);

    // URL / Site
    if (DOM.btnOpen) DOM.btnOpen.addEventListener('click', openSite);
    if (DOM.urlInput) DOM.urlInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') openSite(); });
    if (DOM.btnScreenshot) DOM.btnScreenshot.addEventListener('click', takeScreenshot);
    if (DOM.btnClose) DOM.btnClose.addEventListener('click', closeSession);

    // Scroll buttons in site-actions
    if (DOM.btnScrollUp2) DOM.btnScrollUp2.addEventListener('click', function() { scrollPage('up'); });
    if (DOM.btnScrollDown2) DOM.btnScrollDown2.addEventListener('click', function() { scrollPage('down'); });

    // Interaction / Login overlay
    if (DOM.btnInteract) DOM.btnInteract.addEventListener('click', openInteraction);
    if (DOM.btnLoginCancel) DOM.btnLoginCancel.addEventListener('click', closeInteraction);
    if (DOM.btnLoginDone) DOM.btnLoginDone.addEventListener('click', finishLogin);

    // Login Step 1: Auto Login
    if (DOM.btnAutoLogin) DOM.btnAutoLogin.addEventListener('click', autoLogin);
    if (DOM.btnToggleAutoPass) DOM.btnToggleAutoPass.addEventListener('click', toggleAutoLoginPassword);
    if (DOM.autoLoginPassword) DOM.autoLoginPassword.addEventListener('keydown', function(e) { if (e.key === 'Enter') autoLogin(); });
    if (DOM.autoLoginEmail) DOM.autoLoginEmail.addEventListener('keydown', function(e) { if (e.key === 'Enter') { if (DOM.autoLoginPassword) DOM.autoLoginPassword.focus(); } });

    // Login Step 2: Manual Cookies
    if (DOM.btnOpenSiteTab) DOM.btnOpenSiteTab.addEventListener('click', openSiteInNewTab);
    if (DOM.btnCopyCommand) DOM.btnCopyCommand.addEventListener('click', copyCommandToClipboard);
    if (DOM.btnSyncCookies) DOM.btnSyncCookies.addEventListener('click', syncCookies);
    if (DOM.btnGetSeleniumCookies) DOM.btnGetSeleniumCookies.addEventListener('click', getSeleniumCookies);
    if (DOM.btnRefreshSelenium) DOM.btnRefreshSelenium.addEventListener('click', refreshSeleniumPage);

    // Login Step 3: Scroll & Preview
    if (DOM.btnScrollUp) DOM.btnScrollUp.addEventListener('click', function() { scrollPage('up'); });
    if (DOM.btnScrollDown) DOM.btnScrollDown.addEventListener('click', function() { scrollPage('down'); });
    if (DOM.btnRefreshPreview) DOM.btnRefreshPreview.addEventListener('click', refreshPreview);

    // Modules
    if (DOM.btnBackup) DOM.btnBackup.addEventListener('click', backupSite);
    if (DOM.btnErrors) DOM.btnErrors.addEventListener('click', checkErrors);
    if (DOM.btnSearch) DOM.btnSearch.addEventListener('click', searchSite);

    // Downloads
    if (DOM.btnDownloadErrors) DOM.btnDownloadErrors.addEventListener('click', downloadErrorReport);
    if (DOM.btnDownloadSearch) DOM.btnDownloadSearch.addEventListener('click', downloadSearchReport);

    // Clear
    if (DOM.btnClearErrors) DOM.btnClearErrors.addEventListener('click', clearErrorResults);
    if (DOM.btnClearSearch) DOM.btnClearSearch.addEventListener('click', clearSearchResults);

    console.log('All event listeners registered.');
}

// ===================== INIT =====================
async function init() {
    console.log('Initializing Site Backup & Error Checker v1.3.0...');

    // ---- 1. Load backend URL from config.js via fetch ----
    try {
        var configResponse = await fetch('config.js');
        var configText = await configResponse.text();
        console.log('config.js loaded, length:', configText.length);

        // Try to read BACKEND_CONFIG if it was loaded globally
        if (typeof BACKEND_CONFIG !== 'undefined' && BACKEND_CONFIG && BACKEND_CONFIG.BACKEND_URL) {
            state.backendUrl = BACKEND_CONFIG.BACKEND_URL.replace(/\/+$/, '');
            console.log('Backend URL from global:', state.backendUrl);
        } else {
            // Extract URL via regex from config file content
            var urlMatch = configText.match(/BACKEND_URL\s*[:=]\s*['"]([^'"]+)['"]/);
            if (urlMatch && urlMatch[1]) {
                state.backendUrl = urlMatch[1].replace(/\/+$/, '');
                console.log('Backend URL from regex:', state.backendUrl);
            } else {
                // Fallback: find any hf.space URL
                var hfMatch = configText.match(/(https:\/\/[a-zA-Z0-9\-]+\.hf\.space)/);
                if (hfMatch && hfMatch[1]) {
                    state.backendUrl = hfMatch[1].replace(/\/+$/, '');
                    console.log('Backend URL from hf.space match:', state.backendUrl);
                } else {
                    console.error('Could not extract backend URL from config.js');
                    showToast('Erro: URL do backend não encontrada no config.js', 'error');
                    return;
                }
            }
        }
    } catch (e) {
        console.error('Failed to load config.js:', e);
        showToast('Erro ao carregar config.js: ' + e.message, 'error');
        return;
    }

    console.log('Using backend URL:', state.backendUrl);

    // ---- 2. Check server status ----
    try {
        var statusResponse = await fetch(state.backendUrl + '/');
        var statusData = await statusResponse.json();
        console.log('Server status:', statusData);
        updateServerStatus(true);
        showToast('Servidor conectado!', 'success');

        // ---- 3. Check if auth is required ----
        if (statusData.auth_required === true) {
            var savedToken = localStorage.getItem('backup_auth_token');
            if (savedToken) {
                try {
                    var verifyResponse = await fetch(state.backendUrl + '/auth/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ token: savedToken })
                    });
                    if (verifyResponse.ok) {
                        state.token = savedToken;
                        hideAuthModal();
                        updateSessionBadge(true);
                        console.log('Saved token verified successfully.');
                    } else {
                        localStorage.removeItem('backup_auth_token');
                        showAuthModal();
                    }
                } catch (verifyErr) {
                    console.error('Token verify failed:', verifyErr);
                    localStorage.removeItem('backup_auth_token');
                    showAuthModal();
                }
            } else {
                showAuthModal();
            }
        } else {
            hideAuthModal();
            updateSessionBadge(true);
            console.log('No authentication required.');
        }

    } catch (e) {
        console.error('Server connection failed:', e);
        updateServerStatus(false);
        showToast('Servidor offline ou inacessível.', 'error');
    }

    // ---- 4. Check extension (optional) ----
    try {
        var extOk = await checkExtension();
        console.log('Extension detected:', extOk);
    } catch (e) {
        console.log('Extension not detected (optional).');
    }

    console.log('Initialization complete.');
}

// ===================== START =====================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setupDOM();
        setupEventListeners();
        init();
    });
} else {
    setupDOM();
    setupEventListeners();
    init();
}

})();


