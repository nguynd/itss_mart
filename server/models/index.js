const sequelize  = require('../config/database');
const User        = require('./User');
const FridgeItem  = require('./FridgeItem');
const ShoppingItem = require('./ShoppingItem');
const Recipe      = require('./Recipe');
const Ingredient  = require('./Ingredient');
const MealPlan    = require('./MealPlan');

// ─────────────────────────────────────────────────────────────
// ASSOCIATIONS  (quan hệ giữa các Entity — cốt lõi của OOP/ORM)
// ─────────────────────────────────────────────────────────────

// ShoppingItem ←→ User (2 quan hệ: người được giao & người tạo)
ShoppingItem.belongsTo(User, { as: 'assignee', foreignKey: 'assignedTo' });
ShoppingItem.belongsTo(User, { as: 'creator',  foreignKey: 'createdBy'  });
User.hasMany(ShoppingItem,   { as: 'assignedItems', foreignKey: 'assignedTo' });
User.hasMany(ShoppingItem,   { as: 'createdItems',  foreignKey: 'createdBy'  });

// Recipe ←→ Ingredient (1 công thức có nhiều nguyên liệu)
Recipe.hasMany(Ingredient, { as: 'ingredients', foreignKey: 'recipeId', onDelete: 'CASCADE' });
Ingredient.belongsTo(Recipe, { foreignKey: 'recipeId' });

// Recipe ←→ MealPlan (1 công thức có thể xuất hiện ở nhiều slot thực đơn)
Recipe.hasMany(MealPlan,  { as: 'mealPlans', foreignKey: 'recipeId' });
MealPlan.belongsTo(Recipe, { as: 'recipe',   foreignKey: 'recipeId' });

module.exports = { sequelize, User, FridgeItem, ShoppingItem, Recipe, Ingredient, MealPlan };
