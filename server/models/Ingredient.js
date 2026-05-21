const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Ingredient được tách ra thành entity độc lập (thay vì mảng lồng trong Recipe)
// → đúng chuẩn OOP/ORM: mỗi nguyên liệu là một Object có thể query riêng
const Ingredient = sequelize.define('Ingredient', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  quantity: {
    type: DataTypes.FLOAT,
    defaultValue: 1,
    validate: { min: 0 },
  },
  unit: {
    type: DataTypes.STRING,
    defaultValue: 'g',
  },
  category: {
    type: DataTypes.STRING,
    defaultValue: 'Khác',
  },
  // recipeId là FK → recipes.id (khai báo trong models/index.js)
  recipeId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  tableName: 'ingredients',
  timestamps: false,
});

module.exports = Ingredient;
