const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Tạo mã invite ngẫu nhiên 6 ký tự (A-Z + 0-9)
const genCode = () =>
  Math.random().toString(36).substring(2, 8).toUpperCase();

const Family = sequelize.define('Family', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  inviteCode: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true,
    defaultValue: genCode,
  },
  createdBy: {
    type: DataTypes.STRING, // FK → users.id (declared in index.js)
  },
}, {
  tableName: 'families',
  timestamps: true,
});

module.exports = Family;
