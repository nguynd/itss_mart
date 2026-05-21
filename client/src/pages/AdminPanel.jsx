import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Settings, ShieldAlert, Plus, BookOpen, Trash2, Cpu, Database } from 'lucide-react';

export default function AdminPanel({ refreshTrigger, triggerRefresh }) {
  const [recipes, setRecipes] = useState([]);
  const [showAddRecipeModal, setShowAddRecipeModal] = useState(false);
  const [newRecipe, setNewRecipe] = useState({
    name: '',
    prepTime: '',
    difficulty: 'Dễ',
    ingredients: [{ name: '', quantity: '', unit: 'g', category: 'Rau củ' }],
    instructions: [''],
    image: ''
  });

  const categories = ['Rau củ', 'Thịt cá', 'Đồ khô', 'Gia vị', 'Khác'];
  const units = ['g', 'kg', 'quả', 'miếng', 'hộp', 'chai', 'bó'];

  useEffect(() => {
    fetchAdminData();
  }, [refreshTrigger]);

  const fetchAdminData = async () => {
    try {
      const data = await api.getRecipes();
      setRecipes(data);
    } catch (err) {
      console.error("Error loading admin data:", err);
    }
  };

  const handleAddIngredientRow = () => {
    setNewRecipe(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { name: '', quantity: '', unit: 'g', category: 'Rau củ' }]
    }));
  };

  const handleIngredientChange = (idx, field, value) => {
    const updatedIngs = [...newRecipe.ingredients];
    updatedIngs[idx][field] = value;
    setNewRecipe(prev => ({ ...prev, ingredients: updatedIngs }));
  };

  const handleAddInstructionRow = () => {
    setNewRecipe(prev => ({
      ...prev,
      instructions: [...prev.instructions, '']
    }));
  };

  const handleInstructionChange = (idx, value) => {
    const updatedSteps = [...newRecipe.instructions];
    updatedSteps[idx] = value;
    setNewRecipe(prev => ({ ...prev, instructions: updatedSteps }));
  };

  const handleSubmitRecipe = async (e) => {
    e.preventDefault();
    if (!newRecipe.name) return;

    // Filter out empty rows
    const ings = newRecipe.ingredients.filter(i => i.name && i.quantity);
    const steps = newRecipe.instructions.filter(step => step.trim() !== '');

    try {
      await api.addRecipe({
        ...newRecipe,
        prepTime: parseInt(newRecipe.prepTime) || 30,
        ingredients: ings.map(i => ({ ...i, quantity: parseFloat(i.quantity) })),
        instructions: steps
      });
      setShowAddRecipeModal(false);
      setNewRecipe({
        name: '',
        prepTime: '',
        difficulty: 'Dễ',
        ingredients: [{ name: '', quantity: '', unit: 'g', category: 'Rau củ' }],
        instructions: [''],
        image: ''
      });
      triggerRefresh();
    } catch (err) {
      console.error("Error creating recipe:", err);
    }
  };

  return (
    <div className="fade-in">
      <div className="top-header">
        <div className="page-title">
          <h1>Hệ thống Quản trị viên</h1>
          <p>Quản lý danh mục dữ liệu, cấu hình thư viện công thức nấu ăn và kiểm soát hoạt động hệ thống.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
        {/* RECIPE LIST MANAGEMENT */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={18} style={{ color: 'var(--primary)' }} />
              Quản lý công thức hệ thống ({recipes.length})
            </h3>
            <button className="btn btn-primary" onClick={() => setShowAddRecipeModal(true)}>
              <Plus size={16} /> Thêm công thức mẫu
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
            {recipes.map(recipe => (
              <div 
                key={recipe.id}
                className="shopping-list-item"
                style={{ padding: '12px' }}
              >
                <div>
                  <span style={{ fontWeight: 600 }}>{recipe.name}</span>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Chuẩn bị: {recipe.prepTime} phút | Nguyên liệu: {recipe.ingredients.length} món
                  </div>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Độ khó: {recipe.difficulty}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SYSTEM STATUS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={18} style={{ color: 'var(--secondary)' }} />
              Hiệu năng hệ thống
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Trạng thái Server:</span>
                <span className="badge badge-fresh">Online (Healthy)</span>
              </div>
              <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Cơ sở dữ liệu:</span>
                <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}><Database size={14} /> JSON File DB</span>
              </div>
              <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Thời gian phản hồi API:</span>
                <span style={{ fontWeight: 600, color: 'var(--primary)' }}>&lt; 5ms</span>
              </div>
            </div>
          </div>

          <div className="glass-card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={18} style={{ color: 'var(--warning)' }} />
              Nhật ký kiểm soát dữ liệu
            </h3>
            <div style={{ maxHeight: '180px', overflowY: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>[19:24:46] Khởi động Express Server thành công.</div>
              <div>[19:25:02] Đã kết nối với Database JSON.</div>
              <div>[19:28:14] Đồng bộ hóa tủ lạnh gia đình hoàn tất.</div>
              <div>[19:35:40] Admin hệ thống thêm công thức: Đậu Hũ Sốt Cà Chua.</div>
            </div>
          </div>
        </div>
      </div>

      {/* ADD RECIPE MODAL */}
      {showAddRecipeModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3 className="modal-title">Thêm công thức nấu ăn mới</h3>
              <button className="modal-close" onClick={() => setShowAddRecipeModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmitRecipe}>
              <div className="form-group">
                <label className="form-label">Tên món ăn *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ví dụ: Cá lóc kho tộ" 
                  value={newRecipe.name}
                  onChange={(e) => setNewRecipe(prev => ({ ...prev, name: e.target.value }))}
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label className="form-label">Thời gian chuẩn bị (phút) *</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="30" 
                    value={newRecipe.prepTime}
                    onChange={(e) => setNewRecipe(prev => ({ ...prev, prepTime: e.target.value }))}
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Độ khó</label>
                  <select 
                    className="form-select" 
                    value={newRecipe.difficulty}
                    onChange={(e) => setNewRecipe(prev => ({ ...prev, difficulty: e.target.value }))}
                  >
                    <option value="Dễ">Dễ</option>
                    <option value="Trung bình">Trung bình</option>
                    <option value="Khó">Khó</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Link ảnh minh họa</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="https://images.unsplash.com/..." 
                  value={newRecipe.image}
                  onChange={(e) => setNewRecipe(prev => ({ ...prev, image: e.target.value }))}
                />
              </div>

              {/* INGREDIENTS DYNAMIC INPUT */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Thành phần nguyên liệu *</span>
                  <button type="button" className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '0.75rem' }} onClick={handleAddIngredientRow}>
                    + Thêm dòng
                  </button>
                </label>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
                  {newRecipe.ingredients.map((ing, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.2fr', gap: '8px' }}>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Tên..." 
                        value={ing.name}
                        onChange={(e) => handleIngredientChange(idx, 'name', e.target.value)}
                        required
                      />
                      <input 
                        type="number" 
                        className="form-input" 
                        placeholder="Lượng..." 
                        value={ing.quantity}
                        onChange={(e) => handleIngredientChange(idx, 'quantity', e.target.value)}
                        required
                      />
                      <select 
                        className="form-select"
                        value={ing.unit}
                        onChange={(e) => handleIngredientChange(idx, 'unit', e.target.value)}
                      >
                        {units.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                      <select 
                        className="form-select"
                        value={ing.category}
                        onChange={(e) => handleIngredientChange(idx, 'category', e.target.value)}
                      >
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* INSTRUCTIONS DYNAMIC INPUT */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Các bước thực hiện *</span>
                  <button type="button" className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '0.75rem' }} onClick={handleAddInstructionRow}>
                    + Thêm bước
                  </button>
                </label>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {newRecipe.instructions.map((step, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{idx + 1}.</span>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Mô tả công đoạn..." 
                        value={step}
                        onChange={(e) => handleInstructionChange(idx, e.target.value)}
                        required
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifySelf: 'end', gap: '10px', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddRecipeModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Xác nhận</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
