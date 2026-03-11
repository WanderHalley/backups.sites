// ============================================================
// Site Backup & Error Checker - Frontend v1.3.0
// ============================================================
(function() {
'use strict';

// ===================== EXTENSION ID =====================
let EXTENSION_ID = '';

// ===================== STATE =====================
const state = {
    backendUrl: '',
    token: null,
    sessionId: null,
    siteUrl: '',
    siteTitle: '',
    isConnected: false,
    isAuthenticated: false,
    extensionInstalled: false,
    lastErrorReport: null,
    lastSearchReport: null
};

// ===================== DOM (initialized later) =====================
let DOM = {};

function setupDOM() {
    DOM = {
        // Auth
        authOverlay: document.getElementById('authOverlay'),
        authTokenInput: document.getElementById('authTokenInput'),
        btnAuth: document.getElementById('btnAuth'),
        authToggleVisibility: document.getElementById('authToggleVisibility'),
        btnLogout: document.getElementById('btnLogout'),

        // Header
        serverStatusDot: document.getElementById('serverStatusDot'),
        serverStatusText: document.getElementById('serverStatusText'),
        sessionBadge: document.getElementById('sessionBadge'),
        sessionBadgeText: document.getElementById('sessionBadgeText'),

        // URL / Site
        urlInput: document.getElementById('urlInput'),
        btnOpen: document.getElementById('btnOpen'),
        siteStatus: document.getElementById('siteStatus'),
        siteTitle: document.getElementById('siteTitle'),
        siteUrl: document.getElementById('siteUrl'),
        siteStatusBadge: document.getElementById('siteStatusBadge'),
        btnScreenshot: document.getElementById('btnScreenshot'),
        btnInteract: document.getElementById('btnInteract'),
        btnClose: document.getElementById('btnClose'),
        screenshotPreview: document.getElementById('screenshotPreview'),
        screenshotImg: document.getElementById('screenshotImg'),

        // Interaction / Login
        interactOverlay: document.getElementById('interactOverlay'),
        cookiePasteArea: document.getElementById('cookiePasteArea'),
        loginPreview: document.getElementById('loginPreview'),
        loginPreviewImg: document.getElementById('loginPreviewImg'),
        loginPreviewStatus: document.getElementById('loginPreviewStatus'),

        // Backup
        backupFolder: document.getElementById('backupFolder'),
        btnBackup: document.getElementById('btnBackup'),
        backupProgress: document.getElementById('backupProgress'),
        backupProgressFill: document.getElementById('backupProgressFill'),
        backupProgressText: document.getElementById('backupProgressText'),

        // Errors
        errorsFolder: document.getElementById('errorsFolder'),
        btnErrors: document.getElementById('btnErrors'),
        errorsProgress: document.getElementById('errorsProgress'),
        errorsProgressFill: document.getElementById('errorsProgressFill'),
        errorsProgressText: document.getElementById('errorsProgressText'),

        // Search
        searchTerm: document.getElementById('searchTerm'),
        searchFolder: document.getElementById('searchFolder'),
        btnSearch: document.getElementById('btnSearch'),
        searchProgress: document.getElementById('searchProgress'),
        searchProgressFill: document.getElementById('searchProgressFill'),
        searchProgressText: document.getElementById('searchProgressText'),

        // Results
        errorResultsSection: document.getElementById('errorResultsSection'),
        errorsContent: document.getElementById('errorsContent'),
        searchResultsSection: document.getElementById('searchResultsSection'),
        searchContent: document.getElementById('searchContent'),

        // Downloads & Clear
        btnDownloadErrors: document.getElementById('btnDownloadErrors'),
        btnDownloadSearch: document.getElementById('btnDownloadSearch'),
        btnClearErrors: document.getElementById('btnClearErrors'),
        btnClearSearch: document.getElementById('btnClearSearch'),

        // Toast & Loading
        toastContainer: document.getElementById('toastContainer'),
        loadingOverlay: document.getElementById('loadingOverlay'),
        loadingText: document.getElementById('loadingText'),
        loadingSubtext: document.getElementById('loadingSubtext')
    };

    // Verify critical elements
    var missing = [];
    Object.keys(DOM).forEach(function(key) {
        if (!DOM[key]) missing.push(key);
    });
    if (missing.length > 0) {
        console.error('DOM elements missing:', missing.join(', '));
    } else {
        console.log('All DOM elements loaded successfully.');
    }
}

// ===================== UTILITIES =====================
function showToast(message, type, duration) {
    type = type || 'info';
    duration = duration || 4000;
    if (!DOM.toastContainer) return;

    var icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    var toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.innerHTML = '<span class="toast-icon">' + (icons[type] || 'ℹ️') + '</span><span>' + message + '</span>';
    DOM.toastContainer.appendChild(toast);

    setTimeout(function() {
        toast.classList.add('removing');
        setTimeout(function() {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 300);
    }, duration);
}

function showLoading(text, subtext) {
    if (!DOM.loadingOverlay) return;
    DOM.loadingText.textContent = text || 'Processando...';
    DOM.loadingSubtext.textContent = subtext || '';
    DOM.loadingOverlay.classList.add('active');
}

function hideLoading() {
    if (!DOM.loadingOverlay) return;
    DOM.loadingOverlay.classList.remove('active');
}

function updateServerStatus(status, text) {
    if (!DOM.serverStatusDot || !DOM.serverStatusText) return;
    DOM.serverStatusDot.className = 'status-dot ' + status;
    DOM.serverStatusText.textContent = text || status;
}

function updateSessionBadge(show, text) {
    if (!DOM.sessionBadge) return;
    if (show) {
        DOM.sessionBadge.classList.add('active');
        if (DOM.sessionBadgeText) DOM.sessionBadgeText.textContent = text || 'Sessão ativa';
    } else {
        DOM.sessionBadge.classList.remove('active');
    }
}

function updateModuleButtons(enabled) {
    var buttons = [DOM.btnBackup, DOM.btnErrors, DOM.btnSearch];
    buttons.forEach(function(btn) {
        if (btn) btn.disabled = !enabled;
    });
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
    return new Promise(function(resolve) {
        if (containerEl) containerEl.classList.add('active');
        var i = 0;
        var interval = setInterval(function() {
            if (i < steps.length) {
                if (fillEl) fillEl.style.width = steps[i].pct + '%';
                if (textEl) textEl.textContent = steps[i].text;
                i++;
            } else {
                clearInterval(interval);
                resolve();
            }
        }, 800);
    });
}

function escapeHTML(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ===================== API HELPERS =====================
function apiRequest(endpoint, method, body, isBlob) {
    method = method || 'GET';
    isBlob = isBlob || false;

    var url = state.backendUrl + endpoint;
    var timeout = 120000;
    if (typeof BACKEND_CONFIG !== 'undefined' && BACKEND_CONFIG.REQUEST_TIMEOUT) {
        timeout = BACKEND_CONFIG.REQUEST_TIMEOUT;
    }

    var headers = {};
    if (state.token) {
        headers['Authorization'] = 'Bearer ' + state.token;
    }
    if (body && typeof body === 'object') {
        headers['Content-Type'] = 'application/json';
    }

    var controller = new AbortController();
    var timeoutId = setTimeout(function() { controller.abort(); }, timeout);

    var options = {
        method: method,
        headers: headers,
        signal: controller.signal
    };
    if (body) {
        options.body = JSON.stringify(body);
    }

    return fetch(url, options).then(function(response) {
        clearTimeout(timeoutId);
        if (!response.ok) {
            return response.json().then(function(errData) {
                throw new Error(errData.detail || 'Erro ' + response.status);
            }).catch(function(e) {
                if (e.message && !e.message.startsWith('Erro ')) throw e;
                throw new Error('Erro ' + response.status);
            });
        }
        if (isBlob) return response;
        return response.json();
    }).catch(function(err) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
            throw new Error('Timeout: servidor não respondeu a tempo.');
        }
        throw err;
    });
}

function apiJSON(endpoint, method, body) {
    return apiRequest(endpoint, method, body, false);
}

function apiBlob(endpoint, method, body) {
    return apiRequest(endpoint, method, body, true);
}

// ===================== EXTENSION COMMUNICATION =====================
function checkExtension() {
    return new Promise(function(resolve) {
        if (!EXTENSION_ID) {
            resolve(false);
            return;
        }
        try {
            chrome.runtime.sendMessage(EXTENSION_ID, { action: 'ping' }, function(response) {
                if (chrome.runtime.lastError) {
                    resolve(false);
                    return;
                }
                resolve(response && response.success);
            });
        } catch (e) {
            resolve(false);
        }
    });
}

function getCookiesFromExtension(url) {
    return new Promise(function(resolve, reject) {
        if (!EXTENSION_ID) {
            reject(new Error('Extension ID não configurado.'));
            return;
        }
        try {
            chrome.runtime.sendMessage(EXTENSION_ID, { action: 'getCookies', url: url }, function(response) {
                if (chrome.runtime.lastError) {
                    reject(new Error('Extensão não respondeu.'));
                    return;
                }
                if (response && response.success) {
                    resolve(response.cookies);
                } else {
                    reject(new Error(response ? response.error : 'Erro desconhecido'));
                }
            });
        } catch (e) {
            reject(new Error('Falha ao comunicar com extensão.'));
        }
    });
}

// ===================== AUTH =====================
function showAuthModal() {
    if (DOM.authOverlay) DOM.authOverlay.style.display = 'flex';
}

function hideAuthModal() {
    if (DOM.authOverlay) DOM.authOverlay.style.display = 'none';
}

function authenticate() {
    var token = DOM.authTokenInput ? DOM.authTokenInput.value.trim() : '';
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
        }
    }).then(function(resp) {
        hideLoading();
        if (resp.ok) {
            state.token = token;
            state.isAuthenticated = true;
            sessionStorage.setItem('auth_token', token);
            hideAuthModal();
            updateServerStatus('online', 'Autenticado');
            if (DOM.btnLogout) DOM.btnLogout.style.display = 'flex';
            updateModuleButtons(false);
            showToast('Autenticado com sucesso!', 'success');
        } else {
            showToast('Token inválido.', 'error');
        }
    }).catch(function(err) {
        hideLoading();
        showToast('Erro na autenticação: ' + err.message, 'error');
    });
}

function logout() {
    state.token = null;
    state.isAuthenticated = false;
    state.sessionId = null;
    state.siteUrl = '';
    state.siteTitle = '';
    sessionStorage.removeItem('auth_token');

    if (DOM.btnLogout) DOM.btnLogout.style.display = 'none';
    if (DOM.siteStatus) DOM.siteStatus.classList.remove('active');
    if (DOM.screenshotPreview) DOM.screenshotPreview.classList.remove('active');
    updateSessionBadge(false);
    updateModuleButtons(false);
    updateServerStatus('online', 'Desconectado');
    showAuthModal();
    showToast('Logout realizado.', 'info');
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
    var url = DOM.urlInput ? DOM.urlInput.value.trim() : '';
    if (!url) {
        showToast('Digite a URL do site.', 'warning');
        return;
    }
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }

    showLoading('Abrindo site...', url);

    apiJSON('/open', 'POST', { url: url }).then(function(data) {
        hideLoading();
        state.sessionId = data.session_id;
        state.siteUrl = data.url || url;
        state.siteTitle = data.title || 'Sem título';

        if (DOM.siteTitle) DOM.siteTitle.textContent = state.siteTitle;
        if (DOM.siteUrl) DOM.siteUrl.textContent = state.siteUrl;
        if (DOM.siteStatus) DOM.siteStatus.classList.add('active');

        updateSessionBadge(true, 'Sessão ativa');
        updateModuleButtons(true);
        showToast('Site aberto com sucesso!', 'success');
    }).catch(function(err) {
        hideLoading();
        showToast('Erro ao abrir site: ' + err.message, 'error');
    });
}

function takeScreenshot() {
    if (!state.sessionId) {
        showToast('Nenhuma sessão ativa.', 'warning');
        return;
    }

    showLoading('Capturando screenshot...');

    apiBlob('/screenshot', 'POST', { session_id: state.sessionId }).then(function(response) {
        return response.blob();
    }).then(function(blob) {
        hideLoading();
        var imgUrl = URL.createObjectURL(blob);
        if (DOM.screenshotImg) DOM.screenshotImg.src = imgUrl;
        if (DOM.screenshotPreview) DOM.screenshotPreview.classList.add('active');
        showToast('Screenshot capturado!', 'success');
    }).catch(function(err) {
        hideLoading();
        showToast('Erro no screenshot: ' + err.message, 'error');
    });
}

function closeSession() {
    if (!state.sessionId) {
        showToast('Nenhuma sessão ativa.', 'warning');
        return;
    }

    showLoading('Fechando sessão...');

    apiJSON('/close', 'POST', { session_id: state.sessionId }).then(function() {
        hideLoading();
        state.sessionId = null;
        state.siteUrl = '';
        state.siteTitle = '';

        if (DOM.siteStatus) DOM.siteStatus.classList.remove('active');
        if (DOM.screenshotPreview) DOM.screenshotPreview.classList.remove('active');
        if (DOM.screenshotImg) DOM.screenshotImg.src = '';
        updateSessionBadge(false);
        updateModuleButtons(false);
        showToast('Sessão encerrada.', 'success');
    }).catch(function(err) {
        hideLoading();
        showToast('Erro ao fechar: ' + err.message, 'error');
    });
}

// ===================== INTERACTION / LOGIN =====================
function openInteraction() {
    if (!state.sessionId) {
        showToast('Abra um site primeiro.', 'warning');
        return;
    }
    if (DOM.interactOverlay) DOM.interactOverlay.style.display = 'flex';
    resetLoginSteps();
    showToast('Siga os passos para fazer login no site.', 'info', 5000);
}

function closeInteraction() {
    if (DOM.interactOverlay) DOM.interactOverlay.style.display = 'none';
    showToast('Painel de login fechado.', 'info');
}

function resetLoginSteps() {
    if (DOM.cookiePasteArea) DOM.cookiePasteArea.value = '';
    if (DOM.loginPreview) DOM.loginPreview.classList.remove('active');
    if (DOM.loginPreviewImg) DOM.loginPreviewImg.src = '';
    if (DOM.loginPreviewStatus) {
        DOM.loginPreviewStatus.textContent = '';
        DOM.loginPreviewStatus.className = 'login-preview-status';
    }
}

function openSiteInNewTab() {
    if (!state.siteUrl) {
        showToast('Nenhum site aberto.', 'warning');
        return;
    }
    window.open(state.siteUrl, '_blank');
    showToast('Site aberto em nova aba. Faça login e depois volte aqui.', 'info', 5000);
}

function copyCommandToClipboard() {
    var command = "copy(document.cookie.split(';').map(c=>{let [n,...v]=c.trim().split('=');return{name:n,value:v.join('='),domain:location.hostname,path:'/'}}))";

    if (navigator.clipboard) {
        navigator.clipboard.writeText(command).then(function() {
            showToast('Comando copiado! Cole no console (F12) do site.', 'success');
        }).catch(function() {
            fallbackCopy(command);
        });
    } else {
        fallbackCopy(command);
    }
}

function fallbackCopy(text) {
    var textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showToast('Comando copiado!', 'success');
}

function syncCookies() {
    if (!state.sessionId) {
        showToast('Nenhuma sessão ativa.', 'warning');
        return;
    }

    var cookieText = DOM.cookiePasteArea ? DOM.cookiePasteArea.value.trim() : '';
    if (!cookieText) {
        showToast('Cole os cookies no campo antes de sincronizar.', 'warning');
        return;
    }

    var cookies;
    try {
        cookies = JSON.parse(cookieText);
        if (!Array.isArray(cookies)) {
            throw new Error('Formato inválido');
        }
    } catch (e) {
        showToast('Formato de cookies inválido. Certifique-se de usar o comando correto.', 'error');
        return;
    }

    if (cookies.length === 0) {
        showToast('Nenhum cookie encontrado. Execute o comando no console do site logado.', 'warning');
        return;
    }

    showLoading('Sincronizando ' + cookies.length + ' cookies...', 'Injetando cookies e navegando para o site');

    apiJSON('/inject-cookies', 'POST', {
        session_id: state.sessionId,
        cookies: cookies,
        target_url: state.siteUrl
    }).then(function(data) {
        hideLoading();

        // Show preview
        if (data.screenshot && DOM.loginPreviewImg && DOM.loginPreview) {
            DOM.loginPreviewImg.src = 'data:image/png;base64,' + data.screenshot;
            DOM.loginPreview.classList.add('active');
        }

        // Show login status
        if (DOM.loginPreviewStatus) {
            if (data.login_success) {
                DOM.loginPreviewStatus.className = 'login-preview-status logged-in';
                DOM.loginPreviewStatus.textContent = '✅ Login detectado! Você está logado. Clique em "Pronto, Continuar".';
            } else {
                DOM.loginPreviewStatus.className = 'login-preview-status not-logged';
                DOM.loginPreviewStatus.textContent = '⚠️ Login não confirmado. Verifique o preview. Se estiver logado, clique "Pronto, Continuar". Se não, tente novamente.';
            }
        }

        // Update session info
        if (data.final_url || data.url) {
            state.siteUrl = data.final_url || data.url;
            state.siteTitle = data.final_title || data.title || state.siteTitle;
            if (DOM.siteTitle) DOM.siteTitle.textContent = state.siteTitle;
            if (DOM.siteUrl) DOM.siteUrl.textContent = state.siteUrl;
        }

        // Update main screenshot
        if (data.screenshot) {
            if (DOM.screenshotImg) DOM.screenshotImg.src = 'data:image/png;base64,' + data.screenshot;
            if (DOM.screenshotPreview) DOM.screenshotPreview.classList.add('active');
        }

        // Toast
        var msg = cookies.length + ' cookies enviados, ' + (data.injected_count || 0) + ' injetados.';
        if (data.errors && data.errors.length > 0) {
            msg += ' (' + data.errors.length + ' erros)';
        }
        if (data.login_success) {
            msg += ' ✅ Login detectado!';
            showToast(msg, 'success', 6000);
        } else {
            msg += ' Verifique o preview abaixo.';
            showToast(msg, 'warning', 6000);
        }

    }).catch(function(err) {
        hideLoading();
        showToast('Erro ao sincronizar cookies: ' + err.message, 'error');
    });
}


function finishLogin() {
    closeInteraction();
    showToast('Login finalizado! Agora use os módulos de Backup, Erros e Busca.', 'success', 5000);
}

// ===================== SCROLL =====================
function scrollPage(direction) {
    if (!state.sessionId) {
        showToast('Nenhuma sessão ativa.', 'warning');
        return;
    }

    apiJSON('/scroll', 'POST', {
        session_id: state.sessionId,
        direction: direction,
        amount: 400
    }).then(function(data) {
        if (data.screenshot && DOM.screenshotImg) {
            DOM.screenshotImg.src = 'data:image/png;base64,' + data.screenshot;
            if (DOM.screenshotPreview) DOM.screenshotPreview.classList.add('active');
        }
        var info = data.scroll_info || {};
        var pct = 0;
        if (info.scrollHeight && info.clientHeight) {
            pct = Math.round((info.scrollTop / (info.scrollHeight - info.clientHeight)) * 100);
        }
        showToast('Scroll ' + (direction === 'up' ? '⬆️ cima' : '⬇️ baixo') + ' — ' + pct + '%', 'info', 1500);
    }).catch(function(err) {
        showToast('Erro no scroll: ' + err.message, 'error');
    });
}

// ===================== GET SELENIUM COOKIES =====================
function getSeleniumCookies() {
    if (!state.sessionId) {
        showToast('Nenhuma sessão ativa.', 'warning');
        return;
    }

    showLoading('Capturando cookies do Selenium...');

    apiJSON('/get-selenium-cookies', 'POST', {
        session_id: state.sessionId
    }).then(function(data) {
        hideLoading();

        if (data.cookies && data.cookies.length > 0) {
            // Put cookies in the paste area for the user to see
            if (DOM.cookiePasteArea) {
                DOM.cookiePasteArea.value = JSON.stringify(data.cookies, null, 2);
            }
            showToast('Capturados ' + data.total + ' cookies do Selenium! Agora clique em "Sincronizar Cookies".', 'success', 5000);
        } else {
            showToast('Nenhum cookie encontrado na sessão do Selenium. Faça login na nova aba primeiro.', 'warning', 5000);
        }
    }).catch(function(err) {
        hideLoading();
        showToast('Erro ao capturar cookies: ' + err.message, 'error');
    });
}

// ===================== REFRESH SELENIUM PAGE =====================
function refreshSeleniumPage() {
    if (!state.sessionId) {
        showToast('Nenhuma sessão ativa.', 'warning');
        return;
    }

    showLoading('Atualizando página no Selenium...');

    apiJSON('/refresh-page', 'POST', {
        session_id: state.sessionId
    }).then(function(data) {
        hideLoading();

        if (data.url) {
            state.siteUrl = data.url;
            state.siteTitle = data.title || state.siteTitle;
            if (DOM.siteTitle) DOM.siteTitle.textContent = state.siteTitle;
            if (DOM.siteUrl) DOM.siteUrl.textContent = state.siteUrl;
        }

        if (data.screenshot) {
            if (DOM.screenshotImg) DOM.screenshotImg.src = 'data:image/png;base64,' + data.screenshot;
            if (DOM.screenshotPreview) DOM.screenshotPreview.classList.add('active');
            if (DOM.loginPreviewImg) DOM.loginPreviewImg.src = 'data:image/png;base64,' + data.screenshot;
            if (DOM.loginPreview) DOM.loginPreview.classList.add('active');
        }

        showToast('Página atualizada!', 'success');
    }).catch(function(err) {
        hideLoading();
        showToast('Erro ao atualizar: ' + err.message, 'error');
    });
}

// ===================== AUTO LOGIN =====================
function autoLogin() {
    if (!state.sessionId) {
        showToast('Abra um site primeiro.', 'warning');
        return;
    }

    var emailInput = document.getElementById('autoLoginEmail');
    var passwordInput = document.getElementById('autoLoginPassword');
    var email = emailInput ? emailInput.value.trim() : '';
    var password = passwordInput ? passwordInput.value.trim() : '';

    if (!email) {
        showToast('Digite seu email.', 'warning');
        if (emailInput) emailInput.focus();
        return;
    }
    if (!password) {
        showToast('Digite sua senha.', 'warning');
        if (passwordInput) passwordInput.focus();
        return;
    }

    showLoading('Fazendo login automático...', 'Isso pode levar alguns segundos');

    apiJSON('/auto-login', 'POST', {
        session_id: state.sessionId,
        email: email,
        password: password
    }).then(function(data) {
        hideLoading();

        // Show preview
        var previewDiv = document.getElementById('autoLoginPreview');
        var previewImg = document.getElementById('autoLoginPreviewImg');
        var statusDiv = document.getElementById('autoLoginStatus');
        var stepsDiv = document.getElementById('autoLoginSteps');

        if (data.screenshot && previewImg && previewDiv) {
            previewImg.src = 'data:image/png;base64,' + data.screenshot;
            previewDiv.classList.add('active');
        }

        // Show status
        if (statusDiv) {
            if (data.login_success) {
                statusDiv.className = 'login-preview-status logged-in';
                statusDiv.textContent = '✅ Login realizado com sucesso!';
            } else if (data.url_changed) {
                statusDiv.className = 'login-preview-status logged-in';
                statusDiv.textContent = '🔄 Página mudou — verifique o preview abaixo.';
            } else {
                statusDiv.className = 'login-preview-status not-logged';
                statusDiv.textContent = '⚠️ Não foi possível confirmar o login. Verifique o preview.';
            }
        }

        // Show steps
        if (stepsDiv && data.steps_completed) {
            var stepsHtml = '<strong>Passos executados:</strong><br>';
            data.steps_completed.forEach(function(step) {
                stepsHtml += '• ' + escapeHTML(step) + '<br>';
            });
            stepsDiv.innerHTML = stepsHtml;
        }

        // Update session info
        if (data.final_url) {
            state.siteUrl = data.final_url;
            state.siteTitle = data.final_title || state.siteTitle;
            if (DOM.siteTitle) DOM.siteTitle.textContent = state.siteTitle;
            if (DOM.siteUrl) DOM.siteUrl.textContent = state.siteUrl;
        }

        // Update main screenshot too
        if (data.screenshot) {
            if (DOM.screenshotImg) DOM.screenshotImg.src = 'data:image/png;base64,' + data.screenshot;
            if (DOM.screenshotPreview) DOM.screenshotPreview.classList.add('active');
        }

        // Summary toast
        var summary = [];
        if (data.login_button_clicked) summary.push('botão de login clicado');
        if (data.email_filled) summary.push('email preenchido');
        if (data.password_filled) summary.push('senha preenchida');
        if (data.submit_clicked) summary.push('formulário enviado');

        if (summary.length > 0) {
            showToast('Ações: ' + summary.join(', ') + '.', data.login_success ? 'success' : 'info', 5000);
        } else {
            showToast('Login automático tentado. Verifique o preview.', 'warning', 5000);
        }

    }).catch(function(err) {
        hideLoading();
        showToast('Erro no login automático: ' + err.message, 'error');
    });
}

function toggleAutoLoginPassword() {
    var input = document.getElementById('autoLoginPassword');
    var btn = document.getElementById('btnToggleAutoPass');
    if (!input) return;
    var type = input.type === 'password' ? 'text' : 'password';
    input.type = type;
    if (btn) btn.textContent = type === 'password' ? '👁️' : '🙈';
}
    
// ===================== BACKUP MODULE =====================
function backupSite() {
    if (!state.sessionId) {
        showToast('Abra um site primeiro.', 'warning');
        return;
    }

    var folder = DOM.backupFolder ? DOM.backupFolder.value.trim() : 'meu-backup';
    if (!folder) folder = 'meu-backup';

    showToast('Iniciando backup...', 'info');

    var progressSteps = [
        { pct: 10, text: 'Conectando ao site...' },
        { pct: 25, text: 'Analisando estrutura...' },
        { pct: 40, text: 'Baixando HTML...' },
        { pct: 55, text: 'Baixando CSS e JS...' },
        { pct: 70, text: 'Baixando imagens...' },
        { pct: 85, text: 'Compactando arquivos...' }
    ];

    simulateProgress(DOM.backupProgressFill, DOM.backupProgressText, DOM.backupProgress, progressSteps);

    apiBlob('/backup', 'POST', { session_id: state.sessionId, folder_name: folder }).then(function(response) {
        var disposition = response.headers.get('Content-Disposition');
        var backupErrors = response.headers.get('X-Backup-Errors');
        var filename = 'backup.zip';

        if (disposition) {
            var match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
            if (match && match[1]) {
                filename = match[1].replace(/['"]/g, '');
            }
        }

        return response.blob().then(function(blob) {
            if (DOM.backupProgressFill) DOM.backupProgressFill.style.width = '100%';
            if (DOM.backupProgressText) DOM.backupProgressText.textContent = 'Concluído!';

            downloadBlob(blob, filename);

            var msg = 'Backup baixado com sucesso!';
            if (backupErrors && backupErrors !== '0') {
                msg += ' (' + backupErrors + ' avisos)';
                showToast(msg, 'warning');
            } else {
                showToast(msg, 'success');
            }

            setTimeout(function() {
                if (DOM.backupProgress) DOM.backupProgress.classList.remove('active');
            }, 3000);
        });
    }).catch(function(err) {
        if (DOM.backupProgress) DOM.backupProgress.classList.remove('active');
        showToast('Erro no backup: ' + err.message, 'error');
    });
}

// ===================== ERROR CHECK MODULE =====================
function checkErrors() {
    if (!state.sessionId) {
        showToast('Abra um site primeiro.', 'warning');
        return;
    }

    var folder = DOM.errorsFolder ? DOM.errorsFolder.value.trim() : 'meus-erros';
    if (!folder) folder = 'meus-erros';

    showToast('Iniciando verificação de erros...', 'info');

    var progressSteps = [
        { pct: 10, text: 'Verificando console...' },
        { pct: 25, text: 'Analisando JavaScript...' },
        { pct: 40, text: 'Verificando rede...' },
        { pct: 55, text: 'Analisando CSS/HTML...' },
        { pct: 70, text: 'Verificando segurança...' },
        { pct: 85, text: 'Analisando SEO...' }
    ];

    simulateProgress(DOM.errorsProgressFill, DOM.errorsProgressText, DOM.errorsProgress, progressSteps);

    apiJSON('/check-errors-json', 'POST', { session_id: state.sessionId, folder_name: folder }).then(function(data) {
        if (DOM.errorsProgressFill) DOM.errorsProgressFill.style.width = '100%';
        if (DOM.errorsProgressText) DOM.errorsProgressText.textContent = 'Concluído!';

        state.lastErrorReport = data;
        displayErrorResults(data);

        var totalE = data.total_errors || 0;
        var totalW = data.total_warnings || 0;
        showToast('Verificação concluída: ' + totalE + ' erros, ' + totalW + ' avisos.', totalE > 0 ? 'warning' : 'success');

        setTimeout(function() {
            if (DOM.errorsProgress) DOM.errorsProgress.classList.remove('active');
        }, 3000);
    }).catch(function(err) {
        if (DOM.errorsProgress) DOM.errorsProgress.classList.remove('active');
        showToast('Erro na verificação: ' + err.message, 'error');
    });
}

function downloadErrorReport() {
    if (!state.sessionId) {
        showToast('Nenhuma sessão ativa.', 'warning');
        return;
    }

    var folder = DOM.errorsFolder ? DOM.errorsFolder.value.trim() : 'meus-erros';
    if (!folder) folder = 'meus-erros';

    showLoading('Gerando relatório...');

    apiBlob('/check-errors', 'POST', { session_id: state.sessionId, folder_name: folder }).then(function(response) {
        var disposition = response.headers.get('Content-Disposition');
        var filename = 'relatorio-erros.txt';

        if (disposition) {
            var match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
            if (match && match[1]) {
                filename = match[1].replace(/['"]/g, '');
            }
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
    if (!state.sessionId) {
        showToast('Abra um site primeiro.', 'warning');
        return;
    }

    var term = DOM.searchTerm ? DOM.searchTerm.value.trim() : '';
    if (!term) {
        showToast('Digite o que deseja buscar.', 'warning');
        return;
    }

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

    apiJSON('/search-site', 'POST', {
        session_id: state.sessionId,
        term: term,
        folder_name: folder
    }).then(function(data) {
        if (DOM.searchProgressFill) DOM.searchProgressFill.style.width = '100%';
        if (DOM.searchProgressText) DOM.searchProgressText.textContent = 'Concluído!';

        state.lastSearchReport = data;
        displaySearchResults(data);

        var total = data.total_found || 0;
        showToast('Busca concluída: ' + total + ' resultados encontrados.', total > 0 ? 'success' : 'warning');

        setTimeout(function() {
            if (DOM.searchProgress) DOM.searchProgress.classList.remove('active');
        }, 3000);
    }).catch(function(err) {
        if (DOM.searchProgress) DOM.searchProgress.classList.remove('active');
        showToast('Erro na busca: ' + err.message, 'error');
    });
}

function downloadSearchReport() {
    if (!state.sessionId) {
        showToast('Nenhuma sessão ativa.', 'warning');
        return;
    }

    var term = DOM.searchTerm ? DOM.searchTerm.value.trim() : '';
    if (!term) {
        showToast('Digite o termo de busca.', 'warning');
        return;
    }

    var folder = DOM.searchFolder ? DOM.searchFolder.value.trim() : 'minha-busca';
    if (!folder) folder = 'minha-busca';

    showLoading('Gerando relatório de busca...');

    apiBlob('/search-site-txt', 'POST', {
        session_id: state.sessionId,
        term: term,
        folder_name: folder
    }).then(function(response) {
        var disposition = response.headers.get('Content-Disposition');
        var filename = 'relatorio-busca.txt';

        if (disposition) {
            var match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
            if (match && match[1]) {
                filename = match[1].replace(/['"]/g, '');
            }
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
    if (!data || !data.details) {
        showToast('Nenhum dado de erro para exibir.', 'warning');
        return;
    }

    if (DOM.errorResultsSection) DOM.errorResultsSection.style.display = 'block';

    var totalErrors = data.total_errors || 0;
    var totalWarnings = data.total_warnings || 0;
    var totalErrorsEl = document.getElementById('totalErrors');
    var totalWarningsEl = document.getElementById('totalWarnings');
    if (totalErrorsEl) totalErrorsEl.textContent = totalErrors;
    if (totalWarningsEl) totalWarningsEl.textContent = totalWarnings;

    var details = data.details;
    var categories = Object.keys(details).filter(function(k) {
        var items = details[k];
        return Array.isArray(items) && items.length > 0;
    });

    // Create tabs
    var existingTabs = DOM.errorResultsSection ? DOM.errorResultsSection.querySelector('.result-tabs') : null;
    var tabsContainer = document.createElement('div');
    tabsContainer.className = 'result-tabs';

    // "All" tab
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

    // Render "All" tab initially
    renderErrorsTab('all', details, categories);

    // Tab click listeners
    tabsContainer.querySelectorAll('.result-tab').forEach(function(tab) {
        tab.addEventListener('click', function() {
            tabsContainer.querySelectorAll('.result-tab').forEach(function(t) {
                t.classList.remove('active');
            });
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
    categories.forEach(function(cat) {
        if (details[cat] && details[cat].length > 0) {
            hasItems = true;
        }
    });

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
    if (!data || !data.findings) {
        showToast('Nenhum dado de busca para exibir.', 'warning');
        return;
    }

    if (DOM.searchResultsSection) DOM.searchResultsSection.style.display = 'block';

    var findings = data.findings;
    var totalFound = data.total_found || 0;
    var categoriesSet = {};
    findings.forEach(function(f) { categoriesSet[f.category || 'Outros'] = true; });

    var totalFoundEl = document.getElementById('totalFound');
    var totalCategoriesEl = document.getElementById('totalCategories');
    if (totalFoundEl) totalFoundEl.textContent = totalFound;
    if (totalCategoriesEl) totalCategoriesEl.textContent = Object.keys(categoriesSet).length;

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

    // Interaction / Login
    if (DOM.btnInteract) DOM.btnInteract.addEventListener('click', openInteraction);

    var btnOpenSiteTab = document.getElementById('btnOpenSiteTab');
    if (btnOpenSiteTab) btnOpenSiteTab.addEventListener('click', openSiteInNewTab);

    var btnCopyCommand = document.getElementById('btnCopyCommand');
    if (btnCopyCommand) btnCopyCommand.addEventListener('click', copyCommandToClipboard);

    var btnSyncCookies = document.getElementById('btnSyncCookies');
    if (btnSyncCookies) btnSyncCookies.addEventListener('click', syncCookies);

    var btnCheckExtension = document.getElementById('btnCheckExtension');
    if (btnCheckExtension) btnCheckExtension.addEventListener('click', function() {
        checkExtension().then(function(ok) {
            if (ok) {
                showToast('Extensão detectada e funcionando!', 'success');
            } else {
                showToast('Extensão não detectada. Verifique a instalação.', 'warning');
            }
        });
    });

    var btnLoginRefresh = document.getElementById('btnLoginRefresh');
    if (btnLoginRefresh) btnLoginRefresh.addEventListener('click', checkLoginState);

    var btnLoginCancel = document.getElementById('btnLoginCancel');
    if (btnLoginCancel) btnLoginCancel.addEventListener('click', closeInteraction);

    var btnLoginDone = document.getElementById('btnLoginDone');
    if (btnLoginDone) btnLoginDone.addEventListener('click', finishLogin);
        // Scroll
    var btnScrollUp = document.getElementById('btnScrollUp');
    if (btnScrollUp) btnScrollUp.addEventListener('click', function() { scrollPage('up'); });

    var btnScrollDown = document.getElementById('btnScrollDown');
    if (btnScrollDown) btnScrollDown.addEventListener('click', function() { scrollPage('down'); });

    // Selenium cookies & refresh
    var btnGetSeleniumCookies = document.getElementById('btnGetSeleniumCookies');
    if (btnGetSeleniumCookies) btnGetSeleniumCookies.addEventListener('click', getSeleniumCookies);

    var btnRefreshSelenium = document.getElementById('btnRefreshSelenium');
    if (btnRefreshSelenium) btnRefreshSelenium.addEventListener('click', refreshSeleniumPage);
        // Auto login
    var btnAutoLogin = document.getElementById('btnAutoLogin');
    if (btnAutoLogin) btnAutoLogin.addEventListener('click', autoLogin);

    var btnToggleAutoPass = document.getElementById('btnToggleAutoPass');
    if (btnToggleAutoPass) btnToggleAutoPass.addEventListener('click', toggleAutoLoginPassword);

    var autoLoginPassword = document.getElementById('autoLoginPassword');
    if (autoLoginPassword) autoLoginPassword.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') autoLogin();
    });

    var autoLoginEmail = document.getElementById('autoLoginEmail');
    if (autoLoginEmail) autoLoginEmail.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            var passField = document.getElementById('autoLoginPassword');
            if (passField) passField.focus();
        }
    });


    // Modules
    if (DOM.btnBackup) DOM.btnBackup.addEventListener('click', backupSite);
    if (DOM.btnErrors) DOM.btnErrors.addEventListener('click', checkErrors);
    if (DOM.btnSearch) DOM.btnSearch.addEventListener('click', searchSite);

    // Downloads
    if (DOM.btnDownloadErrors) DOM.btnDownloadErrors.addEventListener('click', downloadErrorReport);
    if (DOM.btnDownloadSearch) DOM.btnDownloadSearch.addEventListener('click', downloadSearchReport);

    // Clear
    if (DOM.btnClearErrors) DOM.btnClearErrors.addEventListener('click', function() {
        if (DOM.errorResultsSection) DOM.errorResultsSection.style.display = 'none';
        if (DOM.errorsContent) DOM.errorsContent.innerHTML = '';
        state.lastErrorReport = null;
        showToast('Resultados de erros limpos.', 'info');
    });
    if (DOM.btnClearSearch) DOM.btnClearSearch.addEventListener('click', function() {
        if (DOM.searchResultsSection) DOM.searchResultsSection.style.display = 'none';
        if (DOM.searchContent) DOM.searchContent.innerHTML = '';
        state.lastSearchReport = null;
        showToast('Resultados de busca limpos.', 'info');
    });

    console.log('Event listeners configurados com sucesso.');
}

// ===================== INIT =====================
async function init() {
    console.log('Iniciando Site Backup & Error Checker...');

    // Load backend URL from config
    if (typeof BACKEND_CONFIG !== 'undefined' && BACKEND_CONFIG.BACKEND_URL) {
        state.backendUrl = BACKEND_CONFIG.BACKEND_URL.replace(/\/+$/, '');
        console.log('Backend URL:', state.backendUrl);
    } else {
        console.error('BACKEND_CONFIG não encontrado! Verifique config.js');
        showToast('Erro: config.js não encontrado ou inválido.', 'error');
        updateServerStatus('offline', 'Config ausente');
        return;
    }

    // Load extension ID from config
    if (typeof BACKEND_CONFIG !== 'undefined' && BACKEND_CONFIG.EXTENSION_ID) {
        EXTENSION_ID = BACKEND_CONFIG.EXTENSION_ID;
    }

    // Check server status
    try {
        var response = await fetch(state.backendUrl + '/', {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) {
            throw new Error('Servidor respondeu com status ' + response.status);
        }

        var data = await response.json();
        console.log('Servidor respondeu:', data);

        state.isConnected = true;
        updateServerStatus('online', 'Conectado');

        // Check auth_required
        if (data.auth_required === true) {
            console.log('Autenticação requerida pelo servidor.');

            // Try saved token first
            var savedToken = sessionStorage.getItem('auth_token');
            if (savedToken) {
                console.log('Token salvo encontrado, verificando...');
                state.token = savedToken;
                try {
                    var verifyResp = await fetch(state.backendUrl + '/auth/verify', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + savedToken
                        }
                    });

                    if (verifyResp.ok) {
                        console.log('Token válido! Reconectado.');
                        state.isAuthenticated = true;
                        hideAuthModal();
                        updateServerStatus('online', 'Autenticado');
                        if (DOM.btnLogout) DOM.btnLogout.style.display = 'flex';
                        updateSessionBadge(false);
                        updateModuleButtons(false);
                        showToast('Reconectado com sucesso!', 'success');
                    } else {
                        console.log('Token salvo inválido, pedindo login...');
                        state.token = null;
                        sessionStorage.removeItem('auth_token');
                        showAuthModal();
                        updateServerStatus('online', 'Login necessário');
                    }
                } catch (verifyErr) {
                    console.error('Erro ao verificar token:', verifyErr);
                    state.token = null;
                    sessionStorage.removeItem('auth_token');
                    showAuthModal();
                    updateServerStatus('online', 'Login necessário');
                }
            } else {
                // No saved token, show login
                console.log('Nenhum token salvo, exibindo login...');
                showAuthModal();
                updateServerStatus('online', 'Login necessário');
            }
        } else {
            // No auth required
            console.log('Servidor sem autenticação. Acesso direto.');
            state.isAuthenticated = true;
            hideAuthModal();
            updateServerStatus('online', 'Conectado');
            updateSessionBadge(false);
            updateModuleButtons(false);
            showToast('Conectado ao servidor!', 'success');
        }

    } catch (err) {
        console.error('Erro ao conectar ao servidor:', err);
        state.isConnected = false;
        updateServerStatus('offline', 'Desconectado');
        showToast('Não foi possível conectar ao servidor. Verifique se o backend está ativo.', 'error', 8000);
        showAuthModal();
    }

    // Check extension (non-blocking)
    checkExtension().then(function(ok) {
        state.extensionInstalled = ok;
        if (ok) {
            console.log('Extensão Chrome detectada!');
        } else {
            console.log('Extensão Chrome não detectada (opcional).');
        }
    });

    console.log('%c Site Backup & Error Checker v1.3.0 ', 'background: #667eea; color: white; font-size: 14px; padding: 4px 8px; border-radius: 4px;');
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



