/**
 * seed.js — Khởi tạo lại cơ sở dữ liệu và tài khoản Admin mặc định
 * Chạy: npm run seed
 */
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { sequelize, Family, User } = require('../models');

const clearAndSeedDb = async () => {
  try {
    // Kết nối DB
    await sequelize.authenticate();
    console.log('✅ Kết nối PostgreSQL thành công\n');

    // Tạo lại toàn bộ bảng (xóa dữ liệu cũ nếu có)
    await sequelize.sync({ force: true });
    console.log('🗃️  Đã làm sạch database và tạo lại toàn bộ bảng trống!\n');

    // Khởi tạo gia đình quản trị hệ thống
    const adminFamily = await Family.create({
      id: 'admin',
      name: 'admin',
      inviteCode: 'ADMIN22',
      createdBy: 'user-admin',
    });
    console.log('🏠 Đã khởi tạo gia đình quản trị hệ thống');

    // Mã hóa mật khẩu cho tài khoản Admin
    const passwordHash = await bcrypt.hash('admin', 12);

    // Khởi tạo tài khoản Admin mặc định
    await User.create({
      id: 'user-admin',
      name: 'Hệ Thống Admin',
      email: 'admin@itss.22.com',
      passwordHash,
      role: 'Quản trị viên',
      avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Admin',
      familyId: adminFamily.id,
    });
    console.log('👤 Đã tạo tài khoản Admin mặc định (admin@itss.22.com / admin)');



    console.log('\n🎉 Khởi tạo cơ sở dữ liệu và seed Admin hoàn tất!');
  } catch (err) {
    console.error('❌ Khởi tạo cơ sở dữ liệu thất bại:', err);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

clearAndSeedDb();
