// =====================================================================
// FIX.JS v2 - Completa o codigo cortado do script.js
// Protegido contra execucao duplicada
// =====================================================================
if (window._fixJsLoaded) { console.log('fix.js duplicado, ignorando.'); } else {
window._fixJsLoaded = true;

// 1) displaySearchResults completa
function displaySearchResults(data) {
    if (!DOM.searchResults) return;
    DOM.searchResults.style.display = 'block';
    DOM.searchResults.innerHTML = '';
    var totalFound = data.total_found || 0;
    var header = document.createElement('div');
    header.className = 'results-header';
    header.innerHTML = '<h3>Resultados da Busca</h3><div class="results-summary"><span class="summary-item info">Total encontrado: ' + totalFound + '</span></div>';
    DOM.searchResults.appendChild(header);
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
        var catLabel = (typeof categoryLabels !== 'undefined' && categoryLabels[gKey]) ? categoryLabels[gKey] : gKey;
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
    var ps = document.getElementById('searchResultsSection');
    if (ps) ps.style.display = 'block';
    setTimeout(function() { if (DOM.searchProgress) DOM.searchProgress.style.display = 'none'; }, 2000);
}

// 2) Wrap displayErrorResults
(function() {
    var _orig = typeof displayErrorResults === 'function' ? displayErrorResults : function() {};
    displayErrorResults = function(data) {
        _orig(data);
        var ps = document.getElementById('errorResultsSection');
        if (ps) ps.style.display = 'block';
        var totalE = 0, totalW = 0;
        if (data.summary) { totalE = data.summary.total_errors || 0; totalW = data.summary.total_warnings || 0; }
        var elE = document.getElementById('totalErrors');
        var elW = document.getElementById('totalWarnings');
        if (elE) elE.textContent = String(totalE);
        if (elW) elW.textContent = String(totalW);
        setTimeout(function() { if (DOM.errorProgress) DOM.errorProgress.style.display = 'none'; }, 2000);
    };
})();

// 3) Clear functions
function clearErrorResults() {
    var ps = document.getElementById('errorResultsSection'); if (ps) ps.style.display = 'none';
    if (DOM.errorResults) { DOM.errorResults.style.display = 'none'; DOM.errorResults.innerHTML = ''; }
    if (DOM.errorProgress) DOM.errorProgress.style.display = 'none';
    if (DOM.errorProgressFill) DOM.errorProgressFill.style.width = '0%';
    if (DOM.errorProgressText) DOM.errorProgressText.textContent = '';
    var e = document.getElementById('totalErrors'); if (e) e.textContent = '0';
    var w = document.getElementById('totalWarnings'); if (w) w.textContent = '0';
    state.lastErrorReport = null; showToast('Resultados limpos.', 'info');
}
function clearSearchResults() {
    var ps = document.getElementById('searchResultsSection'); if (ps) ps.style.display = 'none';
    if (DOM.searchResults) { DOM.searchResults.style.display = 'none'; DOM.searchResults.innerHTML = ''; }
    if (DOM.searchProgress) DOM.searchProgress.style.display = 'none';
    if (DOM.searchProgressFill) DOM.searchProgressFill.style.width = '0%';
    if (DOM.searchProgressText) DOM.searchProgressText.textContent = '';
    var f = document.getElementById('totalFound'); if (f) f.textContent = '0';
    var c = document.getElementById('totalCategories'); if (c) c.textContent = '0';
    state.lastSearchReport = null; showToast('Resultados limpos.', 'info');
}

// 4) Wrap backup/errors/search para esconder barra e evitar dupla execucao
(function() {
    var _bk = typeof backupSite === 'function' ? backupSite : null;
    var _bkR = false;
    if (_bk) { backupSite = function() {
        if (_bkR) return; _bkR = true; _bk();
        var ch = setInterval(function() { if (DOM.backupProgressText && DOM.backupProgressText.textContent.indexOf('concludo') >= 0) { setTimeout(function() { if (DOM.backupProgress) DOM.backupProgress.style.display='none'; if (DOM.backupProgressFill) DOM.backupProgressFill.style.width='0%'; if (DOM.backupProgressText) DOM.backupProgressText.textContent=''; _bkR=false; },3000); clearInterval(ch); } },1000);
        setTimeout(function(){clearInterval(ch);_bkR=false;},120000);
    };}

    var _ce = typeof checkErrors === 'function' ? checkErrors : null;
    var _ceR = false;
    if (_ce) { checkErrors = function() {
        if (_ceR) return; _ceR = true; _ce();
        setTimeout(function(){_ceR=false;},60000);
    };}

    var _ss = typeof searchSite === 'function' ? searchSite : null;
    var _ssR = false;
    if (_ss) { searchSite = function() {
        if (_ssR) return; _ssR = true; _ss();
        setTimeout(function(){_ssR=false;},60000);
    };}
})();

// 5) EVENT LISTENERS
function setupEventListeners() {
    if (window._listenersRegistered) return;
    window._listenersRegistered = true;
    console.log('Setting up event listeners...');
    if (DOM.btnAuth) DOM.btnAuth.addEventListener('click', function(){authenticate();});
    if (DOM.authTokenInput) DOM.authTokenInput.addEventListener('keydown', function(e){if(e.key==='Enter')authenticate();});
    if (DOM.btnTogglePassword) DOM.btnTogglePassword.addEventListener('click', function(){togglePasswordVisibility();});
    if (DOM.btnLogout) DOM.btnLogout.addEventListener('click', function(){logout();});
    if (DOM.btnOpen) DOM.btnOpen.addEventListener('click', function(){openSite();});
    if (DOM.urlInput) DOM.urlInput.addEventListener('keydown', function(e){if(e.key==='Enter')openSite();});
    if (DOM.btnScreenshot) DOM.btnScreenshot.addEventListener('click', function(){takeScreenshot();});
    if (DOM.btnLogin) DOM.btnLogin.addEventListener('click', function(){openInteraction();});
    if (DOM.btnScroll) DOM.btnScroll.addEventListener('click', function(){scrollPage('down');});
    if (DOM.btnClose) DOM.btnClose.addEventListener('click', function(){closeSession();});
    var su2=document.getElementById('btnScrollUp2'),sd2=document.getElementById('btnScrollDown2');
    if(su2) su2.addEventListener('click',function(){scrollPage('up');});
    if(sd2) sd2.addEventListener('click',function(){scrollPage('down');});
    if(DOM.btnScrollUp) DOM.btnScrollUp.addEventListener('click',function(){scrollPage('up');});
    if(DOM.btnScrollDown) DOM.btnScrollDown.addEventListener('click',function(){scrollPage('down');});
    if(DOM.btnCloseInteract) DOM.btnCloseInteract.addEventListener('click',function(){closeInteraction();});
    if(DOM.btnAutoLogin) DOM.btnAutoLogin.addEventListener('click',function(){autoLogin();});
    if(DOM.btnToggleAutoLoginPassword) DOM.btnToggleAutoLoginPassword.addEventListener('click',function(){toggleAutoLoginPassword();});
    if(DOM.btnOpenSiteTab) DOM.btnOpenSiteTab.addEventListener('click',function(){openSiteInNewTab();});
    if(DOM.btnCopyCommand) DOM.btnCopyCommand.addEventListener('click',function(){copyCommandToClipboard();});
    if(DOM.btnSyncCookies) DOM.btnSyncCookies.addEventListener('click',function(){syncCookies();});
    if(DOM.btnGetSeleniumCookies) DOM.btnGetSeleniumCookies.addEventListener('click',function(){getSeleniumCookies();});
    var rs=document.getElementById('btnRefreshSelenium'); if(rs) rs.addEventListener('click',function(){refreshSeleniumPage();});
    if(DOM.btnRefreshPreview) DOM.btnRefreshPreview.addEventListener('click',function(){refreshPreview();});
    var lpc=document.getElementById('livePreviewContainer'),lpi=document.getElementById('livePreviewImg');
    if(lpc&&lpi){lpc.addEventListener('click',function(e){if(!state.sessionId){showToast('Abra um site primeiro.','warning');return;}var r=lpi.getBoundingClientRect();if(r.width===0||r.height===0)return;var rx=Math.round((e.clientX-r.left)*(1920/r.width)),ry=Math.round((e.clientY-r.top)*(1080/r.height));clickOnPage(rx,ry);});}
    var brt=document.getElementById('btnRemoteType'),bre=document.getElementById('btnRemoteEnter'),rti=document.getElementById('remoteTextInput');
    if(brt) brt.addEventListener('click',function(){if(!rti||!rti.value){showToast('Digite algo.','warning');return;}typeOnPage(rti.value,false);});
    if(bre) bre.addEventListener('click',function(){if(!rti)return;typeOnPage(rti.value,true);});
    if(rti) rti.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();typeOnPage(rti.value,true);}});
    var btab=document.getElementById('btnRemoteTab'),besc=document.getElementById('btnRemoteEsc'),bbk=document.getElementById('btnRemoteBack'),bfw=document.getElementById('btnRemoteForward');
    if(btab) btab.addEventListener('click',function(){if(!state.sessionId)return;apiJSON('/type-text','POST',{session_id:state.sessionId,text:'\uE004',press_enter:false,clear_first:false}).then(function(d){if(d.screenshot)updateAllPreviewsBase64(d.screenshot);showToast('Tab!','info');}).catch(function(e){showToast('Erro: '+e.message,'error');});});
    if(besc) besc.addEventListener('click',function(){if(!state.sessionId)return;apiJSON('/type-text','POST',{session_id:state.sessionId,text:'\uE00C',press_enter:false,clear_first:false}).then(function(d){if(d.screenshot)updateAllPreviewsBase64(d.screenshot);showToast('Esc!','info');}).catch(function(e){showToast('Erro: '+e.message,'error');});});
    if(bbk) bbk.addEventListener('click',function(){if(!state.sessionId)return;apiJSON('/navigate','POST',{session_id:state.sessionId,url:'javascript:history.back()'}).then(function(){setTimeout(refreshPreview,500);}).catch(function(){setTimeout(refreshPreview,500);});});
    if(bfw) bfw.addEventListener('click',function(){if(!state.sessionId)return;apiJSON('/navigate','POST',{session_id:state.sessionId,url:'javascript:history.forward()'}).then(function(){setTimeout(refreshPreview,500);}).catch(function(){setTimeout(refreshPreview,500);});});
    var blc=document.getElementById('btnLoginCancel'),bld=document.getElementById('btnLoginDone');
    if(blc) blc.addEventListener('click',function(){closeInteraction();});
    if(bld) bld.addEventListener('click',function(){finishLogin();});
    if(DOM.btnBackup) DOM.btnBackup.addEventListener('click',function(){backupSite();});
    if(DOM.btnCheckErrors) DOM.btnCheckErrors.addEventListener('click',function(){checkErrors();});
    if(DOM.btnSearch) DOM.btnSearch.addEventListener('click',function(){searchSite();});
    if(DOM.btnDownloadErrors) DOM.btnDownloadErrors.addEventListener('click',function(){downloadErrorReport();});
    if(DOM.btnDownloadSearch) DOM.btnDownloadSearch.addEventListener('click',function(){downloadSearchReport();});
    if(DOM.btnClearErrors) DOM.btnClearErrors.addEventListener('click',function(){clearErrorResults();});
    if(DOM.btnClearSearch) DOM.btnClearSearch.addEventListener('click',function(){clearSearchResults();});
    console.log('All event listeners registered.');
}

// 6) INITIALIZATION
async function init() {
    if (window._initDone) { console.log('Init ja executado.'); return; }
    window._initDone = true;
    console.log('Initializing...');
    try {
        if (typeof BACKEND_CONFIG!=='undefined'&&BACKEND_CONFIG&&BACKEND_CONFIG.BACKEND_URL) { state.backendUrl=BACKEND_CONFIG.BACKEND_URL.replace(/\/+$/,''); }
        else { var cr=await fetch('config.js');var ct=await cr.text();var um=ct.match(/BACKEND_URL\s*[:=]\s*['"]([^'"]+)['"]/);if(um&&um[1])state.backendUrl=um[1].replace(/\/+$/,'');else{var hm=ct.match(/(https:\/\/[^\s'"]+\.hf\.space)/);if(hm)state.backendUrl=hm[1].replace(/\/+$/,'');}if(!state.backendUrl){showToast('Backend URL nao encontrada','error');return;} }
        console.log('Backend URL:',state.backendUrl);
    } catch(e){showToast('Erro config: '+e.message,'error');return;}
    if(!DOM.serverStatus) DOM.serverStatus=document.getElementById('serverStatusText');
    if(!DOM.sessionBadge) DOM.sessionBadge=document.getElementById('sessionBadgeText');
    try {
        var sr=await fetch(state.backendUrl+'/');var sd=await sr.json();console.log('Server:',sd);
        updateServerStatus(true); showToast('Servidor conectado!','success');
        if(sd.auth_required===true){var tk=localStorage.getItem('backup_auth_token');if(tk){try{var vr=await fetch(state.backendUrl+'/auth/verify',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+tk},body:'{}'});if(vr.ok){state.token=tk;hideAuthModal();updateSessionBadge(true);}else{localStorage.removeItem('backup_auth_token');showAuthModal();}}catch(ve){localStorage.removeItem('backup_auth_token');showAuthModal();}}else{showAuthModal();}}
        else{hideAuthModal();updateSessionBadge(true);}
    } catch(e){updateServerStatus(false);showToast('Servidor offline','error');}
    try{await checkExtension();}catch(e){}
    console.log('Init complete.');
}

// 7) STARTUP - espera 200ms para ver se script.js original ja iniciou
(function() {
    if (window._appStarted) return;

    function startApp() {
        if (window._appStarted) return;
        window._appStarted = true;
        if (typeof DOM === 'undefined' || !DOM.btnOpen) setupDOM();
        setupEventListeners();
        init();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(function() { if (!window._appStarted) startApp(); }, 200);
        });
    } else {
        setTimeout(function() { if (!window._appStarted) startApp(); }, 200);
    }
})();

} // fim do guard
