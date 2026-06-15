const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Recipe = sequelize.define('Recipe', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  prepTime: {
    type: DataTypes.INTEGER,
    defaultValue: 30,
    validate: { min: 1 },
  },
  difficulty: {
    type: DataTypes.ENUM('Dễ', 'Trung bình', 'Khó'),
    defaultValue: 'Dễ',
  },
  image: {
    type: DataTypes.TEXT,
  },
  // Lưu danh sách bước nấu dưới dạng JSONB — PostgreSQL tự index được
  instructions: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
  familyId: {
    type: DataTypes.STRING, // FK → families.id
  },
}, {
  tableName: 'recipes',
  timestamps: true,
});

module.exports = Recipe;
