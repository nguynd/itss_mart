import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Plus, Search, Calendar, MapPin, Trash2, Check, Thermometer, ShieldAlert, Sparkles, Edit2 } from 'lucide-react';
import { formatQuantityValue, formatUnit } from '../utils/format';
import { detectCategory } from '../utils/categoryDetector';

export default function Fridge({ currentUser, refreshTrigger, triggerRefresh }) {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('Tất cả'); // Tất cả, Ngăn đông, Ngăn mát, Tủ khô
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [categories, setCategories] = useState(['Rau củ', 'Thịt cá', 'Đồ khô', 'Gia vị', 'Khác']);
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'Rau củ',
    quantity: '',
    unit: 'gram',
    expiryDate: '',
    storageLocation: 'Ngăn mát'
  });

  const locations = ['Ngăn đông', 'Ngăn mát', 'Tủ khô'];
  const units = ['gram', 'muỗng', 'gói', 'quả', 'miếng', 'hộp', 'chai', 'bó'];

  useEffect(() => {
    fetchFridge();
    api.getCategories().then(cats => {
      if (cats && cats.length > 0) {
        const mainCatNames = cats.filter(c => !c.parentId).map(c => c.name);
        setCategories(mainCatNames);
      }
    }).catch(() => {});
  }, [refreshTrigger]);

  const fetchFridge = async () => {
    try {
      const data = await api.getFridge();
      // Only show active items (fresh, expiring, expired) - hide consumed and wasted
      setItems(data.filter(i => i.status === 'fresh' || i.status === 'expiring' || i.status === 'expired'));
    } catch (err) {
      console.error("Error fetching fridge:", err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewItem(prev => {
      const updated = { ...prev, [name]: value };
      
      if (name === 'name') {
        const detectedCategory = detectCategory(value);
        if (detectedCategory) {
          updated.category = detectedCategory;
          if (!prev.expiryDate) {
            let shelfLife = 7;
            if (detectedCategory === 'Thịt cá') shelfLife = 3;
            else if (detectedCategory === 'Rau củ') shelfLife = 5;
            else if (detectedCategory === 'Đồ khô') shelfLife = 30;
            else if (detectedCategory === 'Gia vị') shelfLife = 90;
            
            const d = new Date();
            d.setDate(d.getDate() + shelfLife);
            updated.expiryDate = d.toISOString().split('T')[0];
          }
        }
      }
      
      // Auto-suggest expiry date based on category when adding a new item
      if (name === 'category' && !prev.expiryDate) {
        let shelfLife = 7;
        if (value === 'Thịt cá') shelfLife = 3;
        else if (value === 'Rau củ') shelfLife = 5;
        else if (value === 'Đồ khô') shelfLife = 30;
        else if (value === 'Gia vị') shelfLife = 90;
        
        const d = new Date();
        d.setDate(d.getDate() + shelfLife);
        updated.expiryDate = d.toISOString().split('T')[0];
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newItem.name || !newItem.quantity) return;

    try {
      const expiryISO = newItem.expiryDate 
        ? new Date(newItem.expiryDate).toISOString() 
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      if (editingId) {
        await api.updateFridgeItem(editingId, {
          ...newItem,
          quantity: parseFloat(newItem.quantity),
          expiryDate: expiryISO
        });
      } else {
        await api.addFridgeItem({
          ...newItem,
          quantity: parseFloat(newItem.quantity),
          expiryDate: expiryISO
        });
      }

      setShowAddModal(false);
      setEditingId(null);
      setNewItem({
        name: '',
        category: 'Rau củ',
        quantity: '',
        unit: 'gram',
        expiryDate: '',
        storageLocation: 'Ngăn mát'
      });
      triggerRefresh();
    } catch (err) {
      console.error("Error adding fridge item:", err);
    }
  };

  const handleEditClick = (item) => {
    setEditingId(item.id);
    setNewItem({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : '',
      storageLocation: item.storageLocation
    });
    setShowAddModal(true);
  };

  const handleUpdateQty = async (id, currentQty, unit, change) => {
    const newQty = parseFloat(currentQty) + change;
    if (newQty <= 0) {
      // Mark as consumed if reduced to 0
      await api.updateFridgeItem(id, { quantity: 0, status: 'consumed' });
    } else {
      await api.updateFridgeItem(id, { quantity: newQty });
    }
    triggerRefresh();
  };

  const handleMarkWasted = async (id) => {
    if (confirm("Bạn muốn bỏ thực phẩm này đi vì bị hỏng/lãng phí?")) {
      await api.updateFridgeItem(id, { status: 'wasted' });
      triggerRefresh();
    }
  };

  const handleMarkConsumed = async (id) => {
    await api.updateFridgeItem(id, { quantity: 0, status: 'consumed' });
    triggerRefresh();
  };

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesTab = activeTab === 'Tất cả' || item.storageLocation === activeTab;
    return matchesSearch && matchesTab;
  });

  // Calculate stats for alerts
  const expiringCount = items.filter(i => i.status === 'expiring').length;
  const expiredCount = items.filter(i => i.status === 'expired').length;

  return (
    <div className="fade-in">
      <div className="top-header">
        <div className="page-title">
          <h1>Tủ lạnh thông minh</h1>
          <p>Theo dõi hạn sử dụng, quản lý vị trí lưu trữ và tối ưu hóa bảo quản thực phẩm.</p>
        </div>
        <button className="btn btn-primary" onClick={() => {
          setEditingId(null);
          setNewItem({
            name: '',
            category: 'Rau củ',
            quantity: '',
            unit: 'gram',
            expiryDate: '',
            storageLocation: 'Ngăn mát'
          });
          setShowAddModal(true);
        }}>
          <Plus size={18} /> Thêm thực phẩm
        </button>
      </div>

      {/* WARNING NOTIFICATION BANNER */}
      {(expiringCount > 0 || expiredCount > 0) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '1.5rem' }}>
          {expiredCount > 0 && (
            <div className="alert-bar danger">
              <ShieldAlert size={20} />
              <span>Cảnh báo! Có <strong>{expiredCount}</strong> thực phẩm đã quá hạn sử dụng. Hãy dọn dẹp để tránh vi khuẩn lây lan!</span>
            </div>
          )}
          {expiringCount > 0 && (
            <div className="alert-bar warning">
              <Sparkles size={20} />
              <span>Nhắc nhở! Có <strong>{expiringCount}</strong> thực phẩm sắp hết hạn (trong vòng 3 ngày). Hãy ưu tiên chế biến các món này!</span>
            </div>
          )}
        </div>
      )}

      {/* FILTER TABS & SEARCH */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '1.5rem' }}>
        <div className="tab-container" style={{ marginBottom: 0 }}>
          {['Tất cả', 'Ngăn mát', 'Ngăn đông', 'Tủ khô'].map(tab => (
            <button 
              key={tab} 
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: '280px' }}>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Tìm thực phẩm..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '40px' }}
          />
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '12px', color: 'var(--text-muted)' }} />
        </div>
      </div>

      {/* INVENTORY CARDS */}
      {filteredItems.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <Thermometer size={48} style={{ color: 'var(--text-muted)', marginBottom: '10px', opacity: 0.5 }} />
          <p>Không tìm thấy thực phẩm nào. Nhấp vào "Thêm thực phẩm" để nhập mới!</p>
        </div>
      ) : (
        <div className="cards-grid">
          {filteredItems.map(item => {
            const isExpired = item.status === 'expired';
            const isExpiring = item.status === 'expiring';
            const dateStr = new Date(item.expiryDate).toLocaleDateString('vi-VN');

            return (
              <div 
                key={item.id} 
                className={`card-item ${isExpired ? 'expired' : ''} ${isExpiring ? 'expiring' : ''}`}
              >
                <div>
                  <div className="card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="card-title">{item.name}</span>
                      <button className="btn btn-secondary" style={{ padding: '4px', fontSize: '0.75rem', background: 'transparent', border: 'none', color: 'var(--text-muted)' }} onClick={() => handleEditClick(item)} title="Chỉnh sửa">
                        <Edit2 size={14} />
                      </button>
                    </div>
                    <span className={`badge ${
                      isExpired ? 'badge-danger' : 
                      isExpiring ? 'badge-warning' : 
                      'badge-fresh'
                    }`}>
                      {isExpired ? 'Quá hạn' : isExpiring ? 'Cận hạn' : 'Tươi ngon'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <MapPin size={12} /> {item.storageLocation} • {item.category}
                  </div>

                  <div style={{ fontSize: '1.25rem', fontWeight: 700, margin: '12px 0 6px 0' }}>
                    {formatQuantityValue(item.quantity, item.unit)} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>{formatUnit(item.quantity, item.unit)}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: isExpired ? 'var(--danger)' : isExpiring ? 'var(--warning)' : 'var(--text-muted)' }}>
                    <Calendar size={12} /> Hạn: {dateStr}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '4px' }}>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '4px 8px', flexGrow: 1, fontSize: '0.8rem' }}
                      onClick={() => handleUpdateQty(item.id, item.quantity, item.unit, -1)}
                      title="Giảm bớt 1 đơn vị"
                    >
                      -1
                    </button>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '4px 8px', flexGrow: 1, fontSize: '0.8rem' }}
                      onClick={() => handleUpdateQty(item.id, item.quantity, item.unit, 1)}
                      title="Tăng thêm 1 đơn vị"
                    >
                      +1
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '6px 8px', width: '70%', fontSize: '0.75rem', borderColor: 'rgba(16,185,129,0.2)', background: 'var(--primary-glow)', color: 'var(--primary)' }}
                      onClick={() => handleMarkConsumed(item.id)}
                    >
                      <Check size={12} /> Dùng hết
                    </button>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '6px 8px', width: '30%', fontSize: '0.75rem' }}
                      onClick={() => handleMarkWasted(item.id)}
                      title="Đồ hỏng, lãng phí"
                    >
                      <Trash2 size={12} style={{ color: 'var(--danger)' }} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD ITEM MODAL */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">{editingId ? 'Chỉnh sửa thực phẩm' : 'Thêm thực phẩm mới'}</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Tên thực phẩm *</label>
                <input 
                  type="text" 
                  name="name"
                  className="form-input" 
                  placeholder="Ví dụ: Thịt heo, Cải bẹ xanh, sữa..." 
                  value={newItem.name}
                  onChange={handleInputChange}
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label className="form-label">Phân loại</label>
                  <select 
                    name="category"
                    className="form-select" 
                    value={newItem.category}
                    onChange={handleInputChange}
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Vị trí lưu trữ</label>
                  <select 
                    name="storageLocation"
                    className="form-select" 
                    value={newItem.storageLocation}
                    onChange={handleInputChange}
                  >
                    {locations.map(l => <option key={l} value={l}>{l}</option>)}
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
                    onChange={handleInputChange}
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Đơn vị</label>
                  <select 
                    name="unit"
                    className="form-select" 
                    value={newItem.unit}
                    onChange={handleInputChange}
                  >
                    {units.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Ngày hết hạn (Để trống sẽ tự động đề xuất)</label>
                <input 
                  type="date" 
                  name="expiryDate"
                  className="form-input" 
                  value={newItem.expiryDate}
                  onChange={handleInputChange}
                />
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
