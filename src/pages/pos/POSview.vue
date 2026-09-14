<script setup lang="ts">
import { getProductsOptions } from '@/api/products.api';
import { usePosStore } from '@/stores/pos.store';
import type { Product } from '@/types/products';
import { useDebounceFn } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { Button, IconField, InputIcon, InputNumber, InputText, Select, Dialog, Message, useToast, Checkbox } from 'primevue';
import { onMounted, ref } from 'vue';
import { getCustomerOptions, createCustomer } from '@/api/customers.api';
import type { Customer } from '@/types/customers';

const products = ref<Product[]>([]);
const productsLoading = ref(false);
const productSearch = ref('');
const paymentAmount = ref(0)
const sendNotification = ref(false)

// Receipt modal
const showReceiptModal = ref(false)
const receiptData = ref<{
    date: string;
    code: string;
    customer: Customer;
    items: {
        name: string,
        quantity: string,
        price: number,
        subtotal: number
    }[],
    subtotal: number,
    tax: number,
    total: number,
    payment: number,
    change: number
} | null>(null)

const posStore = usePosStore()
const { cart, subtotal, tax, total } = storeToRefs(posStore)
const { addToCart, removeFromCart, updateQuantity, clearCart, checkout } = posStore

const loadProducts = async (search?: string) => {
    productsLoading.value = true

    try {
        const res = await getProductsOptions({
            search: search || undefined,
            limit: 10
        })
        // Jika response dibungkus ApiResponse dan PaginatedResource:
        products.value = res.data.data
    } catch (error) {
        console.log(error)
    } finally {
        productsLoading.value = false
    }
}

const onProductSearch = useDebounceFn(() => {
    loadProducts(productSearch.value)
}, 400)

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(value)
}

const handleQuantityChange = (productId: number, event: Event) => {
    const target = event.target as HTMLInputElement | null;

    if (target) {
        updateQuantity(productId, Number(target.value));
    }
}

const customers = ref<{ label: string; name: string; value: number; phone: string }[]>([])
const selectedCustomerId = ref<number | null>(null)

const loadCustomers = async () => {
    try {
        const res = await getCustomerOptions({ limit: 100 })
        customers.value = res.data.data.map((c: any) => ({
            label: c.name,
            name: c.name,
            value: c.id,
            phone: c.phone
        }))
    } catch (error) {
        console.error("Failed to fetch customers:", error)
    }
}

const showCustomerModal = ref(false)
const customerLoading = ref(false)
const customerErrors = ref<Record<string, string[]>>({})
const customerForm = ref({ name: '', phone: '' })
const toast = useToast()

const openCustomerModal = () => {
    customerForm.value = { name: '', phone: '' }
    customerErrors.value = {}
    showCustomerModal.value = true
}

const submitCustomer = async () => {
    customerLoading.value = true
    customerErrors.value = {}

    try {
        const res = await createCustomer(customerForm.value)
        const newCustomer = res.data.data
        toast.add({
            severity: "success",
            summary: "Success",
            detail: "Customer created successfully",
            life: 3000
        })

        await loadCustomers()
        selectedCustomerId.value = newCustomer.id

        showCustomerModal.value = false
    } catch (error: any) {
        if (error.response?.status === 422) {
            customerErrors.value = error.response?.data.errors ?? {}
            return
        }

        toast.add({
            severity: "error",
            summary: "Error",
            detail: error.response?.data?.message || 'Failed to create customer',
            life: 3000
        })
    } finally {
        customerLoading.value = false
    }
}

const handleCheckout = async () => {
    if (!selectedCustomerId.value) {
        toast.add({ severity: 'warn', summary: 'Warning', detail: "Please select a customer", life: 3000 })
        return
    }

    if (cart.value.length === 0) {
        toast.add({ severity: "warn", summary: "Warning", detail: "Please add at least one item to the cart", life: 3000 })
        return
    }

    if (paymentAmount.value < total.value) {
        toast.add({ severity: "warn", summary: "Warning", detail: "Payment amount is less than total", life: 3000 })
        return // TAMBAHKAN RETURN DI SINI agar proses berhenti
    }

    try {
        // Sinkronisasi data customer dari komponen ke Pinia Store
        posStore.customerId = selectedCustomerId.value

        const res = await checkout(sendNotification.value)

        receiptData.value = {
            code: res.code,
            customer: res.customer,
            date: res.created_at,
            items: res.items,
            subtotal: res.subtotal,
            tax: res.tax,
            total: res.total,
            payment: paymentAmount.value,
            change: paymentAmount.value - res.total
        }

        // Reset state setelah sukses (opsional)
        paymentAmount.value = 0
        selectedCustomerId.value = null

        showReceiptModal.value = true

    } catch (error: any) {
        // Tambahkan `error.message` untuk menangkap throw Error dari Pinia, bukan hanya dari Axios
        const errorMessage = error.response?.data?.message || error.message || "An error occurred"

        toast.add({
            severity: "error",
            summary: "Error",
            detail: errorMessage,
            life: 3000
        })
    }
}

const closeReceipt = () => {
    showReceiptModal.value = false
    receiptData.value = null
    paymentAmount.value = 0

    loadProducts()
    loadCustomers()
}

const printReceipt = () => {
    const printContent = document.getElementById('receipt-content');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
        <html>
            <head>
                <title>Print Receipt</title>
                <style>
                    body {
                        font-family: 'Courier New', Courier, monospace;
                        font-size: 12px;
                        color: #000;
                        width: 300px;
                        margin: 0;
                        padding: 10px;
                    }
                    /* Recreate Tailwind classes used in receipt */
                    .text-sm { font-size: 12px; }
                    .text-xs { font-size: 10px; }
                    .text-base { font-size: 14px; }
                    .font-semibold { font-weight: 600; }
                    .font-medium { font-weight: 500; }
                    .font-mono { font-family: 'Courier New', Courier, monospace; }
                    
                    .text-center { text-align: center; }
                    
                    .flex { display: flex; }
                    .flex-col { flex-direction: column; }
                    .justify-between { justify-content: space-between; }
                    .flex-1 { flex: 1 1 0%; }
                    
                    .mb-3 { margin-bottom: 12px; }
                    .mb-4 { margin-bottom: 16px; }
                    .mt-4 { margin-top: 16px; }
                    
                    .pb-3 { padding-bottom: 12px; }
                    .py-3 { padding-top: 12px; padding-bottom: 12px; }
                    .pt-3 { padding-top: 12px; }
                    .pt-4 { padding-top: 16px; }
                    
                    .space-y-1 > :not([hidden]) ~ :not([hidden]) { margin-top: 4px; }
                    .space-y-2 > :not([hidden]) ~ :not([hidden]) { margin-top: 8px; }
                    
                    .border-b { border-bottom-width: 1px; border-bottom-style: solid; }
                    .border-t { border-top-width: 1px; border-top-style: solid; }
                    .border-dashed { border-style: dashed; }
                    
                    /* Simplify colors for thermal printing (black & white) */
                    .text-surface-600, .text-surface-500, .text-surface-400 { color: #333; }
                    .border-surface-300 { border-color: #000; }
                    
                    @media print {
                        body { width: 300px; margin: 0; padding: 0; }
                    }
                </style>
            </head>
            <body>
                ${printContent.innerHTML}
            </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    // Slight delay to ensure content is fully loaded before printing
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 250);
};

onMounted(() => {
    loadProducts()
    loadCustomers()
})

</script>

<template>
    <div class="min-h-screen bg-surface-50 font-sans text-surface-900">
        <div class="flex justify-between items-center mb-6">
            <div>
                <h1 class="text-2xl font-semibold text-surface-900 mb-1">POS</h1>
                <p class="text-surface-500 text-sm mt-2">
                    Create new transaction
                </p>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2">
                <div class="bg-white rounded-2xl border border-surface-200 p-4">
                    <IconField iconPosition="left" class="mb-4">
                        <InputIcon class="pi pi-search text-surface-400" />
                        <InputText v-model="productSearch" placeholder="Search"
                            class="w-full bg-surface-50 border-surface-200 focus:bg-white focus:border-primary-500"
                            @input="onProductSearch" />
                    </IconField>

                    <!-- Products -->
                    <div v-if="productsLoading" class="text-center py-12 text-surface-500">
                        Loading products ...
                    </div>

                    <div v-else-if="products.length === 0" class="text-center py-12 text-surface-500">
                        Produk tidak ditemukan
                    </div>

                    <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        <button @click="addToCart(product)" v-for="product in products" :key="product.id"
                            class="group p-3 rounded-xl border border-surface-200 hover:border-primary-500 hover:shadow-md transition-all text-left bg-white"
                            :disabled="product.stock === 0"
                            :class="product.stock === 0 ? 'opacity-50 cursor-not-allowed' : ''">
                            <div class="aspect-square rounded-lg bg-surface-100 mb-2 overflow-hidden">
                                <img v-if="product.image" :src="product.image" :alt="product.name"
                                    class="w-full h-full object-cover">

                                <div v-else class="w-full h-full flex items-center justify-center">
                                    <span class="text-surface-500 text-sm">No Image</span>
                                </div>

                            </div>
                            <div class="text-sm font-medium text-surface-900 text-wrap truncate">
                                {{ product.name }}
                            </div>
                            <div class="text-sm font-semibold text-primary-500">
                                {{ formatCurrency(product.price) }}
                            </div>
                            <div class="text-sm font-medium text-surface-500">
                                Stock: {{ product.stock }}
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            <div class="lg:col-span-1">
                <div class="bg-white rounded-2xl border border-surface-200 p-4 sticky top-4">
                    <h2 class="text-lg font-semibold text-surface-900 mb-4">Cart</h2>

                    <!-- Customer Selection -->
                    <div class="mb-4 flex gap-2">
                        <Select v-model="selectedCustomerId" :options="customers" optionLabel="label"
                            optionValue="value" :filterFields="['name', 'phone']" placeholder="Select a customer" filter
                            class="flex-1 bg-surface-50">
                            <template #value="slotProps">
                                <div v-if="slotProps.value" class="flex items-center justify-between w-full pr-2">
                                    <div class="flex flex-col">
                                        <span class="font-medium text-surface-900">
                                            {{customers.find(c => c.value === slotProps.value)?.name}}
                                        </span>
                                        <span class="text-xs text-surface-500">
                                            {{customers.find(c => c.value === slotProps.value)?.phone}}
                                        </span>
                                    </div>
                                    <!-- Button Reset dengan icon X -->
                                    <Button icon="pi pi-times" text rounded size="small" severity="secondary"
                                        class="w-6 h-6 ml-2 hover:bg-surface-200"
                                        @click.stop="selectedCustomerId = null" />
                                </div>
                                <span v-else>{{ slotProps.placeholder }}</span>
                            </template>
                            <template #option="slotProps">
                                <div class="flex flex-col">
                                    <span class="font-medium text-surface-900">{{
                                        slotProps.option.name }}</span>
                                    <span class="text-xs text-surface-500" v-if="slotProps.option.phone">{{
                                        slotProps.option.phone }}</span>
                                </div>
                            </template>
                        </Select>
                        <Button icon="pi pi-plus" @click="openCustomerModal" severity="secondary" class="shrink-0" />
                    </div>

                    <div v-if="cart.length === 0" class="text-center py-8 text-surface-400">
                        <i class="pi pi-shopping-cart text-3xl mb-2"></i>
                        <p class="text-sm">Cart is empty</p>
                    </div>

                    <div v-else ref="cartContainer" class="space-y-2 mb-4 max-h-50 overflow-y-auto">
                        <div v-for="item in cart" :key="item.product.id" class="p-3 rounded-lg bg-surface-50">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-lg bg-surface-200 overflow-hidden shrink-0">
                                    <img v-if="item.product.image" :src="item.product.image"
                                        class="w-full h-full object-cover">

                                    <div v-else class="w-full h-full flex items-center justify-center">
                                        <span class="text-primary-500 text-sm">No Image</span>
                                    </div>
                                </div>

                                <div class="flex-1 m-w-0">
                                    <div class="text-sm font-semibold text-surface-900 truncate">
                                        {{ item.product.name }}
                                    </div>
                                    <div class="text-sm font-semibold text-primary-500">
                                        {{ formatCurrency(item.product.price) }}
                                    </div>
                                </div>
                                <Button icon="pi pi-trash" text rounded size="small" severity="danger"
                                    class="w-7 h-7 shrink-0 " @click="removeFromCart(item.product.id)" />
                            </div>

                            <div class="flex items-center justify-beetween mt-2 pt-2 border-t border-surface-200">
                                <div class="flex items-center gap-1">
                                    <Button icon="pi pi-minus" text rounded size="small" severity="secondary"
                                        class="w-7 h-7" @click="updateQuantity(item.product.id, item.quantity - 1)" />
                                    <!-- <span class="w-8 text-center text-sm font-medium">{{ item.quantity }}</span> -->
                                    <input type="number" :value="item.quantity"
                                        @input="handleQuantityChange(item.product.id, $event)"
                                        class="w-12 text-center text-sm font-medium border border-transparent hover:border-surface-200 focus:border-primary-500 focus:outline-none rounded py-1 -moz-appearance-none"
                                        min="1" />
                                    <Button icon="pi pi-plus" text rounded size="small" severity="secondary"
                                        class="w-7 h-7" @click="updateQuantity(item.product.id, item.quantity + 1)" />
                                </div>
                                <div class="text-sm font-semibold text-surface-900">
                                    {{ formatCurrency(item.product.price * item.quantity) }}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div v-if="cart.length > 0" class="border-t border-surface-900 pt-4 space-y-2">
                        <div class="flex justify-between text-sm text-surface-600">
                            <span>Subtotal </span>
                            <span>{{ formatCurrency(subtotal) }}</span>
                        </div>
                        <div class="flex justify-between text-sm text-surface-600">
                            <span>Tax (11%) </span>
                            <span>{{ formatCurrency(tax) }}</span>
                        </div>
                        <div
                            class="flex justify-between text-lg font-bold text-surface-900 border-t border-surface-200 pt-2">
                            <span>Total </span>
                            <span>{{ formatCurrency(total) }}</span>
                        </div>
                        <div class="pt-3 border-t border-surface-100">
                            <label class="text-sm font-medium text-surface-700 mb-2 block">Payment Amount</label>
                            <InputNumber v-model="paymentAmount" mode="currency" currency="IDR" locale="id-ID"
                                placeholder="Enter amount" class="w-full" />
                        </div>

                        <div class="flex items-center gap-2">
                            <input type="checkbox" v-model="sendNotification"
                                class="w-4 h-4 text-primary-500 rounded border-surface-200 focus:border-primary-500 focus:ring-primary-500">
                            <label>Send Notification</label>
                        </div>
                    </div>
                    <div class="mt-4 space-y-2">
                        <Button label="Checkout" icon="pi pi-check" class="w-full" @click="handleCheckout" />
                        <Button label="Clear Cart" icon="pi pi-trash" class="w-full" severity="secondary"
                            :disabled="cart.length === 0" @click="clearCart" />
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Create Customer Modal -->
    <Dialog v-model:visible="showCustomerModal" modal header="Create Customer" :style="{ width: '400px' }">
        <form @submit.prevent="submitCustomer" class="flex flex-col gap-4 mt-2">
            <div class="flex flex-col gap-2">
                <label for="customerName" class="font-medium text-surface-900">Name <span
                        class="text-red-600">*</span></label>
                <InputText id="customerName" v-model="customerForm.name" type="text" placeholder="Customer name..."
                    class="bg-surface-50 focus:bg-white" :invalid="!!customerErrors.name" />
                <Message v-if="customerErrors.name" severity="error" size="small" variant="simple">
                    {{ customerErrors.name[0] }}
                </Message>
            </div>

            <div class="flex flex-col gap-2">
                <label for="customerPhone" class="font-medium text-surface-900">Phone <span
                        class="text-red-600">*</span></label>
                <InputText id="customerPhone" v-model="customerForm.phone" type="text" placeholder="Phone number..."
                    class="bg-surface-50 focus:bg-white" :invalid="!!customerErrors.phone" />
                <Message v-if="customerErrors.phone" severity="error" size="small" variant="simple">
                    {{ customerErrors.phone[0] }}
                </Message>
            </div>

            <div class="flex justify-end gap-2 mt-4">
                <Button label="Cancel" severity="secondary" text @click="showCustomerModal = false"></Button>
                <Button type="submit" label="Save" icon="pi pi-check" :loading="customerLoading"></Button>
            </div>
        </form>
    </Dialog>

    <Dialog modal header="Transaction Receipt" :style="{ width: '28rem' }" :closable="false"
        v-model:visible="showReceiptModal">
        <div id="receipt-content" v-if="receiptData" class="text-sm">
            <!-- Header -->
            <div class="text-center mb-4 pb-3 border-b border-dashed border-surface-300">
                <div class="text-base font-semibold">MudaPOS Receipt</div>
                <div class="text-xs text-surface-600">{{ receiptData.date }}</div>
            </div>

            <!-- Transaction info -->
            <div class="mb-3 space-y-1">
                <div class="flex justify-between">
                    <span class="text-surface-500">Transaction Code: </span>
                    <span class="font-mono font-semibold">{{ receiptData.code }}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-surface-500">Customer: </span>
                    <span class="font-medium">{{ receiptData.customer?.name }}</span>
                </div>
            </div>

            <!-- Items -->
            <div class="border-t border-dashed border-surface-300 py-3 space-y-2">
                <div v-for="(item, idx) in receiptData.items" :key="idx" class="flex justify-between">
                    <div class="flex-1">
                        <div class="font-medium">{{ item.name }}</div>
                        <div class="text-xs text-surface-500">{{ item.quantity }} x {{ formatCurrency(item.price) }}
                        </div>
                    </div>
                    {{ formatCurrency(item.subtotal) }}
                </div>
            </div>

            <!-- Totals -->
            <div class="border-t border-dashed border-surface-300 pt-3 space-y-1">
                <div class="flex justify-between text-surface-600">
                    <span>Subtotal</span>
                    <span>{{ formatCurrency(receiptData.subtotal) }}</span>
                </div>
                <div class="flex justify-between text-surface-600">
                    <span>Tax (11%)</span>
                    <span>{{ formatCurrency(receiptData.tax) }}</span>
                </div>
                <div class="flex justify-between text-surface-600">
                    <span>Total</span>
                    <span>{{ formatCurrency(receiptData.total) }}</span>
                </div>
                <div class="flex justify-between text-surface-600">
                    <span>Payment</span>
                    <span>{{ formatCurrency(receiptData.payment) }}</span>
                </div>
                <div class="flex justify-between text-surface-600">
                    <span>Change</span>
                    <span>{{ formatCurrency(receiptData.change) }}</span>
                </div>
            </div>

            <!-- Footer -->
            <div class="text-center mt-4 pt-3 border-t border-dashed border-surface-300">
                <div class="text-sm text-surface-400">
                    Thank you for shopping with us!
                </div>
            </div>
        </div>

        <div class="flex justify-end gap-2 mt-4 pt-4 border-t border-surface-200">
            <Button label="Print Receipt" icon="pi pi-print" severity="secondary" outlined @click="printReceipt" />
            <Button label="OK" icon="pi pi-check" @click="closeReceipt" />
        </div>
    </Dialog>
</template>
