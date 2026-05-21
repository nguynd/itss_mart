const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FridgeItem = sequelize.define('FridgeItem', {
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
  expiryDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  storageLocation: {
    type: DataTypes.STRING,
    defaultValue: 'Ngăn mát',
  },
  addedDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  status: {
    type: DataTypes.ENUM('fresh', 'expiring', 'expired', 'consumed', 'wasted'),
    defaultValue: 'fresh',
  },
}, {
  tableName: 'fridge_items',
  timestamps: true,
});

module.exports = FridgeItem;
