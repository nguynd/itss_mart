const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'itss_mart',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASS || 'password',
  {
    host:    process.env.DB_HOST || 'localhost',
    port:    parseInt(process.env.DB_PORT) || 5432,
    dialect: 'postgres',
    logging: false, // đặt thành console.log để debug SQL
    define: {
      underscored: false,
      freezeTableName: true,
    },
  }
);

module.exports = sequelize;
