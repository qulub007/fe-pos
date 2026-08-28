import { getProducts } from "@/api/products.api";
import type { Product } from "@/types/products";
import { defineStore } from "pinia";

export const useProductStore = defineStore("product", {
  state: () => ({
    items: [] as Product[],
    pagination: {
      current_page: 1,
      last_page: 1,
      per_page: 10,
      total: 0,
      from: 0,
      to: 0,
    },
    page: 1,
    limit: 10,
    search: "",
    productCategoryId: null as number | null,
    loading: false,
  }),

  getters: {
    currentPage: (state) => state.pagination.current_page || 1,
    totalPages: (state) => state.pagination.last_page || 1,
    // Hapus logika filter lokal, langsung kembalikan items dari server
    filteredItems: (state) => state.items,
  },

  actions: {
    async fetch() {
      this.loading = true;

      try {
        // Siapkan parameter dasar
        const params: any = {
          page: this.page,
          search: this.search,
          limit: this.limit,
          product_category_id: this.productCategoryId ?? undefined, // Hanya masukkan jika bukan null
        };

        // Hanya masukkan product_category_id jika nilainya bukan null/undefined
        // if (this.productCategoryId) {
        //   params.product_category_id = this.productCategoryId;
        // }

        const res = await getProducts(params);

        this.items = res.data.data.items;
        this.pagination = res.data.data.pagination;
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        this.loading = false;
      }
    },

    setCategoryFilter(id: number | null) {
      this.productCategoryId = id;
      // Otomatis reset ke halaman 1 dan ambil ulang data setiap kali filter diubah
      this.page = 1;
      this.fetch();
    },

    setPage(page: number) {
      this.page = page;
      this.fetch();
    },

    setLimit(limit: number) {
      this.limit = limit;
      this.page = 1;
      this.fetch();
    },

    nextPage() {
      if (this.pagination.current_page < this.pagination.last_page) {
        this.page = this.pagination.current_page + 1;
        this.fetch();
      }
    },

    prevPage() {
      if (this.pagination.current_page > 1) {
        this.page = this.pagination.current_page - 1;
        this.fetch();
      }
    },
  },
});
