const API_BASE = '/api';

// ─── JWT helper ─────────────────────────────────────────────────
const getHeaders = () => {
  const token = localStorage.getItem('itss_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const fetchJSON = async (url, options = {}) => {
  const res = await fetch(url, { ...options, headers: getHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Có lỗi xảy ra');
  return data;
};

export const api = {
  // ─── AUTH ────────────────────────────────────────────────────
  auth: {
    login: (email, password) =>
      fetchJSON(`${API_BASE}/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    register: (name, email, password, role) =>
      fetchJSON(`${API_BASE}/auth/register`, {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role }),
      }),
    me: () => fetchJSON(`${API_BASE}/auth/me`),
  },

  // ─── FAMILY ──────────────────────────────────────────────────
  family: {
    create: (name) =>
      fetchJSON(`${API_BASE}/family/create`, { method: 'POST', body: JSON.stringify({ name }) }),
    join: (inviteCode) =>
      fetchJSON(`${API_BASE}/family/join`, { method: 'POST', body: JSON.stringify({ inviteCode }) }),
    me: () => fetchJSON(`${API_BASE}/family/me`),
    regenerateCode: () =>
      fetchJSON(`${API_BASE}/family/regenerate-code`, { method: 'POST' }),
    leave: () =>
      fetchJSON(`${API_BASE}/family/leave`, { method: 'DELETE' }),
  },

  // ─── USERS (trong gia đình) ──────────────────────────────────────────────────
  getUsers: () => fetchJSON(`${API_BASE}/users`),
  addUser: (userData) =>
    fetchJSON(`${API_BASE}/users`, { method: 'POST', body: JSON.stringify(userData) }),
  updateUser: (id, data) =>
    fetchJSON(`${API_BASE}/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUser: (id) =>
    fetchJSON(`${API_BASE}/users/${id}`, { method: 'DELETE' }),
  changePassword: (data) =>
    fetchJSON(`${API_BASE}/users/change-password`, { method: 'PUT', body: JSON.stringify(data) }),

  // ─── ADMIN — Quản lý toàn hệ thống ─────────────────────────────────────────
  admin: {
    getAllUsers: () => fetchJSON(`${API_BASE}/admin/users`),
    updateUser: (id, data) =>
      fetchJSON(`${API_BASE}/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteUser: (id) =>
      fetchJSON(`${API_BASE}/admin/users/${id}`, { method: 'DELETE' }),

    // Categories
    getCategories: () => fetchJSON(`${API_BASE}/admin/categories`),
    addCategory: (data) =>
      fetchJSON(`${API_BASE}/admin/categories`, { method: 'POST', body: JSON.stringify(data) }),
    updateCategory: (id, data) =>
      fetchJSON(`${API_BASE}/admin/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteCategory: (id) =>
      fetchJSON(`${API_BASE}/admin/categories/${id}`, { method: 'DELETE' }),
  },

  // ─── CATEGORIES (public — dùng trong form user) ─────────────────────────────
  getCategories: () => fetchJSON(`${API_BASE}/categories`),

  // ─── FRIDGE ──────────────────────────────────────────────────
  getFridge: () => fetchJSON(`${API_BASE}/fridge`),
  addFridgeItem: (item) =>
    fetchJSON(`${API_BASE}/fridge`, { method: 'POST', body: JSON.stringify(item) }),
  updateFridgeItem: (id, data) =>
    fetchJSON(`${API_BASE}/fridge/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteFridgeItem: (id) =>
    fetchJSON(`${API_BASE}/fridge/${id}`, { method: 'DELETE' }),

  // ─── SHOPPING ────────────────────────────────────────────────
  getShopping: () => fetchJSON(`${API_BASE}/shopping`),
  addShoppingItem: (item) =>
    fetchJSON(`${API_BASE}/shopping`, { method: 'POST', body: JSON.stringify(item) }),
  updateShoppingItem: (id, data) =>
    fetchJSON(`${API_BASE}/shopping/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteShoppingItem: (id) =>
    fetchJSON(`${API_BASE}/shopping/${id}`, { method: 'DELETE' }),
  completeShopping: () =>
    fetchJSON(`${API_BASE}/shopping/complete`, { method: 'POST' }),

  // ─── RECIPES ─────────────────────────────────────────────────
  getRecipes: () => fetchJSON(`${API_BASE}/recipes`),
  addRecipe: (recipe) =>
    fetchJSON(`${API_BASE}/recipes`, { method: 'POST', body: JSON.stringify(recipe) }),
  updateRecipe: (id, recipe) =>
    fetchJSON(`${API_BASE}/recipes/${id}`, { method: 'PUT', body: JSON.stringify(recipe) }),
  deleteRecipe: (id) =>
    fetchJSON(`${API_BASE}/recipes/${id}`, { method: 'DELETE' }),
  getSuggestions: () => fetchJSON(`${API_BASE}/recipes/suggestions`),
  cookRecipe: (recipeId) =>
    fetchJSON(`${API_BASE}/recipes/cook`, { method: 'POST', body: JSON.stringify({ recipeId }) }),
  addMissingIngredients: (recipeId, userId) =>
    fetchJSON(`${API_BASE}/recipes/add-missing`, {
      method: 'POST',
      body: JSON.stringify({ recipeId, userId }),
    }),

  // ─── MEAL PLAN ───────────────────────────────────────────────
  getMealPlan: () => fetchJSON(`${API_BASE}/meal-plan`),
  updateMealPlan: (planData) =>
    fetchJSON(`${API_BASE}/meal-plan`, { method: 'POST', body: JSON.stringify(planData) }),
  generateShoppingFromPlan: (userId) =>
    fetchJSON(`${API_BASE}/meal-plan/generate-shopping`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),

  // ─── ANALYTICS ───────────────────────────────────────────────
  getAnalytics: () => fetchJSON(`${API_BASE}/analytics`),

  // ─── UPLOAD ──────────────────────────────────────────────────
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const token = localStorage.getItem('itss_token');
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Lỗi upload ảnh');
    return data;
  },
};
