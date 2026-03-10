// =============================================
// SITE BACKUP & ERROR CHECKER — Frontend Logic
// v1.2.0 — Com autenticação, login em sites e busca
// =============================================

(function () {
    "use strict";

    // ─────────────────────────────────────────
    // ESTADO GLOBAL
    // ─────────────────────────────────────────
    const state = {
        backendUrl: (typeof CONFIG !== "undefined" && CONFIG.BACKEND_URL)
            ? CONFIG.BACKEND_URL
            : "",
        token: null,
        sessionId: null,
        siteUrl: null,
        siteTitle: null,
        isConnected: false,
        isAuthenticated: false,
        isBusy: false,
        lastErrorReport: null,
        lastSearchReport: null,
    };

    // ─────────────────────────────────────────
    // ELEMENTOS DO DOM
    // ─────────────────────────────────────────
    const DOM = {
        // Auth
        authOverlay: document.getElementById("authOverlay"),
        authTokenInput: document.getElementById("authTokenInput"),
        btnAuth: document.getElementById("btnAuth"),
        authError: document.getElementById("authError"),
        authToggleVisibility: document.getElementById("authToggleVisibility"),
        btnLogout: document.getElementById("btnLogout"),

        // Main
        mainContainer: document.getElementById("mainContainer"),

        // URL
        urlInput: document.getElementById("urlInput"),
        btnOpen: document.getElementById("btnOpen"),

        // Site Status
        siteStatus: document.getElementById("siteStatus"),
        siteStatusText: document.getElementById("siteStatusText"),
        siteTitleText: document.getElementById("siteTitleText"),
        siteUrlText: document.getElementById("siteUrlText"),
        btnScreenshot: document.getElementById("btnScreenshot"),
        btnSiteLogin: document.getElementById("btnSiteLogin"),
        btnClose: document.getElementById("btnClose"),

        // Screenshot
        screenshotContainer: document.getElementById("screenshotContainer"),
        screenshotImg: document.getElementById("screenshotImg"),
        btnClosePreview: document.getElementById("btnClosePreview"),

        // Server Status
        serverStatus: document.getElementById("serverStatus"),
        sessionBadge: document.getElementById("sessionBadge"),
        sessionIdDisplay: document.getElementById("sessionIdDisplay"),

        // Login Modal
        loginOverlay: document.getElementById("loginOverlay"),
        loginScreenshotImg: document.getElementById("loginScreenshotImg"),
        loginDetectedInfo: document.getElementById("loginDetectedInfo"),
        loginModalSubtitle: document.getElementById("loginModalSubtitle"),
        loginUsername: document.getElementById("loginUsername"),
        loginPassword: document.getElementById("loginPassword"),
        loginUsernameSelector: document.getElementById("loginUsernameSelector"),
        loginPasswordSelector: document.getElementById("loginPasswordSelector"),
        loginSubmitSelector: document.getElementById("loginSubmitSelector"),
        btnDoLogin: document.getElementById("btnDoLogin"),
        btnCloseLogin: document.getElementById("btnCloseLogin"),
        loginTogglePassword: document.getElementById("loginTogglePassword"),
        loginResult: document.getElementById("loginResult"),
        loginResultStatus: document.getElementById("loginResultStatus"),
        loginResultScreenshot: document.getElementById("loginResultScreenshot"),
        loginResultImg: document.getElementById("loginResultImg"),

        // Modules
        btnBackup: document.getElementById("btnBackup"),
        btnCheckErrors: document.getElementById("btnCheckErrors"),
        btnSearchSite: document.getElementById("btnSearchSite"),
        backupFolderName: document.getElementById("backupFolderName"),
        errorFolderName: document.getElementById("errorFolderName"),
        searchTerm: document.getElementById("searchTerm"),
        searchFolderName: document.getElementById("searchFolderName"),

        // Backup Progress
        backupProgress: document.getElementById("backupProgress"),
        backupProgressFill: document.getElementById("backupProgressFill"),
        backupProgressText: document.getElementById("backupProgressText"),

        // Errors Progress
        errorsProgress: document.getElementById("errorsProgress"),
        errorsProgressFill: document.getElementById("errorsProgressFill"),
        errorsProgressText: document.getElementById("errorsProgressText"),

        // Search Progress
        searchProgress: document.getElementById("searchProgress"),
        searchProgressFill: document.getElementById("searchProgressFill"),
        searchProgressText: document.getElementById("searchProgressText"),

        // Error Results
        resultsSection: document.getElementById("resultsSection"),
        resultsContent: document.getElementById("resultsContent"),
        summaryErrors: document.getElementById("summaryErrors"),
        summaryWarnings: document.getElementById("summaryWarnings"),
        btnDownloadTxt: document.getElementById("btnDownloadTxt"),
        btnClearResults: document.getElementById("btnClearResults"),

        // Search Results
        searchResultsSection: document.getElementById("searchResultsSection"),
        searchResultsContent: document.getElementById("searchResultsContent"),
        summarySearchTerm: document.getElementById("summarySearchTerm"),
        summarySearchCount: document.getElementById("summarySearchCount"),
        btnDownloadSearchTxt: document.getElementById("btnDownloadSearchTxt"),
        btnClearSearchResults: document.getElementById("btnClearSearchResults"),

        // Loading
        loadingOverlay: document.getElementById("loadingOverlay"),
        loadingText: document.getElementById("loadingText"),
        loadingSubtext: document.getElementById("loadingSubtext"),

        // Toast
        toastContainer: document.getElementById("toastContainer"),
    };

    // ─────────────────────────────────────────
    // UTILIDADES
    // ─────────────────────────────────────────

    function showToast(message, type = "info", duration = 4000) {
        const toast = document.createElement("div");
        toast.className = `toast toast-${type}`;
        const icons = {
            success: "&#10003;",
            error: "&#10007;",
            warning: "&#9888;",
            info: "&#8505;",
        };
        toast.innerHTML = `<span>${icons[type] || icons.info}</span><span>${message}</span>`;
        DOM.toastContainer.appendChild(toast);
        toast.addEventListener("click", () => {
            toast.classList.add("toast-out");
            setTimeout(() => toast.remove(), 300);
        });
        setTimeout(() => {
            if (toast.parentNode) {
                toast.classList.add("toast-out");
                setTimeout(() => toast.remove(), 300);
            }
        }, duration);
    }

    function showLoading(text = "Processando...", subtext = "Aguarde") {
        DOM.loadingText.textContent = text;
        DOM.loadingSubtext.textContent = subtext;
        DOM.loadingOverlay.style.display = "flex";
    }

    function hideLoading() {
        DOM.loadingOverlay.style.display = "none";
    }

    function updateServerStatus(status) {
        const dot = DOM.serverStatus.querySelector(".status-dot");
        const text = DOM.serverStatus.querySelector(".status-text");
        dot.className = "status-dot";
        switch (status) {
            case "online":
                dot.classList.add("online");
                text.textContent = "Conectado";
                break;
            case "offline":
                dot.classList.add("offline");
                text.textContent = "Desconectado";
                break;
            case "loading":
                dot.classList.add("loading");
                text.textContent = "Conectando...";
                break;
        }
    }

    function updateSessionBadge() {
        if (state.sessionId) {
            DOM.sessionBadge.style.display = "flex";
            DOM.sessionIdDisplay.textContent = state.sessionId;
        } else {
            DOM.sessionBadge.style.display = "none";
        }
    }

    function updateModuleButtons() {
        const hasSession = !!state.sessionId;
        DOM.btnBackup.disabled = !hasSession || state.isBusy;
        DOM.btnCheckErrors.disabled = !hasSession || state.isBusy;
        DOM.btnSearchSite.disabled = !hasSession || state.isBusy;
    }

    // ─────────────────────────────────────────
    // API — REQUISIÇÕES COM TOKEN
    // ─────────────────────────────────────────

    async function apiRequest(endpoint, method = "GET", body = null) {
        if (!state.backendUrl) {
            showToast("URL do backend não configurada", "error");
            throw new Error("Backend URL não configurada");
        }

        const url = `${state.backendUrl.replace(/\/+$/, "")}${endpoint}`;

        const options = {
            method,
            headers: {},
        };

        if (state.token) {
            options.headers["Authorization"] = `Bearer ${state.token}`;
        }

        if (body) {
            options.headers["Content-Type"] = "application/json";
            options.body = JSON.stringify(body);
        }

        const controller = new AbortController();
        const timeout = (typeof CONFIG !== "undefined" && CONFIG.REQUEST_TIMEOUT)
            ? CONFIG.REQUEST_TIMEOUT
            : 120000;
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        options.signal = controller.signal;

        try {
            const response = await fetch(url, options);
            clearTimeout(timeoutId);

            if (response.status === 401) {
                state.isAuthenticated = false;
                state.token = null;
                sessionStorage.removeItem("sitetools_token");
                showAuthModal();
                throw new Error("Token expirado ou inválido. Faça login novamente.");
            }

            if (!response.ok) {
                let errorMsg = `Erro ${response.status}`;
                try {
                    const errData = await response.json();
                    errorMsg = errData.detail || errorMsg;
                } catch (e) { }
                throw new Error(errorMsg);
            }

            return response;
        } catch (err) {
            clearTimeout(timeoutId);
            if (err.name === "AbortError") {
                throw new Error("Timeout: a requisição demorou demais");
            }
            throw err;
        }
    }

    async function apiJSON(endpoint, method = "GET", body = null) {
        const response = await apiRequest(endpoint, method, body);
        return await response.json();
    }

    async function apiBlob(endpoint, method = "GET", body = null) {
        const response = await apiRequest(endpoint, method, body);
        const headers = {};
        response.headers.forEach((value, key) => {
            headers[key] = value;
        });
        const blob = await response.blob();
        return { blob, headers };
    }

    function downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function simulateProgress(fillElement, textElement, steps) {
        let delay = 0;
        steps.forEach((step) => {
            delay += step.delay || 800;
            setTimeout(() => {
                fillElement.style.width = step.percent + "%";
                textElement.textContent = step.text;
            }, delay);
        });
    }

    function escapeHTML(str) {
        const div = document.createElement("div");
        div.textContent = str;
        return div.innerHTML;
    }

    // ─────────────────────────────────────────
    // AUTENTICAÇÃO
    // ─────────────────────────────────────────

    function showAuthModal() {
        DOM.authOverlay.style.display = "flex";
        DOM.authOverlay.classList.remove("auth-hidden");
        DOM.mainContainer.style.display = "none";
        DOM.btnLogout.style.display = "none";
        DOM.authError.style.display = "none";
        DOM.authTokenInput.value = "";
        DOM.authTokenInput.focus();
    }

    function hideAuthModal() {
        DOM.authOverlay.classList.add("auth-hidden");
        setTimeout(() => {
            DOM.authOverlay.style.display = "none";
        }, 400);
        DOM.mainContainer.style.display = "flex";
        DOM.btnLogout.style.display = "flex";
    }

    async function authenticate() {
        const token = DOM.authTokenInput.value.trim();

        if (!token) {
            DOM.authError.textContent = "Digite o token de acesso.";
            DOM.authError.style.display = "block";
            DOM.authTokenInput.focus();
            return;
        }

        state.token = token;

        DOM.btnAuth.disabled = true;
        DOM.btnAuth.innerHTML = '<span class="spinner"></span> Verificando...';
        DOM.authError.style.display = "none";

        try {
            const statusResp = await fetch(
                `${state.backendUrl.replace(/\/+$/, "")}/`
            );
            const statusData = await statusResp.json();

            if (statusData.status !== "online") {
                throw new Error("Servidor offline");
            }

            if (statusData.auth_required) {
                const authData = await apiJSON("/auth/verify", "POST");

                if (authData.status === "authorized") {
                    state.isAuthenticated = true;
                    state.isConnected = true;
                    sessionStorage.setItem("sitetools_token", token);
                    updateServerStatus("online");
                    hideAuthModal();
                    showToast("Autenticado com sucesso!", "success");
                }
            } else {
                state.isAuthenticated = true;
                state.isConnected = true;
                sessionStorage.setItem("sitetools_token", token);
                updateServerStatus("online");
                hideAuthModal();
                showToast("Conectado! (servidor sem autenticação)", "success");
            }

        } catch (err) {
            state.token = null;
            state.isAuthenticated = false;
            updateServerStatus("offline");

            if (err.message.includes("401") || err.message.includes("Token")) {
                DOM.authError.textContent = "Token inválido. Tente novamente.";
            } else {
                DOM.authError.textContent = `Erro de conexão: ${err.message}`;
            }

            DOM.authError.style.display = "block";
        } finally {
            DOM.btnAuth.disabled = false;
            DOM.btnAuth.innerHTML = `
                <span class="btn-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                        <polyline points="10 17 15 12 10 7"/>
                        <line x1="15" y1="12" x2="3" y2="12"/>
                    </svg>
                </span>
                Entrar
            `;
        }
    }

    function logout() {
        state.token = null;
        state.isAuthenticated = false;
        state.isConnected = false;
        state.sessionId = null;
        sessionStorage.removeItem("sitetools_token");

        updateServerStatus("offline");
        updateSessionBadge();
        updateModuleButtons();

        DOM.siteStatus.style.display = "none";
        DOM.screenshotContainer.style.display = "none";
        DOM.resultsSection.style.display = "none";
        DOM.searchResultsSection.style.display = "none";

        showAuthModal();
        showToast("Sessão encerrada", "info");
    }

    function togglePasswordVisibility() {
        const input = DOM.authTokenInput;
        input.type = input.type === "password" ? "text" : "password";
    }

    // ─────────────────────────────────────────
    // AÇÕES PRINCIPAIS
    // ─────────────────────────────────────────

    async function openSite() {
        let url = DOM.urlInput.value.trim();

        if (!url) {
            showToast("Digite uma URL", "warning");
            DOM.urlInput.focus();
            return;
        }

        if (!state.isAuthenticated) {
            showToast("Faça login primeiro", "warning");
            return;
        }

        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            url = "https://" + url;
        }

        showLoading("Abrindo site...", `Carregando ${url}`);
        state.isBusy = true;
        updateModuleButtons();

        try {
            if (state.sessionId) {
                try {
                    await apiJSON("/close", "POST", {
                        session_id: state.sessionId,
                    });
                } catch (e) { }
            }

            const data = await apiJSON("/open", "POST", { url });

            state.sessionId = data.session_id;
            state.siteUrl = data.url;
            state.siteTitle = data.title;

            DOM.siteStatus.style.display = "flex";
            DOM.siteStatusText.textContent = "Carregado";
            DOM.siteStatusText.style.color = "#00b894";
            DOM.siteTitleText.textContent = data.title;
            DOM.siteUrlText.textContent = data.url;

            updateSessionBadge();
            showToast(`Site aberto: ${data.title}`, "success");
        } catch (err) {
            showToast(`Erro ao abrir site: ${err.message}`, "error");
            state.sessionId = null;
            DOM.siteStatus.style.display = "none";
            updateSessionBadge();
        } finally {
            state.isBusy = false;
            updateModuleButtons();
            hideLoading();
        }
    }

    async function takeScreenshot() {
        if (!state.sessionId) return;

        try {
            showToast("Capturando screenshot...", "info", 2000);

            const { blob } = await apiBlob("/screenshot", "POST", {
                session_id: state.sessionId,
            });

            const imgUrl = URL.createObjectURL(blob);
            DOM.screenshotImg.src = imgUrl;
            DOM.screenshotContainer.style.display = "block";

            DOM.screenshotContainer.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
            });

            showToast("Screenshot capturado!", "success");
        } catch (err) {
            showToast(`Erro no screenshot: ${err.message}`, "error");
        }
    }

    async function closeSession() {
        if (!state.sessionId) return;

        try {
            await apiJSON("/close", "POST", {
                session_id: state.sessionId,
            });
            showToast("Sessão encerrada", "info");
        } catch (err) { }

        state.sessionId = null;
        state.siteUrl = null;
        state.siteTitle = null;

        DOM.siteStatus.style.display = "none";
        DOM.screenshotContainer.style.display = "none";
        DOM.resultsSection.style.display = "none";
        DOM.searchResultsSection.style.display = "none";

        updateSessionBadge();
        updateModuleButtons();
    }

    // ─────────────────────────────────────────
    // LOGIN NO SITE
    // ─────────────────────────────────────────

    async function openLoginModal() {
        if (!state.sessionId) {
            showToast("Abra um site primeiro", "warning");
            return;
        }

        // Mostrar modal
        DOM.loginOverlay.style.display = "flex";
        DOM.loginResult.style.display = "none";
        DOM.loginResultScreenshot.style.display = "none";
        DOM.loginUsername.value = "";
        DOM.loginPassword.value = "";
        DOM.loginUsernameSelector.value = "";
        DOM.loginPasswordSelector.value = "";
        DOM.loginSubmitSelector.value = "";

        showToast("Detectando campos de login...", "info", 2000);

        try {
            const data = await apiJSON("/detect-login-fields", "POST", {
                session_id: state.sessionId,
            });

            // Mostrar screenshot
            if (data.screenshot) {
                DOM.loginScreenshotImg.src = "data:image/png;base64," + data.screenshot;
            }

            DOM.loginModalSubtitle.textContent = data.title || "Preencha as credenciais";

            // Auto-preencher seletores
            if (data.has_login_form) {
                DOM.loginDetectedInfo.style.display = "block";

                if (data.username_selectors.length > 0) {
                    const best = data.username_selectors[0];
                    DOM.loginUsernameSelector.value = best.selector;
                    DOM.loginUsername.placeholder = best.placeholder || best.name || "seu@email.com";
                }

                if (data.password_selectors.length > 0) {
                    const best = data.password_selectors[0];
                    DOM.loginPasswordSelector.value = best.selector;
                }

                if (data.submit_selectors.length > 0) {
                    const best = data.submit_selectors[0];
                    DOM.loginSubmitSelector.value = best.selector;
                }

                showToast("Campos de login detectados automaticamente!", "success");
            } else {
                DOM.loginDetectedInfo.style.display = "none";
                showToast("Nenhum formulário de login detectado. Preencha os seletores manualmente.", "warning", 5000);
            }

        } catch (err) {
            DOM.loginDetectedInfo.style.display = "none";
            showToast(`Erro ao detectar campos: ${err.message}`, "error");
        }

        DOM.loginUsername.focus();
    }

    function closeLoginModal() {
        DOM.loginOverlay.style.display = "none";
    }

    async function doSiteLogin() {
        const username = DOM.loginUsername.value.trim();
        const password = DOM.loginPassword.value.trim();
        const usernameSelector = DOM.loginUsernameSelector.value.trim();
        const passwordSelector = DOM.loginPasswordSelector.value.trim();
        const submitSelector = DOM.loginSubmitSelector.value.trim();

        if (!username) {
            showToast("Digite o usuário/email", "warning");
            DOM.loginUsername.focus();
            return;
        }

        if (!password) {
            showToast("Digite a senha", "warning");
            DOM.loginPassword.focus();
            return;
        }

        if (!usernameSelector || !passwordSelector || !submitSelector) {
            showToast("Preencha os seletores CSS (abra a seção avançado)", "warning");
            return;
        }

        DOM.btnDoLogin.disabled = true;
        DOM.btnDoLogin.innerHTML = '<span class="spinner"></span> Fazendo login...';

        try {
            const data = await apiJSON("/do-login", "POST", {
                session_id: state.sessionId,
                username: username,
                password: password,
                username_selector: usernameSelector,
                password_selector: passwordSelector,
                submit_selector: submitSelector,
            });

            // Mostrar resultado
            DOM.loginResult.style.display = "block";

            if (data.probably_logged_in) {
                DOM.loginResultStatus.className = "login-result-status success";
                DOM.loginResultStatus.textContent = "Login realizado com sucesso! " + data.message;
            } else {
                DOM.loginResultStatus.className = "login-result-status warning";
                DOM.loginResultStatus.textContent = "Login enviado. " + data.message;
            }

            // Screenshot pós-login
            if (data.screenshot) {
                DOM.loginResultScreenshot.style.display = "block";
                DOM.loginResultImg.src = "data:image/png;base64," + data.screenshot;
            }

            // Atualizar dados da sessão
            if (data.new_url) {
                state.siteUrl = data.new_url;
                DOM.siteUrlText.textContent = data.new_url;
            }
            if (data.new_title) {
                state.siteTitle = data.new_title;
                DOM.siteTitleText.textContent = data.new_title;
            }

            showToast(
                data.probably_logged_in ? "Login realizado!" : "Login enviado, verifique o resultado",
                data.probably_logged_in ? "success" : "warning"
            );

            // Fechar modal após 3 segundos se login deu certo
            if (data.probably_logged_in) {
                setTimeout(() => {
                    closeLoginModal();
                }, 3000);
            }

        } catch (err) {
            DOM.loginResult.style.display = "block";
            DOM.loginResultStatus.className = "login-result-status error";
            DOM.loginResultStatus.textContent = "Erro: " + err.message;
            DOM.loginResultScreenshot.style.display = "none";
            showToast(`Erro no login: ${err.message}`, "error");
        } finally {
            DOM.btnDoLogin.disabled = false;
            DOM.btnDoLogin.innerHTML = `
                <span class="btn-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                        <polyline points="10 17 15 12 10 7"/>
                        <line x1="15" y1="12" x2="3" y2="12"/>
                    </svg>
                </span>
                Fazer Login
            `;
        }
    }

    function toggleLoginPasswordVisibility() {
        const input = DOM.loginPassword;
        input.type = input.type === "password" ? "text" : "password";
    }

    // ─────────────────────────────────────────
    // MÓDULO 1 — BACKUP
    // ─────────────────────────────────────────

    async function backupSite() {
        if (!state.sessionId || state.isBusy) return;

        const folderName = DOM.backupFolderName.value.trim() || "backup";

        state.isBusy = true;
        updateModuleButtons();

        const btnText = DOM.btnBackup.querySelector(".btn-text");
        const btnLoad = DOM.btnBackup.querySelector(".btn-loading");
        btnText.style.display = "none";
        btnLoad.style.display = "inline-flex";
        DOM.backupProgress.style.display = "block";

        const steps = [
            { percent: 10, text: "Capturando HTML...", delay: 500 },
            { percent: 25, text: "Baixando CSS...", delay: 1000 },
            { percent: 40, text: "Baixando JavaScript...", delay: 1200 },
            { percent: 55, text: "Baixando imagens...", delay: 1500 },
            { percent: 70, text: "Baixando fontes...", delay: 800 },
            { percent: 85, text: "Gerando screenshot...", delay: 600 },
            { percent: 92, text: "Empacotando ZIP...", delay: 800 },
        ];

        simulateProgress(DOM.backupProgressFill, DOM.backupProgressText, steps);

        try {
            const { blob, headers } = await apiBlob("/backup", "POST", {
                session_id: state.sessionId,
                folder_name: folderName,
            });

            DOM.backupProgressFill.style.width = "100%";
            DOM.backupProgressText.textContent = "Backup concluído!";

            const disposition = headers["content-disposition"] || "";
            const filenameMatch = disposition.match(/filename=(.+)/);
            const filename = filenameMatch
                ? filenameMatch[1]
                : `${folderName}_${Date.now()}.zip`;

            downloadBlob(blob, filename);

            const errorCount = headers["x-backup-errors"] || "0";
            showToast(
                `Backup concluído! (${errorCount} avisos durante o processo)`,
                "success",
                5000
            );
        } catch (err) {
            DOM.backupProgressFill.style.width = "0%";
            DOM.backupProgressText.textContent = "Erro no backup";
            showToast(`Erro no backup: ${err.message}`, "error");
        } finally {
            state.isBusy = false;
            updateModuleButtons();
            btnText.style.display = "inline";
            btnLoad.style.display = "none";
            setTimeout(() => {
                DOM.backupProgress.style.display = "none";
                DOM.backupProgressFill.style.width = "0%";
            }, 3000);
        }
    }

    // ─────────────────────────────────────────
    // MÓDULO 2 — VERIFICAR ERROS
    // ─────────────────────────────────────────

    async function checkErrors() {
        if (!state.sessionId || state.isBusy) return;

        const folderName = DOM.errorFolderName.value.trim() || "relatorio-erros";

        state.isBusy = true;
        updateModuleButtons();

        const btnText = DOM.btnCheckErrors.querySelector(".btn-text");
        const btnLoad = DOM.btnCheckErrors.querySelector(".btn-loading");
        btnText.style.display = "none";
        btnLoad.style.display = "inline-flex";
        DOM.errorsProgress.style.display = "block";

        const steps = [
            { percent: 8, text: "Lendo console do navegador...", delay: 500 },
            { percent: 18, text: "Verificando JavaScript...", delay: 1000 },
            { percent: 28, text: "Analisando rede...", delay: 800 },
            { percent: 38, text: "Verificando recursos...", delay: 1000 },
            { percent: 48, text: "Analisando CSS...", delay: 800 },
            { percent: 58, text: "Verificando HTML...", delay: 800 },
            { percent: 68, text: "Testando acessibilidade...", delay: 1000 },
            { percent: 78, text: "Verificando segurança...", delay: 600 },
            { percent: 85, text: "Analisando performance...", delay: 800 },
            { percent: 92, text: "Testando links...", delay: 2000 },
            { percent: 96, text: "Verificando SEO...", delay: 500 },
        ];

        simulateProgress(DOM.errorsProgressFill, DOM.errorsProgressText, steps);

        try {
            const reportJSON = await apiJSON("/check-errors-json", "POST", {
                session_id: state.sessionId,
                folder_name: folderName,
            });

            DOM.errorsProgressFill.style.width = "100%";
            DOM.errorsProgressText.textContent = "Análise concluída!";

            state.lastErrorReport = {
                json: reportJSON,
                folderName: folderName,
            };

            displayErrorResults(reportJSON);

            showToast(
                `Análise concluída! ${reportJSON.total_errors} erros e ${reportJSON.total_warnings} avisos`,
                reportJSON.total_errors > 0 ? "warning" : "success",
                5000
            );
        } catch (err) {
            DOM.errorsProgressFill.style.width = "0%";
            DOM.errorsProgressText.textContent = "Erro na análise";
            showToast(`Erro na análise: ${err.message}`, "error");
        } finally {
            state.isBusy = false;
            updateModuleButtons();
            btnText.style.display = "inline";
            btnLoad.style.display = "none";
            setTimeout(() => {
                DOM.errorsProgress.style.display = "none";
                DOM.errorsProgressFill.style.width = "0%";
            }, 3000);
        }
    }

    async function downloadErrorReport() {
        if (!state.sessionId) {
            showToast("Nenhuma sessão ativa", "warning");
            return;
        }

        const folderName =
            state.lastErrorReport?.folderName ||
            DOM.errorFolderName.value.trim() ||
            "relatorio-erros";

        try {
            showToast("Gerando relatório TXT...", "info", 2000);

            const { blob, headers } = await apiBlob("/check-errors", "POST", {
                session_id: state.sessionId,
                folder_name: folderName,
            });

            const disposition = headers["content-disposition"] || "";
            const filenameMatch = disposition.match(/filename=(.+)/);
            const filename = filenameMatch
                ? filenameMatch[1]
                : `${folderName}_${Date.now()}.txt`;

            downloadBlob(blob, filename);
            showToast("Relatório TXT baixado!", "success");
        } catch (err) {
            showToast(`Erro ao baixar relatório: ${err.message}`, "error");
        }
    }

    // ─────────────────────────────────────────
    // MÓDULO 3 — BUSCAR NO SITE
    // ─────────────────────────────────────────

    async function searchSite() {
        if (!state.sessionId || state.isBusy) return;

        const searchTermValue = DOM.searchTerm.value.trim();
        const folderName = DOM.searchFolderName.value.trim() || "resultado-busca";

        if (!searchTermValue) {
            showToast("Digite o que deseja buscar", "warning");
            DOM.searchTerm.focus();
            return;
        }

        state.isBusy = true;
        updateModuleButtons();

        const btnText = DOM.btnSearchSite.querySelector(".btn-text");
        const btnLoad = DOM.btnSearchSite.querySelector(".btn-loading");
        btnText.style.display = "none";
        btnLoad.style.display = "inline-flex";
        DOM.searchProgress.style.display = "block";

        const steps = [
            { percent: 15, text: `Buscando "${searchTermValue}" no código...`, delay: 500 },
            { percent: 35, text: "Analisando scripts...", delay: 800 },
            { percent: 55, text: "Verificando elementos...", delay: 1000 },
            { percent: 75, text: "Analisando recursos...", delay: 800 },
            { percent: 90, text: "Gerando relatório...", delay: 600 },
        ];

        simulateProgress(DOM.searchProgressFill, DOM.searchProgressText, steps);

        try {
            const data = await apiJSON("/search-site", "POST", {
                session_id: state.sessionId,
                search_term: searchTermValue,
                folder_name: folderName,
            });

            DOM.searchProgressFill.style.width = "100%";
            DOM.searchProgressText.textContent = "Busca concluída!";

            state.lastSearchReport = {
                data: data,
                searchTerm: searchTermValue,
                folderName: folderName,
            };

            displaySearchResults(data, searchTermValue);

            showToast(
                `Busca concluída! ${data.findings_count} item(ns) encontrado(s)`,
                data.findings_count > 0 ? "success" : "warning",
                5000
            );
        } catch (err) {
            DOM.searchProgressFill.style.width = "0%";
            DOM.searchProgressText.textContent = "Erro na busca";
            showToast(`Erro na busca: ${err.message}`, "error");
        } finally {
            state.isBusy = false;
            updateModuleButtons();
            btnText.style.display = "inline";
            btnLoad.style.display = "none";
            setTimeout(() => {
                DOM.searchProgress.style.display = "none";
                DOM.searchProgressFill.style.width = "0%";
            }, 3000);
        }
    }

    async function downloadSearchReport() {
        if (!state.sessionId) {
            showToast("Nenhuma sessão ativa", "warning");
            return;
        }

        const searchTermValue = state.lastSearchReport?.searchTerm || DOM.searchTerm.value.trim();
        const folderName = state.lastSearchReport?.folderName || DOM.searchFolderName.value.trim() || "resultado-busca";

        if (!searchTermValue) {
            showToast("Faça uma busca primeiro", "warning");
            return;
        }

        try {
            showToast("Gerando relatório TXT...", "info", 2000);

            const { blob, headers } = await apiBlob("/search-site-txt", "POST", {
                session_id: state.sessionId,
                search_term: searchTermValue,
                folder_name: folderName,
            });

            const disposition = headers["content-disposition"] || "";
            const filenameMatch = disposition.match(/filename=(.+)/);
            const filename = filenameMatch
                ? filenameMatch[1]
                : `${folderName}_${searchTermValue}_${Date.now()}.txt`;

            downloadBlob(blob, filename);
            showToast("Relatório de busca TXT baixado!", "success");
        } catch (err) {
            showToast(`Erro ao baixar relatório: ${err.message}`, "error");
        }
    }

    // ─────────────────────────────────────────
    // EXIBIÇÃO DOS RESULTADOS DE ERROS
    // ─────────────────────────────────────────

    const categoryLabels = {
        console_errors: { label: "Erros do Console", type: "error" },
        console_warnings: { label: "Avisos do Console", type: "warning" },
        javascript_errors: { label: "Erros de JavaScript", type: "error" },
        network_errors: { label: "Erros de Rede", type: "error" },
        resource_errors: { label: "Erros de Recursos", type: "error" },
        css_errors: { label: "Erros de CSS", type: "error" },
        html_errors: { label: "Erros de HTML", type: "error" },
        accessibility_errors: { label: "Acessibilidade", type: "warning" },
        security_warnings: { label: "Segurança", type: "warning" },
        performance_warnings: { label: "Performance", type: "warning" },
        broken_links: { label: "Links Quebrados", type: "error" },
        seo_warnings: { label: "SEO", type: "info" },
    };

    function displayErrorResults(report) {
        DOM.resultsSection.style.display = "block";
        DOM.summaryErrors.textContent = `${report.total_errors} erro(s)`;
        DOM.summaryWarnings.textContent = `${report.total_warnings} aviso(s)`;
        renderErrorsTab("all", report.details);
        setTimeout(() => {
            DOM.resultsSection.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }, 300);
    }

    function renderErrorsTab(tab, details) {
        DOM.resultsContent.innerHTML = "";

        if (tab === "all") {
            let hasAny = false;
            for (const [key, config] of Object.entries(categoryLabels)) {
                const items = details[key] || [];
                if (items.length === 0) continue;
                hasAny = true;
                DOM.resultsContent.appendChild(
                    createErrorCategoryBlock(config.label, items, config.type)
                );
            }
            if (!hasAny) {
                DOM.resultsContent.innerHTML = `
                    <div class="result-empty">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                            <polyline points="22 4 12 14.01 9 11.01"/>
                        </svg>
                        <p>Nenhum problema encontrado! O site está limpo.</p>
                    </div>
                `;
            }
        } else {
            const config = categoryLabels[tab];
            const items = details[tab] || [];
            if (items.length === 0) {
                DOM.resultsContent.innerHTML = `
                    <div class="result-empty">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                            <polyline points="22 4 12 14.01 9 11.01"/>
                        </svg>
                        <p>Nenhum problema encontrado nesta categoria.</p>
                    </div>
                `;
            } else {
                DOM.resultsContent.appendChild(
                    createErrorCategoryBlock(config.label, items, config.type)
                );
            }
        }
    }

    function createErrorCategoryBlock(label, items, type) {
        const div = document.createElement("div");
        div.className = "result-category";

        let html = `
            <div class="result-category-header">
                <span>${label}</span>
                <span class="result-category-count">${items.length}</span>
            </div>
        `;

        items.forEach((item) => {
            const message = extractErrorMessage(item);
            const itemType = item.type || item.level || type;

            let typeClass = "info";
            if (type === "error" || itemType === "SEVERE" || (typeof itemType === "string" && itemType.includes("ERROR"))) {
                typeClass = "error";
            } else if (type === "warning" || itemType === "WARNING") {
                typeClass = "warning";
            }

            html += `
                <div class="result-item">
                    <span class="result-type ${typeClass}">${escapeHTML(String(itemType))}</span>
                    <span class="result-message">${escapeHTML(message)}</span>
                </div>
            `;
        });

        div.innerHTML = html;
        return div;
    }

    function extractErrorMessage(item) {
        if (typeof item === "string") return item;
        let parts = [];
        if (item.message) parts.push(item.message);
        if (item.url && item.url !== "inline") parts.push(`URL: ${item.url}`);
        if (item.status_code) parts.push(`Status: ${item.status_code}`);
        if (item.element) parts.push(`Elemento: ${item.element}`);
        if (item.text) parts.push(`Texto: "${item.text}"`);
        if (item.duration) parts.push(`Duração: ${item.duration}ms`);
        if (item.source && item.source !== "checker") parts.push(`Fonte: ${item.source}`);
        return parts.join(" | ") || JSON.stringify(item);
    }

    // ─────────────────────────────────────────
    // EXIBIÇÃO DOS RESULTADOS DE BUSCA
    // ─────────────────────────────────────────

    function displaySearchResults(data, searchTermValue) {
        DOM.searchResultsSection.style.display = "block";
        DOM.summarySearchTerm.textContent = `"${searchTermValue}"`;
        DOM.summarySearchCount.textContent = `${data.findings_count} encontrado(s)`;

        DOM.searchResultsContent.innerHTML = "";

        if (data.findings_count === 0) {
            DOM.searchResultsContent.innerHTML = `
                <div class="search-result-empty">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"/>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <p>Nenhum resultado encontrado para "<strong>${escapeHTML(searchTermValue)}</strong>"</p>
                    <div class="search-suggestions">
                        Termos suportados:
                        <code>api</code> <code>links</code> <code>imagens</code>
                        <code>formulários</code> <code>scripts</code> <code>meta</code>
                        <code>css</code> <code>fontes</code> <code>cookies</code><br>
                        Ou digite qualquer termo para buscar no código fonte.
                    </div>
                </div>
            `;
        } else {
            // Agrupar por categoria
            const categories = {};
            data.findings.forEach((item) => {
                const cat = item.category;
                if (!categories[cat]) categories[cat] = [];
                categories[cat].push(item);
            });

            for (const [catName, items] of Object.entries(categories)) {
                const catDiv = document.createElement("div");
                catDiv.className = "search-result-category";

                let html = `
                    <div class="search-result-category-header">
                        <span>${escapeHTML(catName)}</span>
                        <span class="search-result-category-count">${items.length}</span>
                    </div>
                `;

                items.forEach((item) => {
                    html += `
                        <div class="search-result-item">
                            <span class="search-result-item-type">${escapeHTML(item.type)}</span>
                            <span class="search-result-item-value">${escapeHTML(item.value)}</span>
                            ${item.detail ? `<span class="search-result-item-detail">${escapeHTML(item.detail)}</span>` : ""}
                        </div>
                    `;
                });

                catDiv.innerHTML = html;
                DOM.searchResultsContent.appendChild(catDiv);
            }
        }

        setTimeout(() => {
            DOM.searchResultsSection.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }, 300);
    }

    // ─────────────────────────────────────────
    // EVENT LISTENERS
    // ─────────────────────────────────────────

    // Auth
    DOM.btnAuth.addEventListener("click", authenticate);
    DOM.authTokenInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") authenticate();
    });
    DOM.authToggleVisibility.addEventListener("click", togglePasswordVisibility);
    DOM.btnLogout.addEventListener("click", logout);

    // URL
    DOM.btnOpen.addEventListener("click", openSite);
    DOM.urlInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") openSite();
    });

    // Screenshot
    DOM.btnScreenshot.addEventListener("click", takeScreenshot);
    DOM.btnClosePreview.addEventListener("click", () => {
        DOM.screenshotContainer.style.display = "none";
    });

    // Login no site
    DOM.btnSiteLogin.addEventListener("click", openLoginModal);
    DOM.btnCloseLogin.addEventListener("click", closeLoginModal);
    DOM.btnDoLogin.addEventListener("click", doSiteLogin);
    DOM.loginTogglePassword.addEventListener("click", toggleLoginPasswordVisibility);

    // Fechar login modal clicando fora
    DOM.loginOverlay.addEventListener("click", (e) => {
        if (e.target === DOM.loginOverlay) {
            closeLoginModal();
        }
    });

    // Enter no login
    DOM.loginPassword.addEventListener("keydown", (e) => {
        if (e.key === "Enter") doSiteLogin();
    });

    // Fechar sessão
    DOM.btnClose.addEventListener("click", closeSession);

    // Módulo Backup
    DOM.btnBackup.addEventListener("click", backupSite);

    // Módulo Erros
    DOM.btnCheckErrors.addEventListener("click", checkErrors);

    // Módulo Busca
    DOM.btnSearchSite.addEventListener("click", searchSite);
    DOM.searchTerm.addEventListener("keydown", (e) => {
        if (e.key === "Enter") searchSite();
    });

    // Download TXT erros
    DOM.btnDownloadTxt.addEventListener("click", downloadErrorReport);

    // Download TXT busca
    DOM.btnDownloadSearchTxt.addEventListener("click", downloadSearchReport);

    // Limpar resultados erros
    DOM.btnClearResults.addEventListener("click", () => {
        DOM.resultsSection.style.display = "none";
        DOM.resultsContent.innerHTML = "";
        state.lastErrorReport = null;
    });

    // Limpar resultados busca
    DOM.btnClearSearchResults.addEventListener("click", () => {
        DOM.searchResultsSection.style.display = "none";
        DOM.searchResultsContent.innerHTML = "";
        state.lastSearchReport = null;
    });

    // Tabs dos resultados de erros
    document.querySelectorAll(".tab-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            const tab = btn.dataset.tab;
            if (state.lastErrorReport) {
                renderErrorsTab(tab, state.lastErrorReport.json.details);
            }
        });
    });

    // ─────────────────────────────────────────
    // INICIALIZAÇÃO
    // ─────────────────────────────────────────

    function init() {
        updateModuleButtons();
        updateSessionBadge();

        // Verificar se tem token salvo no sessionStorage
        const savedToken = sessionStorage.getItem("sitetools_token");

        if (savedToken && state.backendUrl) {
            state.token = savedToken;

            fetch(`${state.backendUrl.replace(/\/+$/, "")}/auth/verify`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${savedToken}`,
                },
            })
            .then((resp) => {
                if (resp.ok) {
                    state.isAuthenticated = true;
                    state.isConnected = true;
                    updateServerStatus("online");
                    hideAuthModal();
                    showToast("Reconectado automaticamente!", "success");
                } else {
                    throw new Error("Token inválido");
                }
            })
            .catch(() => {
                state.token = null;
                sessionStorage.removeItem("sitetools_token");
                showAuthModal();
            });
        } else {
            showAuthModal();
        }

        console.log(
            "%c Site Tools %c v1.2.0 %c Seguro ",
            "background: #6c5ce7; color: white; padding: 4px 8px; border-radius: 4px 0 0 4px; font-weight: bold;",
            "background: #00cec9; color: white; padding: 4px 8px;",
            "background: #00b894; color: white; padding: 4px 8px; border-radius: 0 4px 4px 0;"
        );
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
