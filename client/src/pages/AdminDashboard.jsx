import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { detectCategory } from '../utils/categoryDetector';
import {
  Users, BookOpen, Plus, Trash2, Edit2, Shield, UserCheck,
  ChefHat, Clock, Search, Tag, AlertTriangle, ChevronRight
} from 'lucide-react';

const ROLES = ['Thành viên (Member)', 'Chủ hộ (Owner)', 'Quản trị viên (Admin)'];
const DIFFICULTIES = ['Dễ', 'Trung bình', 'Khó'];
const ALL_UNITS = ['gram', 'kg', 'lít', 'ml', 'muỗng', 'gói', 'quả', 'miếng', 'hộp', 'chai', 'bó', 'cái'];

export default function AdminDashboard({ currentUser, refreshTrigger, triggerRefresh }) {
  const [activeTab, setActiveTab] = useState('users');

  // ── USERS ──
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({ name: '', role: 'Thành viên (Member)' });

  // ── RECIPES ──
  const [recipes, setRecipes] = useState([]);
  const [recipeSearch, setRecipeSearch] = useState('');
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [editingRecipeId, setEditingRecipeId] = useState(null);
  const [recipeForm, setRecipeForm] = useState({
    name: '', prepTime: '', difficulty: 'Dễ',
    ingredients: [{ name: '', quantity: '', unit: 'gram', category: 'Rau củ' }],
    instructions: [''], image: ''
  });

  // ── CATEGORIES ──
  const [categories, setCategories] = useState([]);
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [catForm, setCatForm] = useState({ name: '', parentId: '', defaultUnit: 'gram' });
  const [catDeleteError, setCatDeleteError] = useState(null);

  useEffect(() => { fetchAll(); }, [refreshTrigger]);

  const fetchAll = async () => {
    // Fetch each independently so one 403 doesn't block the rest
    try {
      const u = await api.admin.getAllUsers();
      setUsers(u);
    } catch (err) {
      console.error('Lỗi load users:', err.message);
    }
    try {
      const r = await api.getRecipes();
      setRecipes(r);
    } catch (err) {
      console.error('Lỗi load recipes:', err.message);
    }
    try {
      const c = await api.admin.getCategories();
      setCategories(c);
    } catch (err) {
      // Fallback: try public categories endpoint
      try {
        const c = await api.getCategories();
        setCategories(c);
      } catch (e) {
        console.error('Lỗi load categories:', e.message);
      }
    }
  };

  // ─── USER HANDLERS ───
  const openAddUser = () => {
    setEditingUser(null);
    setUserForm({ name: '', role: 'Thành viên (Member)' });
    setShowUserModal(true);
  };
  const openEditUser = (u) => {
    setEditingUser(u);
    setUserForm({ name: u.name, role: u.role });
    setShowUserModal(true);
  };
  const handleUserSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.admin.updateUser(editingUser.id, userForm);
      } else {
        await api.addUser({ ...userForm, avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(userForm.name)}` });
      }
      setShowUserModal(false);
      triggerRefresh();
    } catch (err) { alert('Lỗi: ' + err.message); }
  };
  const handleDeleteUser = async (u) => {
    if (u.id === currentUser.id) return alert('Không thể xóa tài khoản của chính mình!');
    if (confirm(`Bạn có chắc muốn xóa tài khoản "${u.name}"?`)) {
      await api.admin.deleteUser(u.id);
      triggerRefresh();
    }
  };

  // ─── RECIPE HANDLERS ───
  const openAddRecipe = () => {
    setEditingRecipeId(null);
    setRecipeForm({ name: '', prepTime: '', difficulty: 'Dễ', ingredients: [{ name: '', quantity: '', unit: 'gram', category: 'Rau củ' }], instructions: [''], image: '' });
    setShowRecipeModal(true);
  };
  const openEditRecipe = (r) => {
    setEditingRecipeId(r.id);
    setRecipeForm({
      name: r.name, prepTime: r.prepTime, difficulty: r.difficulty,
      ingredients: r.ingredients.length > 0 ? r.ingredients : [{ name: '', quantity: '', unit: 'gram', category: 'Rau củ' }],
      instructions: r.instructions.length > 0 ? r.instructions : [''],
      image: r.image || ''
    });
    setShowRecipeModal(true);
  };
  const handleIngredientChange = (idx, field, value) => {
    const upd = [...recipeForm.ingredients];
    upd[idx][field] = value;
    if (field === 'name') {
      const cat = detectCategory(value);
      if (cat) upd[idx].category = cat;
    }
    setRecipeForm(p => ({ ...p, ingredients: upd }));
  };
  const handleRecipeSubmit = async (e) => {
    e.preventDefault();
    const ings = recipeForm.ingredients.filter(i => i.name && i.quantity);
    const steps = recipeForm.instructions.filter(s => s.trim());
    const payload = { ...recipeForm, prepTime: parseInt(recipeForm.prepTime) || 30, ingredients: ings.map(i => ({ ...i, quantity: parseFloat(i.quantity) })), instructions: steps };
    try {
      if (editingRecipeId) { await api.updateRecipe(editingRecipeId, payload); }
      else { await api.addRecipe(payload); }
      setShowRecipeModal(false);
      triggerRefresh();
    } catch (err) { alert('Lỗi: ' + err.message); }
  };
  const handleDeleteRecipe = async (r) => {
    if (confirm(`Xóa công thức "${r.name}"?`)) {
      await api.deleteRecipe(r.id);
      triggerRefresh();
    }
  };

  // ─── CATEGORY HANDLERS ───
  const mainCategories = categories.filter(c => !c.parentId);
  const subCategories = (parentId) => categories.filter(c => c.parentId === parentId);

  const openAddCat = (parentId = null) => {
    setEditingCat(null);
    setCatDeleteError(null);
    setCatForm({ name: '', parentId: parentId || '', defaultUnit: 'gram' });
    setShowCatModal(true);
  };
  const openEditCat = (cat) => {
    setEditingCat(cat);
    setCatDeleteError(null);
    setCatForm({ name: cat.name, parentId: cat.parentId || '', defaultUnit: cat.defaultUnit });
    setShowCatModal(true);
  };
  const handleCatSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...catForm, parentId: catForm.parentId || null };
      if (editingCat) {
        await api.admin.updateCategory(editingCat.id, payload);
      } else {
        await api.admin.addCategory(payload);
      }
      setShowCatModal(false);
      triggerRefresh();
    } catch (err) { alert('Lỗi: ' + err.message); }
  };
  const handleDeleteCat = async (cat) => {
    setCatDeleteError(null);
    try {
      await api.admin.deleteCategory(cat.id);
      triggerRefresh();
    } catch (err) {
      if (err.message && err.message.includes('Không thể xóa')) {
        setCatDeleteError(err.message);
      } else {
        alert('Lỗi: ' + err.message);
      }
    }
  };

  const filteredUsers = users.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase()) || (u.email || '').toLowerCase().includes(userSearch.toLowerCase()));
  const filteredRecipes = recipes.filter(r => r.name.toLowerCase().includes(recipeSearch.toLowerCase()));

  const roleColor = (role) => {
    if (role.includes('Admin')) return '#f59e0b';
    if (role.includes('Owner') || role.includes('Chủ')) return '#3b82f6';
    return 'var(--primary)';
  };

  // Stats
  const catStats = { main: mainCategories.length, sub: categories.filter(c => c.parentId).length };

  return (
    <div className="fade-in">
      <div className="top-header">
        <div className="page-title">
          <h1>🛡️ Trang Quản trị viên</h1>
          <p>Quản lý tài khoản, công thức nấu ăn và danh mục thực phẩm toàn hệ thống.</p>
        </div>
      </div>

      {/* STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { icon: Users, label: 'Tổng tài khoản', value: users.length, color: 'var(--primary)', bg: 'rgba(16,185,129,0.15)' },
          { icon: ChefHat, label: 'Công thức', value: recipes.length, color: 'var(--secondary)', bg: 'rgba(59,130,246,0.15)' },
          { icon: Tag, label: 'Danh mục chính', value: catStats.main, color: '#a78bfa', bg: 'rgba(167,139,250,0.15)' },
          { icon: Shield, label: 'Admin / Chủ hộ', value: users.filter(u => u.role.includes('Admin') || u.role.includes('Chủ')).length, color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={22} style={{ color }} />
            </div>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{value}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div className="tab-container" style={{ marginBottom: '1.5rem' }}>
        {[
          { key: 'users', label: `Tài khoản (${users.length})`, icon: Users },
          { key: 'recipes', label: `Công thức (${recipes.length})`, icon: BookOpen },
          { key: 'categories', label: `Danh mục (${categories.length})`, icon: Tag },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} className={`tab-btn ${activeTab === key ? 'active' : ''}`} onClick={() => setActiveTab(key)}>
            <Icon size={14} style={{ display: 'inline', marginRight: 6 }} />{label}
          </button>
        ))}
      </div>

      {/* ─── USERS TAB ─── */}
      {activeTab === 'users' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: 12 }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <UserCheck size={18} style={{ color: 'var(--primary)' }} /> Danh sách tất cả tài khoản hệ thống
            </h3>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <input type="text" className="form-input" placeholder="Tìm theo tên, email..." value={userSearch}
                  onChange={e => setUserSearch(e.target.value)} style={{ paddingLeft: 36, width: 240 }} />
                <Search size={15} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
              </div>
              <button className="btn btn-primary" onClick={openAddUser}><Plus size={16} /> Thêm tài khoản</button>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Thành viên', 'Email', 'Vai trò', 'Gia đình', 'Ngày đăng ký', 'Thao tác'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.78rem' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img src={u.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${u.name}`}
                          alt={u.name} style={{ width: 32, height: 32, borderRadius: '50%' }} />
                        <div>
                          <div style={{ fontWeight: 600 }}>{u.name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{u.id}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{u.email || '—'}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ padding: '2px 9px', borderRadius: 20, fontSize: '0.73rem', fontWeight: 600, background: `${roleColor(u.role)}22`, color: roleColor(u.role), border: `1px solid ${roleColor(u.role)}44` }}>
                        {u.role.split(' ')[0]}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      {u.family ? (
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{u.family.name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Mã: {u.family.inviteCode}</div>
                        </div>
                      ) : <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Chưa có gia đình</span>}
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button className="btn btn-secondary" style={{ padding: '4px 7px' }} onClick={() => openEditUser(u)}><Edit2 size={13} /></button>
                        <button className="btn btn-secondary" style={{ padding: '4px 7px' }} onClick={() => handleDeleteUser(u)} disabled={u.id === currentUser.id}>
                          <Trash2 size={13} style={{ color: u.id === currentUser.id ? 'var(--text-muted)' : 'var(--danger)' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredUsers.length === 0 && <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Không tìm thấy tài khoản.</div>}
          </div>
        </div>
      )}

      {/* ─── RECIPES TAB ─── */}
      {activeTab === 'recipes' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: 12 }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <ChefHat size={18} style={{ color: 'var(--secondary)' }} /> Thư viện công thức
            </h3>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <input type="text" className="form-input" placeholder="Tìm công thức..." value={recipeSearch}
                  onChange={e => setRecipeSearch(e.target.value)} style={{ paddingLeft: 36, width: 220 }} />
                <Search size={15} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
              </div>
              <button className="btn btn-primary" onClick={openAddRecipe}><Plus size={16} /> Thêm công thức</button>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredRecipes.map(r => (
              <div key={r.id} className="shopping-list-item" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
                {r.image && <img src={r.image} alt={r.name} style={{ width: 52, height: 52, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{r.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 3, display: 'flex', gap: 12 }}>
                    <span><Clock size={11} style={{ display: 'inline', marginRight: 3 }} />{r.prepTime} phút</span>
                    <span>· {r.ingredients.length} nguyên liệu</span>
                    <span style={{ padding: '1px 8px', borderRadius: 10, background: 'rgba(59,130,246,0.15)', color: 'var(--secondary)', fontSize: '0.73rem', fontWeight: 600 }}>{r.difficulty}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button className="btn btn-secondary" style={{ padding: '6px 10px' }} onClick={() => openEditRecipe(r)}><Edit2 size={14} /></button>
                  <button className="btn btn-secondary" style={{ padding: '6px 10px' }} onClick={() => handleDeleteRecipe(r)}><Trash2 size={14} style={{ color: 'var(--danger)' }} /></button>
                </div>
              </div>
            ))}
            {filteredRecipes.length === 0 && <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Không tìm thấy công thức.</div>}
          </div>
        </div>
      )}

      {/* ─── CATEGORIES TAB ─── */}
      {activeTab === 'categories' && (
        <div>
          {catDeleteError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, marginBottom: '1.25rem', color: '#ef4444' }}>
              <AlertTriangle size={18} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '0.88rem' }}>{catDeleteError}</span>
              <button onClick={() => setCatDeleteError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4 }}>✕</button>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Tag size={18} style={{ color: '#a78bfa' }} /> Quản lý danh mục thực phẩm
            </h3>
            <button className="btn btn-primary" onClick={() => openAddCat(null)}><Plus size={16} /> Thêm danh mục chính</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {mainCategories.map(cat => {
              const subs = subCategories(cat.id);
              return (
                <div key={cat.id} className="glass-card" style={{ padding: '1rem' }}>
                  {/* Main category row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: subs.length > 0 ? 12 : 0 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(167,139,250,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Tag size={16} style={{ color: '#a78bfa' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '1rem' }}>{cat.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Đơn vị mặc định: <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{cat.defaultUnit}</span>
                        {subs.length > 0 && <span> · {subs.length} danh mục phụ</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.78rem' }} onClick={() => openAddCat(cat.id)}>
                        <Plus size={13} style={{ display: 'inline', marginRight: 4 }} />Thêm phụ
                      </button>
                      <button className="btn btn-secondary" style={{ padding: '5px 8px' }} onClick={() => openEditCat(cat)}><Edit2 size={14} /></button>
                      <button className="btn btn-secondary" style={{ padding: '5px 8px' }} onClick={() => handleDeleteCat(cat)}>
                        <Trash2 size={14} style={{ color: 'var(--danger)' }} />
                      </button>
                    </div>
                  </div>

                  {/* Sub categories */}
                  {subs.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 48, borderLeft: '2px solid rgba(167,139,250,0.2)', marginLeft: 18 }}>
                      {subs.map(sub => (
                        <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                          <ChevronRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                          <div style={{ flex: 1 }}>
                            <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{sub.name}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 8 }}>
                              Đơn vị: <span style={{ fontWeight: 600, color: 'var(--secondary)' }}>{sub.defaultUnit}</span>
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: 5 }}>
                            <button className="btn btn-secondary" style={{ padding: '3px 7px' }} onClick={() => openEditCat(sub)}><Edit2 size={12} /></button>
                            <button className="btn btn-secondary" style={{ padding: '3px 7px' }} onClick={() => handleDeleteCat(sub)}>
                              <Trash2 size={12} style={{ color: 'var(--danger)' }} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {mainCategories.length === 0 && (
              <div className="glass-card" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                <Tag size={40} style={{ opacity: 0.3, marginBottom: 10 }} />
                <p>Chưa có danh mục nào. Hãy thêm danh mục đầu tiên!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── USER MODAL ─── */}
      {showUserModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingUser ? 'Chỉnh sửa tài khoản' : 'Thêm tài khoản mới'}</h3>
              <button className="modal-close" onClick={() => setShowUserModal(false)}>✕</button>
            </div>
            <form onSubmit={handleUserSubmit}>
              <div className="form-group">
                <label className="form-label">Tên thành viên *</label>
                <input type="text" className="form-input" placeholder="Nguyễn Văn A" value={userForm.name}
                  onChange={e => setUserForm(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Vai trò</label>
                <select className="form-select" value={userForm.role} onChange={e => setUserForm(p => ({ ...p, role: e.target.value }))}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowUserModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Xác nhận</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── CATEGORY MODAL ─── */}
      {showCatModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingCat ? 'Chỉnh sửa danh mục' : (catForm.parentId ? 'Thêm danh mục phụ' : 'Thêm danh mục chính')}</h3>
              <button className="modal-close" onClick={() => setShowCatModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCatSubmit}>
              <div className="form-group">
                <label className="form-label">Tên danh mục *</label>
                <input type="text" className="form-input" placeholder="VD: Rau lá, Thịt đỏ..." value={catForm.name}
                  onChange={e => setCatForm(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Thuộc danh mục chính (để trống nếu là danh mục chính)</label>
                <select className="form-select" value={catForm.parentId} onChange={e => setCatForm(p => ({ ...p, parentId: e.target.value }))}>
                  <option value="">— Là danh mục chính —</option>
                  {mainCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Đơn vị tính mặc định</label>
                <select className="form-select" value={catForm.defaultUnit} onChange={e => setCatForm(p => ({ ...p, defaultUnit: e.target.value }))}>
                  {ALL_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCatModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Xác nhận</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── RECIPE MODAL ─── */}
      {showRecipeModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 600, maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingRecipeId ? 'Chỉnh sửa công thức' : 'Thêm công thức mới'}</h3>
              <button className="modal-close" onClick={() => setShowRecipeModal(false)}>✕</button>
            </div>
            <form onSubmit={handleRecipeSubmit}>
              <div className="form-group">
                <label className="form-label">Tên món ăn *</label>
                <input type="text" className="form-input" placeholder="Ví dụ: Canh chua cá lóc" value={recipeForm.name}
                  onChange={e => setRecipeForm(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                <div className="form-group">
                  <label className="form-label">Thời gian chuẩn bị (phút)</label>
                  <input type="number" className="form-input" placeholder="30" value={recipeForm.prepTime}
                    onChange={e => setRecipeForm(p => ({ ...p, prepTime: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Độ khó</label>
                  <select className="form-select" value={recipeForm.difficulty}
                    onChange={e => setRecipeForm(p => ({ ...p, difficulty: e.target.value }))}>
                    {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Ảnh minh họa (Tải lên từ máy tính)</label>
                <input type="file" accept="image/*" className="form-input"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      try {
                        const data = await api.uploadImage(file);
                        setRecipeForm(p => ({ ...p, image: `http://localhost:5000${data.imageUrl}` }));
                      } catch (err) { alert('Lỗi tải ảnh: ' + err.message); }
                    }
                  }} />
                {recipeForm.image && (
                  <div style={{ marginTop: 10 }}>
                    <img src={recipeForm.image} alt="Preview" style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 8, border: '2px solid var(--border)' }} />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Nguyên liệu</span>
                  <button type="button" className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                    onClick={() => setRecipeForm(p => ({ ...p, ingredients: [...p.ingredients, { name: '', quantity: '', unit: 'gram', category: 'Rau củ' }] }))}>
                    + Thêm dòng
                  </button>
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 200, overflowY: 'auto' }}>
                  {recipeForm.ingredients.map((ing, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.2fr auto', gap: 6, alignItems: 'center' }}>
                      <input type="text" className="form-input" placeholder="Tên..." value={ing.name} onChange={e => handleIngredientChange(idx, 'name', e.target.value)} />
                      <input type="number" className="form-input" placeholder="Lượng..." value={ing.quantity} onChange={e => handleIngredientChange(idx, 'quantity', e.target.value)} />
                      <select className="form-select" value={ing.unit} onChange={e => handleIngredientChange(idx, 'unit', e.target.value)}>
                        {ALL_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                      <select className="form-select" value={ing.category} onChange={e => handleIngredientChange(idx, 'category', e.target.value)}>
                        {categories.filter(c => !c.parentId).map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                      <button type="button" onClick={() => setRecipeForm(p => ({ ...p, ingredients: p.ingredients.filter((_, i) => i !== idx) }))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '4px' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Các bước thực hiện</span>
                  <button type="button" className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                    onClick={() => setRecipeForm(p => ({ ...p, instructions: [...p.instructions, ''] }))}>
                    + Thêm bước
                  </button>
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {recipeForm.instructions.map((step, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', minWidth: 20 }}>{idx + 1}.</span>
                      <input type="text" className="form-input" placeholder="Mô tả bước..." value={step}
                        onChange={e => { const s = [...recipeForm.instructions]; s[idx] = e.target.value; setRecipeForm(p => ({ ...p, instructions: s })); }} />
                      {recipeForm.instructions.length > 1 && (
                        <button type="button" onClick={() => setRecipeForm(p => ({ ...p, instructions: p.instructions.filter((_, i) => i !== idx) }))}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '4px' }}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowRecipeModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Xác nhận</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
