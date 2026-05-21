import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { UserPlus, Shield, Mail, Trash2, Heart, ShieldAlert, Sparkles, UserCheck } from 'lucide-react';

export default function Family({ currentUser, refreshTrigger, triggerRefresh }) {
  const [users, setUsers] = useState([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    role: 'Thành viên (Member)',
    email: ''
  });

  const roles = [
    'Thành viên (Member)',
    'Thành viên (Kho & Tủ lạnh)',
    'Thành viên (Mua sắm)',
    'Thành viên (Công thức)',
    'Thành viên (Kế hoạch & Báo cáo)'
  ];

  useEffect(() => {
    fetchUsers();
  }, [refreshTrigger]);

  const fetchUsers = async () => {
    try {
      const data = await api.getUsers();
      // Filter out admin or display them separate
      setUsers(data);
    } catch (err) {
      console.error("Error fetching family users:", err);
    }
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    if (!newMember.name || !newMember.email) return;

    try {
      await api.addUser({
        ...newMember,
        avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${newMember.name}`
      });
      setShowInviteModal(false);
      setNewMember({
        name: '',
        role: 'Thành viên (Member)',
        email: ''
      });
      triggerRefresh();
    } catch (err) {
      console.error("Error adding user:", err);
    }
  };

  const handleDeleteUser = async (id) => {
    if (confirm("Bạn có chắc muốn xóa thành viên này ra khỏi nhóm gia đình?")) {
      try {
        await api.deleteUser(id);
        triggerRefresh();
      } catch (err) {
        console.error("Error deleting user:", err);
      }
    }
  };

  const isOwner = currentUser.role.includes('Chủ hộ');

  return (
    <div className="fade-in">
      <div className="top-header">
        <div className="page-title">
          <h1>Quản lý Nhóm Gia đình</h1>
          <p>Thiết lập nhóm gia đình của bạn, quản lý các vai trò phân công và chia sẻ công việc đi chợ hằng ngày.</p>
        </div>
        {isOwner && (
          <button className="btn btn-primary" onClick={() => setShowInviteModal(true)}>
            <UserPlus size={18} /> Mời thành viên
          </button>
        )}
      </div>

      {/* FAMILY LIST CARD */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={20} style={{ color: 'var(--primary)' }} />
          Thành viên trong nhóm (family-22)
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {users.filter(u => u.familyId === 'family-22').map(u => {
            const isCurrentUser = u.id === currentUser.id;
            const isMemberOwner = u.role.includes('Chủ hộ');

            return (
              <div 
                key={u.id}
                className="glass-card"
                style={{ 
                  padding: '1.25rem',
                  border: isCurrentUser ? '1px solid var(--primary)' : '1px solid var(--border)',
                  background: isCurrentUser ? 'rgba(16, 185, 129, 0.05)' : 'var(--bg-card)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '160px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <img 
                    src={u.avatar} 
                    alt={u.name} 
                    style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} 
                  />
                  <div>
                    <h4 style={{ fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {u.name}
                      {isCurrentUser && <span className="badge badge-fresh" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>Tôi</span>}
                    </h4>
                    <span style={{ fontSize: '0.8rem', color: isMemberOwner ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 600 }}>
                      {u.role}
                    </span>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
                      <Mail size={12} /> {u.email}
                    </div>
                  </div>
                </div>

                {isOwner && !isCurrentUser && !isMemberOwner && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '6px 12px', fontSize: '0.8rem', border: 'none', color: 'var(--danger)' }}
                      onClick={() => handleDeleteUser(u.id)}
                    >
                      <Trash2 size={14} /> Xóa thành viên
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* RESPONSIBILITY ASSIGNMENT RULES */}
      <div className="glass-card" style={{ marginTop: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserCheck size={18} style={{ color: 'var(--secondary)' }} />
          Bảng phân công trách nhiệm gia đình
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', fontSize: '0.85rem' }}>
          <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid var(--border)' }}>
            <strong style={{ color: 'var(--primary)' }}>Nguyễn Thị Hương (Chủ hộ):</strong>
            <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Toàn quyền quản trị nhóm, phê duyệt các thực đơn và phân công mua sắm.</p>
          </div>
          <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid var(--border)' }}>
            <strong style={{ color: 'var(--primary)' }}>Trần Đức Thắng (Kho hàng):</strong>
            <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Chịu trách nhiệm quản lý hàng tồn, vị trí tủ lạnh và xử lý đồ quá hạn.</p>
          </div>
          <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid var(--border)' }}>
            <strong style={{ color: 'var(--primary)' }}>Lê Hoàng Duy (Mua sắm):</strong>
            <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Chịu trách nhiệm đi siêu thị/chợ và đánh dấu hoàn thành mua sắm.</p>
          </div>
          <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid var(--border)' }}>
            <strong style={{ color: 'var(--primary)' }}>Phạm Hải Nam (Nấu bếp):</strong>
            <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Sáng tạo công thức, theo dõi khớp nguyên liệu và chế biến các bữa ăn.</p>
          </div>
          <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid var(--border)' }}>
            <strong style={{ color: 'var(--primary)' }}>Nguyễn Tấn Dương (Kế hoạch):</strong>
            <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Lên thực đơn tuần và tối ưu hóa lượng thức ăn thừa/chi tiêu.</p>
          </div>
        </div>
      </div>

      {/* INVITE MODAL */}
      {showInviteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Mời thành viên mới vào gia đình</h3>
              <button className="modal-close" onClick={() => setShowInviteModal(false)}>✕</button>
            </div>

            <form onSubmit={handleInviteSubmit}>
              <div className="form-group">
                <label className="form-label">Tên thành viên *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ví dụ: Nguyễn Văn A" 
                  value={newMember.name}
                  onChange={(e) => setNewMember(prev => ({ ...prev, name: e.target.value }))}
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email liên hệ *</label>
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="ví dụ: email@gmail.com" 
                  value={newMember.email}
                  onChange={(e) => setNewMember(prev => ({ ...prev, email: e.target.value }))}
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phân công vai trò chính</label>
                <select 
                  className="form-select"
                  value={newMember.role}
                  onChange={(e) => setNewMember(prev => ({ ...prev, role: e.target.value }))}
                >
                  {roles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', justifySelf: 'end', gap: '10px', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowInviteModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Gửi lời mời</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
