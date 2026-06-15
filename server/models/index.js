const sequelize   = require('../config/database');
const Family      = require('./Family');
const User        = require('./User');
const FridgeItem  = require('./FridgeItem');
const ShoppingItem = require('./ShoppingItem');
const Recipe      = require('./Recipe');
const Ingredient  = require('./Ingredient');
const MealPlan    = require('./MealPlan');

// ─────────────────────────────────────────────────────────────
// ASSOCIATIONS
// ─────────────────────────────────────────────────────────────

// Family ←→ User (một gia đình có nhiều thành viên)
Family.hasMany(User,  { as: 'members',  foreignKey: 'familyId' });
User.belongsTo(Family, { as: 'family',  foreignKey: 'familyId' });

// Family ←→ Data tables
Family.hasMany(FridgeItem,   { foreignKey: 'familyId', onDelete: 'CASCADE' });
Family.hasMany(ShoppingItem, { foreignKey: 'familyId', onDelete: 'CASCADE' });
Family.hasMany(Recipe,       { foreignKey: 'familyId', onDelete: 'CASCADE' });
Family.hasMany(MealPlan,     { foreignKey: 'familyId', onDelete: 'CASCADE' });

FridgeItem.belongsTo(Family,   { foreignKey: 'familyId' });
ShoppingItem.belongsTo(Family, { foreignKey: 'familyId' });
Recipe.belongsTo(Family,       { foreignKey: 'familyId' });
MealPlan.belongsTo(Family,     { foreignKey: 'familyId' });

// ShoppingItem ←→ User (2 quan hệ: người được giao & người tạo)
ShoppingItem.belongsTo(User, { as: 'assignee', foreignKey: 'assignedTo' });
ShoppingItem.belongsTo(User, { as: 'creator',  foreignKey: 'createdBy'  });
User.hasMany(ShoppingItem,   { as: 'assignedItems', foreignKey: 'assignedTo' });
User.hasMany(ShoppingItem,   { as: 'createdItems',  foreignKey: 'createdBy'  });

// Recipe ←→ Ingredient (1 công thức có nhiều nguyên liệu)
Recipe.hasMany(Ingredient, { as: 'ingredients', foreignKey: 'recipeId', onDelete: 'CASCADE' });
Ingredient.belongsTo(Recipe, { foreignKey: 'recipeId' });

// Recipe ←→ MealPlan
Recipe.hasMany(MealPlan,   { as: 'mealPlans', foreignKey: 'recipeId' });
MealPlan.belongsTo(Recipe, { as: 'recipe',   foreignKey: 'recipeId' });

module.exports = { sequelize, Family, User, FridgeItem, ShoppingItem, Recipe, Ingredient, MealPlan };
