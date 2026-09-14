<script setup lang="ts">
import { Button } from 'primevue';
import { useRouter } from 'vue-router';

const router = useRouter();

const goBack = () => {
    router.back();
};

const goHome = () => {
    router.push({ name: 'dashboard' });
};
</script>

<template>
    <div class="flex items-center justify-center min-h-screen bg-surface-50 px-4 py-10">
        <div class="w-full max-w-100">
            <div class="bg-white p-8 rounded-2xl shadow-xl border border-surface-100 text-center">
                <div class="text-center mb-8">
                    <div
                        class="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mx-auto mb-6">
                        <i class="pi pi-lock text-3xl"></i>
                    </div>
                    <h1 class="text-6xl font-bold text-surface-900 mb-4">403</h1>
                    <h2 class="text-2xl font-semibold text-surface-800 mb-2">Access Denied</h2>
                    <p class="text-surface-500">You don't have permission to access this page.</p>
                </div>

                <div class="flex flex-col sm:flex-row gap-3 justify-center mt-6">
                    <Button label="Go Back" icon="pi pi-arrow-left" severity="secondary" outlined @click="goBack" class="w-full sm:w-auto" />
                    <Button label="Back to Home" icon="pi pi-home" @click="goHome" class="w-full sm:w-auto" />
                </div>
            </div>
        </div>
    </div>
</template>
