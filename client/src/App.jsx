import React, { useState, useEffect } from 'react';
import { api } from './api';
import Login from './pages/Login';
import Register from './pages/Register';
import FamilySetup from './pages/FamilySetup';
import Dashboard from './pages/Dashboard';
import Fridge from './pages/Fridge';
import ShoppingList from './pages/ShoppingList';
import Recipes from './pages/Recipes';
import MealPlanner from './pages/MealPlanner';
import Analytics from './pages/Analytics';
import Family from './pages/Family';
import AdminPanel from './pages/AdminPanel';
import AdminDashboard from './pages/AdminDashboard';

import { 
  LayoutDashboard, 
  Apple, 
  ShoppingCart, 
  ChefHat, 
  CalendarRange, 
  PieChart, 
  Users, 
  Settings, 
  UserCircle,
  LogOut,
  Key
} from 'lucide-react';

export default function App() {
  const [authState, setAuthState]     = useState('loading'); // 'loading' | 'login' | 'register' | 'family-setup' | 'app'
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers]             = useState([]);
  const [currentTab, setCurrentTab]   = useState('dashboard');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  // Kiểm tra token khi khởi động
  useEffect(() => {
    const token = localStorage.getItem('itss_token');
    if (!token) {
      setAuthState('login');
      return;
    }
    api.auth.me()
      .then(user => {
        setCurrentUser(user);
        if (!user.familyId) {
          setAuthState('family-setup');
        } else {
          loadUsers(user);
          setAuthState('app');
        }
      })
      .catch(() => {
        localStorage.removeItem('itss_token');
        localStorage.removeItem('itss_user');
        setAuthState('login');
      });
  }, []);

  const loadUsers = async (loggedUser) => {
    try {
      const data = await api.getUsers();
      setUsers(data);
      // Ưu tiên user đang đăng nhập, fallback về Hương
      const me = loggedUser && data.find(u => u.id === loggedUser.id);
      const defaultUser = me || data.find(u => u.id === 'user-huong') || data[0];
      setCurrentUser(defaultUser);
    } catch (err) {
      console.error('Error loading users:', err);
    }
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    if (!user.familyId) {
      setAuthState('family-setup');
    } else {
      loadUsers(user);
      setAuthState('app');
    }
  };

  const handleFamilySetupComplete = (user) => {
    setCurrentUser(user);
    loadUsers(user);
    setAuthState('app');
  };

  const handleLogout = () => {
    localStorage.removeItem('itss_token');
    localStorage.removeItem('itss_user');
    setCurrentUser(null);
    setUsers([]);
    setCurrentTab('dashboard');
    setAuthState('login');
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return alert('Mật khẩu mới không khớp.');
    }
    try {
      await api.changePassword({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
      alert('Đổi mật khẩu thành công!');
      setShowPasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  };

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleUserChange = (e) => {
    const selected = users.find(u => u.id === e.target.value);
    if (selected) {
      setCurrentUser(selected);
      triggerRefresh();
      
      // If switching away from Admin while on Admin panel, fallback to dashboard
      if (selected.id !== 'user-admin' && currentTab === 'admin') {
        setCurrentTab('dashboard');
      }
    }
  };

  // ── AUTH SCREENS ─────────────────────────────────────────────
  if (authState === 'loading') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '15px' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'pulse-border 1s infinite' }}></div>
        <p>Đang tải...</p>
      </div>
    );
  }

  if (authState === 'login') {
    return (
      <Login
        onLoginSuccess={handleLoginSuccess}
        onGoRegister={() => setAuthState('register')}
      />
    );
  }

  if (authState === 'register') {
    return (
      <Register
        onRegisterSuccess={handleLoginSuccess}
        onGoLogin={() => setAuthState('login')}
      />
    );
  }

  if (authState === 'family-setup') {
    return (
      <FamilySetup onSetupComplete={handleFamilySetupComplete} />
    );
  }

  if (!currentUser) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '15px' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'pulse-border 1s infinite' }}></div>
        <p>Đang tải cấu hình hệ thống...</p>
      </div>
    );
  }

  // Kiểm tra quyền Admin
  const isAdmin = currentUser.role.includes('Admin') || currentUser.role.includes('Quản trị viên');

  // Define sidebar items
  const allMenuItems = [
    { key: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { key: 'fridge', label: 'Tủ lạnh', icon: Apple },
    { key: 'shopping', label: 'Đi chợ', icon: ShoppingCart },
    { key: 'recipes', label: 'Công thức', icon: ChefHat },
    { key: 'mealplan', label: 'Thực đơn tuần', icon: CalendarRange },
    { key: 'analytics', label: 'Báo cáo', icon: PieChart },
    { key: 'family', label: 'Gia đình', icon: Users },
  ];

  const adminMenuItems = [
    { key: 'admin', label: 'Quản trị viên', icon: Settings },
  ];

  // Admin chỉ thấy menu admin; user thường thấy tất cả + admin nếu có role
  const visibleMenuItems = isAdmin
    ? adminMenuItems
    : [
        ...allMenuItems,
        ...(currentUser.role.includes('Quản trị viên') || currentUser.role.includes('Admin')
          ? [{ key: 'admin', label: 'Quản trị viên', icon: Settings }]
          : []),
      ];

  // Admin luôn ở tab admin
  const effectiveTab = isAdmin ? 'admin' : currentTab;

  // Render Page Content
  const renderContent = () => {
    switch (effectiveTab) {
      case 'dashboard':
        return (
          <Dashboard 
            currentUser={currentUser} 
            onTabChange={setCurrentTab} 
            refreshTrigger={refreshTrigger}
            triggerRefresh={triggerRefresh}
          />
        );
      case 'fridge':
        return (
          <Fridge 
            currentUser={currentUser} 
            refreshTrigger={refreshTrigger}
            triggerRefresh={triggerRefresh}
          />
        );
      case 'shopping':
        return (
          <ShoppingList 
            currentUser={currentUser} 
            refreshTrigger={refreshTrigger}
            triggerRefresh={triggerRefresh}
          />
        );
      case 'recipes':
        return (
          <Recipes 
            currentUser={currentUser} 
            refreshTrigger={refreshTrigger}
            triggerRefresh={triggerRefresh}
          />
        );
      case 'mealplan':
        return (
          <MealPlanner 
            currentUser={currentUser} 
            refreshTrigger={refreshTrigger}
            triggerRefresh={triggerRefresh}
          />
        );
      case 'analytics':
        return (
          <Analytics 
            currentUser={currentUser} 
            refreshTrigger={refreshTrigger}
          />
        );
      case 'family':
        return (
          <Family 
            currentUser={currentUser} 
            refreshTrigger={refreshTrigger}
            triggerRefresh={triggerRefresh}
          />
        );
      case 'admin':
        return (
          <AdminDashboard
            currentUser={currentUser}
            refreshTrigger={refreshTrigger}
            triggerRefresh={triggerRefresh}
          />
        );
      default:
        return <div>Tính năng đang phát triển</div>;
    }
  };

  return (
    <div className="app-container">
      {/* SIDEBAR NAVIGATION */}
      <aside className="sidebar">
        <div className="logo-container">
          <div className="logo-icon">🛒</div>
          <div>
            <span className="logo-text">ITSS Mart</span>
            <span className="logo-subtext">Nhóm 22 - Chủ đề 04</span>
          </div>
        </div>

        <nav className="nav-menu">
          {visibleMenuItems.map(item => {
            const Icon = item.icon;
            const isActive = effectiveTab === item.key;
            return (
              <a 
                key={item.key} 
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setCurrentTab(item.key)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>

        <div className="nav-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, overflow: 'hidden' }}>
            <img 
              src={currentUser.avatar} 
              alt={currentUser.name} 
              style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', flexShrink: 0 }} 
            />
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentUser.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentUser.role.split(' ')[0]}
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowPasswordModal(true)}
            title="Đổi mật khẩu"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', padding: '6px', borderRadius: '8px',
              display: 'flex', alignItems: 'center', transition: 'color 0.2s, background 0.2s',
              flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.background = 'rgba(16,185,129,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none'; }}
          >
            <Key size={18} />
          </button>
          <button
            id="logout-btn"
            onClick={handleLogout}
            title="Đăng xuất"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', padding: '6px', borderRadius: '8px',
              display: 'flex', alignItems: 'center', transition: 'color 0.2s, background 0.2s',
              flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none'; }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* MAIN LAYOUT */}
      <main className="main-content">

        {/* PAGE CONTENT */}
        {renderContent()}
      </main>

      {/* ĐỔI MẬT KHẨU MODAL */}
      {showPasswordModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3 className="modal-title">Đổi mật khẩu</h3>
              <button className="modal-close" onClick={() => setShowPasswordModal(false)}>✕</button>
            </div>
            <form onSubmit={handlePasswordSubmit}>
              <div className="form-group">
                <label className="form-label">Mật khẩu hiện tại</label>
                <input 
                  type="password" 
                  className="form-input" 
                  value={passwordForm.currentPassword}
                  onChange={e => setPasswordForm(p => ({ ...p, currentPassword: e.target.value }))}
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Mật khẩu mới</label>
                <input 
                  type="password" 
                  className="form-input" 
                  value={passwordForm.newPassword}
                  onChange={e => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))}
                  required 
                  minLength={6}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Xác nhận mật khẩu mới</label>
                <input 
                  type="password" 
                  className="form-input" 
                  value={passwordForm.confirmPassword}
                  onChange={e => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))}
                  required 
                  minLength={6}
                />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowPasswordModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Xác nhận</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
