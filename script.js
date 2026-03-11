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
            if (DOM.siteTitle) DOM.siteTitle.textContent = state.siteTitle;
            if (DOM.siteUrl) DOM.siteUrl.textContent = state.siteUrl;
            if (DOM.siteStatus) DOM.siteStatus.classList.add('active');
            if (DOM.siteStatusBadge) {
                DOM.siteStatusBadge.textContent = '● Aberto';
                DOM.siteStatusBadge.className = 'site-status-badge open';
            }
            updateModuleButtons(true);
            showToast('Site aberto: ' + state.siteTitle, 'success');
            takeScreenshot();
        }).catch(function(err) {
            hideLoading();
            showToast('Erro ao abrir site: ' + err.message, 'error');
        });
}

function takeScreenshot() {
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
        }).catch(function(err) {
            showToast('Erro ao tirar screenshot: ' + err.message, 'error');
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
                updateAllPreviewsBase64(data.screenshot);
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

    // Load live preview automatically
    var liveImg = document.getElementById('livePreviewImg');
    if (liveImg) {
        if (DOM.screenshotImg && DOM.screenshotImg.src && DOM.screenshotImg.src !== '' && DOM.screenshotImg.src !== window.location.href) {
            liveImg.src = DOM.screenshotImg.src;
        } else {
            apiBlob('/screenshot', 'POST', { session_id: state.sessionId })
                .then(function(response) {
                    if (!response.ok) throw new Error('Erro ' + response.status);
                    return response.blob();
                })
                .then(function(blob) {
                    if (!blob) return;
                    var url = URL.createObjectURL(blob);
                    updateAllPreviews(url);
                }).catch(function(err) {
                    showToast('Erro ao carregar preview: ' + err.message, 'error');
                });
        }
    }
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

        if (data.screenshot) {
            updateAllPreviewsBase64(data.screenshot);
        }

        if (DOM.loginPreviewStatus) {
            if (data.login_success) {
                DOM.loginPreviewStatus.textContent = 'Login detectado com sucesso!';
                DOM.loginPreviewStatus.className = 'login-preview-status logged-in';
            } else {
                DOM.loginPreviewStatus.textContent = 'Login não confirmado. Verifique o preview.';
                DOM.loginPreviewStatus.className = 'login-preview-status not-logged';
            }
        }

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
                updateAllPreviewsBase64(data.screenshot);
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

        if (data.screenshot) {
            updateAllPreviewsBase64(data.screenshot);
        }

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

        if (DOM.autoLoginPreview) DOM.autoLoginPreview.classList.add('active');

        if (data.final_url) { state.siteUrl = data.final_url; if (DOM.siteUrl) DOM.siteUrl.textContent = data.final_url; }
        if (data.final_title) { state.siteTitle = data.final_title; if (DOM.siteTitle) DOM.siteTitle.textContent = data.final_title; }

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

// ===================== CLICK ON PAGE =====================
function clickOnPage(clickX, clickY) {
    if (!state.sessionId) { showToast('Abra um site primeiro.', 'warning'); return; }

    var indicator = document.getElementById('clickIndicator');
    if (indicator) {
        indicator.style.left = clickX + 'px';
        indicator.style.top = clickY + 'px';
        indicator.style.display = 'block';
        setTimeout(function() { indicator.style.display = 'none'; }, 800);
    }

    var liveImg = document.getElementById('livePreviewImg');
    if (!liveImg) return;

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

        var remoteInput = document.getElementById('remoteTextInput');
        if (remoteInput && data.typed) remoteInput.value = '';

    }).catch(function(err) {
        if (feedback) feedback.textContent = 'Erro ao digitar: ' + err.message;
        showToast('Erro ao digitar: ' + err.message, 'error');
    });
}

// ===================== BACKUP MODULE =====================

function backupSite() {
    if (!state.sessionId) {
        showToast('Abra um site primeiro.', 'warning');
        return;
    }

    var folderName = 'backup';
    if (DOM.backupFolder) {
        var val = DOM.backupFolder.value.trim();
        if (val) folderName = val;
    }

    showLoading();
    if (DOM.backupProgress) DOM.backupProgress.style.display = 'block';

    var steps = [
        'Preparando backup...',
        'Capturando HTML...',
        'Baixando recursos...',
        'Capturando imagens...',
        'Gerando arquivo ZIP...',
        'Finalizando...'
    ];

    simulateProgress(DOM.backupProgressFill, DOM.backupProgressText, steps, 18000);

    apiBlob('/backup', 'POST', { session_id: state.sessionId, folder_name: folderName })
        .then(function(response) {
            if (!response.ok) {
                return response.text().then(function(t) {
                    var msg = 'Erro ' + response.status;
                    try { var d = JSON.parse(t); if (d.detail) msg = d.detail; } catch (e) { if (t) msg = t; }
                    throw new Error(msg);
                });
            }
            return response.blob().then(function(blob) {
                return { blob: blob, response: response };
            });
        })
        .then(function(result) {
            if (!result || !result.blob) return;

            var timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
            var filename = folderName + '_' + timestamp + '.zip';
            downloadBlob(result.blob, filename);

            if (DOM.backupProgressFill) {
                DOM.backupProgressFill.style.width = '100%';
            }
            if (DOM.backupProgressText) {
                DOM.backupProgressText.textContent = 'Backup concluído!';
            }

            var errorCount = result.response.headers.get('X-Backup-Errors') || '0';
            showToast('Backup baixado! (' + errorCount + ' erros durante o processo)', 'success');
            hideLoading();
        })
        .catch(function(err) {
            showToast('Erro no backup: ' + err.message, 'error');
            hideLoading();
            if (DOM.backupProgress) DOM.backupProgress.style.display = 'none';
        });
}

// ===================== ERROR CHECK MODULE =====================

function checkErrors() {
    if (!state.sessionId) {
        showToast('Abra um site primeiro.', 'warning');
        return;
    }

    var folderName = 'erros';
    if (DOM.errorFolder) {
        var val = DOM.errorFolder.value.trim();
        if (val) folderName = val;
    }

    showLoading();
    if (DOM.errorProgress) DOM.errorProgress.style.display = 'block';

    var steps = [
        'Iniciando verificação...',
        'Verificando HTML...',
        'Verificando CSS...',
        'Verificando JavaScript...',
        'Verificando acessibilidade...',
        'Verificando SEO...',
        'Gerando relatório...'
    ];

    simulateProgress(DOM.errorProgressFill, DOM.errorProgressText, steps, 15000);

    apiJSON('/check-errors-json', 'POST', { session_id: state.sessionId, folder_name: folderName })
        .then(function(data) {
            if (DOM.errorProgressFill) DOM.errorProgressFill.style.width = '100%';
            if (DOM.errorProgressText) DOM.errorProgressText.textContent = 'Verificação concluída!';

            state.lastErrorReport = data;
            displayErrorResults(data);

            var totalErrors = 0;
            var totalWarnings = 0;
            if (data.summary) {
                totalErrors = data.summary.total_errors || 0;
                totalWarnings = data.summary.total_warnings || 0;
            }

            showToast('Verificação concluída: ' + totalErrors + ' erros, ' + totalWarnings + ' avisos', 'success');
            hideLoading();
        })
        .catch(function(err) {
            showToast('Erro na verificação: ' + err.message, 'error');
            hideLoading();
            if (DOM.errorProgress) DOM.errorProgress.style.display = 'none';
        });
}

function downloadErrorReport() {
    if (!state.sessionId) {
        showToast('Abra um site primeiro.', 'warning');
        return;
    }

    var folderName = 'erros';
    if (DOM.errorFolder) {
        var val = DOM.errorFolder.value.trim();
        if (val) folderName = val;
    }

    showLoading();

    apiBlob('/check-errors', 'POST', { session_id: state.sessionId, folder_name: folderName })
        .then(function(response) {
            if (!response.ok) {
                return response.text().then(function(t) {
                    var msg = 'Erro ' + response.status;
                    try { var d = JSON.parse(t); if (d.detail) msg = d.detail; } catch (e) { if (t) msg = t; }
                    throw new Error(msg);
                });
            }
            return response.blob();
        })
        .then(function(blob) {
            if (!blob) return;
            var timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
            var filename = folderName + '_' + timestamp + '.txt';
            downloadBlob(blob, filename);
            showToast('Relatório de erros baixado!', 'success');
            hideLoading();
        })
        .catch(function(err) {
            showToast('Erro ao baixar relatório: ' + err.message, 'error');
            hideLoading();
        });
}

// ===================== SEARCH MODULE =====================

function searchSite() {
    if (!state.sessionId) {
        showToast('Abra um site primeiro.', 'warning');
        return;
    }

    var term = '';
    if (DOM.searchTerm) term = DOM.searchTerm.value.trim();
    if (!term) {
        showToast('Digite um termo para buscar.', 'warning');
        return;
    }

    var folderName = 'busca';
    if (DOM.searchFolder) {
        var val = DOM.searchFolder.value.trim();
        if (val) folderName = val;
    }

    showLoading();
    if (DOM.searchProgress) DOM.searchProgress.style.display = 'block';

    var steps = [
        'Iniciando busca...',
        'Buscando no HTML...',
        'Buscando em scripts...',
        'Buscando em estilos...',
        'Buscando em links...',
        'Compilando resultados...'
    ];

    simulateProgress(DOM.searchProgressFill, DOM.searchProgressText, steps, 12000);

    apiJSON('/search-site', 'POST', {
        session_id: state.sessionId,
        term: term,
        folder_name: folderName
    })
        .then(function(data) {
            if (DOM.searchProgressFill) DOM.searchProgressFill.style.width = '100%';
            if (DOM.searchProgressText) DOM.searchProgressText.textContent = 'Busca concluída!';

            state.lastSearchReport = data;
            displaySearchResults(data);

            var totalFound = data.total_found || 0;
            showToast('Busca concluída: ' + totalFound + ' resultados encontrados', 'success');
            hideLoading();
        })
        .catch(function(err) {
            showToast('Erro na busca: ' + err.message, 'error');
            hideLoading();
            if (DOM.searchProgress) DOM.searchProgress.style.display = 'none';
        });
}

function downloadSearchReport() {
    if (!state.sessionId) {
        showToast('Abra um site primeiro.', 'warning');
        return;
    }

    var term = '';
    if (DOM.searchTerm) term = DOM.searchTerm.value.trim();
    if (!term) {
        showToast('Digite um termo para buscar.', 'warning');
        return;
    }

    var folderName = 'busca';
    if (DOM.searchFolder) {
        var val = DOM.searchFolder.value.trim();
        if (val) folderName = val;
    }

    showLoading();

    apiBlob('/search-site-txt', 'POST', {
        session_id: state.sessionId,
        term: term,
        folder_name: folderName
    })
        .then(function(response) {
            if (!response.ok) {
                return response.text().then(function(t) {
                    var msg = 'Erro ' + response.status;
                    try { var d = JSON.parse(t); if (d.detail) msg = d.detail; } catch (e) { if (t) msg = t; }
                    throw new Error(msg);
                });
            }
            return response.blob();
        })
        .then(function(blob) {
            if (!blob) return;
            var timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
            var filename = folderName + '_' + timestamp + '.txt';
            downloadBlob(blob, filename);
            showToast('Relatório de busca baixado!', 'success');
            hideLoading();
        })
        .catch(function(err) {
            showToast('Erro ao baixar relatório: ' + err.message, 'error');
            hideLoading();
        });
}

// ===================== ERROR RESULTS DISPLAY =====================

var categoryLabels = {
    'html_errors': 'Erros HTML',
    'css_errors': 'Erros CSS',
    'js_errors': 'Erros JavaScript',
    'accessibility': 'Acessibilidade',
    'seo': 'SEO',
    'performance': 'Performance',
    'security': 'Segurança',
    'images': 'Imagens',
    'links': 'Links',
    'forms': 'Formulários',
    'meta': 'Meta Tags',
    'general': 'Geral'
};

function extractErrorMessage(item) {
    if (typeof item === 'string') return item;
    if (item.message) return item.message;
    if (item.description) return item.description;
    if (item.error) return item.error;
    if (item.detail) return item.detail;
    return JSON.stringify(item);
}

function getErrorLevel(item) {
    if (typeof item === 'string') {
        if (item.toLowerCase().indexOf('error') >= 0) return 'error';
        if (item.toLowerCase().indexOf('warning') >= 0) return 'warning';
        return 'info';
    }
    if (item.level) return item.level.toLowerCase();
    if (item.severity) return item.severity.toLowerCase();
    if (item.type) {
        var t = item.type.toLowerCase();
        if (t === 'error') return 'error';
        if (t === 'warning') return 'warning';
    }
    return 'info';
}

function displayErrorResults(data) {
    if (!DOM.errorResults) return;

    DOM.errorResults.style.display = 'block';
    DOM.errorResults.innerHTML = '';

    // Header
    var header = document.createElement('div');
    header.className = 'results-header';

    var totalErrors = 0;
    var totalWarnings = 0;
    var totalInfo = 0;

    if (data.summary) {
        totalErrors = data.summary.total_errors || 0;
        totalWarnings = data.summary.total_warnings || 0;
        totalInfo = data.summary.total_info || 0;
    }

    header.innerHTML = '<h3>Resultado da Verificação</h3>' +
        '<div class="results-summary">' +
        '<span class="summary-item error">Erros: ' + totalErrors + '</span>' +
        '<span class="summary-item warning">Avisos: ' + totalWarnings + '</span>' +
        '<span class="summary-item info">Info: ' + totalInfo + '</span>' +
        '</div>';
    DOM.errorResults.appendChild(header);

    // Categories
    var categories = data.categories || data.results || data;
    if (typeof categories === 'object' && !Array.isArray(categories)) {
        var keys = Object.keys(categories);
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            if (key === 'summary' || key === 'url' || key === 'title' || key === 'timestamp' || key === 'total_found') continue;
            var items = categories[key];
            if (Array.isArray(items) && items.length > 0) {
                var block = createErrorCategoryBlock(key, items);
                DOM.errorResults.appendChild(block);
            }
        }
    }
}

function createErrorCategoryBlock(categoryKey, items) {
    var block = document.createElement('div');
    block.className = 'error-category';

    var label = categoryLabels[categoryKey] || categoryKey;
    var headerDiv = document.createElement('div');
    headerDiv.className = 'error-category-header';
    headerDiv.innerHTML = '<strong>' + escapeHTML(label) + '</strong> <span>(' + items.length + ' itens)</span>';
    block.appendChild(headerDiv);

    var list = document.createElement('div');
    list.className = 'error-list';

    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var level = getErrorLevel(item);
        var message = extractErrorMessage(item);

        var errorItem = document.createElement('div');
        errorItem.className = 'error-item ' + level;
        errorItem.innerHTML = '<span class="error-level">' + level.toUpperCase() + '</span> ' + escapeHTML(message);
        list.appendChild(errorItem);
    }

    block.appendChild(list);
    return block;
}

// ===================== SEARCH RESULTS DISPLAY =====================

function displaySearchResults(data) {
    if (!DOM.searchResults) return;

    DOM.searchResults.style.display = 'block';
    DOM.searchResults.innerHTML = '';

    var header = document.createElement('div');
    header.className = 'results-header';

    var totalFound = data.total_found || 0;
    header.innerHTML = '<h3>Resultados da Busca</h3>' +
        '<div class="results-summary">' +
        '<span class="summary-item info">Total encontrado: ' + totalFound + '</span>' +
        '</div>';
    DOM.searchResults.appendChild(header);

    var findings = data.findings || [];
    if (findings.length === 0) {
        var empty = document.createElement('p');
        empty.style.cssText = 'text-align:center;color:#888;padding:20px;';
        empty.textContent = 'Nenhum resultado encontrado.';
        DOM.searchResults.appendChild(empty);
        return;
    }

    // Group by category
    var grouped = {};
    for (var i = 0; i < findings.length; i++) {
        var cat = findings[i].category || 'general';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(findings[i]);
    }

    var groupKeys = Object.keys(grouped);
    for (var g = 0; g < groupKeys.length; g++) {
        var gKey = groupKeys[g];
        var gItems = grouped[gKey];

        var catBlock = document.createElement('div');
        catBlock.className = 'search-category';

        var catHeader = document.createElement('div');
        catHeader.className = 'error-category-header';
        var catLabel = categoryLabels[gKey] || gKey;
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
}

// ===================== CLEAR RESULTS =====================

function clearErrorResults() {
    if (DOM.errorResults) {
        DOM.errorResults.style.display = 'none';
        DOM.errorResults.innerHTML = '';
    }
    if (DOM.errorProgress) DOM.errorProgress.style.display = 'none';
    if (DOM.errorProgressFill) DOM.errorProgressFill.style.width = '0%';
    if (DOM.errorProgressText) DOM.errorProgressText.textContent = '';
    state.lastErrorReport = null;
}

function clearSearchResults() {
    if (DOM.searchResults) {
        DOM.searchResults.style.display = 'none';
        DOM.searchResults.innerHTML = '';
    }
    if (DOM.searchProgress) DOM.searchProgress.style.display = 'none';
    if (DOM.searchProgressFill) DOM.searchProgressFill.style.width = '0%';
    if (DOM.searchProgressText) DOM.searchProgressText.textContent = '';
    state.lastSearchReport = null;
}

// ===================== EVENT LISTENERS =====================

function setupEventListeners() {
    console.log('Setting up event listeners...');

    // --- AUTH ---
    if (DOM.btnAuth) {
        DOM.btnAuth.addEventListener('click', function() {
            authenticate();
        });
    }
    if (DOM.authTokenInput) {
        DOM.authTokenInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') authenticate();
        });
    }
    if (DOM.btnTogglePassword) {
        DOM.btnTogglePassword.addEventListener('click', function() {
            togglePasswordVisibility();
        });
    }
    if (DOM.btnLogout) {
        DOM.btnLogout.addEventListener('click', function() {
            logout();
        });
    }

    // --- OPEN SITE ---
    if (DOM.btnOpen) {
        DOM.btnOpen.addEventListener('click', function() {
            openSite();
        });
    }
    if (DOM.urlInput) {
        DOM.urlInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') openSite();
        });
    }

    // --- SITE ACTIONS ---
    if (DOM.btnScreenshot) {
        DOM.btnScreenshot.addEventListener('click', function() {
            takeScreenshot();
        });
    }
    if (DOM.btnLogin) {
        DOM.btnLogin.addEventListener('click', function() {
            openInteraction();
        });
    }
    if (DOM.btnScroll) {
        DOM.btnScroll.addEventListener('click', function() {
            scrollPage('down');
        });
    }
    if (DOM.btnClose) {
        DOM.btnClose.addEventListener('click', function() {
            closeSession();
        });
    }

    // --- SCROLL BUTTONS ---
    if (DOM.btnScrollUp) {
        DOM.btnScrollUp.addEventListener('click', function() {
            scrollPage('up');
        });
    }
    if (DOM.btnScrollDown) {
        DOM.btnScrollDown.addEventListener('click', function() {
            scrollPage('down');
        });
    }

    // --- INTERACTION OVERLAY ---
    if (DOM.btnCloseInteract) {
        DOM.btnCloseInteract.addEventListener('click', function() {
            closeInteraction();
        });
    }

    // --- STEP 1: AUTO-LOGIN ---
    if (DOM.btnAutoLogin) {
        DOM.btnAutoLogin.addEventListener('click', function() {
            autoLogin();
        });
    }
    if (DOM.btnToggleAutoLoginPassword) {
        DOM.btnToggleAutoLoginPassword.addEventListener('click', function() {
            toggleAutoLoginPassword();
        });
    }

    // --- STEP 2: MANUAL COOKIES ---
    if (DOM.btnOpenSiteTab) {
        DOM.btnOpenSiteTab.addEventListener('click', function() {
            openSiteInNewTab();
        });
    }
    if (DOM.btnCopyCommand) {
        DOM.btnCopyCommand.addEventListener('click', function() {
            copyCommandToClipboard();
        });
    }
    if (DOM.btnSyncCookies) {
        DOM.btnSyncCookies.addEventListener('click', function() {
            syncCookies();
        });
    }
    if (DOM.btnGetSeleniumCookies) {
        DOM.btnGetSeleniumCookies.addEventListener('click', function() {
            getSeleniumCookies();
        });
    }

    // --- STEP 3: LIVE PREVIEW / REMOTE CONTROL ---
    if (DOM.btnRefreshPreview) {
        DOM.btnRefreshPreview.addEventListener('click', function() {
            refreshPreview();
        });
    }

    // Live preview click
    var livePreviewContainer = document.getElementById('livePreviewContainer');
    var livePreviewImg = document.getElementById('livePreviewImg');
    if (livePreviewContainer && livePreviewImg) {
        livePreviewContainer.addEventListener('click', function(e) {
            if (!state.sessionId) {
                showToast('Abra um site primeiro.', 'warning');
                return;
            }
            var rect = livePreviewImg.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) {
                showToast('Preview não carregado.', 'warning');
                return;
            }
            var clickXRel = e.clientX - rect.left;
            var clickYRel = e.clientY - rect.top;

            // Scale to real page size (1920x1080)
            var scaleX = 1920 / rect.width;
            var scaleY = 1080 / rect.height;
            var realX = Math.round(clickXRel * scaleX);
            var realY = Math.round(clickYRel * scaleY);

            console.log('Click on preview:', realX, realY, '(scaled from', clickXRel, clickYRel, ')');
            clickOnPage(realX, realY);
        });
    }

    // Remote type
    var btnRemoteType = document.getElementById('btnRemoteType');
    var btnRemoteEnter = document.getElementById('btnRemoteEnter');
    var remoteTextInput = document.getElementById('remoteTextInput');

    if (btnRemoteType) {
        btnRemoteType.addEventListener('click', function() {
            if (!remoteTextInput) return;
            var text = remoteTextInput.value;
            if (!text) {
                showToast('Digite algo para enviar.', 'warning');
                return;
            }
            typeOnPage(text, false);
        });
    }

    if (btnRemoteEnter) {
        btnRemoteEnter.addEventListener('click', function() {
            if (!remoteTextInput) return;
            var text = remoteTextInput.value;
            typeOnPage(text, true);
        });
    }

    if (remoteTextInput) {
        remoteTextInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                var text = remoteTextInput.value;
                typeOnPage(text, true);
            }
        });
    }

    // Remote keyboard actions
    var btnRemoteTab = document.getElementById('btnRemoteTab');
    var btnRemoteEsc = document.getElementById('btnRemoteEsc');
    var btnRemoteBack = document.getElementById('btnRemoteBack');
    var btnRemoteForward = document.getElementById('btnRemoteForward');

    if (btnRemoteTab) {
        btnRemoteTab.addEventListener('click', function() {
            if (!state.sessionId) { showToast('Abra um site primeiro.', 'warning'); return; }
            apiJSON('/type-text', 'POST', {
                session_id: state.sessionId,
                text: '\uE004',
                press_enter: false,
                clear_first: false
            }).then(function(data) {
                if (data.screenshot) updateAllPreviewsBase64(data.screenshot);
                showToast('Tab enviado!', 'info');
            }).catch(function(err) {
                showToast('Erro ao enviar Tab: ' + err.message, 'error');
            });
        });
    }

    if (btnRemoteEsc) {
        btnRemoteEsc.addEventListener('click', function() {
            if (!state.sessionId) { showToast('Abra um site primeiro.', 'warning'); return; }
            apiJSON('/type-text', 'POST', {
                session_id: state.sessionId,
                text: '\uE00C',
                press_enter: false,
                clear_first: false
            }).then(function(data) {
                if (data.screenshot) updateAllPreviewsBase64(data.screenshot);
                showToast('Esc enviado!', 'info');
            }).catch(function(err) {
                showToast('Erro ao enviar Esc: ' + err.message, 'error');
            });
        });
    }

    if (btnRemoteBack) {
        btnRemoteBack.addEventListener('click', function() {
            if (!state.sessionId) { showToast('Abra um site primeiro.', 'warning'); return; }
            showToast('Voltando...', 'info');
            apiJSON('/navigate', 'POST', {
                session_id: state.sessionId,
                url: 'javascript:history.back()'
            }).then(function() {
                setTimeout(function() { refreshPreview(); }, 500);
            }).catch(function() {
                setTimeout(function() { refreshPreview(); }, 500);
            });
        });
    }

    if (btnRemoteForward) {
        btnRemoteForward.addEventListener('click', function() {
            if (!state.sessionId) { showToast('Abra um site primeiro.', 'warning'); return; }
            showToast('Avançando...', 'info');
            apiJSON('/navigate', 'POST', {
                session_id: state.sessionId,
                url: 'javascript:history.forward()'
            }).then(function() {
                setTimeout(function() { refreshPreview(); }, 500);
            }).catch(function() {
                setTimeout(function() { refreshPreview(); }, 500);
            });
        });
    }

    // --- FINISH LOGIN ---
    if (DOM.btnFinishLogin) {
        DOM.btnFinishLogin.addEventListener('click', function() {
            finishLogin();
        });
    }

    // --- MODULES ---
    if (DOM.btnBackup) {
        DOM.btnBackup.addEventListener('click', function() {
            backupSite();
        });
    }
    if (DOM.btnCheckErrors) {
        DOM.btnCheckErrors.addEventListener('click', function() {
            checkErrors();
        });
    }
    if (DOM.btnSearch) {
        DOM.btnSearch.addEventListener('click', function() {
            searchSite();
        });
    }

    // --- DOWNLOADS ---
    if (DOM.btnDownloadErrors) {
        DOM.btnDownloadErrors.addEventListener('click', function() {
            downloadErrorReport();
        });
    }
    if (DOM.btnDownloadSearch) {
        DOM.btnDownloadSearch.addEventListener('click', function() {
            downloadSearchReport();
        });
    }

    // --- CLEAR ---
    if (DOM.btnClearErrors) {
        DOM.btnClearErrors.addEventListener('click', function() {
            clearErrorResults();
        });
    }
    if (DOM.btnClearSearch) {
        DOM.btnClearSearch.addEventListener('click', function() {
            clearSearchResults();
        });
    }

    console.log('All event listeners registered.');
}

// ===================== INITIALIZATION =====================

async function init() {
    console.log('Initializing Site Backup & Error Checker...');

    // 1. Load backend URL from config.js
    try {
        // Try global first (if config.js loaded before script.js)
        if (typeof BACKEND_CONFIG !== 'undefined' && BACKEND_CONFIG && BACKEND_CONFIG.BACKEND_URL) {
            state.backendUrl = BACKEND_CONFIG.BACKEND_URL.replace(/\/+$/, '');
            console.log('Backend URL from global:', state.backendUrl);
        } else if (typeof window.BACKEND_CONFIG !== 'undefined' && window.BACKEND_CONFIG && window.BACKEND_CONFIG.BACKEND_URL) {
            state.backendUrl = window.BACKEND_CONFIG.BACKEND_URL.replace(/\/+$/, '');
            console.log('Backend URL from window:', state.backendUrl);
        } else {
            // Fetch and parse config.js
            var configResponse = await fetch('config.js');
            var configText = await configResponse.text();
            console.log('config.js loaded, length:', configText.length);

            var urlMatch = configText.match(/BACKEND_URL\s*[:=]\s*['"]([^'"]+)['"]/);
            if (urlMatch && urlMatch[1]) {
                state.backendUrl = urlMatch[1].replace(/\/+$/, '');
                console.log('Backend URL from regex:', state.backendUrl);
            } else {
                var hfMatch = configText.match(/(https:\/\/[^\s'"]+\.hf\.space)/);
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

    // 2. Check server status
    try {
        var statusResponse = await fetch(state.backendUrl + '/');
        var statusData = await statusResponse.json();
        console.log('Server status:', statusData);
        updateServerStatus(true);
        showToast('Servidor conectado!', 'success');

        // 3. Auth handling
        if (statusData.auth_required === true) {
            var savedToken = localStorage.getItem('backup_auth_token');
            if (savedToken) {
                try {
                    var verifyResponse = await fetch(state.backendUrl + '/auth/verify', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + savedToken
                        },
                        body: JSON.stringify({})
                    });
                    if (verifyResponse.ok) {
                        state.token = savedToken;
                        hideAuthModal();
                        updateSessionBadge(true);
                        console.log('Token verified successfully.');
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

    // 4. Check optional extension
    try {
        var extOk = await checkExtension();
        console.log('Extension detected:', extOk);
    } catch (e) {
        console.log('Extension not detected (optional).');
    }

    console.log('Initialization complete.');
}

// ===================== STARTUP =====================

(function() {
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
