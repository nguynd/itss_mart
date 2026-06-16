const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  // null = danh mục chính, có giá trị = danh mục phụ (id của danh mục cha)
  parentId: {
    type: DataTypes.STRING,
    defaultValue: null,
  },
  // Đơn vị mặc định cho danh mục này
  defaultUnit: {
    type: DataTypes.STRING,
    defaultValue: 'gram',
  },
  // null = hệ thống (admin), có giá trị = của gia đình cụ thể
  familyId: {
    type: DataTypes.STRING,
    defaultValue: null,
  },
}, {
  tableName: 'categories',
  timestamps: true,
});

module.exports = Category;
