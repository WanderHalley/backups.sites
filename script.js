// ============================================================
// Site Backup & Error Checker - Frontend v1.2.0
// ============================================================

(function () {
    'use strict';

    // ===================== STATE =====================
    const state = {
        backendUrl: '',
        token: '',
        sessionId: null,
        siteUrl: '',
        siteTitle: '',
        isConnected: false,
        isAuthenticated: false,
        lastErrorReport: null,
        lastSearchReport: null,
        interactInterval: null
    };

    // ===================== DOM ELEMENTS =====================
    const DOM = {
        // Auth
        authOverlay: document.getElementById('authOverlay'),
        authTokenInput: document.getElementById('authTokenInput'),
        btnAuth: document.getElementById('btnAuth'),
        authError: document.getElementById('authError'),
        authToggleVisibility: document.getElementById('authToggleVisibility'),
        btnLogout: document.getElementById('btnLogout'),

        // Header
        serverStatus: document.getElementById('serverStatus'),
        sessionBadge: document.getElementById('sessionBadge'),
        sessionBadgeText: document.getElementById('sessionBadgeText'),

        // URL
        urlInput: document.getElementById('urlInput'),
        btnOpen: document.getElementById('btnOpen'),
        siteStatus: document.getElementById('siteStatus'),
        siteTitle: document.getElementById('siteTitle'),
        siteUrl: document.getElementById('siteUrl'),
        siteStatusText: document.getElementById('siteStatusText'),
        btnScreenshot: document.getElementById('btnScreenshot'),
        btnInteract: document.getElementById('btnInteract'),
        btnClose: document.getElementById('btnClose'),
        screenshotPreview: document.getElementById('screenshotPreview'),
        screenshotImg: document.getElementById('screenshotImg'),

        // Interaction Modal
        interactOverlay: document.getElementById('interactOverlay'),
        interactScreenImg: document.getElementById('interactScreenImg'),
        clickIndicator: document.getElementById('clickIndicator'),
        interactTextInput: document.getElementById('interactTextInput'),
        btnInteractSend: document.getElementById('btnInteractSend'),
        btnInteractRefresh: document.getElementById('btnInteractRefresh'),
        btnInteractContinue: document.getElementById('btnInteractContinue'),

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

        // Error Results
        errorResultsSection: document.getElementById('errorResultsSection'),
        errorsSummary: document.getElementById('errorsSummary'),
        totalErrors: document.getElementById('totalErrors'),
        totalWarnings: document.getElementById('totalWarnings'),
        errorsTabs: document.getElementById('errorsTabs'),
        errorsContent: document.getElementById('errorsContent'),
        btnDownloadErrors: document.getElementById('btnDownloadErrors'),
        btnClearErrors: document.getElementById('btnClearErrors'),

        // Search Results
        searchResultsSection: document.getElementById('searchResultsSection'),
        totalFound: document.getElementById('totalFound'),
        totalCategories: document.getElementById('totalCategories'),
        searchContent: document.getElementById('searchContent'),
        btnDownloadSearch: document.getElementById('btnDownloadSearch'),
        btnClearSearch: document.getElementById('btnClearSearch'),

        // Global
        toastContainer: document.getElementById('toastContainer'),
        loadingOverlay: document.getElementById('loadingOverlay'),
        loadingText: document.getElementById('loadingText'),
        loadingSubtext: document.getElementById('loadingSubtext')
    };

    // ===================== UTILITIES =====================
    function showToast(message, type = 'info', duration = 4000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        DOM.toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.style.animationDelay = '0s';
            toast.style.animation = 'toastOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    function showLoading(text = 'Processando...', subtext = '') {
        DOM.loadingText.textContent = text;
        DOM.loadingSubtext.textContent = subtext;
        DOM.loadingOverlay.style.display = 'flex';
    }

    function hideLoading() {
        DOM.loadingOverlay.style.display = 'none';
    }

    function updateServerStatus(status, text) {
        DOM.serverStatus.className = `server-status ${status}`;
        DOM.serverStatus.querySelector('span').textContent = text;
    }

    function updateSessionBadge(show, text = 'Sessão ativa') {
        DOM.sessionBadge.style.display = show ? 'flex' : 'none';
        DOM.sessionBadgeText.textContent = text;
    }

    function updateModuleButtons(enabled) {
        DOM.btnBackup.disabled = !enabled;
        DOM.btnErrors.disabled = !enabled;
        DOM.btnSearch.disabled = !enabled;
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

    function simulateProgress(fillEl, textEl, containerEl, steps) {
        return new Promise((resolve) => {
            containerEl.style.display = 'flex';
            let i = 0;
            const interval = setInterval(() => {
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
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    // ===================== API HELPERS =====================
    async function apiRequest(endpoint, method = 'GET', body = null, isBlob = false) {
        const url = state.backendUrl + endpoint;
        const headers = {};

        if (state.token) {
            headers['Authorization'] = 'Bearer ' + state.token;
        }

        const options = { method, headers };

        if (body) {
            headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(body);
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), (typeof BACKEND_CONFIG !== 'undefined' ? BACKEND_CONFIG.REQUEST_TIMEOUT : 120000));
        options.signal = controller.signal;

        try {
            const response = await fetch(url, options);
            clearTimeout(timeout);

            if (!response.ok) {
                let errorMsg = `Erro ${response.status}`;
                try {
                    const errData = await response.json();
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

    async function apiJSON(endpoint, method = 'GET', body = null) {
        return apiRequest(endpoint, method, body, false);
    }

    async function apiBlob(endpoint, method = 'GET', body = null) {
        return apiRequest(endpoint, method, body, true);
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
        const token = DOM.authTokenInput.value.trim();
        if (!token) {
            DOM.authError.textContent = 'Digite o token de acesso.';
            return;
        }

        DOM.btnAuth.disabled = true;
        DOM.authError.textContent = '';

        try {
            // Carrega URL do backend do config.js
            if (typeof BACKEND_CONFIG !== 'undefined' && BACKEND_CONFIG.BACKEND_URL) {
                state.backendUrl = BACKEND_CONFIG.BACKEND_URL.replace(/\/+$/, '');
            } else {
                DOM.authError.textContent = 'Erro: config.js não encontrado.';
                DOM.btnAuth.disabled = false;
                return;
            }

            // Testa conexão primeiro
            state.token = token;
            const statusResp = await apiJSON('/');

            if (statusResp.auth_required) {
                // Valida token
                const authResp = await apiJSON('/auth/verify', 'POST');
                if (!authResp.valid) {
                    DOM.authError.textContent = 'Token inválido.';
                    state.token = '';
                    DOM.btnAuth.disabled = false;
                    return;
                }
            }

            // Sucesso
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
        const input = DOM.authTokenInput;
        input.type = input.type === 'password' ? 'text' : 'password';
    }

    // ===================== CORE ACTIONS =====================

    async function openSite() {
        let url = DOM.urlInput.value.trim();
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
            const data = await apiJSON('/open', 'POST', { url });

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
            const response = await apiBlob('/screenshot', 'POST', {
                session_id: state.sessionId
            });
            const blob = await response.blob();
            const imgUrl = URL.createObjectURL(blob);
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

    // ===================== INTERACTION (LOGIN) =====================

    async function openInteraction() {
        if (!state.sessionId) {
            showToast('Nenhuma sessão ativa.', 'warning');
            return;
        }

        DOM.interactOverlay.style.display = 'flex';
        DOM.interactTextInput.value = '';
        await refreshInteractionScreen();
        startInteractionAutoRefresh();
    }

    function closeInteraction() {
        DOM.interactOverlay.style.display = 'none';
        stopInteractionAutoRefresh();
        showToast('Interação finalizada. Pode continuar usando os módulos.', 'success');
    }

    function startInteractionAutoRefresh() {
        stopInteractionAutoRefresh();
        state.interactInterval = setInterval(async () => {
            await refreshInteractionScreenSilent();
        }, 3000);
    }

    function stopInteractionAutoRefresh() {
        if (state.interactInterval) {
            clearInterval(state.interactInterval);
            state.interactInterval = null;
        }
    }

    async function refreshInteractionScreen() {
        try {
            const data = await apiJSON('/interact/screenshot', 'POST', {
                session_id: state.sessionId
            });
            if (data.screenshot) {
                DOM.interactScreenImg.src = 'data:image/png;base64,' + data.screenshot;
            }
        } catch (err) {
            showToast('Erro ao atualizar tela: ' + err.message, 'error');
        }
    }

    async function refreshInteractionScreenSilent() {
        try {
            const data = await apiJSON('/interact/screenshot', 'POST', {
                session_id: state.sessionId
            });
            if (data.screenshot) {
                DOM.interactScreenImg.src = 'data:image/png;base64,' + data.screenshot;
            }
        } catch (err) {
            // Silencioso
        }
    }

    async function handleInteractClick(event) {
        const img = DOM.interactScreenImg;
        const rect = img.getBoundingClientRect();

        const scaleX = img.naturalWidth / rect.width;
        const scaleY = img.naturalHeight / rect.height;

        const x = Math.round((event.clientX - rect.left) * scaleX);
        const y = Math.round((event.clientY - rect.top) * scaleY);

        // Mostrar indicador de clique
        const indicator = DOM.clickIndicator;
        indicator.style.left = (event.clientX - rect.left) + 'px';
        indicator.style.top = (event.clientY - rect.top) + 'px';
        indicator.style.display = 'block';
        setTimeout(() => { indicator.style.display = 'none'; }, 600);

        try {
            const data = await apiJSON('/interact/click', 'POST', {
                session_id: state.sessionId,
                x: x,
                y: y
            });
            if (data.screenshot) {
                DOM.interactScreenImg.src = 'data:image/png;base64,' + data.screenshot;
            }
        } catch (err) {
            showToast('Erro no clique: ' + err.message, 'error');
        }
    }

    async function handleInteractType() {
        const text = DOM.interactTextInput.value;
        if (!text) return;

        try {
            const data = await apiJSON('/interact/type', 'POST', {
                session_id: state.sessionId,
                text: text
            });
            DOM.interactTextInput.value = '';
            if (data.screenshot) {
                DOM.interactScreenImg.src = 'data:image/png;base64,' + data.screenshot;
            }
        } catch (err) {
            showToast('Erro ao digitar: ' + err.message, 'error');
        }
    }

    async function handleInteractKey(key) {
        try {
            const data = await apiJSON('/interact/key', 'POST', {
                session_id: state.sessionId,
                key: key
            });
            if (data.screenshot) {
                DOM.interactScreenImg.src = 'data:image/png;base64,' + data.screenshot;
            }
        } catch (err) {
            showToast('Erro ao pressionar tecla: ' + err.message, 'error');
        }
    }

    // ===================== BACKUP =====================

    async function backupSite() {
        if (!state.sessionId) {
            showToast('Nenhuma sessão ativa.', 'warning');
            return;
        }

        const folder = DOM.backupFolder.value.trim() || 'backup';
        DOM.btnBackup.disabled = true;

        const steps = [
            { percent: 10 },
            { percent: 25 },
            { percent: 40 },
            { percent: 55 },
            { percent: 70 },
            { percent: 85 }
        ];

        simulateProgress(
            DOM.backupProgressFill,
            DOM.backupProgressText,
            DOM.backupProgress,
            steps
        );

        try {
            const response = await apiBlob('/backup', 'POST', {
                session_id: state.sessionId,
                folder_name: folder
            });

            // Finalizar progresso
            DOM.backupProgressFill.style.width = '100%';
            DOM.backupProgressText.textContent = '100%';

            const blob = await response.blob();

            // Extrair nome do arquivo
            let filename = folder + '_backup.zip';
            const disposition = response.headers.get('Content-Disposition');
            if (disposition) {
                const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (match && match[1]) {
                    filename = match[1].replace(/['"]/g, '');
                }
            }

            downloadBlob(blob, filename);
            showToast('Backup realizado com sucesso!', 'success');

            // Verificar warnings
            const backupErrors = response.headers.get('X-Backup-Errors');
            if (backupErrors && parseInt(backupErrors) > 0) {
                showToast(`Backup concluído com ${backupErrors} aviso(s).`, 'warning');
            }

        } catch (err) {
            showToast('Erro no backup: ' + err.message, 'error');
        }

        DOM.btnBackup.disabled = false;
        setTimeout(() => {
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

        const folder = DOM.errorsFolder.value.trim() || 'erros';
        DOM.btnErrors.disabled = true;

        const steps = [
            { percent: 10 },
            { percent: 20 },
            { percent: 35 },
            { percent: 50 },
            { percent: 65 },
            { percent: 80 },
            { percent: 90 }
        ];

        simulateProgress(
            DOM.errorsProgressFill,
            DOM.errorsProgressText,
            DOM.errorsProgress,
            steps
        );

        try {
            const data = await apiJSON('/check-errors-json', 'POST', {
                session_id: state.sessionId,
                folder_name: folder
            });

            DOM.errorsProgressFill.style.width = '100%';
            DOM.errorsProgressText.textContent = '100%';

            state.lastErrorReport = data;
            displayErrorResults(data);

            const totalE = data.total_errors || 0;
            const totalW = data.total_warnings || 0;

            if (totalE === 0 && totalW === 0) {
                showToast('Nenhum erro encontrado!', 'success');
            } else {
                showToast(`Encontrados: ${totalE} erro(s) e ${totalW} aviso(s).`, totalE > 0 ? 'error' : 'warning');
            }

        } catch (err) {
            showToast('Erro na verificação: ' + err.message, 'error');
        }

        DOM.btnErrors.disabled = false;
        setTimeout(() => {
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

        const folder = DOM.errorsFolder.value.trim() || 'erros';

        try {
            const response = await apiBlob('/check-errors', 'POST', {
                session_id: state.sessionId,
                folder_name: folder
            });

            const blob = await response.blob();

            let filename = folder + '_erros.txt';
            const disposition = response.headers.get('Content-Disposition');
            if (disposition) {
                const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
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

        const term = DOM.searchTerm.value.trim();
        if (!term) {
            showToast('Digite o que deseja buscar.', 'warning');
            return;
        }

        const folder = DOM.searchFolder.value.trim() || 'busca';
        DOM.btnSearch.disabled = true;

        const steps = [
            { percent: 15 },
            { percent: 30 },
            { percent: 50 },
            { percent: 70 },
            { percent: 85 }
        ];

        simulateProgress(
            DOM.searchProgressFill,
            DOM.searchProgressText,
            DOM.searchProgress,
            steps
        );

        try {
            const data = await apiJSON('/search-site', 'POST', {
                session_id: state.sessionId,
                term: term,
                folder_name: folder
            });

            DOM.searchProgressFill.style.width = '100%';
            DOM.searchProgressText.textContent = '100%';

            state.lastSearchReport = data;
            displaySearchResults(data);

            const total = data.total_found || 0;
            if (total === 0) {
                showToast('Nenhum resultado encontrado para "' + term + '".', 'info');
            } else {
                showToast(`Encontrados ${total} resultado(s) para "${term}".`, 'success');
            }

        } catch (err) {
            showToast('Erro na busca: ' + err.message, 'error');
        }

        DOM.btnSearch.disabled = false;
        setTimeout(() => {
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

        const term = DOM.searchTerm.value.trim() || 'busca';
        const folder = DOM.searchFolder.value.trim() || 'busca';

        try {
            const response = await apiBlob('/search-site-txt', 'POST', {
                session_id: state.sessionId,
                term: term,
                folder_name: folder
            });

            const blob = await response.blob();

            let filename = folder + '_' + term + '.txt';
            const disposition = response.headers.get('Content-Disposition');
            if (disposition) {
                const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
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

    // ===================== ERROR RESULTS DISPLAY =====================

    const categoryLabels = {
        'console': 'Console do Navegador',
        'javascript': 'Erros JavaScript',
        'network': 'Erros de Rede',
        'resources': 'Recursos',
        'css': 'Erros CSS',
        'html': 'Erros HTML',
        'accessibility': 'Acessibilidade',
        'security': 'Segurança',
        'performance': 'Performance',
        'broken_links': 'Links Quebrados',
        'seo': 'SEO'
    };

    function displayErrorResults(data) {
        const details = data.details || {};
        const totalE = data.total_errors || 0;
        const totalW = data.total_warnings || 0;

        DOM.totalErrors.textContent = totalE;
        DOM.totalWarnings.textContent = totalW;

        // Gerar tabs
        DOM.errorsTabs.innerHTML = '<button class="tab-btn active" data-tab="all">Todos</button>';

        const categories = Object.keys(details).filter(cat => {
            const items = details[cat];
            return Array.isArray(items) && items.length > 0;
        });

        categories.forEach(cat => {
            const label = categoryLabels[cat] || cat;
            const count = details[cat].length;
            const btn = document.createElement('button');
            btn.className = 'tab-btn';
            btn.dataset.tab = cat;
            btn.textContent = `${label} (${count})`;
            DOM.errorsTabs.appendChild(btn);
        });

        // Renderizar aba "Todos"
        renderErrorsTab('all', details, categories);

        // Listeners nas tabs
        DOM.errorsTabs.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                DOM.errorsTabs.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                const tab = this.dataset.tab;
                if (tab === 'all') {
                    renderErrorsTab('all', details, categories);
                } else {
                    renderErrorsTab(tab, details, [tab]);
                }
            });
        });

        DOM.errorResultsSection.style.display = 'block';
        DOM.errorResultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function renderErrorsTab(tab, details, categories) {
        DOM.errorsContent.innerHTML = '';

        if (categories.length === 0) {
            DOM.errorsContent.innerHTML = `
                <div class="no-results">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    <p>Nenhum erro encontrado!</p>
                </div>
            `;
            return;
        }

        categories.forEach(cat => {
            const items = details[cat];
            if (!Array.isArray(items) || items.length === 0) return;
            DOM.errorsContent.appendChild(createErrorCategoryBlock(cat, items));
        });
    }

    function createErrorCategoryBlock(category, items) {
        const block = document.createElement('div');
        block.className = 'error-category-block';

        const title = document.createElement('div');
        title.className = 'error-category-title';
        title.textContent = (categoryLabels[category] || category) + ` (${items.length})`;
        block.appendChild(title);

        items.forEach(item => {
            const div = document.createElement('div');
            const level = item.level || item.type || 'info';

            let levelClass = 'level-info';
            if (level === 'error' || level === 'SEVERE' || level === 'severe') {
                levelClass = 'level-error';
            } else if (level === 'warning' || level === 'WARNING') {
                levelClass = 'level-warning';
            }

            div.className = 'error-item ' + levelClass;
            div.innerHTML = escapeHTML(extractErrorMessage(item));
            block.appendChild(div);
        });

        return block;
    }

    function extractErrorMessage(item) {
        if (typeof item === 'string') return item;
        if (item.message) return item.message;
        if (item.description) return item.description;
        if (item.text) return item.text;
        if (item.url) return item.url;
        return JSON.stringify(item);
    }

    // ===================== SEARCH RESULTS DISPLAY =====================

    function displaySearchResults(data) {
        const findings = data.findings || [];
        const totalF = data.total_found || 0;

        DOM.totalFound.textContent = totalF;

        // Contar categorias únicas
        const uniqueCategories = [...new Set(findings.map(f => f.category || 'geral'))];
        DOM.totalCategories.textContent = uniqueCategories.length;

        DOM.searchContent.innerHTML = '';

        if (findings.length === 0) {
            DOM.searchContent.innerHTML = `
                <div class="no-results">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="11" cy="11" r="8"/>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <p>Nenhum resultado encontrado.</p>
                </div>
            `;
            DOM.searchResultsSection.style.display = 'block';
            DOM.searchResultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
        }

        // Agrupar por categoria
        const grouped = {};
        findings.forEach(f => {
            const cat = f.category || 'geral';
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(f);
        });

        Object.keys(grouped).forEach(cat => {
            const block = document.createElement('div');
            block.className = 'search-category-block';

            const title = document.createElement('div');
            title.className = 'search-category-title';
            title.textContent = cat.charAt(0).toUpperCase() + cat.slice(1) + ` (${grouped[cat].length})`;
            block.appendChild(title);

            grouped[cat].forEach(item => {
                const div = document.createElement('div');
                div.className = 'search-item';

                let html = '';
                if (item.type) {
                    html += `<div class="search-item-type">${escapeHTML(item.type)}</div>`;
                }
                if (item.value) {
                    html += `<div class="search-item-value">${escapeHTML(item.value)}</div>`;
                }
                if (item.details) {
                    html += `<div class="search-item-details">${escapeHTML(item.details)}</div>`;
                }

                div.innerHTML = html;
                block.appendChild(div);
            });

            DOM.searchContent.appendChild(block);
        });

        DOM.searchResultsSection.style.display = 'block';
        DOM.searchResultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // ===================== EVENT LISTENERS =====================

    // Auth
    DOM.btnAuth.addEventListener('click', authenticate);
    DOM.authTokenInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') authenticate();
    });
    DOM.authToggleVisibility.addEventListener('click', togglePasswordVisibility);
    DOM.btnLogout.addEventListener('click', logout);

    // URL / Site
    DOM.btnOpen.addEventListener('click', openSite);
    DOM.urlInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') openSite();
    });
    DOM.btnScreenshot.addEventListener('click', takeScreenshot);
    DOM.btnClose.addEventListener('click', closeSession);

    // Interaction
    DOM.btnInteract.addEventListener('click', openInteraction);
    DOM.btnInteractContinue.addEventListener('click', closeInteraction);
    DOM.btnInteractRefresh.addEventListener('click', refreshInteractionScreen);

    DOM.interactScreenImg.addEventListener('click', handleInteractClick);

    DOM.btnInteractSend.addEventListener('click', handleInteractType);
    DOM.interactTextInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') handleInteractType();
    });

    // Teclas especiais na interação
    document.querySelectorAll('.interact-keys .btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const key = this.dataset.key;
            if (key) handleInteractKey(key);
        });
    });

    // Modules
    DOM.btnBackup.addEventListener('click', backupSite);
    DOM.btnErrors.addEventListener('click', checkErrors);
    DOM.btnSearch.addEventListener('click', searchSite);

    // Downloads
    DOM.btnDownloadErrors.addEventListener('click', downloadErrorReport);
    DOM.btnDownloadSearch.addEventListener('click', downloadSearchReport);

    // Clear
    DOM.btnClearErrors.addEventListener('click', function () {
        DOM.errorResultsSection.style.display = 'none';
        DOM.errorsContent.innerHTML = '';
        state.lastErrorReport = null;
        showToast('Resultados de erros limpos.', 'info');
    });

    DOM.btnClearSearch.addEventListener('click', function () {
        DOM.searchResultsSection.style.display = 'none';
        DOM.searchContent.innerHTML = '';
        state.lastSearchReport = null;
        showToast('Resultados de busca limpos.', 'info');
    });

     // ===================== INITIALIZATION =====================

    async function init() {
        // Carregar backend URL do config.js
        if (typeof BACKEND_CONFIG !== 'undefined' && BACKEND_CONFIG.BACKEND_URL) {
            state.backendUrl = BACKEND_CONFIG.BACKEND_URL.replace(/\/+$/, '');
        }

        if (!state.backendUrl) {
            showAuthModal();
            return;
        }

        // Verificar token salvo
        const savedToken = sessionStorage.getItem('api_token');

        // Primeiro, verificar se o servidor está online e se precisa de auth
        try {
            const statusResp = await fetch(state.backendUrl + '/', {
                method: 'GET',
                signal: AbortSignal.timeout(10000)
            });
            const data = await statusResp.json();

            if (data.auth_required) {
                // Servidor EXIGE token
                updateServerStatus('online', 'Aguardando login');

                if (savedToken) {
                    // Tentar reconectar com token salvo
                    state.token = savedToken;
                    try {
                        const authResp = await apiJSON('/auth/verify', 'POST');
                        if (authResp.valid) {
                            state.isAuthenticated = true;
                            state.isConnected = true;
                            hideAuthModal();
                            updateServerStatus('online', 'Conectado');
                            DOM.btnLogout.style.display = 'flex';
                            showToast('Reconectado automaticamente!', 'success');
                            return;
                        }
                    } catch (err) {
                        // Token salvo inválido
                    }
                    // Se chegou aqui, token salvo falhou
                    state.token = '';
                    sessionStorage.removeItem('api_token');
                }

                // Mostrar modal de login
                showAuthModal();

            } else {
                // Servidor NÃO exige token
                state.isAuthenticated = true;
                state.isConnected = true;
                hideAuthModal();
                updateServerStatus('online', 'Conectado');
                showToast('Conectado (sem autenticação).', 'info');
            }

        } catch (err) {
            updateServerStatus('offline', 'Servidor offline');
            showAuthModal();
        }

        // Banner
        console.log(
            '%c Site Backup & Error Checker v1.2.0 ',
            'background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 8px 16px; border-radius: 4px; font-size: 14px; font-weight: bold;'
        );
    }

    init();

})();
