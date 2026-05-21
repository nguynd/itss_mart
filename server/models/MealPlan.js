const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MealPlan = sequelize.define('MealPlan', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  dayOfWeek: {
    type: DataTypes.ENUM('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'),
    allowNull: false,
  },
  mealType: {
    type: DataTypes.ENUM('breakfast', 'lunch', 'dinner'),
    allowNull: false,
  },
  // recipeId là FK → recipes.id (khai báo trong models/index.js)
  recipeId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  recipeName: {
    type: DataTypes.STRING, // denormalized để tránh JOIN khi chỉ cần hiển thị tên
  },
}, {
  tableName: 'meal_plans',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['dayOfWeek', 'mealType'], // mỗi slot chỉ có 1 món
    },
  ],
});

module.exports = MealPlan;
