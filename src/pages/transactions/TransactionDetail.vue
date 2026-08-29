<script setup lang="ts">
import { getTransaction } from '@/api/transactions.api';
import type { Transaction } from '@/types/transactions';
import { Button, Column, DataTable, useToast } from 'primevue';
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const toast = useToast();

const loading = ref(false);
const transaction = ref<Transaction | null>(null);

const transactionId = Number(route.params.id);

const formatCurrency = (value: number | string | undefined) => {
    if (value === undefined) return '-';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(Number(value))
}

const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    })
}

const fetchDetail = async () => {
    loading.value = true;
    try {
        const res = await getTransaction(transactionId);
        transaction.value = res.data.data;
    } catch (error) {
        toast.add({
            severity: "error",
            summary: "Error",
            detail: "Failed to load transaction details",
            life: 3000
        });
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    if (transactionId) fetchDetail();
});
</script>

<template>
    <div class="min-h-screen bg-surface-50 font-sans text-surface-900">
        <div class="flex justify-between items-center mb-8">
            <div>
                <h1 class="text-2xl font-semibold text-surface-900 mb-1">
                    Transaction Detail
                </h1>
                <p class="text-surface-500 text-sm mt-2">
                    Code: <span class="font-semibold text-green-600">{{ transaction?.code ?? '-' }}</span>
                </p>
            </div>

            <Button asChild v-slot="slotProps">
                <RouterLink :to="{ name: 'transactions' }" :class="slotProps.class">
                    <i class="pi pi-arrow-left"></i>
                    Back
                </RouterLink>
            </Button>
        </div>

        <div v-if="loading" class="flex justify-center p-8">
            <i class="pi pi-spin pi-spinner text-3xl text-primary-500"></i>
        </div>

        <div v-else-if="transaction" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Left Side: Items -->
            <div class="lg:col-span-2 flex flex-col gap-6">
                <div class="bg-white rounded-2xl border border-surface-200 overflow-hidden">
                    <div class="p-6 border-b border-surface-100">
                        <h2 class="text-lg font-semibold text-surface-900">Items</h2>
                    </div>
                    <DataTable :value="transaction.items || []" dataKey="id" class="clean-table">
                        <Column header="Product">
                            <template #body="{ data }">
                                <div class="flex items-center gap-3">
                                    <div v-if="data.product?.image" class="relative">
                                        <img :src="data.product.image"
                                            class="w-10 h-10 rounded-full object-cover bg-surface-100">
                                    </div>
                                    <span class="font-medium text-surface-900">{{ data.product?.name ?? 'UnknownProduct'
                                    }}
                                    </span>
                                </div>
                            </template>
                        </Column>
                        <Column field="price" header="Price">
                            <template #body="{ data }">
                                {{ formatCurrency(data.price) }}
                            </template>
                        </Column>
                        <Column field="quantity" header="Qty" class="text-center"></Column>
                        <Column header="Subtotal" class="text-right">
                            <template #body="{ data }">
                                {{ formatCurrency(data.price * data.quantity) }}
                            </template>
                        </Column>
                    </DataTable>
                </div>
            </div>

            <!-- Right Side: Summary & Customer -->
            <div class="flex flex-col gap-6">
                <!-- Customer Info -->
                <div class="bg-white rounded-2xl border border-surface-200 p-6">
                    <h2 class="text-lg font-semibold text-surface-900 mb-4">Customer Details</h2>
                    <div class="flex flex-col gap-3">
                        <div class="flex justify-between items-center">
                            <span class="text-surface-500 text-sm">Name</span>
                            <span class="font-medium text-surface-900">{{ transaction.customer?.name ?? '-' }}</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-surface-500 text-sm">Phone</span>
                            <span class="font-medium text-surface-900">{{ transaction.customer?.phone ?? '-' }}</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-surface-500 text-sm">Date</span>
                            <span class="font-medium text-surface-900">{{ formatDate(transaction.created_at) }}</span>
                        </div>
                    </div>
                </div>

                <!-- Summary -->
                <div class="bg-white rounded-2xl border border-surface-200 p-6">
                    <h2 class="text-lg font-semibold text-surface-900 mb-4">Order Summary</h2>
                    <div class="flex flex-col gap-3">
                        <div class="flex justify-between items-center">
                            <span class="text-surface-500 text-sm">Subtotal</span>
                            <span class="font-medium text-surface-900">{{ formatCurrency(transaction.subtotal) }}</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-surface-500 text-sm">Tax</span>
                            <span class="font-medium text-surface-900">{{ formatCurrency(transaction.tax) }}</span>
                        </div>
                        <div class="pt-3 border-t border-surface-100 flex justify-between items-center">
                            <span class="font-semibold text-surface-900">Total</span>
                            <span class="font-bold text-primary-600 text-lg">{{ formatCurrency(transaction.total)
                                }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
