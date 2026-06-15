const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: 'Thành viên (Member)',
  },
  avatar: {
    type: DataTypes.TEXT,
  },
  email: {
    type: DataTypes.STRING,
    validate: { isEmail: true },
  },
  passwordHash: {
    type: DataTypes.STRING(255),
  },
  familyId: {
    type: DataTypes.STRING,
  },
}, {
  tableName: 'users',
  timestamps: true,
});

module.exports = User;
