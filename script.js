// =====================================================================
// Site Backup & Error Checker - Frontend v1.3.0
// =====================================================================

// ===================== STATE =====================
var state = {
    backendUrl: '',
    token: null,
    sessionId: null,
    siteUrl: null,
    siteTitle: null,
    isSessionActive: false,
    isLoading: false,
    lastErrorReport: null,
    lastSearchReport: null
};

// ===================== DOM ELEMENTS =====================
var DOM = {};

function setupDOM() {
    DOM.authOverlay = document.getElementById('authOverlay');
    DOM.authTokenInput = document.getElementById('authTokenInput');
    DOM.btnAuth = document.getElementById('btnAuth');
    DOM.btnTogglePassword = document.getElementById('btnTogglePassword');
    DOM.btnLogout = document.getElementById('btnLogout');

    DOM.serverStatus = document.getElementById('serverStatus');
    DOM.serverStatusDot = document.getElementById('serverStatusDot');
    DOM.sessionBadge = document.getElementById('sessionBadge');

    DOM.urlInput = document.getElementById('urlInput');
    DOM.btnOpen = document.getElementById('btnOpen');

    DOM.siteStatus = document.getElementById('siteStatus');
    DOM.siteTitle = document.getElementById('siteTitle');
    DOM.siteUrl = document.getElementById('siteUrl');
    DOM.siteStatusBadge = document.getElementById('siteStatusBadge');

    DOM.btnScreenshot = document.getElementById('btnScreenshot');
    DOM.btnLogin = document.getElementById('btnInteract');
    DOM.btnScroll = document.getElementById('btnScroll');
    DOM.btnClose = document.getElementById('btnClose');

    DOM.screenshotPreview = document.getElementById('screenshotPreview');
    DOM.screenshotImg = document.getElementById('screenshotImg');

    DOM.interactOverlay = document.getElementById('interactOverlay');
    DOM.btnCloseInteract = document.getElementById('btnLoginCancel');

    DOM.btnAutoLogin = document.getElementById('btnAutoLogin');
    DOM.autoLoginEmail = document.getElementById('autoLoginEmail');
    DOM.autoLoginPassword = document.getElementById('autoLoginPassword');
    DOM.btnToggleAutoLoginPassword = document.getElementById('btnToggleAutoPass');
    DOM.loginPreview = document.getElementById('loginPreview');
    DOM.loginPreviewImg = document.getElementById('loginPreviewImg');
    DOM.loginStatus = document.getElementById('loginStatus');

    DOM.btnOpenSiteTab = document.getElementById('btnOpenSiteTab');
    DOM.btnCopyCommand = document.getElementById('btnCopyCommand');
    DOM.btnSyncCookies = document.getElementById('btnSyncCookies');
    DOM.btnGetSeleniumCookies = document.getElementById('btnGetSeleniumCookies');
    DOM.cookieInput = document.getElementById('cookiePasteArea');

    DOM.btnScrollUp = document.getElementById('btnScrollUp');
    DOM.btnScrollDown = document.getElementById('btnScrollDown');
    DOM.btnRefreshPreview = document.getElementById('btnRefreshPreview');
    DOM.btnFinishLogin = document.getElementById('btnFinishLogin');

    DOM.backupFolder = document.getElementById('backupFolder');
    DOM.btnBackup = document.getElementById('btnBackup');
    DOM.backupProgress = document.getElementById('backupProgress');
    DOM.backupProgressFill = document.getElementById('backupProgressFill');
    DOM.backupProgressText = document.getElementById('backupProgressText');

    DOM.errorFolder = document.getElementById('errorsFolder');
    DOM.btnCheckErrors = document.getElementById('btnErrors');
    DOM.errorProgress = document.getElementById('errorsProgress');
    DOM.errorProgressFill = document.getElementById('errorsProgressFill');
    DOM.errorProgressText = document.getElementById('errorsProgressText');

    DOM.searchTerm = document.getElementById('searchTerm');
    DOM.searchFolder = document.getElementById('searchFolder');
    DOM.btnSearch = document.getElementById('btnSearch');
    DOM.searchProgress = document.getElementById('searchProgress');
    DOM.searchProgressFill = document.getElementById('searchProgressFill');
    DOM.searchProgressText = document.getElementById('searchProgressText');

    DOM.errorResults = document.getElementById('errorsContent');
    DOM.searchResults = document.getElementById('searchContent');
    DOM.btnDownloadErrors = document.getElementById('btnDownloadErrors');
    DOM.btnDownloadSearch = document.getElementById('btnDownloadSearch');
    DOM.btnClearErrors = document.getElementById('btnClearErrors');
    DOM.btnClearSearch = document.getElementById('btnClearSearch');

    DOM.toastContainer = document.getElementById('toastContainer');
    DOM.loadingOverlay = document.getElementById('loadingOverlay');

    // Check missing elements
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
    var toast = document.createElement('div');
    toast.className = 'toast ' + (type || 'info');
    toast.textContent = message;
    DOM.toastContainer.appendChild(toast);
    setTimeout(function() { toast.classList.add('show'); }, 10);
    setTimeout(function() {
        toast.classList.remove('show');
        setTimeout(function() { toast.remove(); }, 300);
    }, 4000);
}

function showLoading() {
    state.isLoading = true;
    if (DOM.loadingOverlay) DOM.loadingOverlay.classList.add('active');
}

function hideLoading() {
    state.isLoading = false;
    if (DOM.loadingOverlay) DOM.loadingOverlay.classList.remove('active');
}

function updateServerStatus(online) {
    if (DOM.serverStatusDot) {
        DOM.serverStatusDot.className = 'status-dot ' + (online ? 'online' : 'offline');
    }
    if (DOM.serverStatus) {
        DOM.serverStatus.textContent = online ? 'Online' : 'Offline';
    }
}

function updateSessionBadge(active) {
    if (DOM.sessionBadge) {
        DOM.sessionBadge.textContent = active ? 'Conectado' : 'Desconectado';
        DOM.sessionBadge.className = 'session-badge ' + (active ? 'active' : '');
    }
}

function updateModuleButtons(enabled) {
    var btns = [DOM.btnBackup, DOM.btnCheckErrors, DOM.btnSearch, DOM.btnScreenshot, DOM.btnLogin, DOM.btnScroll, DOM.btnClose];
    for (var i = 0; i < btns.length; i++) {
        if (btns[i]) btns[i].disabled = !enabled;
    }
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

function simulateProgress(fillEl, textEl, steps, totalTime) {
    if (!fillEl || !textEl || !steps || steps.length === 0) return;
    var stepTime = totalTime / steps.length;
    for (var i = 0; i < steps.length; i++) {
        (function(index) {
            setTimeout(function() {
                var pct = Math.round(((index + 1) / steps.length) * 90);
                fillEl.style.width = pct + '%';
                textEl.textContent = steps[index];
            }, stepTime * index);
        })(i);
    }
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

// ===================== API HELPERS =====================

function apiRequest(endpoint, method, body) {
    var url = state.backendUrl + endpoint;
    var options = {
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
    return apiRequest(endpoint, method, body).then(function(response) {
        if (!response.ok) {
            return response.text().then(function(t) {
                var msg = 'Erro ' + response.status;
                try {
                    var d = JSON.parse(t);
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

function apiBlob(endpoint, method, body) {
    var url = state.backendUrl + endpoint;
    var options = {
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

// ===================== EXTENSION CHECK =====================

function checkExtension() {
    return new Promise(function(resolve, reject) {
        try {
            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                chrome.runtime.sendMessage('backup-extension-id', { action: 'ping' }, function(response) {
                    if (response && response.status === 'ok') {
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                });
            } else {
                resolve(false);
            }
        } catch (e) {
            resolve(false);
        }
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
    var token = DOM.authTokenInput.value.trim();
    if (!token) {
        showToast('Digite o token de acesso.', 'warning');
        return;
    }
    showLoading();
    fetch(state.backendUrl + '/auth/verify', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({})
    })
        .then(function(response) {
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
        .catch(function(err) {
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

function togglePasswordVisibility() {
    if (!DOM.authTokenInput) return;
    var type = DOM.authTokenInput.type === 'password' ? 'text' : 'password';
    DOM.authTokenInput.type = type;
}

// ===================== PREVIEW HELPERS =====================

function updateAllPreviews(blobUrl) {
    if (DOM.screenshotImg) {
        if (DOM.screenshotImg.src && DOM.screenshotImg.src.startsWith('blob:')) {
            URL.revokeObjectURL(DOM.screenshotImg.src);
        }
        DOM.screenshotImg.src = blobUrl;
    }
    if (DOM.screenshotPreview) DOM.screenshotPreview.classList.add('active');
    if (DOM.loginPreviewImg) {
        if (DOM.loginPreviewImg.src && DOM.loginPreviewImg.src.startsWith('blob:')) {
            URL.revokeObjectURL(DOM.loginPreviewImg.src);
        }
        DOM.loginPreviewImg.src = blobUrl;
    }
    if (DOM.loginPreview) DOM.loginPreview.classList.add('active');

    var liveImg = document.getElementById('livePreviewImg');
    if (liveImg) liveImg.src = blobUrl;
}

function updateAllPreviewsBase64(base64data) {
    var src = 'data:image/png;base64,' + base64data;
    if (DOM.screenshotImg) DOM.screenshotImg.src = src;
    if (DOM.screenshotPreview) DOM.screenshotPreview.classList.add('active');
    if (DOM.loginPreviewImg) DOM.loginPreviewImg.src = src;
    if (DOM.loginPreview) DOM.loginPreview.classList.add('active');

    var liveImg = document.getElementById('livePreviewImg');
    if (liveImg) liveImg.src = src;
}

// ===================== SITE ACTIONS =====================

function openSite() {
    if (!DOM.urlInput) return;
    var url = DOM.urlInput.value.trim();
    if (!url) {
        showToast('Digite uma URL.', 'warning');
        return;
    }
    if (url.indexOf('http') !== 0) {
        url = 'https://' + url;
        DOM.urlInput.value = url;
    }

    showLoading();

    apiJSON('/open', 'POST', { url: url })
        .then(function(data) {
            state.sessionId = data.session_id;
            state.siteUrl = data.url || url;
            state.siteTitle = data.title || url;
            state.isSessionActive = true;

            if (DOM.siteStatus) DOM.siteStatus.style.display = 'block';
            if (DOM.siteTitle) DOM.siteTitle.textContent = state.siteTitle;
            if (DOM.siteUrl) DOM.siteUrl.textContent = state.siteUrl;
            if (DOM.siteStatusBadge) {
                DOM.siteStatusBadge.textContent = 'Aberto';
                DOM.siteStatusBadge.className = 'site-status-badge active';
            }

            updateModuleButtons(true);
            showToast('Site aberto: ' + state.siteTitle, 'success');
            hideLoading();

            // Auto screenshot
            takeScreenshot();
        })
        .catch(function(err) {
            showToast('Erro ao abrir site: ' + err.message, 'error');
            hideLoading();
        });
}

function takeScreenshot() {
    if (!state.sessionId) { showToast('Abra um site primeiro.', 'warning'); return; }
    apiBlob('/screenshot', 'POST', { session_id: state.sessionId })
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
            var url = URL.createObjectURL(blob);
            updateAllPreviews(url);
        })
        .catch(function(err) {
            showToast('Erro ao tirar screenshot: ' + err.message, 'error');
        });
}

function closeSession() {
    if (!state.sessionId) { showToast('Nenhuma sessão ativa.', 'warning'); return; }
    showLoading();
    apiJSON('/close', 'POST', { session_id: state.sessionId })
        .then(function() {
            state.sessionId = null;
            state.siteUrl = null;
            state.siteTitle = null;
            state.isSessionActive = false;

            if (DOM.siteStatus) DOM.siteStatus.style.display = 'none';
            if (DOM.screenshotPreview) DOM.screenshotPreview.classList.remove('active');
            if (DOM.screenshotImg) DOM.screenshotImg.src = '';
            if (DOM.loginPreview) DOM.loginPreview.classList.remove('active');
            if (DOM.loginPreviewImg) DOM.loginPreviewImg.src = '';

            var liveImg = document.getElementById('livePreviewImg');
            if (liveImg) liveImg.src = '';

            updateModuleButtons(false);
            showToast('Sessão encerrada.', 'success');
            hideLoading();
        })
        .catch(function(err) {
            showToast('Erro ao fechar: ' + err.message, 'error');
            hideLoading();
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
        })
        .catch(function(err) {
            showToast('Erro ao rolar: ' + err.message, 'error');
        });
}

// ===================== INTERACTION OVERLAY =====================

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
                    liveImg.src = url;
                    if (DOM.screenshotImg) DOM.screenshotImg.src = url;
                    if (DOM.screenshotPreview) DOM.screenshotPreview.classList.add('active');
                })
                .catch(function(err) {
                    showToast('Erro ao carregar preview: ' + err.message, 'error');
                });
        }
    }
}

function closeInteraction() {
    if (DOM.interactOverlay) DOM.interactOverlay.classList.remove('active');
}

function openSiteInNewTab() {
    if (state.siteUrl) {
        window.open(state.siteUrl, '_blank');
    } else {
        showToast('Nenhum site aberto.', 'warning');
    }
}

function copyCommandToClipboard() {
    var command = "JSON.stringify(document.cookie.split('; ').map(c => { var parts = c.split('='); return {name: parts[0], value: parts.slice(1).join('=')}; }))";
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(command)
            .then(function() { showToast('Comando copiado! Cole no console do site.', 'success'); })
            .catch(function() { fallbackCopy(command); });
    } else {
        fallbackCopy(command);
    }
}

function fallbackCopy(text) {
    var ta = document.createElement('textarea');
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
    if (!DOM.cookieInput) return;
    var raw = DOM.cookieInput.value.trim();
    if (!raw) { showToast('Cole os cookies no campo.', 'warning'); return; }

    var cookies;
    try {
        cookies = JSON.parse(raw);
        if (!Array.isArray(cookies)) throw new Error('Deve ser um array.');
    } catch (e) {
        showToast('JSON inválido: ' + e.message, 'error');
        return;
    }

    showLoading();

    apiJSON('/inject-cookies', 'POST', {
        session_id: state.sessionId,
        cookies: cookies,
        target_url: state.siteUrl
    })
        .then(function(data) {
            if (data.screenshot) {
                updateAllPreviewsBase64(data.screenshot);
            }
            if (data.login_success) {
                if (DOM.loginStatus) {
                    DOM.loginStatus.textContent = 'Login detectado!';
                    DOM.loginStatus.className = 'login-status success';
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
        .catch(function(err) {
            showToast('Erro ao injetar cookies: ' + err.message, 'error');
            hideLoading();
        });
}

function getSeleniumCookies() {
    if (!state.sessionId) { showToast('Abra um site primeiro.', 'warning'); return; }
    showLoading();
    apiJSON('/get-selenium-cookies', 'POST', { session_id: state.sessionId })
        .then(function(data) {
            var cookies = data.cookies || [];
            if (DOM.cookieInput) {
                DOM.cookieInput.value = JSON.stringify(cookies, null, 2);
            }
            if (data.screenshot) {
                updateAllPreviewsBase64(data.screenshot);
            }
            showToast('Cookies capturados: ' + (data.total || cookies.length), 'success');
            hideLoading();
        })
        .catch(function(err) {
            showToast('Erro ao capturar cookies: ' + err.message, 'error');
            hideLoading();
        });
}

// ===================== SELENIUM PAGE =====================

function refreshSeleniumPage() {
    if (!state.sessionId) { showToast('Abra um site primeiro.', 'warning'); return; }
    showLoading();
    apiJSON('/refresh-page', 'POST', { session_id: state.sessionId })
        .then(function(data) {
            if (data.screenshot) {
                updateAllPreviewsBase64(data.screenshot);
            }
            if (data.url) state.siteUrl = data.url;
            if (data.title) state.siteTitle = data.title;
            if (DOM.siteTitle) DOM.siteTitle.textContent = state.siteTitle;
            if (DOM.siteUrl) DOM.siteUrl.textContent = state.siteUrl;
            showToast('Página atualizada!', 'success');
            hideLoading();
        })
        .catch(function(err) {
            showToast('Erro ao atualizar: ' + err.message, 'error');
            hideLoading();
        });
}

function refreshPreview() {
    if (!state.sessionId) { showToast('Abra um site primeiro.', 'warning'); return; }
    apiBlob('/screenshot', 'POST', { session_id: state.sessionId })
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
            var url = URL.createObjectURL(blob);
            updateAllPreviews(url);
            showToast('Preview atualizado!', 'success');
        })
        .catch(function(err) {
            showToast('Erro ao atualizar: ' + err.message, 'error');
        });
}

// ===================== AUTO-LOGIN =====================

function autoLogin() {
    if (!state.sessionId) { showToast('Abra um site primeiro.', 'warning'); return; }

    var email = '';
    var password = '';
    if (DOM.autoLoginEmail) email = DOM.autoLoginEmail.value.trim();
    if (DOM.autoLoginPassword) password = DOM.autoLoginPassword.value.trim();

    if (!email || !password) {
        showToast('Preencha email e senha.', 'warning');
        return;
    }

    showLoading();

    apiJSON('/auto-login', 'POST', {
        session_id: state.sessionId,
        email: email,
        password: password
    })
        .then(function(data) {
            if (data.screenshot) {
                updateAllPreviewsBase64(data.screenshot);
            }

            if (data.login_success) {
                if (DOM.loginStatus) {
                    DOM.loginStatus.textContent = 'Login realizado com sucesso!';
                    DOM.loginStatus.className = 'login-status success';
                }
                showToast('Login realizado!', 'success');
            } else if (data.url_changed) {
                if (DOM.loginStatus) {
                    DOM.loginStatus.textContent = 'URL mudou - verifique o preview';
                    DOM.loginStatus.className = 'login-status warning';
                }
                showToast('URL mudou após login. Verifique o preview.', 'info');
            } else {
                if (DOM.loginStatus) {
                    DOM.loginStatus.textContent = 'Login pode não ter funcionado';
                    DOM.loginStatus.className = 'login-status error';
                }
                showToast('Login enviado, mas resultado incerto. Verifique o preview.', 'warning');
            }

            if (data.final_url) state.siteUrl = data.final_url;
            if (data.final_title) state.siteTitle = data.final_title;
            if (DOM.siteTitle) DOM.siteTitle.textContent = state.siteTitle;
            if (DOM.siteUrl) DOM.siteUrl.textContent = state.siteUrl;

            var steps = [];
            if (data.login_button_clicked) steps.push('Botão login clicado');
            if (data.email_filled) steps.push('Email preenchido');
            if (data.password_filled) steps.push('Senha preenchida');
            if (data.submit_clicked) steps.push('Submit clicado');
            if (steps.length > 0) {
                console.log('Auto-login steps:', steps.join(', '));
            }

            hideLoading();
        })
        .catch(function(err) {
            showToast('Erro no auto-login: ' + err.message, 'error');
            hideLoading();
        });
}

function toggleAutoLoginPassword() {
    if (!DOM.autoLoginPassword) return;
    var type = DOM.autoLoginPassword.type === 'password' ? 'text' : 'password';
    DOM.autoLoginPassword.type = type;
}

function finishLogin() {
    closeInteraction();
    refreshPreview();
    showToast('Painel de login fechado.', 'info');
}

// ===================== CLICK ON PAGE =====================

function clickOnPage(clickX, clickY) {
    if (!state.sessionId) { showToast('Abra um site primeiro.', 'warning'); return; }

    console.log('Clicking at:', clickX, clickY);

    // Show click indicator
    var container = document.getElementById('livePreviewContainer');
    if (container) {
        var indicator = document.createElement('div');
        indicator.style.cssText = 'position:absolute;width:20px;height:20px;border-radius:50%;background:rgba(255,100,100,0.7);pointer-events:none;transform:translate(-50%,-50%);z-index:100;';

        var liveImg = document.getElementById('livePreviewImg');
        if (liveImg) {
            var rect = liveImg.getBoundingClientRect();
            var contRect = container.getBoundingClientRect();
            var relX = (clickX / 1920) * rect.width + (rect.left - contRect.left);
            var relY = (clickY / 1080) * rect.height + (rect.top - contRect.top);
            indicator.style.left = relX + 'px';
            indicator.style.top = relY + 'px';
        }

        container.appendChild(indicator);
        setTimeout(function() { indicator.remove(); }, 1000);
    }

    apiJSON('/click-element', 'POST', {
        session_id: state.sessionId,
        x: clickX,
        y: clickY
    })
        .then(function(data) {
            if (data.screenshot) {
                updateAllPreviewsBase64(data.screenshot);
            }

            // Show element info
            var infoEl = document.getElementById('elementInfo');
            if (infoEl && data.clicked) {
                var info = '';
                if (data.clicked.tagName) info += '<' + data.clicked.tagName + '> ';
                if (data.clicked.id) info += '#' + data.clicked.id + ' ';
                if (data.clicked.text) info += '"' + data.clicked.text.substring(0, 50) + '" ';
                if (data.clicked.type) info += '[type=' + data.clicked.type + '] ';
                if (data.clicked.href) info += '→ ' + data.clicked.href.substring(0, 60);
                infoEl.textContent = info || 'Clicado em (' + clickX + ', ' + clickY + ')';
                infoEl.style.display = 'block';
            }

            if (data.url) {
                state.siteUrl = data.url;
                if (DOM.siteUrl) DOM.siteUrl.textContent = data.url;
            }
            if (data.title) {
                state.siteTitle = data.title;
                if (DOM.siteTitle) DOM.siteTitle.textContent = data.title;
            }

            console.log('Click result:', data);
        })
        .catch(function(err) {
            showToast('Erro ao clicar: ' + err.message, 'error');
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
        .then(function(data) {
            if (data.screenshot) {
                updateAllPreviewsBase64(data.screenshot);
            }

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

            // Clear input after typing
            var remoteInput = document.getElementById('remoteTextInput');
            if (remoteInput) remoteInput.value = '';
        })
        .catch(function(err) {
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

            if (DOM.backupProgressFill) DOM.backupProgressFill.style.width = '100%';
            if (DOM.backupProgressText) DOM.backupProgressText.textContent = 'Backup concluído!';

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
    showToast('Resultados de erros limpos.', 'info');
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
    showToast('Resultados de busca limpos.', 'info');
}

// ===================== EVENT LISTENERS =====================

function setupEventListeners() {
    console.log('Setting up event listeners...');

    // Auth
    if (DOM.btnAuth) DOM.btnAuth.addEventListener('click', function() { authenticate(); });
    if (DOM.authTokenInput) DOM.authTokenInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') authenticate(); });
    if (DOM.btnTogglePassword) DOM.btnTogglePassword.addEventListener('click', function() { togglePasswordVisibility(); });
    if (DOM.btnLogout) DOM.btnLogout.addEventListener('click', function() { logout(); });

    // Open site
    if (DOM.btnOpen) DOM.btnOpen.addEventListener('click', function() { openSite(); });
    if (DOM.urlInput) DOM.urlInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') openSite(); });

    // Site actions
    if (DOM.btnScreenshot) DOM.btnScreenshot.addEventListener('click', function() { takeScreenshot(); });
    if (DOM.btnLogin) DOM.btnLogin.addEventListener('click', function() { openInteraction(); });
    if (DOM.btnScroll) DOM.btnScroll.addEventListener('click', function() { scrollPage('down'); });
    if (DOM.btnClose) DOM.btnClose.addEventListener('click', function() { closeSession(); });

    // Scroll buttons (inside interaction panel)
    var btnScrollUp2 = document.getElementById('btnScrollUp2');
    var btnScrollDown2 = document.getElementById('btnScrollDown2');
    if (btnScrollUp2) btnScrollUp2.addEventListener('click', function() { scrollPage('up'); });
    if (btnScrollDown2) btnScrollDown2.addEventListener('click', function() { scrollPage('down'); });
    if (DOM.btnScrollUp) DOM.btnScrollUp.addEventListener('click', function() { scrollPage('up'); });
    if (DOM.btnScrollDown) DOM.btnScrollDown.addEventListener('click', function() { scrollPage('down'); });

    // Interaction overlay
    if (DOM.btnCloseInteract) DOM.btnCloseInteract.addEventListener('click', function() { closeInteraction(); });
    if (DOM.btnAutoLogin) DOM.btnAutoLogin.addEventListener('click', function() { autoLogin(); });
    if (DOM.btnToggleAutoLoginPassword) DOM.btnToggleAutoLoginPassword.addEventListener('click', function() { toggleAutoLoginPassword(); });

    // Site tools
    if (DOM.btnOpenSiteTab) DOM.btnOpenSiteTab.addEventListener('click', function() { openSiteInNewTab(); });
    if (DOM.btnCopyCommand) DOM.btnCopyCommand.addEventListener('click', function() { copyCommandToClipboard(); });
    if (DOM.btnSyncCookies) DOM.btnSyncCookies.addEventListener('click', function() { syncCookies(); });
    if (DOM.btnGetSeleniumCookies) DOM.btnGetSeleniumCookies.addEventListener('click', function() { getSeleniumCookies(); });

    var btnRefreshSelenium = document.getElementById('btnRefreshSelenium');
    if (btnRefreshSelenium) btnRefreshSelenium.addEventListener('click', function() { refreshSeleniumPage(); });
    if (DOM.btnRefreshPreview) DOM.btnRefreshPreview.addEventListener('click', function() { refreshPreview(); });

    // Live preview click
    var livePreviewContainer = document.getElementById('livePreviewContainer');
    var livePreviewImg = document.getElementById('livePreviewImg');
    if (livePreviewContainer && livePreviewImg) {
        livePreviewContainer.addEventListener('click', function(e) {
            if (!state.sessionId) { showToast('Abra um site primeiro.', 'warning'); return; }
            var rect = livePreviewImg.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) { showToast('Preview nao carregado.', 'warning'); return; }
            var scaleX = 1920 / rect.width;
            var scaleY = 1080 / rect.height;
            var realX = Math.round((e.clientX - rect.left) * scaleX);
            var realY = Math.round((e.clientY - rect.top) * scaleY);
            console.log('Click at:', realX, realY);
            clickOnPage(realX, realY);
        });
    }

    // Remote typing
    var btnRemoteType = document.getElementById('btnRemoteType');
    var btnRemoteEnter = document.getElementById('btnRemoteEnter');
    var remoteTextInput = document.getElementById('remoteTextInput');
    if (btnRemoteType) btnRemoteType.addEventListener('click', function() { if (!remoteTextInput || !remoteTextInput.value) { showToast('Digite algo.', 'warning'); return; } typeOnPage(remoteTextInput.value, false); });
    if (btnRemoteEnter) btnRemoteEnter.addEventListener('click', function() { if (!remoteTextInput) return; typeOnPage(remoteTextInput.value, true); });
    if (remoteTextInput) remoteTextInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') { e.preventDefault(); typeOnPage(remoteTextInput.value, true); } });

    // Remote keys
    var btnRemoteTab = document.getElementById('btnRemoteTab');
    var btnRemoteEsc = document.getElementById('btnRemoteEsc');
    var btnRemoteBack = document.getElementById('btnRemoteBack');
    var btnRemoteForward = document.getElementById('btnRemoteForward');
    if (btnRemoteTab) btnRemoteTab.addEventListener('click', function() { if (!state.sessionId) return; apiJSON('/type-text', 'POST', { session_id: state.sessionId, text: '\uE004', press_enter: false, clear_first: false }).then(function(d) { if (d.screenshot) updateAllPreviewsBase64(d.screenshot); showToast('Tab enviado!', 'info'); }).catch(function(e) { showToast('Erro: ' + e.message, 'error'); }); });
    if (btnRemoteEsc) btnRemoteEsc.addEventListener('click', function() { if (!state.sessionId) return; apiJSON('/type-text', 'POST', { session_id: state.sessionId, text: '\uE00C', press_enter: false, clear_first: false }).then(function(d) { if (d.screenshot) updateAllPreviewsBase64(d.screenshot); showToast('Esc enviado!', 'info'); }).catch(function(e) { showToast('Erro: ' + e.message, 'error'); }); });
    if (btnRemoteBack) btnRemoteBack.addEventListener('click', function() { if (!state.sessionId) return; apiJSON('/navigate', 'POST', { session_id: state.sessionId, url: 'javascript:history.back()' }).then(function() { setTimeout(refreshPreview, 500); }).catch(function() { setTimeout(refreshPreview, 500); }); });
    if (btnRemoteForward) btnRemoteForward.addEventListener('click', function() { if (!state.sessionId) return; apiJSON('/navigate', 'POST', { session_id: state.sessionId, url: 'javascript:history.forward()' }).then(function() { setTimeout(refreshPreview, 500); }).catch(function() { setTimeout(refreshPreview, 500); }); });

    // Login panel buttons
    var btnLoginCancel = document.getElementById('btnLoginCancel');
    var btnLoginDone = document.getElementById('btnLoginDone');
    if (btnLoginCancel) btnLoginCancel.addEventListener('click', function() { closeInteraction(); });
    if (btnLoginDone) btnLoginDone.addEventListener('click', function() { finishLogin(); });

    // Dashboard modules
    if (DOM.btnBackup) DOM.btnBackup.addEventListener('click', function() { backupSite(); });
    if (DOM.btnCheckErrors) DOM.btnCheckErrors.addEventListener('click', function() { checkErrors(); });
    if (DOM.btnSearch) DOM.btnSearch.addEventListener('click', function() { searchSite(); });

    // Download and clear
    if (DOM.btnDownloadErrors) DOM.btnDownloadErrors.addEventListener('click', function() { downloadErrorReport(); });
    if (DOM.btnDownloadSearch) DOM.btnDownloadSearch.addEventListener('click', function() { downloadSearchReport(); });
    if (DOM.btnClearErrors) DOM.btnClearErrors.addEventListener('click', function() { clearErrorResults(); });
    if (DOM.btnClearSearch) DOM.btnClearSearch.addEventListener('click', function() { clearSearchResults(); });

    console.log('All event listeners registered.');
}

// ===================== INITIALIZATION =====================

async function init() {
    console.log('Initializing...');

    // Load backend URL
    try {
        if (typeof BACKEND_CONFIG !== 'undefined' && BACKEND_CONFIG && BACKEND_CONFIG.BACKEND_URL) {
            state.backendUrl = BACKEND_CONFIG.BACKEND_URL.replace(/\/+$/, '');
            console.log('Backend URL:', state.backendUrl);
        } else {
            var cr = await fetch('config.js');
            var ct = await cr.text();
            var um = ct.match(/BACKEND_URL\s*[:=]\s*['"]([^'"]+)['"]/);
            if (um && um[1]) {
                state.backendUrl = um[1].replace(/\/+$/, '');
            } else {
                var hm = ct.match(/(https:\/\/[^\s'"]+\.hf\.space)/);
                if (hm) state.backendUrl = hm[1].replace(/\/+$/, '');
            }
            if (!state.backendUrl) {
                showToast('Backend URL nao encontrada no config.js', 'error');
                return;
            }
            console.log('Backend URL:', state.backendUrl);
        }
    } catch (e) {
        showToast('Erro ao carregar config: ' + e.message, 'error');
        return;
    }

    // Check server
    try {
        var sr = await fetch(state.backendUrl + '/');
        var sd = await sr.json();
        console.log('Server status:', sd);
        updateServerStatus(true);
        showToast('Servidor conectado!', 'success');

        // Check auth
        if (sd.auth_required === true) {
            var tk = localStorage.getItem('backup_auth_token');
            if (tk) {
                try {
                    var vr = await fetch(state.backendUrl + '/auth/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + tk },
                        body: '{}'
                    });
                    if (vr.ok) {
                        state.token = tk;
                        hideAuthModal();
                        updateSessionBadge(true);
                    } else {
                        localStorage.removeItem('backup_auth_token');
                        showAuthModal();
                    }
                } catch (ve) {
                    localStorage.removeItem('backup_auth_token');
                    showAuthModal();
                }
            } else {
                showAuthModal();
            }
        } else {
            hideAuthModal();
            updateSessionBadge(true);
        }
    } catch (e) {
        updateServerStatus(false);
        showToast('Servidor offline ou inacessivel.', 'error');
    }

    // Check extension
    try { await checkExtension(); } catch (e) {}

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

