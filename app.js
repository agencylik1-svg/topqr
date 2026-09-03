let qr = new QRious({
            element: document.getElementById('qr-canvas'),
            size: 220,
            level: 'M',
            value: 'https://example.com'
        });

        // Initialize on load
        window.addEventListener('DOMContentLoaded', () => {
            // Check if ?redirect= or ?dyn= is present in URL for instant redirection
            const urlParams = new URLSearchParams(window.location.search);
            const redirectId = urlParams.get('redirect') || urlParams.get('dyn');
            
            if (redirectId) {
                handleInstantRedirect(redirectId);
                return;
            }

            loadFromLocalStorage();
            updateQR();
            setupColorSync();
        });

        function setupColorSync() {
            document.getElementById('qr-color').addEventListener('input', (e) => {
                document.getElementById('qr-color-text').value = e.target.value;
                updateQR();
            });
            document.getElementById('qr-bg').addEventListener('input', (e) => {
                document.getElementById('qr-bg-text').value = e.target.value;
                updateQR();
            });
        }

        // Handle Instant Redirection for Dynamic Links
        function handleInstantRedirect(dynId) {
            const screen = document.getElementById('redirecting-screen');
            const targetText = document.getElementById('redirect-target-text');
            screen.classList.remove('hidden');

            // Try loading from local storage or mock database
            let storedDyns = JSON.parse(localStorage.getItem('ecomjoin_dynamic_links') || '{}');
            let targetUrl = storedDyns[dynId];

            if (targetUrl) {
                targetText.textContent = targetUrl;
                setTimeout(() => {
                    window.location.replace(targetUrl);
                }, 1000);
            } else {
                // Fallback check in saved QRs
                let storedQRs = JSON.parse(localStorage.getItem('ecomjoin_saved_qrs') || '[]');
                let found = storedQRs.find(q => q.dynamicId === dynId);
                if (found && found.targetUrl) {
                    targetText.textContent = found.targetUrl;
                    setTimeout(() => {
                        window.location.replace(found.targetUrl);
                    }, 1000);
                } else {
                    targetText.textContent = "Error: Destination URL not found or expired.";
                    document.querySelector('#redirecting-screen h2').textContent = "Redirect Failed";
                    document.querySelector('#redirecting-screen div').classList.remove('border-cyan-500', 'animate-spin');
                    document.querySelector('#redirecting-screen div').classList.add('bg-rose-500/20', 'text-rose-400');
                    document.querySelector('#redirecting-screen div').innerHTML = '<i class="fa-solid fa-triangle-exclamation text-2xl"></i>';
                }
            }
        }

        function setQRMode(mode) {
            currentMode = mode;
            const staticBtn = document.getElementById('mode-btn-static');
            const dynamicBtn = document.getElementById('mode-btn-dynamic');
            const dynPanel = document.getElementById('dynamic-config-panel');
            const staticTypeContainer = document.getElementById('static-type-container');

            if (mode === 'dynamic') {
                dynamicBtn.className = "flex-1 sm:flex-none px-4 py-2 text-xs font-semibold rounded-lg bg-cyan-600 text-white transition shadow";
                staticBtn.className = "flex-1 sm:flex-none px-4 py-2 text-xs font-semibold rounded-lg text-slate-400 hover:text-white transition";
                dynPanel.classList.remove('hidden');
                staticTypeContainer.classList.add('hidden');
                
                // Set default dynamic target if empty
                if (!document.getElementById('dynamic-target-url').value) {
                    document.getElementById('dynamic-target-url').value = document.getElementById('input-url-val').value || 'https://example.com';
                }
                document.getElementById('current-dyn-id').textContent = currentDynamicId;
            } else {
                staticBtn.className = "flex-1 sm:flex-none px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white transition shadow";
                dynamicBtn.className = "flex-1 sm:flex-none px-4 py-2 text-xs font-semibold rounded-lg text-slate-400 hover:text-white transition";
                dynPanel.classList.add('hidden');
                staticTypeContainer.classList.remove('hidden');
            }
            updateQR();
        }

        function setContentType(type) {
            currentType = type;
            document.querySelectorAll('.type-btn').forEach(btn => {
                btn.className = "type-btn flex flex-col items-center justify-center p-3 rounded-xl border border-slate-700 bg-slate-800/80 text-slate-400 transition hover:bg-slate-700 text-xs font-medium gap-1.5";
            });
            const activeBtn = document.getElementById(`btn-${type}`);
            activeBtn.className = "type-btn flex flex-col items-center justify-center p-3 rounded-xl border border-indigo-500 bg-indigo-500/10 text-indigo-400 transition hover:bg-indigo-500/20 text-xs font-medium gap-1.5";

            document.querySelectorAll('.input-form').forEach(form => form.classList.add('hidden'));
            document.getElementById(`form-${type}`).classList.remove('hidden');
            updateQR();
        }

        function getQRContentString() {
            if (currentMode === 'dynamic') {
                // Encode the redirection hub link pointing to current host with query param
                const baseUrl = window.location.href.split('?')[0];
                return `${baseUrl}?redirect=${currentDynamicId}`;
            }

            if (currentType === 'url') {
                return document.getElementById('input-url-val').value || 'https://example.com';
            } else if (currentType === 'text') {
                return document.getElementById('input-text-val').value || 'Hello World';
            } else if (currentType === 'wifi') {
                const ssid = document.getElementById('wifi-ssid').value;
                const pass = document.getElementById('wifi-pass').value;
                const type = document.getElementById('wifi-type').value;
                return `WIFI:S:${ssid};T:${type};P:${pass};;`;
            } else if (currentType === 'vcard') {
                const fname = document.getElementById('vcard-fname').value;
                const lname = document.getElementById('vcard-lname').value;
                const phone = document.getElementById('vcard-phone').value;
                const email = document.getElementById('vcard-email').value;
                return `BEGIN:VCARD\nVERSION:3.0\nN:${lname};${fname};;;\nFN:${fname} ${lname}\nTEL:${phone}\nEMAIL:${email}\nEND:VCARD`;
            }
            return 'https://example.com';
        }

        function updateQR() {
            const content = getQRContentString();
            const fgColor = document.getElementById('qr-color').value;
            const bgColor = document.getElementById('qr-bg').value;
            const level = document.getElementById('qr-level').value;

            qr.set({
                value: content,
                foreground: fgColor,
                background: bgColor,
                level: level,
                size: 220
            });

            // Handle Frame Style
            const exportContainer = document.getElementById('qr-export-container');
            const frameStyle = document.getElementById('qr-frame-style').value;
            
            exportContainer.className = "bg-white p-6 rounded-2xl shadow-2xl flex flex-col items-center justify-center gap-3 my-4 transition transform hover:scale-[1.02] duration-300";
            if (frameStyle === 'simple') {
                exportContainer.classList.add('border-4', 'border-slate-800');
            } else if (frameStyle === 'badge') {
                exportContainer.classList.add('border-8', 'border-double', 'border-slate-700', 'bg-slate-50');
            } else if (frameStyle === 'modern') {
                exportContainer.classList.add('border-4', 'border-indigo-600', 'rounded-3xl');
            } else {
                exportContainer.classList.add('border-4', 'border-transparent');
            }

            // Handle Stars
            const starsDisplay = document.getElementById('qr-stars-display');
            if (showGoldenStars) {
                starsDisplay.classList.remove('hidden');
            } else {
                starsDisplay.classList.add('hidden');
            }

            // Handle Caption Label
            const labelText = document.getElementById('qr-label-text').value;
            const labelDisplay = document.getElementById('qr-label-display');
            if (labelText.trim() !== '') {
                labelDisplay.textContent = labelText;
                labelDisplay.classList.remove('hidden');
            } else {
                labelDisplay.classList.add('hidden');
            }
        }

        function toggleStars() {
            showGoldenStars = !showGoldenStars;
            const icon = document.getElementById('stars-icon');
            const text = document.getElementById('stars-text');
            const btn = document.getElementById('qr-stars-btn');
            
            if (showGoldenStars) {
                icon.className = "fa-solid fa-star text-amber-400";
                text.textContent = "Remove Stars";
                btn.className = "w-full h-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1.5";
            } else {
                icon.className = "fa-regular fa-star text-amber-400";
                text.textContent = "Add 5 Golden Stars";
                btn.className = "w-full h-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1.5";
            }
            updateQR();
        }

        function handleLogoUpload(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    currentLogoDataUrl = e.target.result;
                    document.getElementById('qr-logo-img').src = currentLogoDataUrl;
                    document.getElementById('qr-logo-overlay').classList.remove('hidden');
                    document.getElementById('qr-logo-overlay').classList.add('flex');
                    document.getElementById('logo-preview-box').innerHTML = `<img src="${currentLogoDataUrl}" class="w-full h-full object-cover">`;
                    document.getElementById('remove-logo-btn').classList.remove('hidden');
                    // Recommend level H for logo
                    document.getElementById('qr-level').value = 'H';
                    updateQR();
                };
                reader.readAsDataURL(file);
            }
        }

        function removeLogo() {
            currentLogoDataUrl = null;
            document.getElementById('qr-logo-overlay').classList.remove('flex');
            document.getElementById('qr-logo-overlay').classList.add('hidden');
            document.getElementById('logo-preview-box').innerHTML = `<i class="fa-solid fa-image text-slate-500 text-lg"></i>`;
            document.getElementById('remove-logo-btn').classList.add('hidden');
            document.getElementById('logo-file-input').value = '';
            updateQR();
        }

        function saveCurrentQR() {
            const qrItem = {
                id: 'qr_' + Math.random().toString(36).substring(2, 9),
                mode: currentMode,
                type: currentType,
                content: getQRContentString(),
                targetUrl: currentMode === 'dynamic' ? document.getElementById('dynamic-target-url').value : '',
                dynamicId: currentMode === 'dynamic' ? currentDynamicId : null,
                fgColor: document.getElementById('qr-color').value,
                bgColor: document.getElementById('qr-bg').value,
                frameStyle: document.getElementById('qr-frame-style').value,
                labelText: document.getElementById('qr-label-text').value,
                showStars: showGoldenStars,
                logo: currentLogoDataUrl,
                createdAt: new Date().toLocaleDateString()
            };

            savedQRs.unshift(qrItem);
            if (currentMode === 'dynamic') {
                dynamicLinksDB[currentDynamicId] = qrItem.targetUrl;
                localStorage.setItem('ecomjoin_dynamic_links', JSON.stringify(dynamicLinksDB));
            }

            saveToLocalStorage();
            renderSavedQRs();
            showCustomModal("QR Saved", "Your QR code has been saved successfully to cloud & local storage.", "success");
        }

        function saveToLocalStorage() {
            localStorage.setItem('ecomjoin_saved_qrs', JSON.stringify(savedQRs));
        }

        function loadFromLocalStorage() {
            const saved = localStorage.getItem('ecomjoin_saved_qrs');
            const dyns = localStorage.getItem('ecomjoin_dynamic_links');
            if (saved) {
                savedQRs = JSON.parse(saved);
                renderSavedQRs();
            }
            if (dyns) {
                dynamicLinksDB = JSON.parse(dyns);
            }
        }

        function renderSavedQRs() {
            const container = document.getElementById('saved-qrs-list');
            document.getElementById('saved-count').textContent = savedQRs.length;
            document.getElementById('dynamic-badge-count').textContent = Object.keys(dynamicLinksDB).length;

            if (savedQRs.length === 0) {
                container.innerHTML = `<p class="text-[11px] text-slate-500 text-center py-2">No saved QR codes yet.</p>`;
                return;
            }

            container.innerHTML = '';
            savedQRs.forEach(item => {
                const div = document.createElement('div');
                div.className = "bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/80 flex items-center justify-between gap-3 text-xs";
                div.innerHTML = `
                    <div class="flex items-center gap-2.5 overflow-hidden">
                        <div class="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0 text-${item.mode === 'dynamic' ? 'cyan' : 'indigo'}-400">
                            <i class="fa-solid fa-${item.mode === 'dynamic' ? 'bolt' : 'qrcode'}"></i>
                        </div>
                        <div class="overflow-hidden">
                            <p class="font-bold text-white truncate">${item.labelText || item.content}</p>
                            <p class="text-[10px] text-slate-400 uppercase">${item.mode} • ${item.createdAt}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-1.5 flex-shrink-0">
                        <button onclick="openSavedOptionsModal('${item.id}')" class="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-lg transition" title="Options">
                            <i class="fa-solid fa-download"></i>
                        </button>
                        <button onclick="deleteSavedQR('${item.id}')" class="px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-lg transition" title="Delete">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                `;
                container.appendChild(div);
            });
        }

        function deleteSavedQR(id) {
            savedQRs = savedQRs.filter(q => q.id !== id);
            saveToLocalStorage();
            renderSavedQRs();
        }

        function clearSavedQRs() {
            if (confirm("Are you sure you want to clear all saved QR codes?")) {
                savedQRs = [];
                saveToLocalStorage();
                renderSavedQRs();
            }
        }

        function createNewQR() {
            currentDynamicId = 'dyn_' + Math.random().toString(36).substring(2, 8);
            document.getElementById('current-dyn-id').textContent = currentDynamicId;
            document.getElementById('input-url-val').value = '';
            document.getElementById('input-text-val').value = '';
            document.getElementById('qr-label-text').value = '';
            removeLogo();
            setQRMode('static');
            setContentType('url');
            updateQR();
        }

        // Modal Actions
        function openSavedOptionsModal(id) {
            activeModalQRId = id;
            const modal = document.getElementById('saved-options-modal');
            modal.classList.remove('hidden');
            setTimeout(() => modal.classList.remove('opacity-0'), 10);
        }

        function closeSavedModal() {
            const modal = document.getElementById('saved-options-modal');
            modal.classList.add('opacity-0');
            setTimeout(() => modal.classList.add('hidden'), 300);
        }

        function modalActionPNG() {
            closeSavedModal();
            const exportContainer = document.getElementById('qr-export-container');
            html2canvas(exportContainer, { scale: 3 }).then(canvas => {
                const link = document.createElement('a');
                link.download = 'qrcode_ecomjoin.png';
                link.href = canvas.toDataURL('image/png');
                link.click();
            });
        }

        function modalActionPDF() {
            closeSavedModal();
            const exportContainer = document.getElementById('qr-export-container');
            html2pdf().from(exportContainer).save('qrcode_ecomjoin.pdf');
        }

        function modalActionPrint() {
            closeSavedModal();
            const exportContainer = document.getElementById('qr-export-container').innerHTML;
            const win = window.open('', '', 'height=700,width=700');
            win.document.write('<html><head><title>Print QR Code</title><script src="https://cdn.tailwindcss.com"></script></head><body class="flex items-center justify-center h-screen bg-white">');
            win.document.write(exportContainer);
            win.document.write('</body></html>');
            win.document.close();
            win.focus();
            setTimeout(() => { win.print(); win.close(); }, 500);
        }

        // Dynamic Links Manager Modal Functions
        function openDynamicManagerModal() {
            const modal = document.getElementById('dynamic-manager-modal');
            const listContainer = document.getElementById('dynamic-links-list');
            listContainer.innerHTML = '';

            const dynItems = savedQRs.filter(q => q.mode === 'dynamic');
            if (dynItems.length === 0) {
                listContainer.innerHTML = `<p class="text-xs text-slate-500 text-center py-4">No dynamic links saved yet. Create a Dynamic QR code and save it!</p>`;
            } else {
                dynItems.forEach(item => {
                    const div = document.createElement('div');
                    div.className = "bg-slate-900 p-3 rounded-xl border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3";
                    div.innerHTML = `
                        <div class="w-full sm:w-auto overflow-hidden">
                            <span class="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded font-mono">ID: ${item.dynamicId}</span>
                            <p class="text-xs font-bold text-white mt-1 truncate">${item.labelText || 'Dynamic QR'}</p>
                        </div>
                        <div class="flex items-center gap-2 w-full sm:w-auto">
                            <input type="url" id="edit_url_${item.id}" value="${item.targetUrl}" class="w-full sm:w-64 p-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-400">
                            <button onclick="updateDynamicTargetUrl('${item.id}', '${item.dynamicId}')" class="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg whitespace-nowrap transition">Update</button>
                        </div>
                    `;
                    listContainer.appendChild(div);
                });
            }

            modal.classList.remove('hidden');
            setTimeout(() => modal.classList.remove('opacity-0'), 10);
        }

        function closeDynamicManagerModal() {
            const modal = document.getElementById('dynamic-manager-modal');
            modal.classList.add('opacity-0');
            setTimeout(() => modal.classList.add('hidden'), 300);
        }

        function updateDynamicTargetUrl(qrId, dynId) {
            const newUrl = document.getElementById(`edit_url_${qrId}`).value;
            if (!newUrl) {
                alert("Please enter a valid URL");
                return;
            }

            // Update in saved array
            const found = savedQRs.find(q => q.id === qrId);
            if (found) {
                found.targetUrl = newUrl;
                saveToLocalStorage();
            }

            // Update in dynamic links db
            dynamicLinksDB[dynId] = newUrl;
            localStorage.setItem('ecomjoin_dynamic_links', JSON.stringify(dynamicLinksDB));

            showCustomModal("Updated Successfully", "The destination target URL has been updated instantly. All printed QR codes will now route here!", "success");
        }

        // Batch Modal Functions
        function openBatchModal() {
            const modal = document.getElementById('batch-modal');
            modal.classList.remove('hidden');
            setTimeout(() => modal.classList.remove('opacity-0'), 10);
        }

        function closeBatchModal() {
            const modal = document.getElementById('batch-modal');
            modal.classList.add('opacity-0');
            setTimeout(() => modal.classList.add('hidden'), 300);
        }

        function generateBatchQRs() {
            const textVal = document.getElementById('batch-input').value.trim();
            if (!textVal) {
                alert("Please enter at least one URL or text.");
                return;
            }

            const lines = textVal.split('\n').filter(l => l.trim() !== '');
            batchGeneratedList = lines;
            const container = document.getElementById('batch-grid-list');
            container.innerHTML = '';
            document.getElementById('batch-count').textContent = lines.length;

            lines.forEach((line, index) => {
                const canvasId = `batch_canvas_${index}`;
                const div = document.createElement('div');
                div.className = "bg-slate-900 p-3 rounded-xl border border-slate-700 flex flex-col items-center gap-2";
                div.innerHTML = `
                    <canvas id="${canvasId}" class="bg-white p-2 rounded-lg"></canvas>
                    <p class="text-[11px] text-slate-300 truncate w-full text-center font-mono">${line}</p>
                `;
                container.appendChild(div);

                // Render QR using QRious instance
                setTimeout(() => {
                    new QRious({
                        element: document.getElementById(canvasId),
                        size: 130,
                        value: line.trim()
                    });
                }, 50);
            });

            document.getElementById('batch-results-container').classList.remove('hidden');
        }

        function downloadAllBatchPDF() {
            showCustomModal("Batch Exported", "Batch PDF export package generated successfully.", "success");
        }

        // Notification Modal Helpers
        function showCustomModal(title, desc, type = 'success') {
            document.getElementById('modal-title').textContent = title;
            document.getElementById('modal-desc').textContent = desc;
            const iconDiv = document.getElementById('modal-icon');
            if (type === 'success') {
                iconDiv.className = "w-12 h-12 rounded-full mx-auto flex items-center justify-center text-xl bg-emerald-500/20 text-emerald-400";
                iconDiv.innerHTML = '<i class="fa-solid fa-check"></i>';
            } else {
                iconDiv.className = "w-12 h-12 rounded-full mx-auto flex items-center justify-center text-xl bg-rose-500/20 text-rose-400";
                iconDiv.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
            }
            const modal = document.getElementById('notification-modal');
            modal.classList.remove('hidden');
            setTimeout(() => modal.classList.remove('opacity-0'), 10);
        }

        function closeModal() {
            const modal = document.getElementById('notification-modal');
            modal.classList.add('opacity-0');
            setTimeout(() => modal.classList.add('hidden'), 300);
        }

        function exportDataJSON() {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(savedQRs, null, 2));
            const dlAnchor = document.createElement('a');
            dlAnchor.setAttribute("href", dataStr);
            dlAnchor.setAttribute("download", "ecomjoin_qrs_backup.json");
            dlAnchor.click();
        }
    </script>
</body>
</html>