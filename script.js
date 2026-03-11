// ============================================================
// Site Backup & Error Checker - Frontend v1.3.0
// ============================================================

(function () {
    'use strict';

    // ===================== EXTENSION ID =====================
    // Após instalar a extensão, copie o ID dela e cole aqui
    // chrome://extensions → copie o ID da extensão "Site Backup - Cookie Sync"
    var EXTENSION_ID = '';

    // Tentar carregar do config.js
    if (typeof BACKEND_CONFIG !== 'undefined' && BACKEND_CONFIG.EXTENSION_ID) {
        EXTENSION_ID = BACKEND_CONFIG.EXTENSION_ID;
    }

    // ===================== STATE =====================
    const state = {
        backendUrl: '',
        token: '',
        sessionId: null,
        siteUrl: '',
        siteTitle: '',
        isConnected: false,
        isAuthenticated: false,
        extensionInstalled: false,
        lastErrorReport: null,
        lastSearchReport: null
    };

    // ===================== DOM ELEMENTS =====================
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

        // Modules
        backupFolder: document.getElementById('backupFolder'),
        btnBackup: document.getElementById('btnBackup'),
        backupProgress: document.getElementById('backupProgress'),
        backupProgressFill: document.getElementById('backupProgressFill'),
        backupProgressText: document.getElementById('backupProgressText'),

        errorsFolder: document.getElementById('errorsFolder'),
        btnErrors: document.getElementById('btnErrors'),
        errorsProgress: document.getElementById('errorsProgress'),
        errorsProgressFill: document.getElementById('errorsProgressFill'),
        errorsProgressText: document.getElementById('errorsProgressText'),

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

        // Toast & Loading
        toastContainer: document.getElementById('toastContainer'),
        loadingOverlay: document.getElementById('loadingOverlay'),
        loadingText: document.getElementById('loadingText'),
        loadingSubtext: document.getElementById('loadingSubtext')
    };
}

    // ===================== UTILITIES =====================
    function showToast(message, type, duration) {
        type = type || 'info';
        duration = duration || 4000;
        var toast = document.createElement('div');
        toast.className = 'toast toast-' + type;
        toast.textContent = message;
        DOM.toastContainer.appendChild(toast);
        setTimeout(function () {
            toast.style.animationDelay = '0s';
            toast.style.animation = 'toastOut 0.3s ease forwards';
            setTimeout(function () { toast.remove(); }, 300);
        }, duration);
    }

    function showLoading(text, subtext) {
        DOM.loadingText.textContent = text || 'Processando...';
        DOM.loadingSubtext.textContent = subtext || '';
        DOM.loadingOverlay.style.display = 'flex';
    }

    function hideLoading() {
        DOM.loadingOverlay.style.display = 'none';
    }

    function updateServerStatus(status, text) {
        DOM.serverStatus.className = 'server-status ' + status;
        DOM.serverStatus.querySelector('span').textContent = text;
    }

    function updateSessionBadge(show, text) {
        DOM.sessionBadge.style.display = show ? 'flex' : 'none';
        DOM.sessionBadgeText.textContent = text || 'Sessão ativa';
    }

    function updateModuleButtons(enabled) {
        DOM.btnBackup.disabled = !enabled;
        DOM.btnErrors.disabled = !enabled;
        DOM.btnSearch.disabled = !enabled;
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
        return new Promise(function (resolve) {
            containerEl.style.display = 'flex';
            var i = 0;
            var interval = setInterval(function () {
                if (i < steps.length) {
                    fillEl.style.width = steps[i].percent + '%';
                    textEl.textContent = steps[i].percent + '%';
                    i++;
                } else {
                    clearInterval(interval);
                    resolve();
                }
            }, 600);
        });
    }

    function escapeHTML(str) {
        if (!str) return '';
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    // ===================== API HELPERS =====================
    async function apiRequest(endpoint, method, body, isBlob) {
        method = method || 'GET';
        isBlob = isBlob || false;
        var url = state.backendUrl + endpoint;
        var headers = {};

        if (state.token) {
            headers['Authorization'] = 'Bearer ' + state.token;
        }

        var options = { method: method, headers: headers };

        if (body) {
            headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(body);
        }

        var controller = new AbortController();
        var timeoutMs = (typeof BACKEND_CONFIG !== 'undefined' && BACKEND_CONFIG.REQUEST_TIMEOUT) ? BACKEND_CONFIG.REQUEST_TIMEOUT : 120000;
        var timeout = setTimeout(function () { controller.abort(); }, timeoutMs);
        options.signal = controller.signal;

        try {
            var response = await fetch(url, options);
            clearTimeout(timeout);

            if (!response.ok) {
                var errorMsg = 'Erro ' + response.status;
                try {
                    var errData = await response.json();
                    errorMsg = errData.detail || errorMsg;
                } catch (e) { }
                throw new Error(errorMsg);
            }

            if (isBlob) {
                return response;
            }

            return await response.json();
        } catch (err) {
            clearTimeout(timeout);
            if (err.name === 'AbortError') {
                throw new Error('Timeout: o servidor demorou para responder.');
            }
            throw err;
        }
    }

    async function apiJSON(endpoint, method, body) {
        return apiRequest(endpoint, method, body, false);
    }

    async function apiBlob(endpoint, method, body) {
        return apiRequest(endpoint, method, body, true);
    }

    // ===================== EXTENSION COMMUNICATION =====================
    function checkExtension() {
        return new Promise(function (resolve) {
            if (!EXTENSION_ID) {
                resolve(false);
                return;
            }

            try {
                chrome.runtime.sendMessage(EXTENSION_ID, { action: 'ping' }, function (response) {
                    if (chrome.runtime.lastError || !response) {
                        resolve(false);
                        return;
                    }
                    if (response.success) {
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                });
            } catch (e) {
                resolve(false);
            }
        });
    }

    function getCookiesFromExtension(url) {
        return new Promise(function (resolve, reject) {
            if (!EXTENSION_ID) {
                reject(new Error('ID da extensão não configurado. Adicione EXTENSION_ID no config.js'));
                return;
            }

            if (!state.extensionInstalled) {
                reject(new Error('Extensão não detectada. Instale a extensão e recarregue a página.'));
                return;
            }

            try {
                chrome.runtime.sendMessage(EXTENSION_ID, { action: 'getCookiesFromTab', url: url }, function (response) {
                    if (chrome.runtime.lastError) {
                        reject(new Error('Erro na comunicação com a extensão: ' + chrome.runtime.lastError.message));
                        return;
                    }

                    if (!response) {
                        reject(new Error('Sem resposta da extensão. Verifique se está instalada.'));
                        return;
                    }

                    if (response.success) {
                        resolve(response);
                    } else {
                        reject(new Error(response.error || 'Erro ao capturar cookies'));
                    }
                });
            } catch (e) {
                reject(new Error('Falha ao comunicar com a extensão: ' + e.message));
            }
        });
    }

    // ===================== AUTHENTICATION =====================
    function showAuthModal() {
        DOM.authOverlay.style.display = 'flex';
        DOM.authError.textContent = '';
        DOM.authTokenInput.value = '';
        DOM.authTokenInput.focus();
    }

    function hideAuthModal() {
        DOM.authOverlay.style.display = 'none';
    }

    async function authenticate() {
        var token = DOM.authTokenInput.value.trim();
        if (!token) {
            DOM.authError.textContent = 'Digite o token de acesso.';
            return;
        }

        DOM.btnAuth.disabled = true;
        DOM.authError.textContent = '';

        try {
            if (typeof BACKEND_CONFIG !== 'undefined' && BACKEND_CONFIG.BACKEND_URL) {
                state.backendUrl = BACKEND_CONFIG.BACKEND_URL.replace(/\/+$/, '');
            } else {
                DOM.authError.textContent = 'Erro: config.js não encontrado.';
                DOM.btnAuth.disabled = false;
                return;
            }

            state.token = token;
            var statusResp = await apiJSON('/');

            if (statusResp.auth_required) {
                var authResp = await apiJSON('/auth/verify', 'POST');
                if (!authResp.valid) {
                    DOM.authError.textContent = 'Token inválido.';
                    state.token = '';
                    DOM.btnAuth.disabled = false;
                    return;
                }
            }

            state.isAuthenticated = true;
            state.isConnected = true;
            sessionStorage.setItem('api_token', token);

            hideAuthModal();
            updateServerStatus('online', 'Conectado');
            DOM.btnLogout.style.display = 'flex';
            showToast('Autenticado com sucesso!', 'success');

        } catch (err) {
            DOM.authError.textContent = 'Erro ao conectar: ' + err.message;
            state.token = '';
        }

        DOM.btnAuth.disabled = false;
    }

    function logout() {
        state.token = '';
        state.sessionId = null;
        state.isAuthenticated = false;
        state.isConnected = false;
        state.siteUrl = '';
        state.siteTitle = '';
        state.lastErrorReport = null;
        state.lastSearchReport = null;

        sessionStorage.removeItem('api_token');

        updateServerStatus('', 'Desconectado');
        updateSessionBadge(false);
        updateModuleButtons(false);

        DOM.siteStatus.style.display = 'none';
        DOM.screenshotPreview.style.display = 'none';
        DOM.errorResultsSection.style.display = 'none';
        DOM.searchResultsSection.style.display = 'none';
        DOM.btnLogout.style.display = 'none';

        showAuthModal();
        showToast('Sessão encerrada.', 'info');
    }

    function togglePasswordVisibility() {
        var input = DOM.authTokenInput;
        input.type = input.type === 'password' ? 'text' : 'password';
    }

    // ===================== CORE ACTIONS =====================

    async function openSite() {
        var url = DOM.urlInput.value.trim();
        if (!url) {
            showToast('Digite uma URL para abrir.', 'warning');
            return;
        }

        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        showLoading('Abrindo site...', url);
        DOM.btnOpen.disabled = true;

        try {
            var data = await apiJSON('/open', 'POST', { url: url });

            state.sessionId = data.session_id;
            state.siteUrl = data.url;
            state.siteTitle = data.title || 'Sem título';

            DOM.siteTitle.textContent = state.siteTitle;
            DOM.siteUrl.textContent = state.siteUrl;
            DOM.siteStatusText.textContent = 'Carregado';
            DOM.siteStatus.style.display = 'flex';

            updateSessionBadge(true, 'Sessão: ' + state.sessionId.substring(0, 8) + '...');
            updateModuleButtons(true);

            showToast('Site aberto com sucesso!', 'success');

        } catch (err) {
            showToast('Erro ao abrir site: ' + err.message, 'error');
        }

        DOM.btnOpen.disabled = false;
        hideLoading();
    }

    async function takeScreenshot() {
        if (!state.sessionId) {
            showToast('Nenhuma sessão ativa.', 'warning');
            return;
        }

        DOM.btnScreenshot.disabled = true;

        try {
            var response = await apiBlob('/screenshot', 'POST', {
                session_id: state.sessionId
            });
            var blob = await response.blob();
            var imgUrl = URL.createObjectURL(blob);
            DOM.screenshotImg.src = imgUrl;
            DOM.screenshotPreview.style.display = 'block';
            showToast('Screenshot capturado!', 'success');
        } catch (err) {
            showToast('Erro ao capturar screenshot: ' + err.message, 'error');
        }

        DOM.btnScreenshot.disabled = false;
    }

    async function closeSession() {
        if (!state.sessionId) return;

        showLoading('Fechando sessão...');

        try {
            await apiJSON('/close', 'POST', { session_id: state.sessionId });

            state.sessionId = null;
            state.siteUrl = '';
            state.siteTitle = '';

            DOM.siteStatus.style.display = 'none';
            DOM.screenshotPreview.style.display = 'none';
            updateSessionBadge(false);
            updateModuleButtons(false);

            showToast('Sessão encerrada.', 'info');
        } catch (err) {
            showToast('Erro ao fechar sessão: ' + err.message, 'error');
        }

        hideLoading();
    }

    // ===================== INTERACTION / LOGIN =====================

    async function openInteraction() {
        if (!state.sessionId) {
            showToast('Nenhuma sessão ativa.', 'warning');
            return;
        }

        resetLoginSteps();
        DOM.interactOverlay.style.display = 'flex';

        var stepUrl = document.getElementById('stepSiteUrl');
        if (stepUrl) {
            stepUrl.textContent = state.siteUrl;
        }

        // Verificar extensão
        var extStatus = document.getElementById('extensionStatus');
        if (extStatus) {
            extStatus.innerHTML = '<div class="extension-checking">' +
                '<div class="loading-spinner" style="width:20px;height:20px;border-width:2px;margin:0;"></div>' +
                '<span>Verificando extensão...</span>' +
                '</div>';
        }

        try {
            var installed = await checkExtension();
            state.extensionInstalled = installed;

            if (extStatus) {
                if (installed) {
                    extStatus.innerHTML = '<div class="extension-ok">' +
                        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2">' +
                        '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>' +
                        '<polyline points="22 4 12 14.01 9 11.01"/>' +
                        '</svg>' +
                        '<span>Extensão detectada! Pronta para sincronizar.</span>' +
                        '</div>';
                } else {
                    extStatus.innerHTML = '<div class="extension-error">' +
                        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">' +
                        '<circle cx="12" cy="12" r="10"/>' +
                        '<line x1="15" y1="9" x2="9" y2="15"/>' +
                        '<line x1="9" y1="9" x2="15" y2="15"/>' +
                        '</svg>' +
                        '<span>Extensão não detectada. Instale a extensão e configure o EXTENSION_ID no config.js</span>' +
                        '</div>';
                }
            }
        } catch (err) {
            state.extensionInstalled = false;
            if (extStatus) {
                extStatus.innerHTML = '<div class="extension-error">' +
                    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">' +
                    '<circle cx="12" cy="12" r="10"/>' +
                    '<line x1="15" y1="9" x2="9" y2="15"/>' +
                    '<line x1="9" y1="9" x2="15" y2="15"/>' +
                    '</svg>' +
                    '<span>Erro ao verificar extensão.</span>' +
                    '</div>';
            }
        }
    }

    function closeInteraction() {
        DOM.interactOverlay.style.display = 'none';
    }

    function resetLoginSteps() {
        var step1 = document.getElementById('loginStep1');
        var step2 = document.getElementById('loginStep2');

        if (step1) { step1.className = 'login-step active'; }
        if (step2) { step2.className = 'login-step'; }

        var loginPreview = document.getElementById('loginPreview');
        if (loginPreview) loginPreview.style.display = 'none';

        var btnDone = document.getElementById('btnLoginDone');
        if (btnDone) btnDone.style.display = 'none';
    }

    function openSiteInNewTab() {
        if (!state.siteUrl) {
            showToast('Nenhum site aberto.', 'warning');
            return;
        }

        window.open(state.siteUrl, '_blank');

        var step1 = document.getElementById('loginStep1');
        var step2 = document.getElementById('loginStep2');

        if (step1) { step1.className = 'login-step done'; }
        if (step2) { step2.className = 'login-step active'; }

        showToast('Site aberto em nova aba. Faça login e volte aqui.', 'info', 6000);
    }

    async function syncCookies() {
        if (!state.sessionId) {
            showToast('Nenhuma sessão ativa.', 'warning');
            return;
        }

        if (!state.extensionInstalled) {
            showToast('Extensão não detectada. Instale a extensão primeiro.', 'error');
            return;
        }

        showLoading('Capturando cookies...', 'Comunicando com a extensão');

        try {
            // Pegar cookies da extensão
            var cookieData = await getCookiesFromExtension(state.siteUrl);

            if (!cookieData.cookies || cookieData.cookies.length === 0) {
                hideLoading();
                showToast('Nenhum cookie encontrado. Verifique se fez login no site.', 'warning');
                return;
            }

            showLoading('Sincronizando cookies...', cookieData.total + ' cookies capturados');

            // Enviar cookies para o backend
            var data = await apiJSON('/inject-cookies', 'POST', {
                session_id: state.sessionId,
                cookies: cookieData.cookies
            });

            hideLoading();

            // Mostrar preview
            var loginPreview = document.getElementById('loginPreview');
            var loginPreviewImg = document.getElementById('loginPreviewImg');
            var loginStatusText = document.getElementById('loginStatusText');

            if (data.screenshot && loginPreviewImg) {
                loginPreviewImg.src = 'data:image/png;base64,' + data.screenshot;
                if (loginPreview) loginPreview.style.display = 'block';
            }

            // Atualizar info da sessão
            if (data.url) {
                state.siteUrl = data.url;
                state.siteTitle = data.title || 'Sem título';
                DOM.siteTitle.textContent = state.siteTitle;
                DOM.siteUrl.textContent = state.siteUrl;
            }

            var injected = data.injected || 0;
            var total = data.total || 0;
            var errors = data.errors || [];

            if (injected > 0) {
                showToast(injected + '/' + total + ' cookies sincronizados!', 'success');

                // Marcar step 2 como done
                var step2 = document.getElementById('loginStep2');
                if (step2) { step2.className = 'login-step done'; }

                if (loginStatusText) {
                    loginStatusText.textContent = 'Cookies sincronizados com sucesso! Verifique a imagem.';
                    loginStatusText.className = 'login-status status-success';
                }

                // Mostrar botão "Pronto"
                var btnDone = document.getElementById('btnLoginDone');
                if (btnDone) btnDone.style.display = 'inline-flex';

            } else {
                showToast('Nenhum cookie foi injetado. Verifique se fez login.', 'error');
                if (loginStatusText) {
                    loginStatusText.textContent = 'Falha ao injetar cookies. Tente novamente.';
                    loginStatusText.className = 'login-status status-failed';
                }
            }

            if (errors.length > 0) {
                showToast(errors.length + ' cookie(s) com erro.', 'warning');
            }

        } catch (err) {
            hideLoading();
            showToast('Erro ao sincronizar: ' + err.message, 'error');
        }
    }

    async function checkLoginState() {
        if (!state.sessionId) return;

        showLoading('Verificando estado...');

        try {
            var data = await apiJSON('/get-current-state', 'POST', {
                session_id: state.sessionId
            });

            hideLoading();

            var loginPreview = document.getElementById('loginPreview');
            var loginPreviewImg = document.getElementById('loginPreviewImg');
            var loginStatusText = document.getElementById('loginStatusText');

            if (data.screenshot && loginPreviewImg) {
                loginPreviewImg.src = 'data:image/png;base64,' + data.screenshot;
                if (loginPreview) loginPreview.style.display = 'block';
            }

            if (data.url) {
                state.siteUrl = data.url;
                state.siteTitle = data.title || 'Sem título';
                DOM.siteTitle.textContent = state.siteTitle;
                DOM.siteUrl.textContent = state.siteUrl;
            }

            if (loginStatusText) {
                if (data.probably_logged_in) {
                    loginStatusText.textContent = 'Login detectado! O site parece estar logado.';
                    loginStatusText.className = 'login-status status-success';

                    var btnDone = document.getElementById('btnLoginDone');
                    if (btnDone) btnDone.style.display = 'inline-flex';

                    showToast('Login detectado com sucesso!', 'success');
                } else {
                    loginStatusText.textContent = 'Login não detectado. Tente sincronizar novamente.';
                    loginStatusText.className = 'login-status status-uncertain';
                    showToast('Login não detectado.', 'warning');
                }
            }

        } catch (err) {
            hideLoading();
            showToast('Erro ao verificar estado: ' + err.message, 'error');
        }
    }

    function finishLogin() {
        closeInteraction();
        showToast('Login concluído! Agora pode usar Backup, Erros e Busca.', 'success', 5000);
    }

    // ===================== BACKUP =====================

    async function backupSite() {
        if (!state.sessionId) {
            showToast('Nenhuma sessão ativa.', 'warning');
            return;
        }

        var folder = DOM.backupFolder.value.trim() || 'backup';
        DOM.btnBackup.disabled = true;

        var steps = [
            { percent: 10 }, { percent: 25 }, { percent: 40 },
            { percent: 55 }, { percent: 70 }, { percent: 85 }
        ];

        simulateProgress(DOM.backupProgressFill, DOM.backupProgressText, DOM.backupProgress, steps);

        try {
            var response = await apiBlob('/backup', 'POST', {
                session_id: state.sessionId,
                folder_name: folder
            });

            DOM.backupProgressFill.style.width = '100%';
            DOM.backupProgressText.textContent = '100%';

            var blob = await response.blob();

            var filename = folder + '_backup.zip';
            var disposition = response.headers.get('Content-Disposition');
            if (disposition) {
                var match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (match && match[1]) {
                    filename = match[1].replace(/['"]/g, '');
                }
            }

            downloadBlob(blob, filename);
            showToast('Backup realizado com sucesso!', 'success');

            var backupErrors = response.headers.get('X-Backup-Errors');
            if (backupErrors && parseInt(backupErrors) > 0) {
                showToast('Backup concluído com ' + backupErrors + ' aviso(s).', 'warning');
            }

        } catch (err) {
            showToast('Erro no backup: ' + err.message, 'error');
        }

        DOM.btnBackup.disabled = false;
        setTimeout(function () {
            DOM.backupProgress.style.display = 'none';
            DOM.backupProgressFill.style.width = '0%';
            DOM.backupProgressText.textContent = '0%';
        }, 2000);
    }

    // ===================== ERROR CHECK =====================

    async function checkErrors() {
        if (!state.sessionId) {
            showToast('Nenhuma sessão ativa.', 'warning');
            return;
        }

        var folder = DOM.errorsFolder.value.trim() || 'erros';
        DOM.btnErrors.disabled = true;

        var steps = [
            { percent: 10 }, { percent: 20 }, { percent: 35 },
            { percent: 50 }, { percent: 65 }, { percent: 80 }, { percent: 90 }
        ];

        simulateProgress(DOM.errorsProgressFill, DOM.errorsProgressText, DOM.errorsProgress, steps);

        try {
            var data = await apiJSON('/check-errors-json', 'POST', {
                session_id: state.sessionId,
                folder_name: folder
            });

            DOM.errorsProgressFill.style.width = '100%';
            DOM.errorsProgressText.textContent = '100%';

            state.lastErrorReport = data;
            displayErrorResults(data);

            var totalE = data.total_errors || 0;
            var totalW = data.total_warnings || 0;

            if (totalE === 0 && totalW === 0) {
                showToast('Nenhum erro encontrado!', 'success');
            } else {
                showToast('Encontrados: ' + totalE + ' erro(s) e ' + totalW + ' aviso(s).', totalE > 0 ? 'error' : 'warning');
            }

        } catch (err) {
            showToast('Erro na verificação: ' + err.message, 'error');
        }

        DOM.btnErrors.disabled = false;
        setTimeout(function () {
            DOM.errorsProgress.style.display = 'none';
            DOM.errorsProgressFill.style.width = '0%';
            DOM.errorsProgressText.textContent = '0%';
        }, 2000);
    }

    async function downloadErrorReport() {
        if (!state.sessionId) {
            showToast('Nenhuma sessão ativa.', 'warning');
            return;
        }

        var folder = DOM.errorsFolder.value.trim() || 'erros';

        try {
            var response = await apiBlob('/check-errors', 'POST', {
                session_id: state.sessionId,
                folder_name: folder
            });

            var blob = await response.blob();

            var filename = folder + '_erros.txt';
            var disposition = response.headers.get('Content-Disposition');
            if (disposition) {
                var match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (match && match[1]) {
                    filename = match[1].replace(/['"]/g, '');
                }
            }

            downloadBlob(blob, filename);
            showToast('Relatório de erros baixado!', 'success');
        } catch (err) {
            showToast('Erro ao baixar relatório: ' + err.message, 'error');
        }
    }

    // ===================== SEARCH =====================

    async function searchSite() {
        if (!state.sessionId) {
            showToast('Nenhuma sessão ativa.', 'warning');
            return;
        }

        var term = DOM.searchTerm.value.trim();
        if (!term) {
            showToast('Digite o que deseja buscar.', 'warning');
            return;
        }

        var folder = DOM.searchFolder.value.trim() || 'busca';
        DOM.btnSearch.disabled = true;

        var steps = [
            { percent: 15 }, { percent: 30 }, { percent: 50 },
            { percent: 70 }, { percent: 85 }
        ];

        simulateProgress(DOM.searchProgressFill, DOM.searchProgressText, DOM.searchProgress, steps);

        try {
            var data = await apiJSON('/search-site', 'POST', {
                session_id: state.sessionId,
                term: term,
                folder_name: folder
            });

            DOM.searchProgressFill.style.width = '100%';
            DOM.searchProgressText.textContent = '100%';

            state.lastSearchReport = data;
            displaySearchResults(data);

            var total = data.total_found || 0;
            if (total === 0) {
                showToast('Nenhum resultado encontrado para "' + term + '".', 'info');
            } else {
                showToast('Encontrados ' + total + ' resultado(s) para "' + term + '".', 'success');
            }

        } catch (err) {
            showToast('Erro na busca: ' + err.message, 'error');
        }

        DOM.btnSearch.disabled = false;
        setTimeout(function () {
            DOM.searchProgress.style.display = 'none';
            DOM.searchProgressFill.style.width = '0%';
            DOM.searchProgressText.textContent = '0%';
        }, 2000);
    }

    async function downloadSearchReport() {
        if (!state.sessionId) {
            showToast('Nenhuma sessão ativa.', 'warning');
            return;
        }

        var term = DOM.searchTerm.value.trim() || 'busca';
        var folder = DOM.searchFolder.value.trim() || 'busca';

        try {
            var response = await apiBlob('/search-site-txt', 'POST', {
                session_id: state.sessionId,
                term: term,
                folder_name: folder
            });

            var blob = await response.blob();

            var filename = folder + '_' + term + '.txt';
            var disposition = response.headers.get('Content-Disposition');
            if (disposition) {
                var match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (match && match[1]) {
                    filename = match[1].replace(/['"]/g, '');
                }
            }

            downloadBlob(blob, filename);
            showToast('Relatório de busca baixado!', 'success');
        } catch (err) {
            showToast('Erro ao baixar relatório: ' + err.message, 'error');
        }
    }

// ===================== DISPLAY ERROR RESULTS =====================
const categoryLabels = {
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
        if (item.toLowerCase().includes('error')) return 'error';
        if (item.toLowerCase().includes('warning') || item.toLowerCase().includes('aviso')) return 'warning';
        return 'info';
    }
    if (item.level) return item.level.toLowerCase();
    if (item.severity) return item.severity.toLowerCase();
    if (item.type) {
        const t = item.type.toLowerCase();
        if (t.includes('error')) return 'error';
        if (t.includes('warning')) return 'warning';
    }
    return 'info';
}

function displayErrorResults(data) {
    if (!data || !data.details) {
        showToast('Nenhum dado de erro para exibir.', 'warning');
        return;
    }

    DOM.errorResultsSection.style.display = 'block';

    const totalErrors = data.total_errors || 0;
    const totalWarnings = data.total_warnings || 0;
    const totalErrorsEl = document.getElementById('totalErrors');
    const totalWarningsEl = document.getElementById('totalWarnings');
    if (totalErrorsEl) totalErrorsEl.textContent = totalErrors;
    if (totalWarningsEl) totalWarningsEl.textContent = totalWarnings;

    const details = data.details;
    const categories = Object.keys(details).filter(k => {
        const items = details[k];
        return Array.isArray(items) && items.length > 0;
    });

    // Create tabs
    const tabsContainer = DOM.errorResultsSection.querySelector('.result-tabs') || document.createElement('div');
    tabsContainer.className = 'result-tabs';
    tabsContainer.innerHTML = '';

    // "All" tab
    const allTab = document.createElement('button');
    allTab.className = 'result-tab active';
    allTab.dataset.tab = 'all';
    let totalItems = 0;
    categories.forEach(c => { totalItems += details[c].length; });
    allTab.textContent = `Todos (${totalItems})`;
    tabsContainer.appendChild(allTab);

    categories.forEach(cat => {
        const tab = document.createElement('button');
        tab.className = 'result-tab';
        tab.dataset.tab = cat;
        const label = categoryLabels[cat] || cat;
        tab.textContent = `${label} (${details[cat].length})`;
        tabsContainer.appendChild(tab);
    });

    // Insert tabs if not already in DOM
    const existingTabs = DOM.errorResultsSection.querySelector('.result-tabs');
    if (existingTabs) {
        existingTabs.replaceWith(tabsContainer);
    } else {
        DOM.errorsContent.parentNode.insertBefore(tabsContainer, DOM.errorsContent);
    }

    // Render "All" tab initially
    renderErrorsTab('all', details, categories);

    // Tab click listeners
    tabsContainer.querySelectorAll('.result-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            tabsContainer.querySelectorAll('.result-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const selectedTab = tab.dataset.tab;
            if (selectedTab === 'all') {
                renderErrorsTab('all', details, categories);
            } else {
                renderErrorsTab(selectedTab, details, [selectedTab]);
            }
        });
    });
}

function renderErrorsTab(tab, details, categories) {
    DOM.errorsContent.innerHTML = '';

    let hasItems = false;
    categories.forEach(cat => {
        if (details[cat] && details[cat].length > 0) {
            hasItems = true;
        }
    });

    if (!hasItems) {
        DOM.errorsContent.innerHTML = '<div class="no-results">Nenhum erro encontrado! O site parece estar limpo.</div>';
        return;
    }

    categories.forEach(cat => {
        if (details[cat] && details[cat].length > 0) {
            const block = createErrorCategoryBlock(cat, details[cat]);
            DOM.errorsContent.appendChild(block);
        }
    });
}

function createErrorCategoryBlock(category, items) {
    const block = document.createElement('div');
    block.className = 'error-category-block';

    const title = document.createElement('div');
    title.className = 'error-category-title';
    const label = categoryLabels[category] || category;
    title.innerHTML = `<strong>${escapeHTML(label)}</strong> <span class="error-count">(${items.length})</span>`;
    block.appendChild(title);

    const list = document.createElement('div');
    list.className = 'error-list';

    items.forEach(item => {
        const entry = document.createElement('div');
        const level = getErrorLevel(item);
        entry.className = `error-item level-${level}`;

        const message = extractErrorMessage(item);
        let html = `<span class="error-level">${level.toUpperCase()}</span> ${message}`;

        if (typeof item === 'object') {
            if (item.source) html += `<div class="error-source">Fonte: ${escapeHTML(item.source)}</div>`;
            if (item.url) html += `<div class="error-source">URL: ${escapeHTML(item.url)}</div>`;
            if (item.line) html += `<div class="error-source">Linha: ${item.line}</div>`;
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

    DOM.searchResultsSection.style.display = 'block';

    const findings = data.findings;
    const totalFound = data.total_found || 0;
    const categoriesSet = new Set(findings.map(f => f.category));

    const totalFoundEl = document.getElementById('totalFound');
    const totalCategoriesEl = document.getElementById('totalCategories');
    if (totalFoundEl) totalFoundEl.textContent = totalFound;
    if (totalCategoriesEl) totalCategoriesEl.textContent = categoriesSet.size;

    DOM.searchContent.innerHTML = '';

    if (findings.length === 0) {
        DOM.searchContent.innerHTML = '<div class="no-results">Nenhum resultado encontrado para o termo buscado.</div>';
        return;
    }

    // Group by category
    const grouped = {};
    findings.forEach(f => {
        const cat = f.category || 'Outros';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(f);
    });

    Object.keys(grouped).forEach(cat => {
        const block = document.createElement('div');
        block.className = 'search-category-block';

        const title = document.createElement('div');
        title.className = 'search-category-title';
        title.innerHTML = `<strong>${escapeHTML(cat)}</strong> <span class="search-count">(${grouped[cat].length})</span>`;
        block.appendChild(title);

        const list = document.createElement('div');
        list.className = 'search-list';

        grouped[cat].forEach(item => {
            const entry = document.createElement('div');
            entry.className = 'search-item';

            let html = '';
            if (item.type) html += `<span class="search-type">${escapeHTML(item.type)}</span> `;
            if (item.value) html += `<span class="search-value">${escapeHTML(item.value)}</span>`;
            if (item.details) html += `<div class="search-details">${escapeHTML(item.details)}</div>`;

            entry.innerHTML = html;
            list.appendChild(entry);
        });

        block.appendChild(list);
        DOM.searchContent.appendChild(block);
    });
}

// ===================== EVENT LISTENERS =====================
// Auth
DOM.btnAuth.addEventListener('click', authenticate);
DOM.authTokenInput.addEventListener('keydown', e => { if (e.key === 'Enter') authenticate(); });
DOM.authToggleVisibility.addEventListener('click', togglePasswordVisibility);
DOM.btnLogout.addEventListener('click', logout);

// URL / Site
DOM.btnOpen.addEventListener('click', openSite);
DOM.urlInput.addEventListener('keydown', e => { if (e.key === 'Enter') openSite(); });
DOM.btnScreenshot.addEventListener('click', takeScreenshot);
DOM.btnClose.addEventListener('click', closeSession);

// Interaction / Login
DOM.btnInteract.addEventListener('click', openInteraction);

var btnOpenSiteTab = document.getElementById('btnOpenSiteTab');
if (btnOpenSiteTab) btnOpenSiteTab.addEventListener('click', openSiteInNewTab);

var btnSyncCookies = document.getElementById('btnSyncCookies');
if (btnSyncCookies) btnSyncCookies.addEventListener('click', syncCookies);

var btnCheckExtension = document.getElementById('btnCheckExtension');
if (btnCheckExtension) btnCheckExtension.addEventListener('click', async () => {
    const ok = await checkExtension();
    if (ok) {
        showToast('Extensão detectada e funcionando!', 'success');
    } else {
        showToast('Extensão não detectada. Verifique a instalação.', 'warning');
    }
});

var btnLoginRefresh = document.getElementById('btnLoginRefresh');
if (btnLoginRefresh) btnLoginRefresh.addEventListener('click', checkLoginState);

var btnLoginCancel = document.getElementById('btnLoginCancel');
if (btnLoginCancel) btnLoginCancel.addEventListener('click', closeInteraction);

var btnLoginDone = document.getElementById('btnLoginDone');
if (btnLoginDone) btnLoginDone.addEventListener('click', finishLogin);

// Modules
DOM.btnBackup.addEventListener('click', backupSite);
DOM.btnErrors.addEventListener('click', checkErrors);
DOM.btnSearch.addEventListener('click', searchSite);

// Downloads
DOM.btnDownloadErrors.addEventListener('click', downloadErrorReport);
DOM.btnDownloadSearch.addEventListener('click', downloadSearchReport);

// Clear
DOM.btnClearErrors.addEventListener('click', () => {
    DOM.errorResultsSection.style.display = 'none';
    DOM.errorsContent.innerHTML = '';
    state.lastErrorReport = null;
    showToast('Resultados de erros limpos.', 'info');
});
DOM.btnClearSearch.addEventListener('click', () => {
    DOM.searchResultsSection.style.display = 'none';
    DOM.searchContent.innerHTML = '';
    state.lastSearchReport = null;
    showToast('Resultados de busca limpos.', 'info');
});

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
        const response = await fetch(state.backendUrl + '/', {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) {
            throw new Error('Servidor respondeu com status ' + response.status);
        }

        const data = await response.json();
        console.log('Servidor respondeu:', data);

        state.isConnected = true;
        updateServerStatus('online', 'Conectado');

        // *** FIX: Always check auth_required ***
        if (data.auth_required === true) {
            console.log('Autenticação requerida pelo servidor.');

            // Try saved token first
            const savedToken = sessionStorage.getItem('auth_token');
            if (savedToken) {
                console.log('Token salvo encontrado, verificando...');
                state.token = savedToken;
                try {
                    const verifyResp = await fetch(state.backendUrl + '/auth/verify', {
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

        // Show auth modal anyway so user can try
        showAuthModal();
    }

    // Check extension (non-blocking)
    checkExtension().then(ok => {
        state.extensionInstalled = ok;
        if (ok) {
            console.log('Extensão Chrome detectada!');
        } else {
            console.log('Extensão Chrome não detectada (opcional).');
        }
    });

    console.log('%c Site Backup & Error Checker v1.3.0 ', 'background: #667eea; color: white; font-size: 14px; padding: 4px 8px; border-radius: 4px;');
}

// Start
init();
})();

