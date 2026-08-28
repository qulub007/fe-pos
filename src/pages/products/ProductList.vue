<script setup lang="ts">
import { Button, Column, DataTable, IconField, Select, InputText, InputIcon, useConfirm, ConfirmDialog, useToast } from 'primevue';
import { useProductStore } from '@/stores/products.store';
import { getCategories } from '@/api/product-categories.api';
import { storeToRefs } from 'pinia';
import { onMounted, ref } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import { deleteProduct } from '@/api/products.api';
import { RouterLink } from 'vue-router';

const productStore = useProductStore();
const { fetch, setLimit, setPage, nextPage, prevPage, setCategoryFilter } = productStore;
const { filteredItems, loading, limit, currentPage, totalPages, search, productCategoryId } = storeToRefs(productStore);

const confirm = useConfirm();
const toast = useToast();

const categoryOptions = ref<{ label: string; value: number | null }[]>([])

const fetchCategories = async () => {
    try {
        const res = await getCategories({ limit: 100 })
        const fetchedCategories = res.data.data.items.map((c: { id: number; name: string }) => ({
            label: c.name,
            value: c.id,
        }))

        // 2. Tambahkan opsi 'All Categories' di urutan pertama
        categoryOptions.value = [
            { label: 'All Categories', value: null },
            ...fetchedCategories
        ]
    } catch (error) {
        console.error("Failed to fetch categories:", error)
    }
}

const onSearch = useDebounceFn(() => {
    setPage(1)
}, 400)

const onCategoryChange = (value: number | null) => {
    setCategoryFilter(value ?? null)
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(value)
}

const confirmDelete = (id: number) => {
    confirm.require({
        message: "Are you sure you want to delete this product",
        header: "Confirm Delete",
        icon: "pi pi-exclamation-triangle",
        rejectProps: {
            label: "Cancel",
            severity: "secondary",
            outlined: true
        },
        acceptProps: {
            label: "Delete",
            severity: "danger"
        },
        accept: async () => {
            try {
                await deleteProduct(id)
                toast.add({
                    severity: "success",
                    summary: "Deleted",
                    detail: "Product Removed",
                    life: 3000,
                })
                fetch()
            } catch (error) {
                toast.add({
                    severity: "error",
                    summary: "Error",
                    detail: "Failed to delete product",
                    life: 3000,
                })
            }
        }
    })
}

onMounted(() => {
    fetchCategories()
    fetch()
});
</script>

<template>
    <div class="min-h-screen bg-surface-50 font-sans text-surface-900">
        <div class="flex justify-between items-center mb-8">
            <div>
                <h1 class="text-2xl font-semibold text-surface-900 mb-1">Products</h1>
                <p class="text-surface-500 text-sm mt-2">
                    The list here show all products
                </p>
            </div>

            <Button asChild v-slot="slotProps">
                <RouterLink :to="{ name: 'products-create' }" :class="slotProps.class">
                    Add Product
                </RouterLink>
            </Button>
        </div>

        <div class="bg-white rounded-2xl border border-surface-200 p-2">
            <div class="flex flex-col md:flex-row justify-between items-center px-4 py-4 gap-4">

                <IconField iconPosition="left" class="w-full md:w-80">
                    <InputIcon class="pi pi-search text-surface-400" />
                    <InputText v-model="search" placeholder="Search" @input="onSearch" />
                </IconField>

                <Select :model-value="productCategoryId" :options="categoryOptions" optionLabel="label"
                    optionValue="value" placeholder="Filter by Category" filter class="w-full md:w-56"
                    @update:model-value="onCategoryChange" />

            </div>

            <DataTable :value="filteredItems" :loading="loading" dataKey="id" class="clean-table" :rowHover="true">

                <Column field="name" header="Name" class="min-w-[16rem]">
                    <template #body="{ data }">
                        <div class="flex items-center gap-3">
                            <div class="relative">
                                <img :src="data.image" class="w-10 h-10 rounded-full object-cover bg-surface-100">
                            </div>
                            <span class="font-semibold text-surface-900">{{ data.name }}</span>
                        </div>
                    </template>
                </Column>

                <Column field="price" header="Price">
                    <template #body="{ data }">
                        {{ formatCurrency(data.price) }}
                    </template>
                </Column>

                <Column field="stock" header="Stock">
                    <template #body="{ data }">
                        <span class="px-2.5 py-1 rounded-full text-xs font-medium inline-block" :class="{
                            'bg-green-100 text-green-700': data.stock >= 20,
                            'bg-yellow-100 text-yellow-800': data.stock > 0 && data.stock < 20,
                            'bg-red-100 text-red-700': data.stock === 0
                        }">
                            {{ data.stock }}
                        </span>
                    </template>
                </Column>


                <Column field="product_category" header="Category">
                    <template #body="{ data }">
                        {{ data.product_category?.name ?? '-' }}
                    </template>
                </Column>

                <Column header="Action" style="width: 5rem;">
                    <template #body="{ data }">
                        <div class="flex items-center gap-2">
                            <RouterLink :to="{ name: 'products-edit', params: { id: data.id } }">
                                <Button icon="pi pi-pencil" text rounded severity="primary"
                                    class="w-9! h-9! border-surface-200! text-surface-200! hover:text-primary-600! hover:border-primary-500 hover:bg-primary-50! bg-white" />
                            </RouterLink>

                            <Button icon="pi pi-trash" text rounded severity="danger"
                                class="w-9! h-9! border-surface-200! text-surface-200! hover:text-primary-600! hover:border-primary-500 hover:bg-primary-50! bg-white"
                                @click="confirmDelete(data.id)" />
                        </div>
                    </template>
                </Column>
            </DataTable>

            <div class="flex justify-between items-center px-4 py-4 border-t border-surface-100 gap-4">
                <div class="flex items-ceter gap-2">
                    <span class="text-sm text-surface-500">Row per page:</span>
                    <Select :model-value="limit" :options="[5, 10, 20, 50]" @update:model-value="setLimit" />
                </div>

                <div class="flex items-center gap-4">
                    <span class="text-sm font-medium text-surface-600">
                        {{ currentPage }} of {{ totalPages }}
                    </span>

                    <div class="flex gap-1">
                        <Button icon="pi pi-chevron-left" text rounded severity="secondary" :disabled="currentPage == 1"
                            class="w-9! h-9! border! border-surface-500! hover:bg-surface-50!" @click="prevPage" />
                        <Button icon="pi pi-chevron-right" text rounded severity="secondary"
                            :disabled="currentPage == totalPages"
                            class="w-9! h-9! border! border-surface-500! hover:bg-surface-50!" @click="nextPage" />
                    </div>
                </div>
            </div>
        </div>
    </div>

    <ConfirmDialog />
</template>
