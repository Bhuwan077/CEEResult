/**
 * Admin Authentication & Session Management
 */

const TOKEN_KEY = 'cee_admin_jwt';
const USER_KEY = 'cee_admin_user';

export const authService = {
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  setSession(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  getUser() {
    const raw = localStorage.getItem(USER_KEY);
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  isAuthenticated() {
    return !!this.getToken();
  }
};
