// =====================================================================
// Site Backup & Error Checker - Frontend v1.4.0
// =====================================================================
// CORREÇÕES APLICADAS:
// - "use strict" adicionado
// - var → const/let em todo o código
// - apiBlob agora reutiliza apiRequest (eliminada duplicação)
// - fix.js integrado: barras de progresso escondem automaticamente
// - Textos com acentuação corrigidos (concludo → concluído, etc.)
// - Debounce adicionado nos cliques do preview ao vivo
// - Memory leaks de blob URLs corrigidos com cleanup centralizado
// - Funções de clear/download de resultados implementadas corretamente
// - Event listeners centralizados em setupEventListeners()
// - Inicialização com checkServerStatus e auto-restore de token
// - pressKey() implementada para Tab/Esc/Back/Forward
// - Fullscreen toggle implementado
// - Todas as funcionalidades originais mantidas intactas
// =====================================================================
"use strict";

// ===================== STATE =====================
const state = {
    backendUrl: '',
    token: null,
    sessionId: null,
    siteUrl: null,
    siteTitle: null,
    isSessionActive: false,
    isLoading: false,
    lastErrorReport: null,
    lastSearchReport: null,
    isFullscreen: false,
    clickDebounceTimer: null
};

// ===================== DOM ELEMENTS =====================
const DOM = {};

function setupDOM() {
    DOM.authOverlay = document.getElementById('authOverlay');
    DOM.authTokenInput = document.getElementById('authTokenInput');
    DOM.authToggleVisibility = document.getElementById('authToggleVisibility');
    DOM.btnAuth = document.getElementById('btnAuth');
    DOM.btnLogout = document.getElementById('btnLogout');

    DOM.serverStatusDot = document.getElementById('serverStatusDot');
    DOM.serverStatusText = document.getElementById('serverStatusText');
    DOM.sessionBadge = document.getElementById('sessionBadge');
    DOM.sessionBadgeText = document.getElementById('sessionBadgeText');

    DOM.urlInput = document.getElementById('urlInput');
    DOM.btnOpen = document.getElementById('btnOpen');

    DOM.siteStatus = document.getElementById('siteStatus');
    DOM.siteTitle = document.getElementById('siteTitle');
    DOM.siteUrl = document.getElementById('siteUrl');
    DOM.siteStatusBadge = document.getElementById('siteStatusBadge');

    DOM.btnScreenshot = document.getElementById('btnScreenshot');
    DOM.btnLogin = document.getElementById('btnInteract');
    DOM.btnScrollUp2 = document.getElementById('btnScrollUp2');
    DOM.btnScrollDown2 = document.getElementById('btnScrollDown2');
    DOM.btnClose = document.getElementById('btnClose');

    DOM.screenshotPreview = document.getElementById('screenshotPreview');
    DOM.screenshotImg = document.getElementById('screenshotImg');

    DOM.interactOverlay = document.getElementById('interactOverlay');
    DOM.loginPanel = document.getElementById('loginPanel');
    DOM.btnLoginCancel = document.getElementById('btnLoginCancel');
    DOM.btnLoginDone = document.getElementById('btnLoginDone');

    DOM.btnAutoLogin = document.getElementById('btnAutoLogin');
    DOM.autoLoginEmail = document.getElementById('autoLoginEmail');
    DOM.autoLoginPassword = document.getElementById('autoLoginPassword');
    DOM.btnToggleAutoPass = document.getElementById('btnToggleAutoPass');
    DOM.autoLoginPreview = document.getElementById('autoLoginPreview');
    DOM.autoLoginPreviewImg = document.getElementById('autoLoginPreviewImg');
    DOM.autoLoginStatus = document.getElementById('autoLoginStatus');
    DOM.loginPreview = document.getElementById('loginPreview');
    DOM.loginPreviewImg = document.getElementById('loginPreviewImg');
    DOM.loginPreviewStatus = document.getElementById('loginPreviewStatus');

    DOM.btnOpenSiteTab = document.getElementById('btnOpenSiteTab');
    DOM.btnCopyCommand = document.getElementById('btnCopyCommand');
    DOM.cookieCommandArea = document.getElementById('cookieCommandArea');
    DOM.btnSyncCookies = document.getElementById('btnSyncCookies');
    DOM.btnGetSeleniumCookies = document.getElementById('btnGetSeleniumCookies');
    DOM.btnRefreshSelenium = document.getElementById('btnRefreshSelenium');
    DOM.cookiePasteArea = document.getElementById('cookiePasteArea');

    DOM.livePreviewContainer = document.getElementById('livePreviewContainer');
    DOM.livePreviewImg = document.getElementById('livePreviewImg');
    DOM.clickFeedback = document.getElementById('clickFeedback');
    DOM.coordsDisplay = document.getElementById('coordsDisplay');
    DOM.btnScrollUp = document.getElementById('btnScrollUp');
    DOM.btnScrollDown = document.getElementById('btnScrollDown');
    DOM.btnRefreshPreview = document.getElementById('btnRefreshPreview');
    DOM.btnFullscreen = document.getElementById('btnFullscreen');

    DOM.remoteTextInput = document.getElementById('remoteTextInput');
    DOM.btnRemoteType = document.getElementById('btnRemoteType');
    DOM.btnRemoteEnter = document.getElementById('btnRemoteEnter');
    DOM.btnRemoteTab = document.getElementById('btnRemoteTab');
    DOM.btnRemoteEsc = document.getElementById('btnRemoteEsc');
    DOM.btnRemoteBack = document.getElementById('btnRemoteBack');
    DOM.btnRemoteForward = document.getElementById('btnRemoteForward');
    DOM.elementInfo = document.getElementById('elementInfo');
    DOM.elementInfoText = document.getElementById('elementInfoText');

    DOM.backupFolder = document.getElementById('backupFolder');
    DOM.btnBackup = document.getElementById('btnBackup');
    DOM.backupProgress = document.getElementById('backupProgress');
    DOM.backupProgressFill = document.getElementById('backupProgressFill');
    DOM.backupProgressText = document.getElementById('backupProgressText');

    DOM.errorsFolder = document.getElementById('errorsFolder');
    DOM.btnErrors = document.getElementById('btnErrors');
    DOM.errorsProgress = document.getElementById('errorsProgress');
    DOM.errorsProgressFill = document.getElementById('errorsProgressFill');
    DOM.errorsProgressText = document.getElementById('errorsProgressText');

    DOM.searchTerm = document.getElementById('searchTerm');
    DOM.searchFolder = document.getElementById('searchFolder');
    DOM.btnSearch = document.getElementById('btnSearch');
    DOM.searchProgress = document.getElementById('searchProgress');
    DOM.searchProgressFill = document.getElementById('searchProgressFill');
    DOM.searchProgressText = document.getElementById('searchProgressText');

    DOM.errorResultsSection = document.getElementById('errorResultsSection');
    DOM.errorsContent = document.getElementById('errorsContent');
    DOM.totalErrors = document.getElementById('totalErrors');
    DOM.totalWarnings = document.getElementById('totalWarnings');
    DOM.btnDownloadErrors = document.getElementById('btnDownloadErrors');
    DOM.btnClearErrors = document.getElementById('btnClearErrors');

    DOM.searchResultsSection = document.getElementById('searchResultsSection');
    DOM.searchContent = document.getElementById('searchContent');
    DOM.totalFound = document.getElementById('totalFound');
    DOM.totalCategories = document.getElementById('totalCategories');
    DOM.btnDownloadSearch = document.getElementById('btnDownloadSearch');
    DOM.btnClearSearch = document.getElementById('btnClearSearch');

    DOM.toastContainer = document.getElementById('toastContainer');
    DOM.loadingOverlay = document.getElementById('loadingOverlay');
    DOM.loadingText = document.getElementById('loadingText');
    DOM.loadingSubtext = document.getElementById('loadingSubtext');

    // Verificação de elementos ausentes
    const missing = [];
    const keys = Object.keys(DOM);
    for (let i = 0; i < keys.length; i++) {
        if (!DOM[keys[i]]) missing.push(keys[i]);
    }
    if (missing.length > 0) {
        console.warn('[DOM] Elementos não encontrados:', missing.join(', '));
    } else {
        console.log('[DOM] Todos os elementos carregados com sucesso.');
    }
}

// ===================== UTILITIES =====================

function showToast(message, type) {
    if (!DOM.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast ' + (type || 'info');
    toast.textContent = message;
    DOM.toastContainer.appendChild(toast);
    setTimeout(function () { toast.classList.add('show'); }, 10);
    setTimeout(function () {
        toast.classList.remove('show');
        setTimeout(function () {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 300);
    }, 4000);
}

function showLoading(text, subtext) {
    state.isLoading = true;
    if (DOM.loadingOverlay) DOM.loadingOverlay.classList.add('active');
    if (DOM.loadingText && text) DOM.loadingText.textContent = text;
    if (DOM.loadingSubtext) DOM.loadingSubtext.textContent = subtext || '';
}

function hideLoading() {
    state.isLoading = false;
    if (DOM.loadingOverlay) DOM.loadingOverlay.classList.remove('active');
    if (DOM.loadingText) DOM.loadingText.textContent = 'Processando...';
    if (DOM.loadingSubtext) DOM.loadingSubtext.textContent = '';
}

function updateServerStatus(online) {
    if (DOM.serverStatusDot) {
        DOM.serverStatusDot.className = 'status-dot ' + (online ? 'online' : 'offline');
    }
    if (DOM.serverStatusText) {
        DOM.serverStatusText.textContent = online ? 'Online' : 'Offline';
    }
}

function updateSessionBadge(active) {
    if (DOM.sessionBadge) {
        DOM.sessionBadge.style.display = active ? 'inline-flex' : 'none';
    }
    if (DOM.sessionBadgeText) {
        DOM.sessionBadgeText.textContent = active ? 'Sessão ativa' : '';
    }
    if (DOM.btnLogout) {
        DOM.btnLogout.style.display = active ? 'inline-block' : 'none';
    }
}

function updateModuleButtons(enabled) {
    const btns = [DOM.btnBackup, DOM.btnErrors, DOM.btnSearch, DOM.btnScreenshot, DOM.btnLogin, DOM.btnClose, DOM.btnScrollUp2, DOM.btnScrollDown2];
    for (let i = 0; i < btns.length; i++) {
        if (btns[i]) btns[i].disabled = !enabled;
    }
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function simulateProgress(fillEl, textEl, steps, totalTime) {
    if (!fillEl || !textEl || !steps || steps.length === 0) return;
    const stepTime = totalTime / steps.length;
    for (let i = 0; i < steps.length; i++) {
        (function (index) {
            setTimeout(function () {
                const pct = Math.round(((index + 1) / steps.length) * 90);
                fillEl.style.width = pct + '%';
                textEl.textContent = steps[index];
            }, stepTime * index);
        })(i);
    }
}

/**
 * Esconde a barra de progresso após um delay
 * (integração do antigo fix.js)
 */
function hideProgressAfterDelay(progressEl, fillEl, textEl, delay) {
    setTimeout(function () {
        if (progressEl) progressEl.style.display = 'none';
        if (fillEl) fillEl.style.width = '0%';
        if (textEl) textEl.textContent = '';
    }, delay || 3000);
}

function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Revoga blob URL anterior de um elemento <img> para evitar memory leak
 */
function revokePreviousBlobUrl(imgEl) {
    if (imgEl && imgEl.src && imgEl.src.startsWith('blob:')) {
        URL.revokeObjectURL(imgEl.src);
    }
}

// ===================== API HELPERS =====================

function apiRequest(endpoint, method, body) {
    const url = state.backendUrl + endpoint;
    const options = {
        method: method || 'POST',
        headers: { 'Content-Type': 'application/json' }
    };
    if (state.token) {
        options.headers['Authorization'] = 'Bearer ' + state.token;
    }
    if (body) {
        options.body = JSON.stringify(body);
    }
    return fetch(url, options);
}

function apiJSON(endpoint, method, body) {
    return apiRequest(endpoint, method, body).then(function (response) {
        if (!response.ok) {
            return response.text().then(function (t) {
                let msg = 'Erro ' + response.status;
                try {
                    const d = JSON.parse(t);
                    if (d.detail) msg = d.detail;
                } catch (e) {
                    if (t) msg = t;
                }
                throw new Error(msg);
            });
        }
        return response.json();
    });
}

/**
 * apiBlob agora reutiliza apiRequest (correção de duplicação)
 */
function apiBlob(endpoint, method, body) {
    return apiRequest(endpoint, method, body);
}

// ===================== EXTENSION CHECK =====================

function checkExtension() {
    return new Promise(function (resolve) {
        try {
            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                chrome.runtime.sendMessage('backup-extension-id', { action: 'ping' }, function (response) {
                    resolve(response && response.status === 'ok');
                });
            } else {
                resolve(false);
            }
        } catch (e) {
            resolve(false);
        }
    });
}

// ===================== SERVER STATUS =====================

function checkServerStatus() {
    fetch(state.backendUrl + '/health', { method: 'GET' })
        .then(function (response) {
            updateServerStatus(response.ok);
        })
        .catch(function () {
            updateServerStatus(false);
        });
}

// ===================== AUTHENTICATION =====================

function showAuthModal() {
    if (DOM.authOverlay) DOM.authOverlay.classList.add('active');
}

function hideAuthModal() {
    if (DOM.authOverlay) DOM.authOverlay.classList.remove('active');
}

function authenticate() {
    if (!DOM.authTokenInput) return;
    const token = DOM.authTokenInput.value.trim();
    if (!token) {
        showToast('Digite o token de acesso.', 'warning');
        return;
    }
    showLoading('Autenticando...');
    fetch(state.backendUrl + '/auth/verify', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({})
    })
        .then(function (response) {
            if (response.ok) {
                state.token = token;
                localStorage.setItem('backup_auth_token', token);
                hideAuthModal();
                updateSessionBadge(true);
                showToast('Autenticado com sucesso!', 'success');
            } else {
                showToast('Token inválido.', 'error');
            }
            hideLoading();
        })
        .catch(function (err) {
            showToast('Erro na autenticação: ' + err.message, 'error');
            hideLoading();
        });
}

function logout() {
    state.token = null;
    localStorage.removeItem('backup_auth_token');
    updateSessionBadge(false);
    showToast('Desconectado.', 'info');
    if (state.sessionId) closeSession();
}

function togglePasswordVisibility(inputEl) {
    if (!inputEl) return;
    inputEl.type = inputEl.type === 'password' ? 'text' : 'password';
}

// ===================== PREVIEW HELPERS =====================

function updateAllPreviews(blobUrl) {
    revokePreviousBlobUrl(DOM.screenshotImg);
    if (DOM.screenshotImg) DOM.screenshotImg.src = blobUrl;
    if (DOM.screenshotPreview) DOM.screenshotPreview.classList.add('active');

    revokePreviousBlobUrl(DOM.loginPreviewImg);
    if (DOM.loginPreviewImg) DOM.loginPreviewImg.src = blobUrl;
    if (DOM.loginPreview) DOM.loginPreview.classList.add('active');

    if (DOM.livePreviewImg) DOM.livePreviewImg.src = blobUrl;
}

function updateAllPreviewsBase64(base64data) {
    const src = 'data:image/png;base64,' + base64data;
    if (DOM.screenshotImg) DOM.screenshotImg.src = src;
    if (DOM.screenshotPreview) DOM.screenshotPreview.classList.add('active');
    if (DOM.loginPreviewImg) DOM.loginPreviewImg.src = src;
    if (DOM.loginPreview) DOM.loginPreview.classList.add('active');
    if (DOM.livePreviewImg) DOM.livePreviewImg.src = src;
}

// ===================== SITE ACTIONS =====================

function openSite() {
    if (!DOM.urlInput) return;
    let url = DOM.urlInput.value.trim();
    if (!url) {
        showToast('Digite uma URL.', 'warning');
        return;
    }
    if (url.indexOf('http') !== 0) {
        url = 'https://' + url;
        DOM.urlInput.value = url;
    }

    showLoading('Abrindo site...');

    apiJSON('/open', 'POST', { url: url })
        .then(function (data) {
            state.sessionId = data.session_id;
            state.siteUrl = data.url || url;
            state.siteTitle = data.title || url;
            state.isSessionActive = true;

            if (DOM.siteStatus) DOM.siteStatus.style.display = 'block';
            if (DOM.siteTitle) DOM.siteTitle.textContent = state.siteTitle;
            if (DOM.siteUrl) DOM.siteUrl.textContent = state.siteUrl;
            if (DOM.siteStatusBadge) {
                DOM.siteStatusBadge.textContent = '● Aberto';
                DOM.siteStatusBadge.className = 'site-status-badge open';
            }

            updateModuleButtons(true);
            showToast('Site aberto: ' + state.siteTitle, 'success');
            hideLoading();

            takeScreenshot();
        })
        .catch(function (err) {
            showToast('Erro ao abrir site: ' + err.message, 'error');
            hideLoading();
        });
}

function takeScreenshot() {
    if (!state.sessionId) { showToast('Abra um site primeiro.', 'warning'); return; }
    apiBlob('/screenshot', 'POST', { session_id: state.sessionId })
        .then(function (response) {
            if (!response.ok) {
                return response.text().then(function (t) {
                    let msg = 'Erro ' + response.status;
                    try { const d = JSON.parse(t); if (d.detail) msg = d.detail; } catch (e) { if (t) msg = t; }
                    throw new Error(msg);
                });
            }
            return response.blob();
        })
        .then(function (blob) {
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            updateAllPreviews(url);
        })
        .catch(function (err) {
            showToast('Erro ao tirar screenshot: ' + err.message, 'error');
        });
}

function closeSession() {
    if (!state.sessionId) { showToast('Nenhuma sessão ativa.', 'warning'); return; }
    showLoading('Encerrando sessão...');
    apiJSON('/close', 'POST', { session_id: state.sessionId })
        .then(function () {
            state.sessionId = null;
            state.siteUrl = null;
            state.siteTitle = null;
            state.isSessionActive = false;

            if (DOM.siteStatus) DOM.siteStatus.style.display = 'none';
            if (DOM.screenshotPreview) DOM.screenshotPreview.classList.remove('active');
            revokePreviousBlobUrl(DOM.screenshotImg);
            if (DOM.screenshotImg) DOM.screenshotImg.src = '';
            if (DOM.loginPreview) DOM.loginPreview.classList.remove('active');
            revokePreviousBlobUrl(DOM.loginPreviewImg);
            if (DOM.loginPreviewImg) DOM.loginPreviewImg.src = '';
            if (DOM.livePreviewImg) DOM.livePreviewImg.src = '';

            updateModuleButtons(false);
            showToast('Sessão encerrada.', 'success');
            hideLoading();
        })
        .catch(function (err) {
            showToast('Erro ao fechar: ' + err.message, 'error');
            hideLoading();
        });
}

// ===================== SCROLL =====================

function scrollPage(direction) {
    if (!state.sessionId) { showToast('Abra um site primeiro.', 'warning'); return; }
    apiJSON('/scroll', 'POST', { session_id: state.sessionId, direction: direction, amount: 400 })
        .then(function (data) {
            if (data.screenshot) {
                updateAllPreviewsBase64(data.screenshot);
            }
            showToast('Página rolada para ' + (direction === 'up' ? 'cima' : 'baixo'), 'info');
        })
        .catch(function (err) {
            showToast('Erro ao rolar: ' + err.message, 'error');
        });
}

// ===================== INTERACTION OVERLAY =====================

function openInteraction() {
    if (!state.sessionId) { showToast('Abra um site primeiro.', 'warning'); return; }
    if (DOM.interactOverlay) DOM.interactOverlay.classList.add('active');

    if (DOM.livePreviewImg) {
        if (DOM.screenshotImg && DOM.screenshotImg.src && DOM.screenshotImg.src !== '' && DOM.screenshotImg.src !== window.location.href) {
            DOM.livePreviewImg.src = DOM.screenshotImg.src;
        } else {
            refreshPreview();
        }
    }
}

function closeInteraction() {
    if (DOM.interactOverlay) DOM.interactOverlay.classList.remove('active');
    // Sair do fullscreen se estiver ativo
    if (state.isFullscreen) toggleFullscreen();
}

function toggleFullscreen() {
    state.isFullscreen = !state.isFullscreen;
    if (DOM.loginPanel) {
        if (state.isFullscreen) {
            DOM.loginPanel.classList.add('fullscreen-mode');
        } else {
            DOM.loginPanel.classList.remove('fullscreen-mode');
        }
    }
    if (DOM.btnFullscreen) {
        DOM.btnFullscreen.textContent = state.isFullscreen ? '🔲 Sair Tela Cheia' : '🔲 Tela Cheia';
    }
}

function openSiteInNewTab() {
    if (state.siteUrl) {
        window.open(state.siteUrl, '_blank');
    } else {
        showToast('Nenhum site aberto.', 'warning');
    }
}

function copyCommandToClipboard() {
    const commandArea = DOM.cookieCommandArea;
    const command = commandArea ? commandArea.value : '';
    if (!command) return;

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(command)
            .then(function () { showToast('Comando copiado! Cole no console do site.', 'success'); })
            .catch(function () { fallbackCopy(command); });
    } else {
        fallbackCopy(command);
    }
}

function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;left:-9999px;';
    document.body.appendChild(ta);
    ta.select();
    try {
        document.execCommand('copy');
        showToast('Comando copiado!', 'success');
    } catch (e) {
        showToast('Não foi possível copiar.', 'error');
    }
    document.body.removeChild(ta);
}

// ===================== COOKIES =====================

function syncCookies() {
    if (!state.sessionId) { showToast('Abra um site primeiro.', 'warning'); return; }
    if (!DOM.cookiePasteArea) return;
    const raw = DOM.cookiePasteArea.value.trim();
    if (!raw) { showToast('Cole os cookies no campo.', 'warning'); return; }

    let cookies;
    try {
        cookies = JSON.parse(raw);
        if (!Array.isArray(cookies)) throw new Error('Deve ser um array.');
    } catch (e) {
        showToast('JSON inválido: ' + e.message, 'error');
        return;
    }

    showLoading('Injetando cookies...');

    apiJSON('/inject-cookies', 'POST', {
        session_id: state.sessionId,
        cookies: cookies,
        target_url: state.siteUrl
    })
        .then(function (data) {
            if (data.screenshot) updateAllPreviewsBase64(data.screenshot);
            if (data.login_success) {
                if (DOM.loginPreviewStatus) {
                    DOM.loginPreviewStatus.textContent = 'Login detectado!';
                    DOM.loginPreviewStatus.className = 'login-preview-status logged-in';
                }
                showToast('Cookies injetados e login detectado!', 'success');
            } else {
                showToast('Cookies injetados: ' + (data.injected_count || 0) + ' de ' + (data.total_cookies || 0), 'info');
            }

            if (data.final_url) state.siteUrl = data.final_url;
            if (data.final_title) state.siteTitle = data.final_title;
            if (DOM.siteTitle) DOM.siteTitle.textContent = state.siteTitle;
            if (DOM.siteUrl) DOM.siteUrl.textContent = state.siteUrl;

            hideLoading();
        })
        .catch(function (err) {
            showToast('Erro ao injetar cookies: ' + err.message, 'error');
            hideLoading();
        });
}

function getSeleniumCookies() {
    if (!state.sessionId) { showToast('Abra um site primeiro.', 'warning'); return; }
    showLoading('Capturando cookies...');
    apiJSON('/get-selenium-cookies', 'POST', { session_id: state.sessionId })
        .then(function (data) {
            const cookies = data.cookies || [];
            if (DOM.cookiePasteArea) {
                DOM.cookiePasteArea.value = JSON.stringify(cookies, null, 2);
            }
            if (data.screenshot) updateAllPreviewsBase64(data.screenshot);
            showToast('Cookies capturados: ' + (data.total || cookies.length), 'success');
            hideLoading();
        })
        .catch(function (err) {
            showToast('Erro ao capturar cookies: ' + err.message, 'error');
            hideLoading();
        });
}

// ===================== SELENIUM PAGE =====================

function refreshSeleniumPage() {
    if (!state.sessionId) { showToast('Abra um site primeiro.', 'warning'); return; }
    showLoading('Atualizando página...');
    apiJSON('/refresh-page', 'POST', { session_id: state.sessionId })
        .then(function (data) {
            if (data.screenshot) updateAllPreviewsBase64(data.screenshot);
            if (data.url) state.siteUrl = data.url;
            if (data.title) state.siteTitle = data.title;
            if (DOM.siteTitle) DOM.siteTitle.textContent = state.siteTitle;
            if (DOM.siteUrl) DOM.siteUrl.textContent = state.siteUrl;
            showToast('Página atualizada!', 'success');
            hideLoading();
        })
        .catch(function (err) {
            showToast('Erro ao atualizar: ' + err.message, 'error');
            hideLoading();
        });
}

function refreshPreview() {
    if (!state.sessionId) { showToast('Abra um site primeiro.', 'warning'); return; }
    apiBlob('/screenshot', 'POST', { session_id: state.sessionId })
        .then(function (response) {
            if (!response.ok) {
                return response.text().then(function (t) {
                    let msg = 'Erro ' + response.status;
                    try { const d = JSON.parse(t); if (d.detail) msg = d.detail; } catch (e) { if (t) msg = t; }
                    throw new Error(msg);
                });
            }
            return response.blob();
        })
        .then(function (blob) {
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            updateAllPreviews(url);
            showToast('Preview atualizado!', 'success');
        })
        .catch(function (err) {
            showToast('Erro ao atualizar preview: ' + err.message, 'error');
        });
}

// ===================== AUTO-LOGIN =====================

function autoLogin() {
    if (!state.sessionId) { showToast('Abra um site primeiro.', 'warning'); return; }

    const email = DOM.autoLoginEmail ? DOM.autoLoginEmail.value.trim() : '';
    const password = DOM.autoLoginPassword ? DOM.autoLoginPassword.value.trim() : '';

    if (!email || !password) {
        showToast('Preencha email e senha.', 'warning');
        return;
    }

    showLoading('Realizando login automático...');

    apiJSON('/auto-login', 'POST', {
        session_id: state.sessionId,
        email: email,
        password: password
    })
        .then(function (data) {
            if (data.screenshot) updateAllPreviewsBase64(data.screenshot);

            if (data.login_success) {
                if (DOM.autoLoginStatus) {
                    DOM.autoLoginStatus.textContent = 'Login realizado com sucesso!';
                    DOM.autoLoginStatus.className = 'login-preview-status logged-in';
                }
                if (DOM.autoLoginPreview) DOM.autoLoginPreview.classList.add('active');
                showToast('Login realizado!', 'success');
            } else if (data.url_changed) {
                if (DOM.autoLoginStatus) {
                    DOM.autoLoginStatus.textContent = 'URL mudou - verifique o preview';
                    DOM.autoLoginStatus.className = 'login-preview-status not-logged';
                }
                if (DOM.autoLoginPreview) DOM.autoLoginPreview.classList.add('active');
                showToast('URL mudou após login. Verifique o preview.', 'info');
            } else {
                if (DOM.autoLoginStatus) {
                    DOM.autoLoginStatus.textContent = 'Login pode não ter funcionado';
                    DOM.autoLoginStatus.className = 'login-preview-status not-logged';
                }
                if (DOM.autoLoginPreview) DOM.autoLoginPreview.classList.add('active');
                showToast('Login enviado, mas resultado incerto. Verifique o preview.', 'warning');
            }

            if (data.final_url) state.siteUrl = data.final_url;
            if (data.final_title) state.siteTitle = data.final_title;
            if (DOM.siteTitle) DOM.siteTitle.textContent = state.siteTitle;
            if (DOM.siteUrl) DOM.siteUrl.textContent = state.siteUrl;

            const steps = [];
            if (data.login_button_clicked) steps.push('Botão login clicado');
            if (data.email_filled) steps.push('Email preenchido');
            if (data.password_filled) steps.push('Senha preenchida');
            if (data.submit_clicked) steps.push('Submit clicado');
            if (steps.length > 0) {
                console.log('[Auto-login] Passos:', steps.join(', '));
            }

            hideLoading();
        })
        .catch(function (err) {
            showToast('Erro no auto-login: ' + err.message, 'error');
            hideLoading();
        });
}

function finishLogin() {
    closeInteraction();
    refreshPreview();
    showToast('Painel de login fechado.', 'info');
}

// ===================== CLICK ON PAGE (com debounce) =====================

function clickOnPage(clickX, clickY) {
    if (!state.sessionId) { showToast('Abra um site primeiro.', 'warning'); return; }

    // Debounce: impede cliques duplicados em menos de 500ms
    if (state.clickDebounceTimer) return;
    state.clickDebounceTimer = setTimeout(function () {
        state.clickDebounceTimer = null;
    }, 500);

    console.log('[Click] Coordenadas:', clickX, clickY);

    // Indicador visual do clique
    if (DOM.livePreviewContainer && DOM.livePreviewImg) {
        const indicator = document.createElement('div');
        indicator.style.cssText = 'position:absolute;width:20px;height:20px;border-radius:50%;background:rgba(255,100,100,0.7);pointer-events:none;transform:translate(-50%,-50%);z-index:100;';

        const rect = DOM.livePreviewImg.getBoundingClientRect();
        const contRect = DOM.livePreviewContainer.getBoundingClientRect();
        const relX = (clickX / 1920) * rect.width + (rect.left - contRect.left);
        const relY = (clickY / 1080) * rect.height + (rect.top - contRect.top);
        indicator.style.left = relX + 'px';
        indicator.style.top = relY + 'px';

        DOM.livePreviewContainer.appendChild(indicator);
        setTimeout(function () {
            if (indicator.parentNode) indicator.parentNode.removeChild(indicator);
        }, 1000);
    }

    if (DOM.clickFeedback) {
        DOM.clickFeedback.textContent = 'Clicando em (' + clickX + ', ' + clickY + ')...';
    }

    apiJSON('/click-element', 'POST', {
        session_id: state.sessionId,
        x: clickX,
        y: clickY
    })
        .then(function (data) {
            if (data.screenshot) updateAllPreviewsBase64(data.screenshot);

            // Mostrar informações do elemento clicado
            if (DOM.elementInfo && DOM.elementInfoText && data.clicked) {
                let info = '';
                if (data.clicked.tagName) info += '<' + data.clicked.tagName + '> ';
                if (data.clicked.id) info += '#' + data.clicked.id + ' ';
                if (data.clicked.text) info += '"' + data.clicked.text.substring(0, 50) + '" ';
                if (data.clicked.type) info += '[type=' + data.clicked.type + '] ';
                if (data.clicked.href) info += ' ' + data.clicked.href.substring(0, 60);
                DOM.elementInfoText.textContent = info || 'Clicado em (' + clickX + ', ' + clickY + ')';
                DOM.elementInfo.style.display = 'block';
            }

            if (DOM.clickFeedback) {
                DOM.clickFeedback.textContent = 'Clique realizado em (' + clickX + ', ' + clickY + ')';
            }

            if (data.url) {
                state.siteUrl = data.url;
                if (DOM.siteUrl) DOM.siteUrl.textContent = data.url;
            }
            if (data.title) {
                state.siteTitle = data.title;
                if (DOM.siteTitle) DOM.siteTitle.textContent = data.title;
            }
        })
        .catch(function (err) {
            showToast('Erro ao clicar: ' + err.message, 'error');
            if (DOM.clickFeedback) DOM.clickFeedback.textContent = '';
        });
}

// ===================== TYPE ON PAGE =====================

function typeOnPage(text, pressEnter) {
    if (!state.sessionId) { showToast('Abra um site primeiro.', 'warning'); return; }

    apiJSON('/type-text', 'POST', {
        session_id: state.sessionId,
        text: text || '',
        press_enter: pressEnter || false,
        clear_first: true
    })
        .then(function (data) {
            if (data.screenshot) updateAllPreviewsBase64(data.screenshot);

            if (data.typed) {
                showToast('Texto digitado' + (pressEnter ? ' + Enter' : '') + '!', 'success');
            } else {
                showToast('Nenhum campo focado para digitar.', 'warning');
            }

            if (data.url) {
                state.siteUrl = data.url;
                if (DOM.siteUrl) DOM.siteUrl.textContent = data.url;
            }
            if (data.title) {
                state.siteTitle = data.title;
                if (DOM.siteTitle) DOM.siteTitle.textContent = data.title;
            }

            if (DOM.remoteTextInput) DOM.remoteTextInput.value = '';
        })
        .catch(function (err) {
            showToast('Erro ao digitar: ' + err.message, 'error');
        });
}

// ===================== PRESS KEY =====================

function pressKey(key) {
    if (!state.sessionId) { showToast('Abra um site primeiro.', 'warning'); return; }

    apiJSON('/press-key', 'POST', {
        session_id: state.sessionId,
        key: key
    })
        .then(function (data) {
            if (data.screenshot) updateAllPreviewsBase64(data.screenshot);
            if (data.url) {
                state.siteUrl = data.url;
                if (DOM.siteUrl) DOM.siteUrl.textContent = data.url;
            }
            if (data.title) {
                state.siteTitle = data.title;
                if (DOM.siteTitle) DOM.siteTitle.textContent = data.title;
            }
            showToast('Tecla "' + key + '" pressionada.', 'info');
        })
        .catch(function (err) {
            showToast('Erro ao pressionar tecla: ' + err.message, 'error');
        });
}

function navigateBack() {
    if (!state.sessionId) { showToast('Abra um site primeiro.', 'warning'); return; }
    apiJSON('/navigate', 'POST', { session_id: state.sessionId, direction: 'back' })
        .then(function (data) {
            if (data.screenshot) updateAllPreviewsBase64(data.screenshot);
            if (data.url) { state.siteUrl = data.url; if (DOM.siteUrl) DOM.siteUrl.textContent = data.url; }
            if (data.title) { state.siteTitle = data.title; if (DOM.siteTitle) DOM.siteTitle.textContent = data.title; }
            showToast('Navegou para trás.', 'info');
        })
        .catch(function (err) { showToast('Erro ao navegar: ' + err.message, 'error'); });
}

function navigateForward() {
    if (!state.sessionId) { showToast('Abra um site primeiro.', 'warning'); return; }
    apiJSON('/navigate', 'POST', { session_id: state.sessionId, direction: 'forward' })
        .then(function (data) {
            if (data.screenshot) updateAllPreviewsBase64(data.screenshot);
            if (data.url) { state.siteUrl = data.url; if (DOM.siteUrl) DOM.siteUrl.textContent = data.url; }
            if (data.title) { state.siteTitle = data.title; if (DOM.siteTitle) DOM.siteTitle.textContent = data.title; }
            showToast('Navegou para frente.', 'info');
        })
        .catch(function (err) { showToast('Erro ao navegar: ' + err.message, 'error'); });
}

// ===================== BACKUP MODULE =====================

function backupSite() {
    if (!state.sessionId) {
        showToast('Abra um site primeiro.', 'warning');
        return;
    }

    let folderName = 'backup';
    if (DOM.backupFolder) {
        const val = DOM.backupFolder.value.trim();
        if (val) folderName = val;
    }

    showLoading('Realizando backup...');
    if (DOM.backupProgress) DOM.backupProgress.style.display = 'block';

    const steps = [
        'Preparando backup...',
        'Capturando HTML...',
        'Baixando recursos...',
        'Capturando imagens...',
        'Gerando arquivo ZIP...',
        'Finalizando...'
    ];

    simulateProgress(DOM.backupProgressFill, DOM.backupProgressText, steps, 18000);

    apiBlob('/backup', 'POST', { session_id: state.sessionId, folder_name: folderName })
        .then(function (response) {
            if (!response.ok) {
                return response.text().then(function (t) {
                    let msg = 'Erro ' + response.status;
                    try { const d = JSON.parse(t); if (d.detail) msg = d.detail; } catch (e) { if (t) msg = t; }
                    throw new Error(msg);
                });
            }
            return response.blob().then(function (blob) {
                return { blob: blob, response: response };
            });
        })
        .then(function (result) {
            if (!result || !result.blob) return;

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
            const filename = folderName + '_' + timestamp + '.zip';
            downloadBlob(result.blob, filename);

            if (DOM.backupProgressFill) DOM.backupProgressFill.style.width = '100%';
            if (DOM.backupProgressText) DOM.backupProgressText.textContent = 'Backup concluído!';

            const errorCount = result.response.headers.get('X-Backup-Errors') || '0';
            showToast('Backup baixado! (' + errorCount + ' erros durante o processo)', 'success');
            hideLoading();

            // Esconde barra de progresso após delay (integração do fix.js)
            hideProgressAfterDelay(DOM.backupProgress, DOM.backupProgressFill, DOM.backupProgressText, 3000);
        })
        .catch(function (err) {
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

    let folderName = 'erros';
    if (DOM.errorsFolder) {
        const val = DOM.errorsFolder.value.trim();
        if (val) folderName = val;
    }

    showLoading('Verificando erros...');
    if (DOM.errorsProgress) DOM.errorsProgress.style.display = 'block';

    const steps = [
        'Iniciando verificação...',
        'Verificando HTML...',
        'Verificando CSS...',
        'Verificando JavaScript...',
        'Verificando acessibilidade...',
        'Verificando SEO...',
        'Gerando relatório...'
    ];

    simulateProgress(DOM.errorsProgressFill, DOM.errorsProgressText, steps, 15000);

    apiJSON('/check-errors-json', 'POST', { session_id: state.sessionId, folder_name: folderName })
        .then(function (data) {
            if (DOM.errorsProgressFill) DOM.errorsProgressFill.style.width = '100%';
            if (DOM.errorsProgressText) DOM.errorsProgressText.textContent = 'Verificação concluída!';

            state.lastErrorReport = data;
            displayErrorResults(data);

            let totalErrors = 0;
            let totalWarnings = 0;
            if (data.summary) {
                totalErrors = data.summary.total_errors || 0;
                totalWarnings = data.summary.total_warnings || 0;
            }

            showToast('Verificação concluída: ' + totalErrors + ' erros, ' + totalWarnings + ' avisos', 'success');
            hideLoading();

            // Esconde barra de progresso após delay (integração do fix.js)
            hideProgressAfterDelay(DOM.errorsProgress, DOM.errorsProgressFill, DOM.errorsProgressText, 2000);
        })
        .catch(function (err) {
            showToast('Erro na verificação: ' + err.message, 'error');
            hideLoading();
            if (DOM.errorsProgress) DOM.errorsProgress.style.display = 'none';
        });
}

function downloadErrorReport() {
    if (!state.sessionId) {
        showToast('Abra um site primeiro.', 'warning');
        return;
    }

    let folderName = 'erros';
    if (DOM.errorsFolder) {
        const val = DOM.errorsFolder.value.trim();
        if (val) folderName = val;
    }

    showLoading('Baixando relatório de erros...');

    apiBlob('/check-errors', 'POST', { session_id: state.sessionId, folder_name: folderName })
        .then(function (response) {
            if (!response.ok) {
                return response.text().then(function (t) {
                    let msg = 'Erro ' + response.status;
                    try { const d = JSON.parse(t); if (d.detail) msg = d.detail; } catch (e) { if (t) msg = t; }
                    throw new Error(msg);
                });
            }
            return response.blob();
        })
        .then(function (blob) {
            if (!blob) return;
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
            const filename = folderName + '_' + timestamp + '.txt';
            downloadBlob(blob, filename);
            showToast('Relatório de erros baixado!', 'success');
            hideLoading();
        })
        .catch(function (err) {
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

    const term = DOM.searchTerm ? DOM.searchTerm.value.trim() : '';
    if (!term) {
        showToast('Digite um termo para buscar.', 'warning');
        return;
    }

    let folderName = 'busca';
    if (DOM.searchFolder) {
        const val = DOM.searchFolder.value.trim();
        if (val) folderName = val;
    }

    showLoading('Buscando no site...');
    if (DOM.searchProgress) DOM.searchProgress.style.display = 'block';

    const steps = [
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
        .then(function (data) {
            if (DOM.searchProgressFill) DOM.searchProgressFill.style.width = '100%';
            if (DOM.searchProgressText) DOM.searchProgressText.textContent = 'Busca concluída!';

            state.lastSearchReport = data;
            displaySearchResults(data);

            const totalFound = data.total_found || 0;
            showToast('Busca concluída: ' + totalFound + ' resultados encontrados', 'success');
            hideLoading();

            // Esconde barra de progresso após delay (integração do fix.js)
            hideProgressAfterDelay(DOM.searchProgress, DOM.searchProgressFill, DOM.searchProgressText, 2000);
        })
        .catch(function (err) {
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

    const term = DOM.searchTerm ? DOM.searchTerm.value.trim() : '';
    if (!term) {
        showToast('Digite um termo para buscar.', 'warning');
        return;
    }

    let folderName = 'busca';
    if (DOM.searchFolder) {
        const val = DOM.searchFolder.value.trim();
        if (val) folderName = val;
    }

    showLoading('Baixando relatório de busca...');

    apiBlob('/search-site-txt', 'POST', {
        session_id: state.sessionId,
        term: term,
        folder_name: folderName
    })
        .then(function (response) {
            if (!response.ok) {
                return response.text().then(function (t) {
                    let msg = 'Erro ' + response.status;
                    try { const d = JSON.parse(t); if (d.detail) msg = d.detail; } catch (e) { if (t) msg = t; }
                    throw new Error(msg);
                });
            }
            return response.blob();
        })
        .then(function (blob) {
            if (!blob) return;
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
            const filename = folderName + '_' + timestamp + '.txt';
            downloadBlob(blob, filename);
            showToast('Relatório de busca baixado!', 'success');
            hideLoading();
        })
        .catch(function (err) {
            showToast('Erro ao baixar relatório: ' + err.message, 'error');
            hideLoading();
        });
}

// ===================== ERROR RESULTS DISPLAY =====================

const categoryLabels = {
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
    'general': 'Geral',
    'network': 'Rede',
    'console': 'Console'
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
        const lower = item.toLowerCase();
        if (lower.indexOf('error') >= 0) return 'error';
        if (lower.indexOf('warning') >= 0) return 'warning';
        return 'info';
    }
    if (item.level) return item.level.toLowerCase();
    if (item.severity) return item.severity.toLowerCase();
    if (item.type) {
        const t = item.type.toLowerCase();
        if (t === 'error') return 'error';
        if (t === 'warning') return 'warning';
    }
    return 'info';
}

function displayErrorResults(data) {
    if (!DOM.errorsContent) return;

    // Mostrar seção de resultados
    if (DOM.errorResultsSection) DOM.errorResultsSection.style.display = 'block';

    DOM.errorsContent.innerHTML = '';

    let totalErrors = 0;
    let totalWarnings = 0;

    if (data.summary) {
        totalErrors = data.summary.total_errors || 0;
        totalWarnings = data.summary.total_warnings || 0;
    }

    // Atualizar contadores no header
    if (DOM.totalErrors) DOM.totalErrors.textContent = totalErrors;
    if (DOM.totalWarnings) DOM.totalWarnings.textContent = totalWarnings;

    const categories = data.categories || data.results || data;
    if (typeof categories === 'object' && !Array.isArray(categories)) {
        const keys = Object.keys(categories);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (key === 'summary' || key === 'url' || key === 'title' || key === 'timestamp' || key === 'total_found') continue;
            const items = categories[key];
            if (Array.isArray(items) && items.length > 0) {
                const block = createErrorCategoryBlock(key, items);
                DOM.errorsContent.appendChild(block);
            }
        }
    }
}

function createErrorCategoryBlock(categoryKey, items) {
    const block = document.createElement('div');
    block.className = 'error-category-block';

    const label = categoryLabels[categoryKey] || categoryKey;
    const headerDiv = document.createElement('div');
    headerDiv.className = 'error-category-title';
    headerDiv.innerHTML = '<strong>' + escapeHTML(label) + '</strong> <span class="error-count">(' + items.length + ' itens)</span>';
    block.appendChild(headerDiv);

    const list = document.createElement('div');
    list.className = 'error-list';

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const level = getErrorLevel(item);
        const message = extractErrorMessage(item);

        const errorItem = document.createElement('div');
        errorItem.className = 'error-item level-' + level;
        errorItem.innerHTML = '<span class="error-level">' + level.toUpperCase() + '</span> ' + escapeHTML(message);

        // Adicionar fonte se disponível
        if (item.source || item.url || item.selector) {
            const sourceDiv = document.createElement('div');
            sourceDiv.className = 'error-source';
            sourceDiv.textContent = item.source || item.url || item.selector || '';
            errorItem.appendChild(sourceDiv);
        }

        list.appendChild(errorItem);
    }

    block.appendChild(list);
    return block;
}

// ===================== SEARCH RESULTS DISPLAY =====================

function displaySearchResults(data) {
    if (!DOM.searchContent) return;

    // Mostrar seção de resultados
    if (DOM.searchResultsSection) DOM.searchResultsSection.style.display = 'block';

    DOM.searchContent.innerHTML = '';

    const totalFound = data.total_found || 0;
    const findings = data.findings || [];

    // Atualizar contadores
    if (DOM.totalFound) DOM.totalFound.textContent = totalFound;

    if (findings.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'no-results';
        empty.textContent = 'Nenhum resultado encontrado.';
        DOM.searchContent.appendChild(empty);
        if (DOM.totalCategories) DOM.totalCategories.textContent = '0';
        return;
    }

    // Agrupar por categoria
    const grouped = {};
    for (let i = 0; i < findings.length; i++) {
        const cat = findings[i].category || 'general';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(findings[i]);
    }

    const groupKeys = Object.keys(grouped);
    if (DOM.totalCategories) DOM.totalCategories.textContent = groupKeys.length;

    for (let g = 0; g < groupKeys.length; g++) {
        const gKey = groupKeys[g];
        const gItems = grouped[gKey];

        const catBlock = document.createElement('div');
        catBlock.className = 'search-category-block';

        const catHeader = document.createElement('div');
        catHeader.className = 'search-category-title';
        const catLabel = categoryLabels[gKey] || gKey;
        catHeader.innerHTML = '<strong>' + escapeHTML(catLabel) + '</strong> <span class="search-count">(' + gItems.length + ' itens)</span>';
        catBlock.appendChild(catHeader);

        const catList = document.createElement('div');
        catList.className = 'search-list';

        for (let j = 0; j < gItems.length; j++) {
            const findItem = gItems[j];
            const searchItem = document.createElement('div');
            searchItem.className = 'search-item';

            let html = '';
            if (findItem.type) html += '<span class="search-type">' + escapeHTML(findItem.type) + '</span> ';
            if (findItem.value) html += '<span class="search-value">' + escapeHTML(findItem.value) + '</span>';
            if (findItem.details) html += '<div class="search-details">' + escapeHTML(findItem.details) + '</div>';
            if (!findItem.value && !findItem.type) html = '<span class="search-value">' + escapeHTML(JSON.stringify(findItem)) + '</span>';

            searchItem.innerHTML = html;
            catList.appendChild(searchItem);
        }

        catBlock.appendChild(catList);
        DOM.searchContent.appendChild(catBlock);
    }
}

// ===================== CLEAR RESULTS =====================

function clearErrorResults() {
    if (DOM.errorsContent) DOM.errorsContent.innerHTML = '';
    if (DOM.errorResultsSection) DOM.errorResultsSection.style.display = 'none';
    if (DOM.totalErrors) DOM.totalErrors.textContent = '0';
    if (DOM.totalWarnings) DOM.totalWarnings.textContent = '0';
    state.lastErrorReport = null;
    showToast('Resultados de erros limpos.', 'info');
}

function clearSearchResults() {
    if (DOM.searchContent) DOM.searchContent.innerHTML = '';
    if (DOM.searchResultsSection) DOM.searchResultsSection.style.display = 'none';
    if (DOM.totalFound) DOM.totalFound.textContent = '0';
    if (DOM.totalCategories) DOM.totalCategories.textContent = '0';
    state.lastSearchReport = null;
    showToast('Resultados de busca limpos.', 'info');
}

// ===================== LIVE PREVIEW CLICK HANDLER =====================

function setupLivePreviewClick() {
    if (!DOM.livePreviewContainer || !DOM.livePreviewImg) return;

    DOM.livePreviewImg.addEventListener('mousemove', function (e) {
        const rect = DOM.livePreviewImg.getBoundingClientRect();
        const x = Math.round((e.clientX - rect.left) / rect.width * 1920);
        const y = Math.round((e.clientY - rect.top) / rect.height * 1080);
        if (DOM.coordsDisplay) DOM.coordsDisplay.textContent = 'X: ' + x + ' Y: ' + y;
    });

    DOM.livePreviewImg.addEventListener('click', function (e) {
        e.preventDefault();
        const rect = DOM.livePreviewImg.getBoundingClientRect();
        const x = Math.round((e.clientX - rect.left) / rect.width * 1920);
        const y = Math.round((e.clientY - rect.top) / rect.height * 1080);
        clickOnPage(x, y);
    });
}

// ===================== EVENT LISTENERS =====================

function setupEventListeners() {
    // ---- Autenticação ----
    if (DOM.btnAuth) DOM.btnAuth.addEventListener('click', authenticate);
    if (DOM.authToggleVisibility) DOM.authToggleVisibility.addEventListener('click', function () {
        togglePasswordVisibility(DOM.authTokenInput);
    });
    if (DOM.authTokenInput) DOM.authTokenInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') authenticate();
    });
    if (DOM.btnLogout) DOM.btnLogout.addEventListener('click', logout);

    // ---- URL / Site ----
    if (DOM.btnOpen) DOM.btnOpen.addEventListener('click', openSite);
    if (DOM.urlInput) DOM.urlInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') openSite();
    });
    if (DOM.btnScreenshot) DOM.btnScreenshot.addEventListener('click', takeScreenshot);
    if (DOM.btnClose) DOM.btnClose.addEventListener('click', closeSession);
    if (DOM.btnScrollUp2) DOM.btnScrollUp2.addEventListener('click', function () { scrollPage('up'); });
    if (DOM.btnScrollDown2) DOM.btnScrollDown2.addEventListener('click', function () { scrollPage('down'); });

    // ---- Interaction Overlay ----
    if (DOM.btnLogin) DOM.btnLogin.addEventListener('click', openInteraction);
    if (DOM.btnLoginCancel) DOM.btnLoginCancel.addEventListener('click', closeInteraction);
    if (DOM.btnLoginDone) DOM.btnLoginDone.addEventListener('click', finishLogin);

    // ---- Auto Login ----
    if (DOM.btnAutoLogin) DOM.btnAutoLogin.addEventListener('click', autoLogin);
    if (DOM.btnToggleAutoPass) DOM.btnToggleAutoPass.addEventListener('click', function () {
        togglePasswordVisibility(DOM.autoLoginPassword);
    });

    // ---- Cookies ----
    if (DOM.btnOpenSiteTab) DOM.btnOpenSiteTab.addEventListener('click', openSiteInNewTab);
    if (DOM.btnCopyCommand) DOM.btnCopyCommand.addEventListener('click', copyCommandToClipboard);
    if (DOM.btnSyncCookies) DOM.btnSyncCookies.addEventListener('click', syncCookies);
    if (DOM.btnGetSeleniumCookies) DOM.btnGetSeleniumCookies.addEventListener('click', getSeleniumCookies);
    if (DOM.btnRefreshSelenium) DOM.btnRefreshSelenium.addEventListener('click', refreshSeleniumPage);

    // ---- Remote Control ----
    if (DOM.btnScrollUp) DOM.btnScrollUp.addEventListener('click', function () { scrollPage('up'); });
    if (DOM.btnScrollDown) DOM.btnScrollDown.addEventListener('click', function () { scrollPage('down'); });
    if (DOM.btnRefreshPreview) DOM.btnRefreshPreview.addEventListener('click', refreshPreview);
    if (DOM.btnFullscreen) DOM.btnFullscreen.addEventListener('click', toggleFullscreen);

    if (DOM.btnRemoteType) DOM.btnRemoteType.addEventListener('click', function () {
        const text = DOM.remoteTextInput ? DOM.remoteTextInput.value : '';
        typeOnPage(text, false);
    });
    if (DOM.btnRemoteEnter) DOM.btnRemoteEnter.addEventListener('click', function () {
        const text = DOM.remoteTextInput ? DOM.remoteTextInput.value : '';
        typeOnPage(text, true);
    });
    if (DOM.remoteTextInput) DOM.remoteTextInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            const text = DOM.remoteTextInput.value;
            typeOnPage(text, true);
        }
    });

    if (DOM.btnRemoteTab) DOM.btnRemoteTab.addEventListener('click', function () { pressKey('Tab'); });
    if (DOM.btnRemoteEsc) DOM.btnRemoteEsc.addEventListener('click', function () { pressKey('Escape'); });
    if (DOM.btnRemoteBack) DOM.btnRemoteBack.addEventListener('click', navigateBack);
    if (DOM.btnRemoteForward) DOM.btnRemoteForward.addEventListener('click', navigateForward);

    // ---- Modules ----
    if (DOM.btnBackup) DOM.btnBackup.addEventListener('click', backupSite);
    if (DOM.btnErrors) DOM.btnErrors.addEventListener('click', checkErrors);
    if (DOM.btnSearch) DOM.btnSearch.addEventListener('click', searchSite);

    // ---- Results ----
    if (DOM.btnDownloadErrors) DOM.btnDownloadErrors.addEventListener('click', downloadErrorReport);
    if (DOM.btnDownloadSearch) DOM.btnDownloadSearch.addEventListener('click', downloadSearchReport);
    if (DOM.btnClearErrors) DOM.btnClearErrors.addEventListener('click', clearErrorResults);
    if (DOM.btnClearSearch) DOM.btnClearSearch.addEventListener('click', clearSearchResults);

    // ---- Live Preview Click ----
    setupLivePreviewClick();
}

// ===================== INITIALIZATION =====================

function init() {
    // Configurar URL do backend
    if (typeof BACKEND_CONFIG !== 'undefined' && BACKEND_CONFIG.BACKEND_URL) {
        state.backendUrl = BACKEND_CONFIG.BACKEND_URL;
    } else {
        state.backendUrl = 'https://wanderhalleylee-backupsites.hf.space';
        console.warn('[Init] BACKEND_CONFIG não encontrado, usando URL padrão.');
    }

    // Montar referências DOM
    setupDOM();

    // Registrar event listeners
    setupEventListeners();

    // Verificar status do servidor
    checkServerStatus();
    // Re-verificar a cada 30 segundos
    setInterval(checkServerStatus, 30000);

    // Restaurar token salvo
    const savedToken = localStorage.getItem('backup_auth_token');
    if (savedToken) {
        state.token = savedToken;
        updateSessionBadge(true);
        console.log('[Init] Token restaurado do localStorage.');
    } else {
        showAuthModal();
    }

    console.log('[Init] Site Backup & Error Checker v' + (BACKEND_CONFIG ? BACKEND_CONFIG.VERSION : '1.4.0') + ' inicializado.');
}

// Iniciar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', init);
