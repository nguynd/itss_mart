/**
 * migrate_family.js
 * Chạy 1 lần duy nhất để:
 * 1. Tạo bản ghi gia đình 'family-22' nếu chưa có
 * 2. Gán familyId cho tất cả users cũ (familyId = null)
 * 3. Gán familyId cho tất cả fridge_items, shopping_items, recipes, meal_plans cũ
 *
 * Chạy: node migrate_family.js
 */
require('dotenv').config();
const { sequelize, Family, User, FridgeItem, ShoppingItem, Recipe, MealPlan } = require('./models');

async function migrate() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log('✅ DB connected & schema synced\n');

    // 1. Tạo gia đình gốc nếu chưa có
    let family = await Family.findOne({ where: { id: 'family-22' } });
    if (!family) {
      family = await Family.create({
        id:         'family-22',
        name:       'Gia đình Nhóm 22',
        inviteCode: 'ITSS22',
        createdBy:  'user-huong',
      });
      console.log('✅ Tạo gia đình family-22 với invite code: ITSS22');
    } else {
      console.log('ℹ️  Gia đình family-22 đã tồn tại');
    }

    // 2. Gán familyId cho users cũ
    const [uCount] = await User.update(
      { familyId: 'family-22' },
      { where: { familyId: null } }
    );
    console.log(`✅ Gán familyId cho ${uCount} users`);

    // 3. Gán familyId cho fridge_items cũ
    const [fCount] = await FridgeItem.update(
      { familyId: 'family-22' },
      { where: { familyId: null } }
    );
    console.log(`✅ Gán familyId cho ${fCount} fridge_items`);

    // 4. Gán familyId cho shopping_items cũ
    const [sCount] = await ShoppingItem.update(
      { familyId: 'family-22' },
      { where: { familyId: null } }
    );
    console.log(`✅ Gán familyId cho ${sCount} shopping_items`);

    // 5. Gán familyId cho recipes cũ
    const [rCount] = await Recipe.update(
      { familyId: 'family-22' },
      { where: { familyId: null } }
    );
    console.log(`✅ Gán familyId cho ${rCount} recipes`);

    // 6. Gán familyId cho meal_plans cũ
    const [mCount] = await MealPlan.update(
      { familyId: 'family-22' },
      { where: { familyId: null } }
    );
    console.log(`✅ Gán familyId cho ${mCount} meal_plans`);

    console.log('\n🎉 Migration hoàn tất!');
    console.log('   Invite code để thêm thành viên: ITSS22');
    await sequelize.close();
  } catch (err) {
    console.error('❌ Migration thất bại:', err.message);
    process.exit(1);
  }
}

migrate();
