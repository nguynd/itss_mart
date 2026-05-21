const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ShoppingItem = sequelize.define('ShoppingItem', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING,
    defaultValue: 'Khác',
  },
  quantity: {
    type: DataTypes.FLOAT,
    defaultValue: 1,
    validate: { min: 0 },
  },
  unit: {
    type: DataTypes.STRING,
    defaultValue: 'cái',
  },
  completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  // assignedTo và createdBy là FK → users.id (khai báo trong models/index.js)
  assignedTo: {
    type: DataTypes.STRING,
  },
  createdBy: {
    type: DataTypes.STRING,
  },
  dateCreated: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'shopping_items',
  timestamps: true,
});

module.exports = ShoppingItem;
