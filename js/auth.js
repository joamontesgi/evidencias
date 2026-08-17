const Auth = {
  accessToken: null,
  tokenClient: null,

  init() {
    if (!window.google?.accounts?.oauth2) {
      throw new Error("Google Identity Services no cargó. Revisa tu conexión.");
    }

    this.tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: window.APP_CONFIG.GOOGLE_CLIENT_ID,
      scope: "https://www.googleapis.com/auth/drive.file",
      callback: (response) => {
        if (response.error) {
          App.onAuthError(response.error);
          return;
        }
        this.accessToken = response.access_token;
        App.onAuthSuccess();
      },
    });
  },

  signIn() {
    if (!this.tokenClient) {
      this.init();
    }
    this.tokenClient.requestAccessToken({ prompt: "consent" });
  },

  signOut() {
    if (this.accessToken && window.google?.accounts?.oauth2) {
      google.accounts.oauth2.revoke(this.accessToken, () => {});
    }
    this.accessToken = null;
    App.onAuthSignedOut();
  },

  isAuthenticated() {
    return Boolean(this.accessToken);
  },

  getHeaders(json = true) {
    if (!this.accessToken) {
      throw new Error("No hay sesión activa con Google.");
    }
    const headers = { Authorization: `Bearer ${this.accessToken}` };
    if (json) headers["Content-Type"] = "application/json";
    return headers;
  },
};
