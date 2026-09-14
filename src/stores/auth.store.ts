import { loginApi, logoutApi, meApi } from "@/api/auth.api";
import type { User } from "@/types/user";
import { defineStore } from "pinia";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null as User | null,
    loading: false,
    isAuthenticated: !!localStorage.getItem("token"),
  }),

  getters: {
    hasPermission: (state) => (permission: string): boolean => {
        return state.user?.permissions?.includes(permission) ?? false
    },
    hasRole: (state) => (role:string): boolean => {
        return state.user?.roles.includes(role) ?? false
    },
    hasAnyPermission: (state)=> (permissions: string[]): boolean => {
        return permissions.some(p => state.user?.permissions?.includes(p) ?? false)
    }

  },

  actions: {
    async login(email: string, password: string) {
      this.loading = true;

      try {
        const res = await loginApi({ email, password });
        localStorage.setItem("token", res.data.data.token);
        this.isAuthenticated = true;
        await this.fetchUser();
      } finally {
        this.loading = false;
      }
    },

    async fetchUser() {
      const res = await meApi();

      this.user = res.data.data;

    },

    async logout() {
      try {
        await logoutApi();
      } finally {
        localStorage.removeItem("token");
        this.user = null;
        this.isAuthenticated = false;
      }
    },
  },
});
