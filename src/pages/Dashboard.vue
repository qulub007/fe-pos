<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getDashboardData } from '@/api/dashboard.api';
import { DataTable, Column } from 'primevue';
import Chart from 'primevue/chart';

const dashboardData = ref({
    today_revenue: 0,
    today_transactions: 0,
    today_products_sold: 0,
    revenue_chart: [] as any[],
    best_selling_products: [],
    low_stock_alerts: []
});

const chartData = ref({});
const chartOptions = ref({});
const loading = ref(true);

const formatCurrency = (value: number | string) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(Number(value));
};

const setChartData = (data: any[]) => {
    const documentStyle = getComputedStyle(document.documentElement);
    const primaryColor = documentStyle.getPropertyValue('--p-primary-500') || '#10b981';

    return {
        labels: data.map(item => {
            const date = new Date(item.date);
            return date.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
        }),
        datasets: [
            {
                label: 'Revenue',
                data: data.map(item => Number(item.revenue)),
                fill: true,
                borderColor: primaryColor,
                backgroundColor: 'rgba(16, 185, 129, 0.1)', // Light transparent primary color
                borderWidth: 2,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 6
            }
        ]
    };
};

const setChartOptions = () => {
    const textColorSecondary = '#64748b'; // text-surface-500
    const surfaceBorder = '#e2e8f0'; // border-surface-200

    return {
        maintainAspectRatio: false,
        aspectRatio: 0.6,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                callbacks: {
                    label: function (context: any) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(context.parsed.y);
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            x: {
                ticks: {
                    color: textColorSecondary,
                    maxRotation: 45,
                    minRotation: 45
                },
                grid: {
                    display: false,
                    drawBorder: false
                }
            },
            y: {
                ticks: {
                    color: textColorSecondary,
                    callback: function (value: any) {
                        if (value >= 1000) {
                            return 'Rp ' + (value / 1000) + 'k';
                        }
                        return 'Rp ' + value;
                    }
                },
                grid: {
                    color: surfaceBorder,
                    drawBorder: false,
                },
                border: {
                    display: false
                }
            }
        }
    };
};

const fetchData = async () => {
    try {
        const response = await getDashboardData();
        dashboardData.value = response.data.data;
        chartData.value = setChartData(dashboardData.value.revenue_chart);
        chartOptions.value = setChartOptions();
    } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    fetchData();
});
</script>

<template>
    <div class="min-h-screen bg-surface-50 font-sans text-surface-900">
        <div class="flex justify-between items-center mb-6">
            <div>
                <h1 class="text-2xl font-semibold text-surface-900 mb-1">Dashboard</h1>
                <p class="text-surface-500 text-sm mt-2">Overview and statistics</p>
            </div>
        </div>

        <div v-if="loading" class="flex justify-center items-center py-12">
            <i class="pi pi-spin pi-spinner text-3xl text-primary-500"></i>
        </div>

        <div v-else>
            <!-- Top Cards -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div class="bg-white rounded-2xl border border-surface-200 p-6 flex items-center justify-between">
                    <div>
                        <span class="text-sm font-medium text-surface-500 block mb-2">Today's Revenue</span>
                        <div class="text-2xl font-semibold text-surface-900">{{
                            formatCurrency(dashboardData.today_revenue) }}</div>
                    </div>
                    <div class="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600">
                        <i class="pi pi-wallet" style="font-size: 2rem; color: #4ade80;"></i>
                    </div>
                </div>

                <div class="bg-white rounded-2xl border border-surface-200 p-6 flex items-center justify-between">
                    <div>
                        <span class="text-sm font-medium text-surface-500 block mb-2">Today's Transactions</span>
                        <div class="text-2xl font-semibold text-surface-900">{{ dashboardData.today_transactions }}
                        </div>
                    </div>
                    <div class="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                        <i class="pi pi-shopping-cart text-xl" style="font-size: 2rem"></i>
                    </div>
                </div>

                <div class=" bg-white rounded-2xl border border-surface-200 p-6 flex items-center justify-between">
                    <div>
                        <span class="text-sm font-medium text-surface-500 block mb-2">Products Sold Today</span>
                        <div class="text-2xl font-semibold text-surface-900">{{
                            dashboardData.today_products_sold }}
                        </div>
                    </div>
                    <div class="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                        <i class="pi pi-box text-xl" style="font-size: 2rem"></i>
                    </div>
                </div>
            </div>

            <!-- Chart -->
            <div class="bg-white rounded-2xl border border-surface-200 p-6 mb-6">
                <h2 class="text-lg font-semibold text-surface-900 mb-4 flex items-center gap-2">
                    <i class="pi pi-chart-line text-green-500" style="font-size: 24px"></i>
                    Grafik Pendapatan (30 Hari Terakhir)
                </h2>
                <div class="h-80">
                    <Chart type="line" :data="chartData" :options="chartOptions" class="h-full w-full" />
                </div>
            </div>

            <!-- Tables -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Best Selling Products -->
                <div class="bg-white rounded-2xl border border-surface-200 p-6">
                    <h2 class="text-lg font-semibold text-surface-900 mb-4 flex items-center gap-2">
                        <i class="pi pi-star-fill text-yellow-500"></i>
                        Produk Terlaris
                    </h2>
                    <DataTable :value="dashboardData.best_selling_products" class="clean-table" :rows="5">
                        <Column header="Product">
                            <template #body="{ data }">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-lg bg-surface-100 overflow-hidden shrink-0">
                                        <img v-if="data.image" :src="data.image" class="w-full h-full object-cover">
                                        <div v-else class="w-full h-full flex items-center justify-center">
                                            <i class="pi pi-image text-surface-400"></i>
                                        </div>
                                    </div>
                                    <span class="font-medium text-surface-900">{{ data.name }}</span>
                                </div>
                            </template>
                        </Column>
                        <Column field="price" header="Price">
                            <template #body="{ data }">
                                {{ formatCurrency(data.price) }}
                            </template>
                        </Column>
                        <Column field="total_sold" header="Sold" class="text-center">
                            <template #body="{ data }">
                                <span class="px-2 py-1 bg-green-100 text-green-700 rounded-lg font-semibold text-sm">
                                    {{ data.total_sold }}
                                </span>
                            </template>
                        </Column>
                    </DataTable>
                </div>

                <!-- Low Stock Alerts -->
                <div class="bg-white rounded-2xl border border-surface-200 p-6">
                    <h2 class="text-lg font-semibold text-surface-900 mb-4 flex items-center gap-2">
                        <i class="pi pi-exclamation-triangle text-orange-500"></i>
                        Stok Hampir Habis
                    </h2>
                    <DataTable :value="dashboardData.low_stock_alerts" class="clean-table" :rows="5">
                        <Column header="Product">
                            <template #body="{ data }">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-lg bg-surface-100 overflow-hidden shrink-0">
                                        <img v-if="data.image" :src="data.image" class="w-full h-full object-cover">
                                        <div v-else class="w-full h-full flex items-center justify-center">
                                            <i class="pi pi-image text-surface-400"></i>
                                        </div>
                                    </div>
                                    <span class="font-medium text-surface-900">{{ data.name }}</span>
                                </div>
                            </template>
                        </Column>
                        <Column field="price" header="Price">
                            <template #body="{ data }">
                                {{ formatCurrency(data.price) }}
                            </template>
                        </Column>
                        <Column header="Stock" class="text-center">
                            <template #body="{ data }">
                                <span class="px-2 py-1 bg-red-100 text-red-700 rounded-lg font-semibold text-sm">
                                    {{ data.stock }}
                                </span>
                            </template>
                        </Column>
                    </DataTable>
                </div>
            </div>
        </div>
    </div>
</template>
