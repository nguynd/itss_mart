import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Plus, Check, Trash2, ShoppingBag, User, CheckSquare, Square, RefreshCw, Edit2 } from 'lucide-react';
import { formatQuantity } from '../utils/format';
import { detectCategory } from '../utils/categoryDetector';

export default function ShoppingList({ currentUser, refreshTrigger, triggerRefresh }) {
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'Rau củ',
    quantity: '',
    unit: 'gram',
    assignedTo: 'user-duy'
  });

  const categories = ['Rau củ', 'Thịt cá', 'Đồ khô', 'Gia vị', 'Khác'];
  const units = ['gram', 'muỗng', 'gói', 'quả', 'miếng', 'hộp', 'chai', 'bó'];

  useEffect(() => {
    fetchShoppingData();
  }, [refreshTrigger]);

  const fetchShoppingData = async () => {
    try {
      const [shopData, usersData] = await Promise.all([
        api.getShopping(),
        api.getUsers()
      ]);
      setItems(shopData);
      setUsers(usersData);
    } catch (err) {
      console.error("Error loading shopping data:", err);
    }
  };

  const handleToggleComplete = async (item) => {
    try {
      await api.updateShoppingItem(item.id, { completed: !item.completed });
      triggerRefresh();
    } catch (err) {
      console.error("Error toggling item:", err);
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      await api.deleteShoppingItem(id);
      triggerRefresh();
    } catch (err) {
      console.error("Error deleting item:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newItem.name || !newItem.quantity) return;

    try {
      if (editingId) {
        await api.updateShoppingItem(editingId, {
          ...newItem,
          quantity: parseFloat(newItem.quantity),
          assignedTo: newItem.assignedTo || currentUser.id
        });
      } else {
        await api.addShoppingItem({
          ...newItem,
          quantity: parseFloat(newItem.quantity),
          createdBy: currentUser.id
        });
      }

      setShowAddModal(false);
      setEditingId(null);
      setNewItem({
        name: '',
        category: 'Rau củ',
        quantity: '',
        unit: 'gram',
        assignedTo: currentUser.id
      });
      triggerRefresh();
    } catch (err) {
      console.error("Error adding item:", err);
    }
  };

  const handleEditClick = (item) => {
    setEditingId(item.id);
    setNewItem({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      assignedTo: item.assignedTo
    });
    setShowAddModal(true);
  };

  const handleCompleteShopping = async () => {
    const completedCount = items.filter(i => i.completed).length;
    if (completedCount === 0) {
      alert("Hãy đánh dấu các thực phẩm đã mua trước khi hoàn tất!");
      return;
    }

    if (confirm(`Bạn đã đi chợ xong? ${completedCount} món đồ đã mua sẽ được tự động chuyển vào tủ lạnh.`)) {
      try {
        const result = await api.completeShopping();
        alert(result.message);
        triggerRefresh();
      } catch (err) {
        console.error("Error completing shopping:", err);
      }
    }
  };

  // Group items by category
  const groupedItems = categories.reduce((acc, cat) => {
    acc[cat] = items.filter(item => item.category === cat);
    return acc;
  }, {});

  const getUserName = (id) => {
    const user = users.find(u => u.id === id);
    return user ? user.name : 'Chưa phân công';
  };

  return (
    <div className="fade-in">
      <div className="top-header">
        <div className="page-title">
          <h1>Danh sách đi chợ</h1>
          <p>Lên kế hoạch mua sắm chung, phân công các thành viên gia đình và đồng bộ tự động vào tủ lạnh khi hoàn tất.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={handleCompleteShopping} style={{ borderColor: 'rgba(59, 130, 246, 0.4)', color: 'var(--secondary)' }}>
            <Check size={18} /> Hoàn tất đi chợ
          </button>
          <button className="btn btn-primary" onClick={() => {
            setEditingId(null);
            setNewItem({
              name: '',
              category: 'Rau củ',
              quantity: '',
              unit: 'gram',
              assignedTo: currentUser.id
            });
            setShowAddModal(true);
          }}>
            <Plus size={18} /> Thêm đồ cần mua
          </button>
        </div>
      </div>

      {/* ITEMS LIST GROUPED BY CATEGORY */}
      {items.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <ShoppingBag size={48} style={{ color: 'var(--text-muted)', marginBottom: '10px', opacity: 0.5 }} />
          <p>Chưa có món hàng nào cần mua trong danh sách. Hãy thêm đồ mới hoặc tự động sinh từ kế hoạch bữa ăn!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {categories.map(cat => {
            const catItems = groupedItems[cat];
            if (catItems.length === 0) return null;

            return (
              <div key={cat} className="glass-card" style={{ padding: '1.25rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--secondary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--secondary)' }}></span>
                  {cat} ({catItems.length})
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {catItems.map(item => (
                    <div 
                      key={item.id} 
                      className={`shopping-list-item ${item.completed ? 'completed' : ''}`}
                    >
                      <div 
                        className="shopping-checkbox-container" 
                        onClick={() => handleToggleComplete(item)}
                      >
                        <div className={`shopping-checkbox ${item.completed ? 'checked' : ''}`}>
                          {item.completed && <Check size={14} style={{ color: '#fff' }} />}
                        </div>
                        <span className={`shopping-name ${item.completed ? 'line-through' : ''}`}>
                          {item.name}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <span className="shopping-badge">
                          {formatQuantity(item.quantity, item.unit)}
                        </span>

                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <User size={12} /> {getUserName(item.assignedTo)}
                        </span>

                        <button 
                          className="modal-close" 
                          style={{ padding: '4px' }}
                          onClick={() => handleEditClick(item)}
                          title="Chỉnh sửa mặt hàng"
                        >
                          <Edit2 size={16} style={{ color: 'var(--text-muted)' }} />
                        </button>

                        <button 
                          className="modal-close" 
                          style={{ padding: '4px' }}
                          onClick={() => handleDeleteItem(item.id)}
                          title="Xóa khỏi danh sách"
                        >
                          <Trash2 size={16} style={{ color: 'var(--danger)' }} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD SHOPPING ITEM MODAL */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">{editingId ? 'Chỉnh sửa mặt hàng' : 'Thêm đồ cần mua mới'}</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Tên mặt hàng *</label>
                <input 
                  type="text" 
                  name="name"
                  className="form-input" 
                  placeholder="Ví dụ: Bí đao, Hành lá, Sườn heo..." 
                  value={newItem.name}
                  onChange={(e) => {
                    const value = e.target.value;
                    setNewItem(prev => {
                      const updated = { ...prev, name: value };
                      const detectedCategory = detectCategory(value);
                      if (detectedCategory) {
                        updated.category = detectedCategory;
                      }
                      return updated;
                    });
                  }}
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label className="form-label">Phân loại quầy hàng</label>
                  <select 
                    name="category"
                    className="form-select" 
                    value={newItem.category}
                    onChange={(e) => setNewItem(prev => ({ ...prev, category: e.target.value }))}
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Phân công mua sắm</label>
                  <select 
                    name="assignedTo"
                    className="form-select" 
                    value={newItem.assignedTo}
                    onChange={(e) => setNewItem(prev => ({ ...prev, assignedTo: e.target.value }))}
                  >
                    {users.filter(u => u.id !== 'user-admin').map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role.split(' ')[0]})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label className="form-label">Số lượng *</label>
                  <input 
                    type="number" 
                    name="quantity"
                    step="any"
                    className="form-input" 
                    placeholder="100, 2..." 
                    value={newItem.quantity}
                    onChange={(e) => setNewItem(prev => ({ ...prev, quantity: e.target.value }))}
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Đơn vị</label>
                  <select 
                    name="unit"
                    className="form-select" 
                    value={newItem.unit}
                    onChange={(e) => setNewItem(prev => ({ ...prev, unit: e.target.value }))}
                  >
                    {units.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifySelf: 'end', gap: '10px', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Xác nhận</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
