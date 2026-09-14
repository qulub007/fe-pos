import AppLayout from "@/layout/AppLayout.vue";
import Login from "@/pages/auth/login.vue";
import Dashboard from "@/pages/Dashboard.vue";
import CategoryForm from "@/pages/product-categories/CategoryForm.vue";
import CategoryList from "@/pages/product-categories/CategoryList.vue";
import ProductForm from "@/pages/products/ProductForm.vue";
import ProductList from "@/pages/products/ProductList.vue";
import CustomerForm from "@/pages/customers/CustomerForm.vue";
import CustomerList from "@/pages/customers/CustomerList.vue";
import TransactionList from "@/pages/transactions/TransactionList.vue";
import TransactionDetail from "@/pages/transactions/TransactionDetail.vue";
import { useAuthStore } from "@/stores/auth.store";
import { createRouter, createWebHistory } from "vue-router";
import POSview from "@/pages/pos/POSview.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/login",
      name: "login",
      component: Login,
      meta: { guest: true },
    },
    {
      path: "/403",
      name: "forbidden",
      component: () => import("@/pages/errors/Forbidden.vue"),
    },
    {
      path: "/",
      component: AppLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: "",
          name: "dashboard",
          component: Dashboard,
          meta: {permission: 'view_dashboard_statistics'}
        },
        {
          path: "/product-categories",
          name: "product-categories",
          component: CategoryList,
          meta: {permission: 'view_product_categories'}
        },
        {
          path: "/product-categories/create",
          name: "product-categories-create",
          component: CategoryForm,
          meta: {permission: 'create_product_categories'}
        },
        {
          path: "/product-categories/:id/edit",
          name: "product-categories-edit",
          component: CategoryForm,
          meta: {permission: 'edit_product_categories'}
        },
        {
          path: "/products",
          name: "products",
          component: ProductList,
          meta: {permission: 'view_products'}
        },
        {
          path: "/products/create",
          name: "products-create",
          component: ProductForm,
          meta: {permission: 'create_products'}
        },
        {
          path: "/products/:id/edit",
          name: "products-edit",
          component: ProductForm,
          meta: {permission: 'edit_products'}
        },
        {
          path: "/customers",
          name: "customers",
          component: CustomerList,
          meta: {permission: 'view_customers'}
        },
        {
          path: "/customers/create",
          name: "customers-create",
          component: CustomerForm,
          meta: {permission: 'create_customers'}
        },
        {
          path: "/customers/:id/edit",
          name: "customers-edit",
          component: CustomerForm,
          meta: {permission: 'edit_customers'}
        },
        {
          path: "/transactions",
          name: "transactions",
          component: TransactionList,
          meta: {permission: 'view_transactions'}
        },
        {
          path: "/transactions/:id",
          name: "transactions-detail",
          component: TransactionDetail,
          meta: {permission: 'view_transactions'}
        },
        {
          path: "/pos",
          name: "pos",
          component: POSview,
        },
      ],
    },
  ],
});

router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore();

  if (auth.isAuthenticated && !auth.user) {
    try {
      await auth.fetchUser();
    } catch {
      auth.logout();
      return next("/login");
    }
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return next("/login");
  }

  if (to.meta.guest && auth.isAuthenticated) {
    return next("/");
  }

  const permission = to.meta.permission as string | undefined
  if(permission && auth.user && !auth.hasPermission(permission)) {
    return next('/403')
  }

  next();
});

export default router;
