const API_BASE = '/api';

export const api = {
  // Users
  getUsers: async () => {
    const res = await fetch(`${API_BASE}/users`);
    return res.json();
  },
  addUser: async (userData) => {
    const res = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return res.json();
  },
  deleteUser: async (id) => {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  // Fridge
  getFridge: async () => {
    const res = await fetch(`${API_BASE}/fridge`);
    return res.json();
  },
  addFridgeItem: async (item) => {
    const res = await fetch(`${API_BASE}/fridge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    return res.json();
  },
  updateFridgeItem: async (id, data) => {
    const res = await fetch(`${API_BASE}/fridge/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  deleteFridgeItem: async (id) => {
    const res = await fetch(`${API_BASE}/fridge/${id}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  // Shopping
  getShopping: async () => {
    const res = await fetch(`${API_BASE}/shopping`);
    return res.json();
  },
  addShoppingItem: async (item) => {
    const res = await fetch(`${API_BASE}/shopping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    return res.json();
  },
  updateShoppingItem: async (id, data) => {
    const res = await fetch(`${API_BASE}/shopping/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  deleteShoppingItem: async (id) => {
    const res = await fetch(`${API_BASE}/shopping/${id}`, {
      method: 'DELETE',
    });
    return res.json();
  },
  completeShopping: async () => {
    const res = await fetch(`${API_BASE}/shopping/complete`, {
      method: 'POST',
    });
    return res.json();
  },

  // Recipes
  getRecipes: async () => {
    const res = await fetch(`${API_BASE}/recipes`);
    return res.json();
  },
  addRecipe: async (recipe) => {
    const res = await fetch(`${API_BASE}/recipes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(recipe),
    });
    return res.json();
  },
  getSuggestions: async () => {
    const res = await fetch(`${API_BASE}/recipes/suggestions`);
    return res.json();
  },
  cookRecipe: async (recipeId) => {
    const res = await fetch(`${API_BASE}/recipes/cook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipeId }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Có lỗi xảy ra khi chế biến');
    }
    return res.json();
  },
  addMissingIngredients: async (recipeId, userId) => {
    const res = await fetch(`${API_BASE}/recipes/add-missing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipeId, userId }),
    });
    return res.json();
  },

  // Meal Plan
  getMealPlan: async () => {
    const res = await fetch(`${API_BASE}/meal-plan`);
    return res.json();
  },
  updateMealPlan: async (planData) => {
    const res = await fetch(`${API_BASE}/meal-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(planData),
    });
    return res.json();
  },
  generateShoppingFromPlan: async (userId) => {
    const res = await fetch(`${API_BASE}/meal-plan/generate-shopping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    return res.json();
  },

  // Analytics
  getAnalytics: async () => {
    const res = await fetch(`${API_BASE}/analytics`);
    return res.json();
  },
};
