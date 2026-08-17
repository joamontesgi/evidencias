const App = {
  selectedFiles: [],
  isUploading: false,
  isSearching: false,
  activeTab: "upload",
  previewUrls: [],

  els: {},

  init() {
    this.cacheElements();
    this.bindEvents();
    this.checkConfig();
    this.renderAuthState(false);
    this.switchTab("upload");
  },

  cacheElements() {
    const ids = [
      "auth-section",
      "main-section",
      "btn-signin",
      "btn-signout",
      "auth-status",
      "upload-form",
      "view-form",
      "file-input",
      "drop-zone",
      "file-list",
      "btn-upload",
      "btn-search",
      "upload-progress",
      "progress-bar",
      "progress-text",
      "toast",
      "config-warning",
      "tab-upload",
      "tab-view",
      "panel-upload",
      "panel-view",
      "view-loading",
      "view-empty",
      "view-results",
      "lightbox",
      "lightbox-content",
      "lightbox-close",
    ];
    ids.forEach((id) => {
      this.els[id] = document.getElementById(id);
    });
  },

  bindEvents() {
    this.els["btn-signin"].addEventListener("click", () => Auth.signIn());
    this.els["btn-signout"].addEventListener("click", () => Auth.signOut());
    this.els["upload-form"].addEventListener("submit", (e) => this.handleSubmit(e));
    this.els["view-form"].addEventListener("submit", (e) => this.handleSearch(e));
    this.els["file-input"].addEventListener("change", (e) => this.addFiles(e.target.files));
    this.els["tab-upload"].addEventListener("click", () => this.switchTab("upload"));
    this.els["tab-view"].addEventListener("click", () => this.switchTab("view"));
    this.els["lightbox-close"].addEventListener("click", () => this.closeLightbox());
    this.els["lightbox"].addEventListener("click", (e) => {
      if (e.target === this.els["lightbox"]) this.closeLightbox();
    });

    this.els["drop-zone"].addEventListener("dragover", (e) => {
      e.preventDefault();
      this.els["drop-zone"].classList.add("border-blue-500", "bg-blue-50");
    });
    this.els["drop-zone"].addEventListener("dragleave", () => {
      this.els["drop-zone"].classList.remove("border-blue-500", "bg-blue-50");
    });
    this.els["drop-zone"].addEventListener("drop", (e) => {
      e.preventDefault();
      this.els["drop-zone"].classList.remove("border-blue-500", "bg-blue-50");
      this.addFiles(e.dataTransfer.files);
    });
  },

  switchTab(tab) {
    this.activeTab = tab;
    const isUpload = tab === "upload";

    this.els["panel-upload"].classList.toggle("hidden", !isUpload);
    this.els["panel-view"].classList.toggle("hidden", isUpload);

    this.els["tab-upload"].className = isUpload
      ? "tab-btn flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition bg-blue-600 text-white"
      : "tab-btn flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition text-slate-600 hover:bg-slate-50";

    this.els["tab-view"].className = !isUpload
      ? "tab-btn flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition bg-blue-600 text-white"
      : "tab-btn flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition text-slate-600 hover:bg-slate-50";
  },

  checkConfig() {
    const clientId = window.APP_CONFIG?.GOOGLE_CLIENT_ID || "";
    if (clientId.includes("TU_CLIENT_ID")) {
      this.els["config-warning"].classList.remove("hidden");
    }
  },

  onAuthSuccess() {
    this.renderAuthState(true);
    this.showToast("Conectado a Google Drive", "success");
  },

  onAuthSignedOut() {
    this.renderAuthState(false);
    this.clearViewResults();
    this.closeLightbox();
    this.showToast("Sesión cerrada", "info");
  },

  onAuthError(error) {
    this.showToast(`Error de autenticación: ${error}`, "error");
  },

  renderAuthState(isAuth) {
    this.els["auth-section"].classList.toggle("hidden", isAuth);
    this.els["main-section"].classList.toggle("hidden", !isAuth);
    this.els["auth-status"].textContent = isAuth
      ? "Conectado a Google Drive"
      : "No conectado";
  },

  addFiles(fileList) {
    const maxBytes = window.APP_CONFIG.MAX_FILE_SIZE_MB * 1024 * 1024;
    const allowed = window.APP_CONFIG.ALLOWED_TYPES;

    for (const file of fileList) {
      if (!allowed.includes(file.type) && !file.type.startsWith("image/") && !file.type.startsWith("video/")) {
        this.showToast(`Tipo no permitido: ${file.name}`, "error");
        continue;
      }
      if (file.size > maxBytes) {
        this.showToast(`${file.name} supera ${window.APP_CONFIG.MAX_FILE_SIZE_MB} MB`, "error");
        continue;
      }
      if (!this.selectedFiles.some((f) => f.name === file.name && f.size === file.size)) {
        this.selectedFiles.push(file);
      }
    }

    this.renderFileList();
    this.els["file-input"].value = "";
  },

  removeFile(index) {
    this.selectedFiles.splice(index, 1);
    this.renderFileList();
  },

  renderFileList() {
    const list = this.els["file-list"];
    list.innerHTML = "";

    if (this.selectedFiles.length === 0) {
      list.innerHTML = '<p class="text-sm text-slate-500">No hay archivos seleccionados.</p>';
      this.els["btn-upload"].disabled = true;
      return;
    }

    this.els["btn-upload"].disabled = this.isUploading;

    this.selectedFiles.forEach((file, index) => {
      const item = document.createElement("div");
      item.className =
        "flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2";
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      const icon = file.type.startsWith("video/") ? "🎬" : "📷";
      item.innerHTML = `
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium text-slate-800">${icon} ${file.name}</p>
          <p class="text-xs text-slate-500">${sizeMb} MB · ${file.type || "desconocido"}</p>
        </div>
        <button type="button" data-index="${index}" class="remove-file text-sm text-red-600 hover:text-red-800">Quitar</button>
      `;
      list.appendChild(item);
    });

    list.querySelectorAll(".remove-file").forEach((btn) => {
      btn.addEventListener("click", () => this.removeFile(Number(btn.dataset.index)));
    });
  },

  async handleSubmit(e) {
    e.preventDefault();
    if (this.isUploading || this.selectedFiles.length === 0) return;

    const apartment = document.getElementById("apartment").value.trim();
    const owner = document.getElementById("owner").value.trim();
    const evidenceType = document.getElementById("evidence-type").value;
    const notes = document.getElementById("notes").value.trim();

    if (!apartment || !owner) {
      this.showToast("Completa número de apartamento y nombre del propietario.", "error");
      return;
    }

    this.isUploading = true;
    this.els["btn-upload"].disabled = true;
    this.els["upload-progress"].classList.remove("hidden");

    const total = this.selectedFiles.length;
    let completed = 0;

    try {
      this.setProgress(0, "Preparando carpetas en Drive...");
      const folderId = await Drive.ensureUploadPath({ apartment, owner, evidenceType });

      for (const file of this.selectedFiles) {
        const basePct = Math.round((completed / total) * 100);
        this.setProgress(basePct, `Subiendo ${completed + 1} de ${total}: ${file.name}`);

        await Drive.uploadFile(file, folderId, (filePct) => {
          const overall = Math.round(((completed + filePct / 100) / total) * 100);
          this.setProgress(overall, `Subiendo ${completed + 1} de ${total}: ${file.name}`);
        });

        completed += 1;
      }

      if (notes) {
        await this.saveNotes(folderId, { apartment, owner, evidenceType, notes });
      }

      this.setProgress(100, "¡Subida completada!");
      this.showToast(`${total} archivo(s) guardados en Google Drive`, "success");
      this.selectedFiles = [];
      this.renderFileList();
      document.getElementById("notes").value = "";
    } catch (err) {
      console.error(err);
      this.showToast(err.message || "Error al subir archivos", "error");
    } finally {
      this.isUploading = false;
      this.els["btn-upload"].disabled = this.selectedFiles.length === 0;
      setTimeout(() => {
        this.els["upload-progress"].classList.add("hidden");
        this.setProgress(0, "");
      }, 2500);
    }
  },

  async handleSearch(e) {
    e.preventDefault();
    if (this.isSearching) return;

    const apartment = document.getElementById("view-apartment").value.trim();
    const owner = document.getElementById("view-owner").value.trim();

    if (!apartment || !owner) {
      this.showToast("Completa número de apartamento y nombre del propietario.", "error");
      return;
    }

    this.isSearching = true;
    this.els["btn-search"].disabled = true;
    this.clearViewResults();
    this.els["view-loading"].classList.remove("hidden");
    this.els["view-empty"].classList.add("hidden");
    this.els["view-results"].classList.add("hidden");

    try {
      const data = await Drive.listEvidence({ apartment, owner });

      this.els["view-loading"].classList.add("hidden");

      if (!data) {
        this.els["view-empty"].classList.remove("hidden");
        return;
      }

      const totalFiles = data.sections.reduce((sum, s) => sum + s.files.length, 0);
      if (totalFiles === 0) {
        this.els["view-empty"].classList.remove("hidden");
        return;
      }

      this.renderViewResults(data);
      this.els["view-results"].classList.remove("hidden");
    } catch (err) {
      console.error(err);
      this.els["view-loading"].classList.add("hidden");
      this.showToast(err.message || "Error al buscar evidencias", "error");
    } finally {
      this.isSearching = false;
      this.els["btn-search"].disabled = false;
    }
  },

  clearViewResults() {
    this.revokePreviewUrls();
    this.els["view-results"].innerHTML = "";
    this.els["view-results"].classList.add("hidden");
    this.els["view-empty"].classList.add("hidden");
    this.els["view-loading"].classList.add("hidden");
  },

  revokePreviewUrls() {
    this.previewUrls.forEach((url) => URL.revokeObjectURL(url));
    this.previewUrls = [];
  },

  renderViewResults(data) {
    const container = this.els["view-results"];
    container.innerHTML = "";

    const header = document.createElement("div");
    header.className = "rounded-xl border border-blue-200 bg-blue-50 px-5 py-4";
    header.innerHTML = `
      <h3 class="font-semibold text-blue-900">Apto ${data.apartment} — ${data.owner}</h3>
      <p class="mt-1 text-sm text-blue-700">Evidencias encontradas en Google Drive</p>
    `;
    container.appendChild(header);

    data.sections.forEach((section) => {
      const block = document.createElement("div");
      block.className = "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm";

      const count = section.files.length;
      block.innerHTML = `
        <div class="mb-4 flex items-center justify-between gap-3">
          <h4 class="font-semibold text-slate-800">${section.label}</h4>
          <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">${count} archivo(s)</span>
        </div>
      `;

      if (count === 0) {
        const empty = document.createElement("p");
        empty.className = "text-sm text-slate-500";
        empty.textContent = "No hay archivos en esta categoría.";
        block.appendChild(empty);
      } else {
        const actions = document.createElement("div");
        actions.className = "mb-4";
        const downloadAllBtn = document.createElement("button");
        downloadAllBtn.type = "button";
        downloadAllBtn.className =
          "rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50";
        downloadAllBtn.textContent = "Descargar todos";
        downloadAllBtn.addEventListener("click", () => this.downloadAll(section.files));
        actions.appendChild(downloadAllBtn);
        block.appendChild(actions);

        const grid = document.createElement("div");
        grid.className = "grid gap-4 sm:grid-cols-2 lg:grid-cols-3";

        section.files.forEach((file) => {
          grid.appendChild(this.createEvidenceCard(file));
        });

        block.appendChild(grid);
      }

      container.appendChild(block);
    });
  },

  createEvidenceCard(file) {
    const card = document.createElement("div");
    card.className = "overflow-hidden rounded-xl border border-slate-200 bg-slate-50";

    const displayName = Drive.displayFileName(file.name);
    const isImage = Drive.isImage(file.mimeType);
    const isVideo = Drive.isVideo(file.mimeType);
    const isMedia = isImage || isVideo;

    const preview = document.createElement("div");
    preview.className = "flex aspect-video items-center justify-center bg-slate-200";

    if (isMedia) {
      preview.classList.add("cursor-pointer");
      preview.innerHTML = `<span class="text-sm text-slate-500">Cargando vista previa...</span>`;
      this.loadPreview(file, preview, isVideo);
      preview.addEventListener("click", () => this.openLightbox(file));
    } else {
      preview.innerHTML = `<span class="text-3xl">${file.mimeType === "text/plain" ? "📝" : "📄"}</span>`;
    }

    const body = document.createElement("div");
    body.className = "space-y-2 p-3";
    body.innerHTML = `
      <p class="truncate text-sm font-medium text-slate-800" title="${displayName}">${displayName}</p>
      <p class="text-xs text-slate-500">${Drive.formatSize(file.size)} · ${Drive.formatDate(file.createdTime)}</p>
    `;

    const btnRow = document.createElement("div");
    btnRow.className = "flex gap-2";

    const downloadBtn = document.createElement("button");
    downloadBtn.type = "button";
    downloadBtn.className =
      "flex-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700";
    downloadBtn.textContent = "Descargar";
    downloadBtn.addEventListener("click", () => this.downloadSingle(file, downloadBtn));

    btnRow.appendChild(downloadBtn);

    if (isMedia) {
      const viewBtn = document.createElement("button");
      viewBtn.type = "button";
      viewBtn.className =
        "rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-white";
      viewBtn.textContent = "Ver";
      viewBtn.addEventListener("click", () => this.openLightbox(file));
      btnRow.appendChild(viewBtn);
    }

    body.appendChild(btnRow);
    card.appendChild(preview);
    card.appendChild(body);
    return card;
  },

  async loadPreview(file, container, isVideo) {
    try {
      const blob = await Drive.fetchFileBlob(file.id);
      const url = URL.createObjectURL(blob);
      this.previewUrls.push(url);

      if (isVideo) {
        container.innerHTML = `<video src="${url}" class="h-full w-full object-cover" muted preload="metadata"></video>`;
      } else {
        container.innerHTML = `<img src="${url}" alt="${Drive.displayFileName(file.name)}" class="h-full w-full object-cover" />`;
      }
    } catch {
      container.innerHTML = `<span class="text-3xl">${isVideo ? "🎬" : "📷"}</span>`;
    }
  },

  async downloadSingle(file, button) {
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = "Descargando...";

    try {
      await Drive.downloadFile(file);
      this.showToast(`Descargado: ${Drive.displayFileName(file.name)}`, "success");
    } catch (err) {
      this.showToast(err.message || "Error al descargar", "error");
    } finally {
      button.disabled = false;
      button.textContent = originalText;
    }
  },

  async downloadAll(files) {
    if (files.length === 0) return;

    this.showToast(`Descargando ${files.length} archivo(s)...`, "info");

    for (const file of files) {
      try {
        await Drive.downloadFile(file);
        await new Promise((r) => setTimeout(r, 400));
      } catch (err) {
        this.showToast(`Error con ${Drive.displayFileName(file.name)}`, "error");
      }
    }

    this.showToast("Descarga completada", "success");
  },

  async openLightbox(file) {
    const box = this.els["lightbox"];
    const content = this.els["lightbox-content"];
    content.innerHTML = `<p class="text-white">Cargando...</p>`;
    box.classList.remove("hidden");
    box.classList.add("flex");

    try {
      const blob = await Drive.fetchFileBlob(file.id);
      const url = URL.createObjectURL(blob);
      this.previewUrls.push(url);

      if (Drive.isVideo(file.mimeType)) {
        content.innerHTML = `<video src="${url}" controls autoplay class="max-h-[85vh] max-w-full rounded-lg"></video>`;
      } else if (Drive.isImage(file.mimeType)) {
        content.innerHTML = `<img src="${url}" alt="${Drive.displayFileName(file.name)}" class="max-h-[85vh] max-w-full rounded-lg" />`;
      } else {
        content.innerHTML = `<p class="rounded-lg bg-white px-4 py-3 text-sm text-slate-800">${Drive.displayFileName(file.name)}</p>`;
      }
    } catch (err) {
      content.innerHTML = `<p class="text-white">${err.message}</p>`;
    }
  },

  closeLightbox() {
    this.els["lightbox"].classList.add("hidden");
    this.els["lightbox"].classList.remove("flex");
    this.els["lightbox-content"].innerHTML = "";
  },

  async saveNotes(folderId, meta) {
    const content = [
      "Evidencia de apartamento",
      "========================",
      `Apartamento: ${meta.apartment}`,
      `Propietario: ${meta.owner}`,
      `Tipo: ${window.APP_CONFIG.EVIDENCE_TYPES[meta.evidenceType]}`,
      `Fecha: ${new Date().toLocaleString("es-CO")}`,
      "",
      "Notas:",
      meta.notes,
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain" });
    const file = new File([blob], `notas_${Date.now()}.txt`, { type: "text/plain" });
    await Drive.uploadFile(file, folderId);
  },

  setProgress(pct, text) {
    this.els["progress-bar"].style.width = `${pct}%`;
    this.els["progress-text"].textContent = text;
  },

  showToast(message, type = "info") {
    const colors = {
      success: "bg-emerald-600",
      error: "bg-red-600",
      info: "bg-slate-700",
    };
    const toast = this.els["toast"];
    toast.textContent = message;
    toast.className = `fixed bottom-6 right-6 z-50 max-w-sm rounded-lg px-4 py-3 text-sm text-white shadow-lg ${colors[type] || colors.info}`;
    toast.classList.remove("hidden");
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => toast.classList.add("hidden"), 4000);
  },
};

window.addEventListener("load", () => {
  try {
    App.init();
    if (window.google?.accounts?.oauth2) {
      Auth.init();
    } else {
      window.addEventListener("google-loaded", () => Auth.init());
    }
  } catch (err) {
    console.error(err);
    App.showToast(err.message, "error");
  }
});
