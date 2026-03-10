// =============================================
// SITE BACKUP & ERROR CHECKER — Frontend Logic
// =============================================

(function () {
    "use strict";

    // ─────────────────────────────────────────
    // ESTADO GLOBAL
    // ─────────────────────────────────────────
    const state = {
        backendUrl: "",
        sessionId: null,
        siteUrl: null,
        siteTitle: null,
        isConnected: false,
        isBusy: false,
        lastErrorReport: null,
    };

    // ─────────────────────────────────────────
    // ELEMENTOS DO DOM
    // ─────────────────────────────────────────
    const DOM = {
        // Config
        backendUrl: document.getElementById("backendUrl"),
        btnTestConnection: document.getElementById("btnTestConnection"),

        // URL
        urlInput: document.getElementById("urlInput"),
        btnOpen: document.getElementById("btnOpen"),

        // Site Status
        siteStatus: document.getElementById("siteStatus"),
        siteStatusText: document.getElementById("siteStatusText"),
        siteTitleText: document.getElementById("siteTitleText"),
        siteUrlText: document.getElementById("siteUrlText"),
        btnScreenshot: document.getElementById("btnScreenshot"),
        btnClose: document.getElementById("btnClose"),

        // Screenshot
        screenshotContainer: document.getElementById("screenshotContainer"),
        screenshotImg: document.getElementById("screenshotImg"),
        btnClosePreview: document.getElementById("btnClosePreview"),

        // Server Status
        serverStatus: document.getElementById("serverStatus"),
        sessionBadge: document.getElementById("sessionBadge"),
        sessionIdDisplay: document.getElementById("sessionIdDisplay"),

        // Modules
        btnBackup: document.getElementById("btnBackup"),
        btnCheckErrors: document.getElementById("btnCheckErrors"),
        backupFolderName: document.getElementById("backupFolderName"),
        errorFolderName: document.getElementById("errorFolderName"),

        // Backup Progress
        backupProgress: document.getElementById("backupProgress"),
        backupProgressFill: document.getElementById("backupProgressFill"),
        backupProgressText: document.getElementById("backupProgressText"),

        // Errors Progress
        errorsProgress: document.getElementById("errorsProgress"),
        errorsProgressFill: document.getElementById("errorsProgressFill"),
        errorsProgressText: document.getElementById("errorsProgressText"),

        // Results
        resultsSection: document.getElementById("resultsSection"),
        resultsContent: document.getElementById("resultsContent"),
        summaryErrors: document.getElementById("summaryErrors"),
        summaryWarnings: document.getElementById("summaryWarnings"),
        btnDownloadTxt: document.getElementById("btnDownloadTxt"),
        btnClearResults: document.getElementById("btnClearResults"),

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

    /**
     * Toast notification
     */
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

    /**
     * Loading overlay
     */
    function showLoading(text = "Processando...", subtext = "Aguarde") {
        DOM.loadingText.textContent = text;
        DOM.loadingSubtext.textContent = subtext;
        DOM.loadingOverlay.style.display = "flex";
    }

    function hideLoading() {
        DOM.loadingOverlay.style.display = "none";
    }

    /**
     * Atualiza status do servidor no header
     */
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

    /**
     * Atualiza estado da sessão no header
     */
    function updateSessionBadge() {
        if (state.sessionId) {
            DOM.sessionBadge.style.display = "flex";
            DOM.sessionIdDisplay.textContent = state.sessionId;
        } else {
            DOM.sessionBadge.style.display = "none";
        }
    }

    /**
     * Habilita/desabilita botões dos módulos
     */
    function updateModuleButtons() {
        const hasSession = !!state.sessionId;
        DOM.btnBackup.disabled = !hasSession || state.isBusy;
        DOM.btnCheckErrors.disabled = !hasSession || state.isBusy;
    }

    /**
     * Faz requisição ao backend
     */
    async function apiRequest(endpoint, method = "GET", body = null) {
        if (!state.backendUrl) {
            showToast("Configure a URL do backend primeiro", "warning");
            throw new Error("Backend URL não configurada");
        }

        const url = `${state.backendUrl.replace(/\/+$/, "")}${endpoint}`;

        const options = {
            method,
            headers: {},
        };

        if (body) {
            options.headers["Content-Type"] = "application/json";
            options.body = JSON.stringify(body);
        }

        const response = await fetch(url, options);

        if (!response.ok) {
            let errorMsg = `Erro ${response.status}`;
            try {
                const errData = await response.json();
                errorMsg = errData.detail || errorMsg;
            } catch (e) {
                // Ignorar
            }
            throw new Error(errorMsg);
        }

        return response;
    }

    /**
     * Faz requisição que retorna JSON
     */
    async function apiJSON(endpoint, method = "GET", body = null) {
        const response = await apiRequest(endpoint, method, body);
        return await response.json();
    }

    /**
     * Faz requisição que retorna Blob (arquivo)
     */
    async function apiBlob(endpoint, method = "GET", body = null) {
        const response = await apiRequest(endpoint, method, body);
        const headers = {};
        response.headers.forEach((value, key) => {
            headers[key] = value;
        });
        const blob = await response.blob();
        return { blob, headers };
    }

    /**
     * Dispara download de um blob
     */
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

    /**
     * Simula progresso (fake progress para UX)
     */
    function simulateProgress(fillElement, textElement, steps, onComplete) {
        let currentStep = 0;

        const interval = setInterval(() => {
            if (currentStep >= steps.length) {
                clearInterval(interval);
                if (onComplete) onComplete();
                return;
            }

            const step = steps[currentStep];
            fillElement.style.width = step.percent + "%";
            textElement.textContent = step.text;
            currentStep++;
        }, step => step?.delay || 800);

        // Fallback: usar timeout sequencial
        clearInterval(interval);
        let delay = 0;
        steps.forEach((step, i) => {
            delay += step.delay || 800;
            setTimeout(() => {
                fillElement.style.width = step.percent + "%";
                textElement.textContent = step.text;
                if (i === steps.length - 1 && onComplete) {
                    onComplete();
                }
            }, delay);
        });
    }

    /**
     * Salva config no localStorage
     */
    function saveConfig() {
        localStorage.setItem("sitetools_backend_url", state.backendUrl);
    }

    function loadConfig() {
        const saved = localStorage.getItem("sitetools_backend_url");
        if (saved) {
            state.backendUrl = saved;
            DOM.backendUrl.value = saved;
        }
    }

    // ─────────────────────────────────────────
    // AÇÕES PRINCIPAIS
    // ─────────────────────────────────────────

    /**
     * Testar conexão com o backend
     */
    async function testConnection() {
        state.backendUrl = DOM.backendUrl.value.trim();

        if (!state.backendUrl) {
            showToast("Digite a URL do backend", "warning");
            return;
        }

        updateServerStatus("loading");

        try {
            const data = await apiJSON("/");
            if (data.status === "online") {
                state.isConnected = true;
                updateServerStatus("online");
                saveConfig();
                showToast(
                    `Conectado! Servidor v${data.version} — ${data.active_sessions} sessão(ões) ativa(s)`,
                    "success"
                );
            } else {
                throw new Error("Resposta inesperada");
            }
        } catch (err) {
            state.isConnected = false;
            updateServerStatus("offline");
            showToast(`Falha na conexão: ${err.message}`, "error");
        }
    }

    /**
     * Abrir site
     */
    async function openSite() {
        let url = DOM.urlInput.value.trim();

        if (!url) {
            showToast("Digite uma URL", "warning");
            DOM.urlInput.focus();
            return;
        }

        if (!state.isConnected) {
            showToast("Conecte ao backend primeiro", "warning");
            return;
        }

        // Adicionar protocolo se não tiver
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            url = "https://" + url;
        }

        showLoading("Abrindo site...", `Carregando ${url}`);
        state.isBusy = true;
        updateModuleButtons();

        try {
            // Fechar sessão anterior se existir
            if (state.sessionId) {
                try {
                    await apiJSON("/close", "POST", {
                        session_id: state.sessionId,
                    });
                } catch (e) {
                    // Ignorar
                }
            }

            const data = await apiJSON("/open", "POST", { url });

            state.sessionId = data.session_id;
            state.siteUrl = data.url;
            state.siteTitle = data.title;

            // Atualizar UI
            DOM.siteStatus.style.display = "flex";
            DOM.siteStatusText.textContent = "Carregado";
            DOM.siteStatusText.style.color = "#00b894";
            DOM.siteTitleText.textContent = data.title;
            DOM.siteUrlText.textContent = data.url;

            updateSessionBadge();
            updateModuleButtons();

            showToast(`Site aberto: ${data.title}`, "success");
        } catch (err) {
            showToast(`Erro ao abrir site: ${err.message}`, "error");
            state.sessionId = null;
            DOM.siteStatus.style.display = "none";
            updateSessionBadge();
            updateModuleButtons();
        } finally {
            state.isBusy = false;
            updateModuleButtons();
            hideLoading();
        }
    }

    /**
     * Capturar screenshot
     */
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

            // Scroll para o screenshot
            DOM.screenshotContainer.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
            });

            showToast("Screenshot capturado!", "success");
        } catch (err) {
            showToast(`Erro no screenshot: ${err.message}`, "error");
        }
    }

    /**
     * Fechar sessão
     */
    async function closeSession() {
        if (!state.sessionId) return;

        try {
            await apiJSON("/close", "POST", {
                session_id: state.sessionId,
            });
            showToast("Sessão encerrada", "info");
        } catch (err) {
            // Ignorar erro ao fechar
        }

        state.sessionId = null;
        state.siteUrl = null;
        state.siteTitle = null;

        DOM.siteStatus.style.display = "none";
        DOM.screenshotContainer.style.display = "none";
        DOM.resultsSection.style.display = "none";

        updateSessionBadge();
        updateModuleButtons();
    }

    /**
     * MÓDULO 1 — Backup do Site
     */
    async function backupSite() {
        if (!state.sessionId || state.isBusy) return;

        const folderName =
            DOM.backupFolderName.value.trim() || "backup";

        state.isBusy = true;
        updateModuleButtons();

        // Mostrar progresso
        const btnText = DOM.btnBackup.querySelector(".btn-text");
        const btnLoad = DOM.btnBackup.querySelector(".btn-loading");
        btnText.style.display = "none";
        btnLoad.style.display = "inline-flex";

        DOM.backupProgress.style.display = "block";

        // Simular progresso
        const steps = [
            { percent: 10, text: "Capturando HTML...", delay: 500 },
            { percent: 25, text: "Baixando CSS...", delay: 1000 },
            { percent: 40, text: "Baixando JavaScript...", delay: 1200 },
            { percent: 55, text: "Baixando imagens...", delay: 1500 },
            { percent: 70, text: "Baixando fontes...", delay: 800 },
            { percent: 85, text: "Gerando screenshot...", delay: 600 },
            { percent: 92, text: "Empacotando ZIP...", delay: 800 },
        ];

        simulateProgress(
            DOM.backupProgressFill,
            DOM.backupProgressText,
            steps
        );

        try {
            const { blob, headers } = await apiBlob("/backup", "POST", {
                session_id: state.sessionId,
                folder_name: folderName,
            });

            // Completar progresso
            DOM.backupProgressFill.style.width = "100%";
            DOM.backupProgressText.textContent = "Backup concluído!";

            // Extrair filename do header ou gerar um
            const disposition = headers["content-disposition"] || "";
            const filenameMatch = disposition.match(/filename=(.+)/);
            const filename = filenameMatch
                ? filenameMatch[1]
                : `${folderName}_${Date.now()}.zip`;

            // Disparar download
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

    /**
     * MÓDULO 2 — Verificar Erros
     */
    async function checkErrors() {
        if (!state.sessionId || state.isBusy) return;

        const folderName =
            DOM.errorFolderName.value.trim() || "relatorio-erros";

        state.isBusy = true;
        updateModuleButtons();

        // Mostrar progresso
        const btnText = DOM.btnCheckErrors.querySelector(".btn-text");
        const btnLoad = DOM.btnCheckErrors.querySelector(".btn-loading");
        btnText.style.display = "none";
        btnLoad.style.display = "inline-flex";

        DOM.errorsProgress.style.display = "block";

        // Simular progresso
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

        simulateProgress(
            DOM.errorsProgressFill,
            DOM.errorsProgressText,
            steps
        );

        try {
            // Pedir JSON para exibir no frontend
            const reportJSON = await apiJSON("/check-errors-json", "POST", {
                session_id: state.sessionId,
                folder_name: folderName,
            });

            // Completar progresso
            DOM.errorsProgressFill.style.width = "100%";
            DOM.errorsProgressText.textContent = "Análise concluída!";

            // Salvar para download posterior
            state.lastErrorReport = {
                json: reportJSON,
                folderName: folderName,
            };

            // Exibir resultados no frontend
            displayResults(reportJSON);

            showToast(
                `Análise concluída! ${reportJSON.total_errors} erros e ${reportJSON.total_warnings} avisos encontrados`,
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

    /**
     * Baixar relatório TXT
     */
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

            const { blob, headers } = await apiBlob(
                "/check-errors",
                "POST",
                {
                    session_id: state.sessionId,
                    folder_name: folderName,
                }
            );

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
    // EXIBIÇÃO DOS RESULTADOS
    // ─────────────────────────────────────────

    const categoryLabels = {
        console_errors: { label: "Erros do Console", type: "error" },
        console_warnings: { label: "Avisos do Console", type: "warning" },
        javascript_errors: { label: "Erros de JavaScript", type: "error" },
        network_errors: { label: "Erros de Rede", type: "error" },
        resource_errors: { label: "Erros de Recursos", type: "error" },
        css_errors: { label: "Erros de CSS", type: "error" },
        html_errors: { label: "Erros de HTML", type: "error" },
        accessibility_errors: {
            label: "Acessibilidade",
            type: "warning",
        },
        security_warnings: { label: "Segurança", type: "warning" },
        performance_warnings: { label: "Performance", type: "warning" },
        broken_links: { label: "Links Quebrados", type: "error" },
        seo_warnings: { label: "SEO", type: "info" },
    };

    /**
     * Exibe os resultados na seção de resultados
     */
    function displayResults(report) {
        DOM.resultsSection.style.display = "block";
        DOM.summaryErrors.textContent = `${report.total_errors} erro(s)`;
        DOM.summaryWarnings.textContent = `${report.total_warnings} aviso(s)`;

        // Renderizar todos inicialmente
        renderResultsTab("all", report.details);

        // Scroll para resultados
        setTimeout(() => {
            DOM.resultsSection.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }, 300);
    }

    /**
     * Renderiza conteúdo de uma tab
     */
    function renderResultsTab(tab, details) {
        DOM.resultsContent.innerHTML = "";

        if (tab === "all") {
            // Mostrar todas as categorias
            let hasAny = false;

            for (const [key, config] of Object.entries(categoryLabels)) {
                const items = details[key] || [];
                if (items.length === 0) continue;

                hasAny = true;
                const categoryDiv = createCategoryBlock(
                    config.label,
                    items,
                    config.type
                );
                DOM.resultsContent.appendChild(categoryDiv);
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
            // Mostrar categoria específica
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
                const categoryDiv = createCategoryBlock(
                    config.label,
                    items,
                    config.type
                );
                DOM.resultsContent.appendChild(categoryDiv);
            }
        }
    }

    /**
     * Cria bloco visual de uma categoria
     */
    function createCategoryBlock(label, items, type) {
        const div = document.createElement("div");
        div.className = "result-category";

        let headerHTML = `
            <div class="result-category-header">
                <span>${label}</span>
                <span class="result-category-count">${items.length}</span>
            </div>
        `;

        let itemsHTML = "";
        items.forEach((item) => {
            const message = extractMessage(item);
            const itemType = item.type || item.level || type;

            let typeClass = "info";
            if (
                type === "error" ||
                itemType === "SEVERE" ||
                itemType.includes("ERROR")
            ) {
                typeClass = "error";
            } else if (
                type === "warning" ||
                itemType === "WARNING"
            ) {
                typeClass = "warning";
            }

            itemsHTML += `
                <div class="result-item">
                    <span class="result-type ${typeClass}">${itemType}</span>
                    <span class="result-message">${escapeHTML(message)}</span>
                </div>
            `;
        });

        div.innerHTML = headerHTML + itemsHTML;
        return div;
    }

    /**
     * Extrai mensagem legível de um item de resultado
     */
    function extractMessage(item) {
        if (typeof item === "string") return item;

        let parts = [];

        if (item.message) parts.push(item.message);
        if (item.url && item.url !== "inline")
            parts.push(`URL: ${item.url}`);
        if (item.status_code) parts.push(`Status: ${item.status_code}`);
        if (item.element) parts.push(`Elemento: ${item.element}`);
        if (item.text) parts.push(`Texto: "${item.text}"`);
        if (item.duration) parts.push(`Duração: ${item.duration}ms`);
        if (item.source && item.source !== "checker")
            parts.push(`Fonte: ${item.source}`);

        return parts.join(" | ") || JSON.stringify(item);
    }

    /**
     * Escape HTML para evitar XSS
     */
    function escapeHTML(str) {
        const div = document.createElement("div");
        div.textContent = str;
        return div.innerHTML;
    }

    // ─────────────────────────────────────────
    // EVENT LISTENERS
    // ─────────────────────────────────────────

    // Config: Testar conexão
    DOM.btnTestConnection.addEventListener("click", testConnection);

    DOM.backendUrl.addEventListener("keydown", (e) => {
        if (e.key === "Enter") testConnection();
    });

    // URL: Abrir site
    DOM.btnOpen.addEventListener("click", openSite);

    DOM.urlInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") openSite();
    });

    // Screenshot
    DOM.btnScreenshot.addEventListener("click", takeScreenshot);

    // Fechar preview do screenshot
    DOM.btnClosePreview.addEventListener("click", () => {
        DOM.screenshotContainer.style.display = "none";
    });

    // Fechar sessão
    DOM.btnClose.addEventListener("click", closeSession);

    // Módulo Backup
    DOM.btnBackup.addEventListener("click", backupSite);

    // Módulo Erros
    DOM.btnCheckErrors.addEventListener("click", checkErrors);

    // Download TXT
    DOM.btnDownloadTxt.addEventListener("click", downloadErrorReport);

    // Limpar resultados
    DOM.btnClearResults.addEventListener("click", () => {
        DOM.resultsSection.style.display = "none";
        DOM.resultsContent.innerHTML = "";
        state.lastErrorReport = null;
    });

    // Tabs dos resultados
    document.querySelectorAll(".tab-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            // Ativar tab
            document
                .querySelectorAll(".tab-btn")
                .forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");

            // Renderizar conteúdo da tab
            const tab = btn.dataset.tab;
            if (state.lastErrorReport) {
                renderResultsTab(tab, state.lastErrorReport.json.details);
            }
        });
    });

    // ─────────────────────────────────────────
    // INICIALIZAÇÃO
    // ─────────────────────────────────────────

    function init() {
        loadConfig();
        updateModuleButtons();
        updateSessionBadge();

        // Auto-testar conexão se tem URL salva
        if (state.backendUrl) {
            setTimeout(testConnection, 500);
        }

        console.log(
            "%c Site Backup & Error Checker %c v1.0.0 ",
            "background: #6c5ce7; color: white; padding: 4px 8px; border-radius: 4px 0 0 4px; font-weight: bold;",
            "background: #00cec9; color: white; padding: 4px 8px; border-radius: 0 4px 4px 0;"
        );
    }

    // Iniciar quando DOM estiver pronto
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
