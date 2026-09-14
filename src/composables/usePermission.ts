import { useAuthStore } from "@/stores/auth.store";

export function usePermission() {
    const authStore = useAuthStore()

    const can = (permission: string): boolean => {
        return authStore.hasPermission(permission)
    }

    const canAny = (permissions: string[]): boolean => {
        return authStore.hasAnyPermission(permissions)
    }

    const hasRole = (role: string): boolean => {
        return authStore.hasRole(role)
    }

    return {
        can,
        canAny,
        hasRole
    }
}
