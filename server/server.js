require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '7d';

// ─────────────────────────────────────────────────────────────────
// AUTH MIDDLEWARE — Verify JWT từ header Authorization
// ─────────────────────────────────────────────────────────────────
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Chưa đăng nhập. Vui lòng đăng nhập để tiếp tục.' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn.' });
  }
};

// Middleware kiểm tra user đã có gia đình chưa
const familyMiddleware = (req, res, next) => {
  if (!req.user.familyId) {
    return res.status(403).json({ error: 'Bạn chưa thuộc gia đình nào. Vui lòng tạo hoặc tham gia gia đình.' });
  }
  next();
};

const {
  sequelize,
  Family, User, FridgeItem, ShoppingItem, Recipe, Ingredient, MealPlan,
} = require('./models');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─────────────────────────────────────────────────────────────────
// UPLOAD ENDPOINT
// ─────────────────────────────────────────────────────────────────
app.post('/api/upload', authMiddleware, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded.' });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ imageUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// HELPER: Cập nhật trạng thái hạn sử dụng (chỉ gia đình hiện tại)
// ─────────────────────────────────────────────────────────────────
const refreshFridgeStatuses = async (familyId) => {
  const now = new Date();
  const threeDays = new Date();
  threeDays.setDate(now.getDate() + 3);
  const notManual = { [Op.notIn]: ['wasted', 'consumed'] };
  const fWhere = familyId ? { familyId } : {};

  await Promise.all([
    FridgeItem.update({ status: 'expired' }, { where: { ...fWhere, expiryDate: { [Op.lt]: now }, status: notManual } }),
    FridgeItem.update({ status: 'expiring' }, { where: { ...fWhere, expiryDate: { [Op.between]: [now, threeDays] }, status: notManual } }),
    FridgeItem.update({ status: 'fresh' }, { where: { ...fWhere, expiryDate: { [Op.gt]: threeDays }, status: notManual } }),
  ]);
};

const WITH_INGREDIENTS = [{ model: Ingredient, as: 'ingredients' }];

// ─────────────────────────────────────────────────────────────────
// 0. AUTH — Register / Login / Me
// ─────────────────────────────────────────────────────────────────

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin.' });
    if (password.length < 6)
      return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự.' });

    const existing = await User.findOne({ where: { email } });
    if (existing)
      return res.status(400).json({ error: 'Email này đã được đăng ký. Vui lòng dùng email khác.' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      id: `user-${Date.now()}`,
      name,
      email,
      passwordHash,
      role: role || 'Thành viên (Member)',
      avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`,
      familyId: null, // Chưa có gia đình, sẽ setup sau
    });

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role, familyId: null },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    const { passwordHash: _, ...safeUser } = user.toJSON();
    res.status(201).json({ token, user: safeUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Vui lòng nhập email và mật khẩu.' });

    const user = await User.findOne({ where: { email } });
    if (!user)
      return res.status(401).json({ error: 'Email không tồn tại trong hệ thống.' });

    if (!user.passwordHash)
      return res.status(401).json({ error: 'Tài khoản này chưa thiết lập mật khẩu. Vui lòng liên hệ quản trị viên.' });

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid)
      return res.status(401).json({ error: 'Mật khẩu không chính xác.' });

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role, familyId: user.familyId },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    const { passwordHash: _, ...safeUser } = user.toJSON();
    res.json({ token, user: safeUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'Không tìm thấy user.' });
    const { passwordHash: _, ...safeUser } = user.toJSON();
    res.json(safeUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// 0.5. FAMILY — Tạo / Tham gia / Xem gia đình
// ─────────────────────────────────────────────────────────────────

// POST /api/family/create — Tạo gia đình mới
app.post('/api/family/create', authMiddleware, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { name } = req.body;
    if (!name || !name.trim())
      return res.status(400).json({ error: 'Vui lòng nhập tên gia đình.' });

    // Sinh inviteCode duy nhất
    let inviteCode, exists;
    do {
      inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      exists = await Family.findOne({ where: { inviteCode } });
    } while (exists);

    const family = await Family.create({
      id: `fam-${Date.now()}`,
      name: name.trim(),
      inviteCode,
      createdBy: req.user.id,
    }, { transaction: t });

    // Gán gia đình cho user và cập nhật role thành Chủ hộ
    await User.update(
      { familyId: family.id, role: 'Chủ hộ (Owner)' },
      { where: { id: req.user.id }, transaction: t }
    );

    await t.commit();

    // Tạo token mới có familyId
    const updatedUser = await User.findByPk(req.user.id);
    const token = jwt.sign(
      { id: updatedUser.id, name: updatedUser.name, email: updatedUser.email, role: updatedUser.role, familyId: family.id },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    const { passwordHash: _, ...safeUser } = updatedUser.toJSON();
    res.status(201).json({ token, user: safeUser, family });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: err.message });
  }
});

// POST /api/family/join — Tham gia bằng invite code
app.post('/api/family/join', authMiddleware, async (req, res) => {
  try {
    const { inviteCode } = req.body;
    if (!inviteCode)
      return res.status(400).json({ error: 'Vui lòng nhập mã mời.' });

    const family = await Family.findOne({ where: { inviteCode: inviteCode.trim().toUpperCase() } });
    if (!family)
      return res.status(404).json({ error: 'Mã mời không hợp lệ hoặc đã hết hạn.' });

    await User.update(
      { familyId: family.id, role: 'Thành viên (Member)' },
      { where: { id: req.user.id } }
    );

    const updatedUser = await User.findByPk(req.user.id);
    const token = jwt.sign(
      { id: updatedUser.id, name: updatedUser.name, email: updatedUser.email, role: updatedUser.role, familyId: family.id },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    const { passwordHash: _, ...safeUser } = updatedUser.toJSON();
    res.json({ token, user: safeUser, family });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/family/me — Xem thông tin gia đình + danh sách thành viên
app.get('/api/family/me', authMiddleware, familyMiddleware, async (req, res) => {
  try {
    const family = await Family.findByPk(req.user.familyId, {
      include: [{
        model: User,
        as: 'members',
        attributes: ['id', 'name', 'role', 'avatar', 'email'],
      }],
    });
    if (!family) return res.status(404).json({ error: 'Không tìm thấy gia đình.' });
    res.json(family);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/family/regenerate-code — Tạo lại invite code (chỉ chủ hộ)
app.post('/api/family/regenerate-code', authMiddleware, familyMiddleware, async (req, res) => {
  try {
    const family = await Family.findByPk(req.user.familyId);
    if (!family) return res.status(404).json({ error: 'Không tìm thấy gia đình.' });
    if (family.createdBy !== req.user.id)
      return res.status(403).json({ error: 'Chỉ chủ hộ mới có thể tạo lại mã mời.' });

    let inviteCode, exists;
    do {
      inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      exists = await Family.findOne({ where: { inviteCode } });
    } while (exists);

    await family.update({ inviteCode });
    res.json({ inviteCode: family.inviteCode });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/family/leave — Rời khỏi gia đình
app.delete('/api/family/leave', authMiddleware, familyMiddleware, async (req, res) => {
  try {
    const family = await Family.findByPk(req.user.familyId);
    if (family && family.createdBy === req.user.id) {
      const memberCount = await User.count({ where: { familyId: req.user.familyId } });
      if (memberCount > 1)
        return res.status(400).json({ error: 'Chủ hộ không thể rời nếu còn thành viên khác. Hãy chuyển quyền chủ hộ trước.' });
    }
    await User.update({ familyId: null }, { where: { id: req.user.id } });
    const updatedUser = await User.findByPk(req.user.id);
    const token = jwt.sign(
      { id: updatedUser.id, name: updatedUser.name, email: updatedUser.email, role: updatedUser.role, familyId: null },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );
    const { passwordHash: _, ...safeUser } = updatedUser.toJSON();
    res.json({ token, user: safeUser, message: 'Đã rời gia đình.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// 1. USERS (trong gia đình)
// ─────────────────────────────────────────────────────────────────
app.get('/api/users', authMiddleware, familyMiddleware, async (req, res) => {
  try {
    res.json(await User.findAll({ where: { familyId: req.user.familyId } }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', authMiddleware, familyMiddleware, async (req, res) => {
  try {
    const user = await User.create({
      id: `user-${Date.now()}`,
      name: req.body.name || 'Thành viên mới',
      role: req.body.role || 'Thành viên (Member)',
      avatar: req.body.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${Date.now()}`,
      email: req.body.email || '',
      familyId: req.user.familyId,
    });
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:id', authMiddleware, familyMiddleware, async (req, res) => {
  try {
    await User.destroy({ where: { id: req.params.id, familyId: req.user.familyId } });
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// 2. FRIDGE
// ─────────────────────────────────────────────────────────────────
app.get('/api/fridge', authMiddleware, familyMiddleware, async (req, res) => {
  try {
    const fid = req.user.familyId;
    await refreshFridgeStatuses(fid);
    res.json(await FridgeItem.findAll({ where: { familyId: fid } }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/fridge', authMiddleware, familyMiddleware, async (req, res) => {
  try {
    const expiryDate = req.body.expiryDate
      ? new Date(req.body.expiryDate)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const item = await FridgeItem.create({
      id: `fridge-item-${Date.now()}`,
      name: req.body.name,
      category: req.body.category || 'Khác',
      quantity: parseFloat(req.body.quantity) || 1,
      unit: req.body.unit || 'cái',
      expiryDate,
      storageLocation: req.body.storageLocation || 'Ngăn mát',
      addedDate: new Date(),
      status: 'fresh',
      familyId: req.user.familyId,
    });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/fridge/:id', authMiddleware, familyMiddleware, async (req, res) => {
  try {
    const item = await FridgeItem.findOne({ where: { id: req.params.id, familyId: req.user.familyId } });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    await item.update(req.body);
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/fridge/:id', authMiddleware, familyMiddleware, async (req, res) => {
  try {
    await FridgeItem.destroy({ where: { id: req.params.id, familyId: req.user.familyId } });
    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// 3. SHOPPING LIST
// ─────────────────────────────────────────────────────────────────
app.get('/api/shopping', authMiddleware, familyMiddleware, async (req, res) => {
  try {
    res.json(await ShoppingItem.findAll({ where: { familyId: req.user.familyId } }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/shopping', authMiddleware, familyMiddleware, async (req, res) => {
  try {
    const fid = req.user.familyId;
    // Tìm user mặc định để assignedTo trong gia đình
    const defaultAssignee = await User.findOne({ where: { familyId: fid } });
    const item = await ShoppingItem.create({
      id: `shop-item-${Date.now()}`,
      name: req.body.name,
      category: req.body.category || 'Khác',
      quantity: parseFloat(req.body.quantity) || 1,
      unit: req.body.unit || 'cái',
      completed: false,
      assignedTo: req.body.assignedTo || (defaultAssignee ? defaultAssignee.id : req.user.id),
      createdBy: req.user.id,
      dateCreated: new Date(),
      familyId: fid,
    });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/shopping/:id', authMiddleware, familyMiddleware, async (req, res) => {
  try {
    const item = await ShoppingItem.findOne({ where: { id: req.params.id, familyId: req.user.familyId } });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    await item.update(req.body);
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/shopping/:id', authMiddleware, familyMiddleware, async (req, res) => {
  try {
    await ShoppingItem.destroy({ where: { id: req.params.id, familyId: req.user.familyId } });
    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Hoàn tất đi chợ → đồng bộ vào Tủ lạnh
app.post('/api/shopping/complete', authMiddleware, familyMiddleware, async (req, res) => {
  const t = await sequelize.transaction();
  const fid = req.user.familyId;
  try {
    const completedItems = await ShoppingItem.findAll({ where: { completed: true, familyId: fid }, transaction: t });
    const now = new Date();

    for (const shopItem of completedItems) {
      const shelfMap = { 'Thịt cá': 3, 'Rau củ': 5, 'Đồ khô': 30, 'Gia vị': 90 };
      const storageMap = { 'Đồ khô': 'Tủ khô', 'Gia vị': 'Tủ khô' };
      const days = shelfMap[shopItem.category] || 7;
      const storage = storageMap[shopItem.category] || 'Ngăn mát';

      const expiryDate = new Date();
      expiryDate.setDate(now.getDate() + days);

      const existing = await FridgeItem.findOne({
        where: { name: { [Op.iLike]: shopItem.name }, status: { [Op.in]: ['fresh', 'expiring'] }, familyId: fid },
        transaction: t,
      });

      if (existing) {
        await existing.update({
          quantity: existing.quantity + shopItem.quantity,
          expiryDate: expiryDate > existing.expiryDate ? expiryDate : existing.expiryDate,
        }, { transaction: t });
      } else {
        await FridgeItem.create({
          id: `fridge-item-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
          name: shopItem.name,
          category: shopItem.category,
          quantity: shopItem.quantity,
          unit: shopItem.unit,
          expiryDate,
          storageLocation: storage,
          addedDate: now,
          status: 'fresh',
          familyId: fid,
        }, { transaction: t });
      }
    }

    await ShoppingItem.destroy({ where: { completed: true, familyId: fid }, transaction: t });
    await t.commit();
    res.json({ message: 'Đi chợ hoàn tất. Đã đồng bộ thực phẩm vào tủ lạnh!', addedCount: completedItems.length });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// 4. RECIPES
// ─────────────────────────────────────────────────────────────────
app.get('/api/recipes', authMiddleware, familyMiddleware, async (req, res) => {
  try {
    res.json(await Recipe.findAll({ where: { familyId: { [Op.in]: [req.user.familyId, 'admin'] } }, include: WITH_INGREDIENTS }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/recipes', authMiddleware, familyMiddleware, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const recipe = await Recipe.create({
      id: `recipe-${Date.now()}`,
      name: req.body.name,
      prepTime: parseInt(req.body.prepTime) || 30,
      difficulty: req.body.difficulty || 'Dễ',
      instructions: req.body.instructions || [],
      image: req.body.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
      familyId: req.user.familyId,
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

// Gợi ý công thức theo tủ lạnh của gia đình
app.get('/api/recipes/suggestions', authMiddleware, familyMiddleware, async (req, res) => {
  const fid = req.user.familyId;
  try {
    await refreshFridgeStatuses(fid);
    const [recipes, fridgeItems] = await Promise.all([
      Recipe.findAll({ where: { familyId: { [Op.in]: [fid, 'admin'] } }, include: WITH_INGREDIENTS }),
      FridgeItem.findAll({ where: { familyId: fid, status: { [Op.in]: ['fresh', 'expiring'] } } }),
    ]);

    const suggestions = recipes.map(recipe => {
      let availableCount = 0;
      const missingIngredients = [];
      recipe.ingredients.forEach(reqIng => {
        const reqName = reqIng.name.toLowerCase().trim();
        const matching = fridgeItems.filter(f => f.name.toLowerCase().trim() === reqName || f.name.toLowerCase().trim().includes(reqName) || reqName.includes(f.name.toLowerCase().trim()));
        
        let isAvailable = false;
        let availableQty = matching.reduce((s, f) => s + f.quantity, 0);
        let missingQty = reqIng.quantity;

        if (matching.length > 0) {
          const hasSpecialUnit = matching.some(f => ['gói', 'hộp', 'chai'].includes(f.unit));
          if (hasSpecialUnit || reqIng.unit === 'muỗng') {
            isAvailable = true;
            missingQty = 0;
          } else {
            if (availableQty >= reqIng.quantity) {
              isAvailable = true;
              missingQty = 0;
            } else {
              missingQty = reqIng.quantity - availableQty;
            }
          }
        }

        if (isAvailable) {
          availableCount++;
        } else {
          missingIngredients.push({ name: reqIng.name, required: reqIng.quantity, available: availableQty, missing: missingQty > 0 ? missingQty : 1, unit: reqIng.unit, category: reqIng.category });
        }
      });
      const total = recipe.ingredients.length;
      return { ...recipe.toJSON(), matchPercentage: total > 0 ? Math.round((availableCount / total) * 100) : 0, canCook: missingIngredients.length === 0, missingIngredients };
    });

    suggestions.sort((a, b) => { if (a.canCook !== b.canCook) return a.canCook ? -1 : 1; return b.matchPercentage - a.matchPercentage; });
    res.json(suggestions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Nấu món — trừ nguyên liệu (FIFO)
app.post('/api/recipes/cook', authMiddleware, familyMiddleware, async (req, res) => {
  const t = await sequelize.transaction();
  const fid = req.user.familyId;
  try {
    const recipe = await Recipe.findOne({ where: { id: req.body.recipeId, familyId: { [Op.in]: [fid, 'admin'] } }, include: WITH_INGREDIENTS });
    if (!recipe) return res.status(404).json({ error: 'Recipe not found' });

    const fridgeItems = await FridgeItem.findAll({ where: { familyId: fid, status: { [Op.in]: ['fresh', 'expiring'] } }, transaction: t });

    // Validate availability
    for (const reqIng of recipe.ingredients) {
      const reqName = reqIng.name.toLowerCase().trim();
      const matching = fridgeItems.filter(f => f.name.toLowerCase().trim() === reqName || f.name.toLowerCase().trim().includes(reqName) || reqName.includes(f.name.toLowerCase().trim()));
      
      const hasSpecialUnit = matching.some(f => ['gói', 'hộp', 'chai'].includes(f.unit));
      if (!hasSpecialUnit && reqIng.unit !== 'muỗng') {
        const totalAvailable = matching.reduce((s, f) => s + f.quantity, 0);
        if (totalAvailable < reqIng.quantity) { await t.rollback(); return res.status(400).json({ error: 'Không đủ nguyên liệu trong tủ lạnh để chế biến món này!' }); }
      } else if (matching.length === 0) {
        await t.rollback(); return res.status(400).json({ error: 'Không đủ nguyên liệu trong tủ lạnh để chế biến món này!' });
      }
    }

    // Deduct
    for (const reqIng of recipe.ingredients) {
      const reqName = reqIng.name.toLowerCase().trim();
      let toDeduct = reqIng.quantity;
      const matching = fridgeItems.filter(f => f.name.toLowerCase().trim() === reqName || f.name.toLowerCase().trim().includes(reqName) || reqName.includes(f.name.toLowerCase().trim())).sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
      
      for (const item of matching) {
        if (toDeduct <= 0) break;
        if (['gói', 'hộp', 'chai'].includes(item.unit) || reqIng.unit === 'muỗng') {
          toDeduct = 0; // Do not deduct for these units
          break;
        }
        if (item.quantity > toDeduct) { await item.update({ quantity: item.quantity - toDeduct }, { transaction: t }); toDeduct = 0; }
        else { toDeduct -= item.quantity; await item.update({ quantity: 0, status: 'consumed' }, { transaction: t }); }
      }
    }

    await t.commit();
    res.json({ message: `Đã nấu món ${recipe.name}! Tự động khấu trừ nguyên liệu.`, recipeName: recipe.name });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: err.message });
  }
});

// Thêm nguyên liệu còn thiếu vào shopping
app.post('/api/recipes/add-missing', authMiddleware, familyMiddleware, async (req, res) => {
  const t = await sequelize.transaction();
  const fid = req.user.familyId;
  try {
    const { recipeId } = req.body;
    const recipe = await Recipe.findOne({ where: { id: recipeId, familyId: { [Op.in]: [fid, 'admin'] } }, include: WITH_INGREDIENTS });
    if (!recipe) return res.status(404).json({ error: 'Recipe not found' });

    const fridgeItems = await FridgeItem.findAll({ where: { familyId: fid, status: { [Op.in]: ['fresh', 'expiring'] } } });
    const fridgeMap = {};
    fridgeItems.forEach(f => { const key = f.name.toLowerCase().trim(); fridgeMap[key] = (fridgeMap[key] || 0) + f.quantity; });

    let addedCount = 0;
    for (const reqIng of recipe.ingredients) {
      const reqName = reqIng.name.toLowerCase().trim();
      const foundKey = Object.keys(fridgeMap).find(k => k === reqName || k.includes(reqName) || reqName.includes(k));
      const availableQty = foundKey ? fridgeMap[foundKey] : 0;
      if (availableQty < reqIng.quantity) {
        const missingQty = reqIng.quantity - availableQty;
        const existing = await ShoppingItem.findOne({ where: { name: { [Op.iLike]: reqIng.name }, completed: false, familyId: fid }, transaction: t });
        if (existing) { await existing.update({ quantity: existing.quantity + missingQty }, { transaction: t }); }
        else {
          await ShoppingItem.create({ id: `shop-item-${Date.now()}-${Math.floor(Math.random() * 9999)}`, name: reqIng.name, category: reqIng.category, quantity: missingQty, unit: reqIng.unit, completed: false, assignedTo: req.user.id, createdBy: req.user.id, dateCreated: new Date(), familyId: fid }, { transaction: t });
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
app.get('/api/meal-plan', authMiddleware, familyMiddleware, async (req, res) => {
  try {
    res.json(await MealPlan.findAll({ where: { familyId: req.user.familyId }, include: [{ model: Recipe, as: 'recipe' }] }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/meal-plan', authMiddleware, familyMiddleware, async (req, res) => {
  const t = await sequelize.transaction();
  const fid = req.user.familyId;
  try {
    const { dayOfWeek, mealType, recipeId, recipeName } = req.body;
    await MealPlan.destroy({ where: { dayOfWeek, mealType, familyId: fid }, transaction: t });
    if (recipeId) {
      await MealPlan.create({ id: `plan-${Date.now()}`, dayOfWeek, mealType, recipeId, recipeName, familyId: fid }, { transaction: t });
    }
    await t.commit();
    res.json({ message: 'Cập nhật thực đơn thành công!', mealPlan: await MealPlan.findAll({ where: { familyId: fid } }) });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: err.message });
  }
});

// Tạo shopping từ meal plan
app.post('/api/meal-plan/generate-shopping', authMiddleware, familyMiddleware, async (req, res) => {
  const t = await sequelize.transaction();
  const fid = req.user.familyId;
  try {
    const [plans, fridgeItems] = await Promise.all([
      MealPlan.findAll({ where: { familyId: fid }, include: [{ model: Recipe, as: 'recipe', include: WITH_INGREDIENTS }] }),
      FridgeItem.findAll({ where: { familyId: fid, status: { [Op.in]: ['fresh', 'expiring'] } } }),
    ]);

    const planIngredients = {};
    plans.forEach(plan => {
      if (!plan.recipe) return;
      plan.recipe.ingredients.forEach(ing => {
        const key = ing.name.toLowerCase().trim();
        if (!planIngredients[key]) planIngredients[key] = { name: ing.name, quantity: 0, unit: ing.unit, category: ing.category };
        planIngredients[key].quantity += ing.quantity;
      });
    });

    const fridgeMap = {};
    fridgeItems.forEach(f => { const key = f.name.toLowerCase().trim(); fridgeMap[key] = (fridgeMap[key] || 0) + f.quantity; });

    let addedCount = 0;
    for (const [key, reqIng] of Object.entries(planIngredients)) {
      const foundKey = Object.keys(fridgeMap).find(k => k === key || k.includes(key) || key.includes(k));
      const availableQty = foundKey ? fridgeMap[foundKey] : 0;
      if (availableQty < reqIng.quantity) {
        const missingQty = reqIng.quantity - availableQty;
        const existing = await ShoppingItem.findOne({ where: { name: { [Op.iLike]: reqIng.name }, completed: false, familyId: fid }, transaction: t });
        if (existing) { await existing.update({ quantity: existing.quantity + missingQty }, { transaction: t }); }
        else {
          await ShoppingItem.create({ id: `shop-item-${Date.now()}-${Math.floor(Math.random() * 9999)}`, name: reqIng.name, category: reqIng.category, quantity: missingQty, unit: reqIng.unit, completed: false, assignedTo: req.user.id, createdBy: req.user.id, dateCreated: new Date(), familyId: fid }, { transaction: t });
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
// 6. ANALYTICS (theo gia đình)
// ─────────────────────────────────────────────────────────────────
app.get('/api/analytics', authMiddleware, familyMiddleware, async (req, res) => {
  const fid = req.user.familyId;
  try {
    const [fridge, shopping] = await Promise.all([
      FridgeItem.findAll({ where: { familyId: fid } }),
      ShoppingItem.findAll({ where: { familyId: fid } }),
    ]);

    const wastedCount = fridge.filter(f => f.status === 'wasted' || f.status === 'expired').length;
    const consumedCount = fridge.filter(f => f.status === 'consumed').length;
    const activeCount = fridge.filter(f => f.status === 'fresh' || f.status === 'expiring').length;
    const total = wastedCount + consumedCount + activeCount || 1;
    const wasteRate = Math.round((wastedCount / total) * 100);

    const priceMap = { 'Thịt cá': 120000, 'Rau củ': 25000, 'Đồ khô': 40000, 'Gia vị': 15000, 'Khác': 30000 };
    const spendByCategory = { 'Thịt cá': 0, 'Rau củ': 0, 'Đồ khô': 0, 'Gia vị': 0, 'Khác': 0 };
    shopping.forEach(item => {
      const rate = priceMap[item.category] || 20000;
      const cost = Math.round(item.quantity * (item.unit === 'g' ? rate / 1000 : rate));
      spendByCategory[item.category] = (spendByCategory[item.category] || 0) + cost;
    });

    res.json({
      wasteRate, wastedCount, consumedCount, activeCount, spendByCategory,
      monthlyTrends: [
        { month: 'T12', spend: 1200000, waste: 15 },
        { month: 'T1', spend: 1450000, waste: 12 },
        { month: 'T2', spend: 1800000, waste: 20 },
        { month: 'T3', spend: 1300000, waste: 8 },
        { month: 'T4', spend: 1550000, waste: 10 },
        { month: 'T5', spend: 1100000, waste: 5 },
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
    // DEBUG: Kiểm tra chính xác database/schema/port mà Node đang kết nối
    const [dbInfo] = await sequelize.query(`
  SELECT
    current_database() AS database,
    current_schema() AS schema,
    inet_server_port() AS port;
`);
    console.log('🔎 Sequelize đang kết nối tới:', dbInfo[0]);

    // Đồng bộ toàn bộ schema (tạo các bảng nếu chưa có)
    await sequelize.sync({ alter: true });
    console.log('🗃️  Toàn bộ schema đồng bộ thành công');

    app.listen(PORT, () => console.log(`🚀 Server chạy tại http://localhost:${PORT}`));
  } catch (err) {
    console.error('❌ Không thể khởi động server:', err);
    process.exit(1);
  }
};

start();
