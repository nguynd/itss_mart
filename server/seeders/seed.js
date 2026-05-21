/**
 * seed.js — Import dữ liệu từ JSON files cũ vào PostgreSQL
 * Chạy: npm run seed
 */
const path = require('path');
const fs   = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { sequelize, User, FridgeItem, ShoppingItem, Recipe, Ingredient, MealPlan } = require('../models');

const readJSON = (filename) => {
  const filePath = path.join(__dirname, '../data', filename);
  if (!fs.existsSync(filePath)) return [];
  try {
    const content = fs.readFileSync(filePath, 'utf-8').trim();
    return content ? JSON.parse(content) : [];
  } catch (err) {
    console.warn(`⚠️  Không đọc được ${filename}:`, err.message);
    return [];
  }
};

const seed = async () => {
  try {
    // Kết nối DB
    await sequelize.authenticate();
    console.log('✅ Kết nối PostgreSQL thành công\n');

    // Tạo lại toàn bộ bảng (xóa dữ liệu cũ nếu có)
    await sequelize.sync({ force: true });
    console.log('🗃️  Đã tạo schema\n');

    // ── 1. Users ─────────────────────────────────────────
    const users = readJSON('users.json');
    await User.bulkCreate(users, { ignoreDuplicates: true });
    console.log(`👤 Seeded ${users.length} users`);

    // ── 2. Fridge Items ──────────────────────────────────
    const fridgeData = readJSON('fridge.json');
    await FridgeItem.bulkCreate(fridgeData, { ignoreDuplicates: true });
    console.log(`🧊 Seeded ${fridgeData.length} fridge items`);

    // ── 3. Shopping Items ────────────────────────────────
    const shoppingData = readJSON('shopping.json');
    await ShoppingItem.bulkCreate(shoppingData, { ignoreDuplicates: true });
    console.log(`🛒 Seeded ${shoppingData.length} shopping items`);

    // ── 4. Recipes + Ingredients (tách mảng lồng ra bảng riêng) ──
    const recipesData = readJSON('recipes.json');
    for (const recipe of recipesData) {
      const { ingredients, ...recipeFields } = recipe;

      await Recipe.create(recipeFields);

      if (Array.isArray(ingredients) && ingredients.length > 0) {
        await Ingredient.bulkCreate(
          ingredients.map(ing => ({ ...ing, recipeId: recipe.id }))
        );
      }
    }
    console.log(`🍳 Seeded ${recipesData.length} recipes`);

    // ── 5. Meal Plans ────────────────────────────────────
    const mealPlanData = readJSON('mealplan.json');
    await MealPlan.bulkCreate(mealPlanData, { ignoreDuplicates: true });
    console.log(`📅 Seeded ${mealPlanData.length} meal plans`);

    console.log('\n🎉 Seed hoàn tất!');
  } catch (err) {
    console.error('❌ Seed thất bại:', err);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

seed();
