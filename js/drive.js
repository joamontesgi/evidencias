const Drive = {
  DRIVE_API: "https://www.googleapis.com/drive/v3",
  UPLOAD_API: "https://www.googleapis.com/upload/drive/v3",

  async findFolder(name, parentId = null) {
    const escaped = name.replace(/'/g, "\\'");
    let query = `mimeType='application/vnd.google-apps.folder' and name='${escaped}' and trashed=false`;
    if (parentId) {
      query += ` and '${parentId}' in parents`;
    } else {
      query += " and 'root' in parents";
    }

    const params = new URLSearchParams({
      q: query,
      fields: "files(id,name)",
      pageSize: "1",
    });

    const res = await fetch(`${this.DRIVE_API}/files?${params}`, {
      headers: Auth.getHeaders(),
    });

    if (!res.ok) {
      throw await this.parseError(res, "No se pudo buscar la carpeta");
    }

    const data = await res.json();
    return data.files?.[0] ?? null;
  },

  async createFolder(name, parentId = null) {
    const metadata = {
      name,
      mimeType: "application/vnd.google-apps.folder",
    };
    if (parentId) metadata.parents = [parentId];

    const res = await fetch(`${this.DRIVE_API}/files`, {
      method: "POST",
      headers: Auth.getHeaders(),
      body: JSON.stringify(metadata),
    });

    if (!res.ok) {
      throw await this.parseError(res, "No se pudo crear la carpeta");
    }

    return res.json();
  },

  async getOrCreateFolder(name, parentId = null) {
    const existing = await this.findFolder(name, parentId);
    if (existing) return existing;
    return this.createFolder(name, parentId);
  },

  async ensureUploadPath({ apartment, owner, evidenceType }) {
    const root = await this.getOrCreateFolder(window.APP_CONFIG.ROOT_FOLDER_NAME);
    const aptLabel = this.buildApartmentLabel(apartment, owner);
    const aptFolder = await this.getOrCreateFolder(aptLabel, root.id);
    const typeLabel = window.APP_CONFIG.EVIDENCE_TYPES[evidenceType] || evidenceType;
    const typeFolder = await this.getOrCreateFolder(typeLabel, aptFolder.id);
    return typeFolder.id;
  },

  buildApartmentLabel(apartment, owner) {
    return `Apto ${apartment} - ${owner}`.trim();
  },

  displayFileName(name) {
    return name.replace(/^\d{4}-\d{2}-\d{2}T[\d-]+Z?_/, "");
  },

  async findApartmentFolder(apartment, owner) {
    const root = await this.findFolder(window.APP_CONFIG.ROOT_FOLDER_NAME);
    if (!root) return null;
    return this.findFolder(this.buildApartmentLabel(apartment, owner), root.id);
  },

  async listFilesInFolder(folderId) {
    const q = `'${folderId}' in parents and trashed=false and mimeType!='application/vnd.google-apps.folder'`;
    const params = new URLSearchParams({
      q,
      fields: "files(id,name,mimeType,size,createdTime,thumbnailLink)",
      orderBy: "createdTime desc",
      pageSize: "100",
    });

    const res = await fetch(`${this.DRIVE_API}/files?${params}`, {
      headers: Auth.getHeaders(),
    });

    if (!res.ok) {
      throw await this.parseError(res, "No se pudieron listar los archivos");
    }

    const data = await res.json();
    return data.files || [];
  },

  async listEvidence({ apartment, owner }) {
    const aptFolder = await this.findApartmentFolder(apartment, owner);
    if (!aptFolder) return null;

    const sections = [];
    for (const [key, label] of Object.entries(window.APP_CONFIG.EVIDENCE_TYPES)) {
      const typeFolder = await this.findFolder(label, aptFolder.id);
      const files = typeFolder ? await this.listFilesInFolder(typeFolder.id) : [];
      sections.push({ key, label, files });
    }

    return { apartment, owner, sections };
  },

  async fetchFileBlob(fileId) {
    const res = await fetch(`${this.DRIVE_API}/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${Auth.accessToken}` },
    });

    if (!res.ok) {
      throw await this.parseError(res, "No se pudo descargar el archivo");
    }

    return res.blob();
  },

  async downloadFile(file) {
    const blob = await this.fetchFileBlob(file.id);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = this.displayFileName(file.name);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  },

  isImage(mimeType) {
    return mimeType?.startsWith("image/");
  },

  isVideo(mimeType) {
    return mimeType?.startsWith("video/");
  },

  formatSize(bytes) {
    if (!bytes) return "—";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  },

  formatDate(iso) {
    if (!iso) return "";
    return new Date(iso).toLocaleString("es-CO", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  },

  async uploadFile(file, folderId, onProgress) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const safeName = file.name.replace(/[^\w.\-() ]/g, "_");
    const fileName = `${timestamp}_${safeName}`;

    // Archivos menores a 5 MB: subida multipart simple
    if (file.size < 5 * 1024 * 1024) {
      return this.uploadMultipart(file, folderId, fileName, onProgress);
    }

    return this.uploadResumable(file, folderId, fileName, onProgress);
  },

  async uploadMultipart(file, folderId, fileName, onProgress) {
    const metadata = {
      name: fileName,
      parents: [folderId],
    };

    const form = new FormData();
    form.append(
      "metadata",
      new Blob([JSON.stringify(metadata)], { type: "application/json" })
    );
    form.append("file", file);

    onProgress?.(10);

    const res = await fetch(`${this.UPLOAD_API}/files?uploadType=multipart&fields=id,name,webViewLink`, {
      method: "POST",
      headers: { Authorization: `Bearer ${Auth.accessToken}` },
      body: form,
    });

    if (!res.ok) {
      throw await this.parseError(res, "Error al subir el archivo");
    }

    onProgress?.(100);
    return res.json();
  },

  async uploadResumable(file, folderId, fileName, onProgress) {
    const metadata = {
      name: fileName,
      parents: [folderId],
    };

    const initRes = await fetch(`${this.UPLOAD_API}/files?uploadType=resumable&fields=id,name,webViewLink`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Auth.accessToken}`,
        "Content-Type": "application/json",
        "X-Upload-Content-Type": file.type || "application/octet-stream",
        "X-Upload-Content-Length": String(file.size),
      },
      body: JSON.stringify(metadata),
    });

    if (!initRes.ok) {
      throw await this.parseError(initRes, "No se pudo iniciar la subida");
    }

    const uploadUrl = initRes.headers.get("Location");
    if (!uploadUrl) {
      throw new Error("Google Drive no devolvió URL de subida.");
    }

    const chunkSize = 256 * 1024;
    let uploaded = 0;

    while (uploaded < file.size) {
      const chunk = file.slice(uploaded, uploaded + chunkSize);
      const end = uploaded + chunk.size - 1;

      const res = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Length": String(chunk.size),
          "Content-Range": `bytes ${uploaded}-${end}/${file.size}`,
        },
        body: chunk,
      });

      if (res.status === 308) {
        uploaded += chunk.size;
        const pct = Math.round((uploaded / file.size) * 100);
        onProgress?.(pct);
        continue;
      }

      if (!res.ok) {
        throw await this.parseError(res, "Error durante la subida");
      }

      onProgress?.(100);
      return res.json();
    }

    throw new Error("La subida no se completó correctamente.");
  },

  async parseError(res, fallback) {
    let detail = fallback;
    try {
      const data = await res.json();
      detail = data.error?.message || fallback;
    } catch {
      // ignore
    }
    return new Error(`${detail} (HTTP ${res.status})`);
  },
};
