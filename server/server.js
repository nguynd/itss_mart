require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const { Op }  = require('sequelize');

const {
  sequelize,
  User, FridgeItem, ShoppingItem, Recipe, Ingredient, MealPlan,
} = require('./models');

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ─────────────────────────────────────────────────────────────────
// HELPER: Cập nhật trạng thái hạn sử dụng trong DB bằng bulk UPDATE
// ─────────────────────────────────────────────────────────────────
const refreshFridgeStatuses = async () => {
  const now       = new Date();
  const threeDays = new Date();
  threeDays.setDate(now.getDate() + 3);

  const notManual = { [Op.notIn]: ['wasted', 'consumed'] };

  await Promise.all([
    FridgeItem.update(
      { status: 'expired' },
      { where: { expiryDate: { [Op.lt]: now }, status: notManual } }
    ),
    FridgeItem.update(
      { status: 'expiring' },
      { where: { expiryDate: { [Op.between]: [now, threeDays] }, status: notManual } }
    ),
    FridgeItem.update(
      { status: 'fresh' },
      { where: { expiryDate: { [Op.gt]: threeDays }, status: notManual } }
    ),
  ]);
};

// ─────────────────────────────────────────────────────────────────
// INCLUDE helper — Recipe luôn kèm Ingredients
// ─────────────────────────────────────────────────────────────────
const WITH_INGREDIENTS = [{ model: Ingredient, as: 'ingredients' }];

// ─────────────────────────────────────────────────────────────────
// 1. USERS
// ─────────────────────────────────────────────────────────────────
app.get('/api/users', async (_req, res) => {
  try {
    res.json(await User.findAll());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const user = await User.create({
      id:       `user-${Date.now()}`,
      name:     req.body.name   || 'Thành viên mới',
      role:     req.body.role   || 'Thành viên (Member)',
      avatar:   req.body.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${Date.now()}`,
      email:    req.body.email  || '',
      familyId: 'family-22',
    });
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    await User.destroy({ where: { id: req.params.id } });
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// 2. FRIDGE
// ─────────────────────────────────────────────────────────────────
app.get('/api/fridge', async (_req, res) => {
  try {
    await refreshFridgeStatuses();
    res.json(await FridgeItem.findAll());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/fridge', async (req, res) => {
  try {
    const expiryDate = req.body.expiryDate
      ? new Date(req.body.expiryDate)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const item = await FridgeItem.create({
      id:              `fridge-item-${Date.now()}`,
      name:            req.body.name,
      category:        req.body.category        || 'Khác',
      quantity:        parseFloat(req.body.quantity) || 1,
      unit:            req.body.unit            || 'cái',
      expiryDate,
      storageLocation: req.body.storageLocation || 'Ngăn mát',
      addedDate:       new Date(),
      status:          'fresh',
    });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/fridge/:id', async (req, res) => {
  try {
    const item = await FridgeItem.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    await item.update(req.body);
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/fridge/:id', async (req, res) => {
  try {
    await FridgeItem.destroy({ where: { id: req.params.id } });
    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// 3. SHOPPING LIST
// ─────────────────────────────────────────────────────────────────
app.get('/api/shopping', async (_req, res) => {
  try {
    res.json(await ShoppingItem.findAll());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/shopping', async (req, res) => {
  try {
    const item = await ShoppingItem.create({
      id:          `shop-item-${Date.now()}`,
      name:        req.body.name,
      category:    req.body.category   || 'Khác',
      quantity:    parseFloat(req.body.quantity) || 1,
      unit:        req.body.unit       || 'cái',
      completed:   false,
      assignedTo:  req.body.assignedTo || 'user-duy',
      createdBy:   req.body.createdBy  || 'user-huong',
      dateCreated: new Date(),
    });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/shopping/:id', async (req, res) => {
  try {
    const item = await ShoppingItem.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    await item.update(req.body);
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/shopping/:id', async (req, res) => {
  try {
    await ShoppingItem.destroy({ where: { id: req.params.id } });
    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Hoàn tất đi chợ → đồng bộ vào Tủ lạnh (wrapped trong Transaction)
app.post('/api/shopping/complete', async (_req, res) => {
  const t = await sequelize.transaction();
  try {
    const completedItems = await ShoppingItem.findAll({ where: { completed: true }, transaction: t });
    const now = new Date();

    for (const shopItem of completedItems) {
      // Tính shelf life theo category
      const shelfMap = { 'Thịt cá': 3, 'Rau củ': 5, 'Đồ khô': 30, 'Gia vị': 90 };
      const storageMap = { 'Đồ khô': 'Tủ khô', 'Gia vị': 'Tủ khô' };
      const days    = shelfMap[shopItem.category]    || 7;
      const storage = storageMap[shopItem.category]  || 'Ngăn mát';

      const expiryDate = new Date();
      expiryDate.setDate(now.getDate() + days);

      // Nếu đã có trong tủ (fresh/expiring) → cộng thêm số lượng
      const existing = await FridgeItem.findOne({
        where: {
          name:   { [Op.iLike]: shopItem.name },
          status: { [Op.in]: ['fresh', 'expiring'] },
        },
        transaction: t,
      });

      if (existing) {
        await existing.update({
          quantity:   existing.quantity + shopItem.quantity,
          expiryDate: expiryDate > existing.expiryDate ? expiryDate : existing.expiryDate,
        }, { transaction: t });
      } else {
        await FridgeItem.create({
          id:              `fridge-item-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
          name:            shopItem.name,
          category:        shopItem.category,
          quantity:        shopItem.quantity,
          unit:            shopItem.unit,
          expiryDate,
          storageLocation: storage,
          addedDate:       now,
          status:          'fresh',
        }, { transaction: t });
      }
    }

    // Xóa các item đã mua khỏi danh sách
    await ShoppingItem.destroy({ where: { completed: true }, transaction: t });
    await t.commit();

    res.json({
      message:    'Đi chợ hoàn tất. Đã đồng bộ thực phẩm vào tủ lạnh!',
      addedCount: completedItems.length,
    });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// 4. RECIPES
// ─────────────────────────────────────────────────────────────────
app.get('/api/recipes', async (_req, res) => {
  try {
    res.json(await Recipe.findAll({ include: WITH_INGREDIENTS }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/recipes', async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const recipe = await Recipe.create({
      id:           `recipe-${Date.now()}`,
      name:         req.body.name,
      prepTime:     parseInt(req.body.prepTime) || 30,
      difficulty:   req.body.difficulty         || 'Dễ',
      instructions: req.body.instructions       || [],
      image:        req.body.image              || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
    }, { transaction: t });

    if (Array.isArray(req.body.ingredients) && req.body.ingredients.length > 0) {
      await Ingredient.bulkCreate(
        req.body.ingredients.map(ing => ({ ...ing, recipeId: recipe.id })),
        { transaction: t }
      );
    }

    await t.commit();
    res.status(201).json(await Recipe.findByPk(recipe.id, { include: WITH_INGREDIENTS }));
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: err.message });
  }
});

// Gợi ý công thức dựa trên nguyên liệu trong tủ lạnh
app.get('/api/recipes/suggestions', async (_req, res) => {
  try {
    await refreshFridgeStatuses();

    const [recipes, fridgeItems] = await Promise.all([
      Recipe.findAll({ include: WITH_INGREDIENTS }),
      FridgeItem.findAll({ where: { status: { [Op.in]: ['fresh', 'expiring'] } } }),
    ]);

    // Map nguyên liệu tủ lạnh: tên (lowercase) → tổng số lượng
    const fridgeMap = {};
    fridgeItems.forEach(f => {
      const key = f.name.toLowerCase().trim();
      fridgeMap[key] = (fridgeMap[key] || 0) + f.quantity;
    });

    const suggestions = recipes.map(recipe => {
      let availableCount = 0;
      const missingIngredients = [];

      recipe.ingredients.forEach(reqIng => {
        const reqName  = reqIng.name.toLowerCase().trim();
        const foundKey = Object.keys(fridgeMap).find(
          k => k === reqName || k.includes(reqName) || reqName.includes(k)
        );

        if (foundKey && fridgeMap[foundKey] >= reqIng.quantity) {
          availableCount++;
        } else {
          const availableQty = foundKey ? fridgeMap[foundKey] : 0;
          missingIngredients.push({
            name:      reqIng.name,
            required:  reqIng.quantity,
            available: availableQty,
            missing:   reqIng.quantity - availableQty,
            unit:      reqIng.unit,
            category:  reqIng.category,
          });
        }
      });

      const total = recipe.ingredients.length;
      return {
        ...recipe.toJSON(),
        matchPercentage: total > 0 ? Math.round((availableCount / total) * 100) : 0,
        canCook:         missingIngredients.length === 0,
        missingIngredients,
      };
    });

    suggestions.sort((a, b) => {
      if (a.canCook !== b.canCook) return a.canCook ? -1 : 1;
      return b.matchPercentage - a.matchPercentage;
    });

    res.json(suggestions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Nấu món — trừ nguyên liệu khỏi tủ lạnh (FIFO theo hạn sử dụng)
app.post('/api/recipes/cook', async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const recipe = await Recipe.findByPk(req.body.recipeId, { include: WITH_INGREDIENTS });
    if (!recipe) return res.status(404).json({ error: 'Recipe not found' });

    const fridgeItems = await FridgeItem.findAll({
      where: { status: { [Op.in]: ['fresh', 'expiring'] } },
      transaction: t,
    });

    // Kiểm tra đủ nguyên liệu trước khi trừ
    for (const reqIng of recipe.ingredients) {
      const reqName  = reqIng.name.toLowerCase().trim();
      const matching = fridgeItems.filter(f =>
        f.name.toLowerCase().trim() === reqName ||
        f.name.toLowerCase().trim().includes(reqName) ||
        reqName.includes(f.name.toLowerCase().trim())
      );
      const totalAvailable = matching.reduce((s, f) => s + f.quantity, 0);
      if (totalAvailable < reqIng.quantity) {
        await t.rollback();
        return res.status(400).json({ error: 'Không đủ nguyên liệu trong tủ lạnh để chế biến món này!' });
      }
    }

    // Trừ nguyên liệu (dùng hàng sắp hết hạn trước)
    for (const reqIng of recipe.ingredients) {
      const reqName = reqIng.name.toLowerCase().trim();
      let toDeduct  = reqIng.quantity;

      const matching = fridgeItems
        .filter(f =>
          f.name.toLowerCase().trim() === reqName ||
          f.name.toLowerCase().trim().includes(reqName) ||
          reqName.includes(f.name.toLowerCase().trim())
        )
        .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

      for (const item of matching) {
        if (toDeduct <= 0) break;
        if (item.quantity > toDeduct) {
          await item.update({ quantity: item.quantity - toDeduct }, { transaction: t });
          toDeduct = 0;
        } else {
          toDeduct -= item.quantity;
          await item.update({ quantity: 0, status: 'consumed' }, { transaction: t });
        }
      }
    }

    await t.commit();
    res.json({ message: `Đã nấu món ${recipe.name}! Tự động khấu trừ nguyên liệu.`, recipeName: recipe.name });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: err.message });
  }
});

// Thêm nguyên liệu còn thiếu vào danh sách mua sắm
app.post('/api/recipes/add-missing', async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { recipeId, userId } = req.body;
    const recipe = await Recipe.findByPk(recipeId, { include: WITH_INGREDIENTS });
    if (!recipe) return res.status(404).json({ error: 'Recipe not found' });

    const fridgeItems = await FridgeItem.findAll({
      where: { status: { [Op.in]: ['fresh', 'expiring'] } },
    });

    const fridgeMap = {};
    fridgeItems.forEach(f => {
      const key = f.name.toLowerCase().trim();
      fridgeMap[key] = (fridgeMap[key] || 0) + f.quantity;
    });

    let addedCount = 0;
    for (const reqIng of recipe.ingredients) {
      const reqName  = reqIng.name.toLowerCase().trim();
      const foundKey = Object.keys(fridgeMap).find(
        k => k === reqName || k.includes(reqName) || reqName.includes(k)
      );
      const availableQty = foundKey ? fridgeMap[foundKey] : 0;

      if (availableQty < reqIng.quantity) {
        const missingQty = reqIng.quantity - availableQty;
        const existing   = await ShoppingItem.findOne({
          where: { name: { [Op.iLike]: reqIng.name }, completed: false },
          transaction: t,
        });

        if (existing) {
          await existing.update({ quantity: existing.quantity + missingQty }, { transaction: t });
        } else {
          await ShoppingItem.create({
            id:          `shop-item-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
            name:        reqIng.name,
            category:    reqIng.category,
            quantity:    missingQty,
            unit:        reqIng.unit,
            completed:   false,
            assignedTo:  'user-duy',
            createdBy:   userId || 'user-huong',
            dateCreated: new Date(),
          }, { transaction: t });
        }
        addedCount++;
      }
    }

    await t.commit();
    res.json({ message: `Đã thêm ${addedCount} nguyên liệu còn thiếu vào danh sách mua sắm!`, addedCount });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// 5. MEAL PLAN
// ─────────────────────────────────────────────────────────────────
app.get('/api/meal-plan', async (_req, res) => {
  try {
    res.json(await MealPlan.findAll({ include: [{ model: Recipe, as: 'recipe' }] }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/meal-plan', async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { dayOfWeek, mealType, recipeId, recipeName } = req.body;

    // Mỗi slot chỉ có 1 món → xóa slot cũ rồi thêm mới
    await MealPlan.destroy({ where: { dayOfWeek, mealType }, transaction: t });

    if (recipeId) {
      await MealPlan.create({ id: `plan-${Date.now()}`, dayOfWeek, mealType, recipeId, recipeName }, { transaction: t });
    }

    await t.commit();
    res.json({ message: 'Cập nhật thực đơn thành công!', mealPlan: await MealPlan.findAll() });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: err.message });
  }
});

// Tự động tạo danh sách mua sắm từ kế hoạch tuần
app.post('/api/meal-plan/generate-shopping', async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { userId } = req.body;

    const [plans, fridgeItems] = await Promise.all([
      MealPlan.findAll({
        include: [{ model: Recipe, as: 'recipe', include: WITH_INGREDIENTS }],
      }),
      FridgeItem.findAll({ where: { status: { [Op.in]: ['fresh', 'expiring'] } } }),
    ]);

    // Tổng hợp nguyên liệu cần cho cả tuần
    const planIngredients = {};
    plans.forEach(plan => {
      if (!plan.recipe) return;
      plan.recipe.ingredients.forEach(ing => {
        const key = ing.name.toLowerCase().trim();
        if (!planIngredients[key]) {
          planIngredients[key] = { name: ing.name, quantity: 0, unit: ing.unit, category: ing.category };
        }
        planIngredients[key].quantity += ing.quantity;
      });
    });

    const fridgeMap = {};
    fridgeItems.forEach(f => {
      const key = f.name.toLowerCase().trim();
      fridgeMap[key] = (fridgeMap[key] || 0) + f.quantity;
    });

    let addedCount = 0;
    for (const [key, reqIng] of Object.entries(planIngredients)) {
      const foundKey = Object.keys(fridgeMap).find(
        k => k === key || k.includes(key) || key.includes(k)
      );
      const availableQty = foundKey ? fridgeMap[foundKey] : 0;

      if (availableQty < reqIng.quantity) {
        const missingQty = reqIng.quantity - availableQty;
        const existing   = await ShoppingItem.findOne({
          where: { name: { [Op.iLike]: reqIng.name }, completed: false },
          transaction: t,
        });

        if (existing) {
          await existing.update({ quantity: existing.quantity + missingQty }, { transaction: t });
        } else {
          await ShoppingItem.create({
            id:          `shop-item-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
            name:        reqIng.name,
            category:    reqIng.category,
            quantity:    missingQty,
            unit:        reqIng.unit,
            completed:   false,
            assignedTo:  'user-duy',
            createdBy:   userId || 'user-huong',
            dateCreated: new Date(),
          }, { transaction: t });
        }
        addedCount++;
      }
    }

    await t.commit();
    res.json({ message: `Đã tạo ${addedCount} mặt hàng còn thiếu vào danh sách mua sắm!`, addedCount });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// 6. ANALYTICS
// ─────────────────────────────────────────────────────────────────
app.get('/api/analytics', async (_req, res) => {
  try {
    const [fridge, shopping] = await Promise.all([FridgeItem.findAll(), ShoppingItem.findAll()]);

    const wastedCount   = fridge.filter(f => f.status === 'wasted' || f.status === 'expired').length;
    const consumedCount = fridge.filter(f => f.status === 'consumed').length;
    const activeCount   = fridge.filter(f => f.status === 'fresh'   || f.status === 'expiring').length;
    const total         = wastedCount + consumedCount + activeCount || 1;
    const wasteRate     = Math.round((wastedCount / total) * 100);

    const priceMap = { 'Thịt cá': 120000, 'Rau củ': 25000, 'Đồ khô': 40000, 'Gia vị': 15000, 'Khác': 30000 };
    const spendByCategory = { 'Thịt cá': 360000, 'Rau củ': 95000, 'Đồ khô': 120000, 'Gia vị': 30000, 'Khác': 45000 };

    shopping.forEach(item => {
      const rate = priceMap[item.category] || 20000;
      const cost = Math.round(item.quantity * (item.unit === 'g' ? rate / 1000 : rate));
      spendByCategory[item.category] = (spendByCategory[item.category] || 0) + cost;
    });

    res.json({
      wasteRate, wastedCount, consumedCount, activeCount, spendByCategory,
      monthlyTrends: [
        { month: 'T12', spend: 1200000, waste: 15 },
        { month: 'T1',  spend: 1450000, waste: 12 },
        { month: 'T2',  spend: 1800000, waste: 20 },
        { month: 'T3',  spend: 1300000, waste: 8  },
        { month: 'T4',  spend: 1550000, waste: 10 },
        { month: 'T5',  spend: 1100000, waste: 5  },
      ],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// KHỞI ĐỘNG SERVER
// ─────────────────────────────────────────────────────────────────
const start = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Kết nối PostgreSQL thành công');

    // alter:true → tự chỉnh bảng cho khớp model mà không xóa dữ liệu
    await sequelize.sync({ alter: true });
    console.log('🗃️  Schema đồng bộ');

    app.listen(PORT, () => console.log(`🚀 Server chạy tại http://localhost:${PORT}`));
  } catch (err) {
    console.error('❌ Không thể khởi động server:', err);
    process.exit(1);
  }
};

start();
