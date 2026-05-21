import React, { useState, useEffect } from 'react';
import { api } from './api';
import Dashboard from './pages/Dashboard';
import Fridge from './pages/Fridge';
import ShoppingList from './pages/ShoppingList';
import Recipes from './pages/Recipes';
import MealPlanner from './pages/MealPlanner';
import Analytics from './pages/Analytics';
import Family from './pages/Family';
import AdminPanel from './pages/AdminPanel';

import { 
  LayoutDashboard, 
  Apple, 
  ShoppingCart, 
  ChefHat, 
  CalendarRange, 
  PieChart, 
  Users, 
  Settings, 
  UserCircle 
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
      // Default to Hương (Mom/Owner)
      const defaultUser = data.find(u => u.id === 'user-huong') || data[0];
      setCurrentUser(defaultUser);
    } catch (err) {
      console.error("Error loading initial users:", err);
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

  if (!currentUser) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '15px' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'pulse-border 1s infinite' }}></div>
        <p>Đang tải cấu hình hệ thống...</p>
      </div>
    );
  }

  // Define sidebar items
  const menuItems = [
    { key: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard, roleRequired: '' },
    { key: 'fridge', label: 'Tủ lạnh', icon: Apple, roleRequired: '' },
    { key: 'shopping', label: 'Đi chợ', icon: ShoppingCart, roleRequired: '' },
    { key: 'recipes', label: 'Công thức', icon: ChefHat, roleRequired: '' },
    { key: 'mealplan', label: 'Thực đơn tuần', icon: CalendarRange, roleRequired: '' },
    { key: 'analytics', label: 'Báo cáo', icon: PieChart, roleRequired: '' },
    { key: 'family', label: 'Gia đình', icon: Users, roleRequired: '' },
    { key: 'admin', label: 'Quản trị viên', icon: Settings, roleRequired: 'Quản trị viên' }
  ];

  // Filter menu based on roles
  const visibleMenuItems = menuItems.filter(item => {
    if (!item.roleRequired) return true;
    return currentUser.role.includes(item.roleRequired);
  });

  // Render Page Content
  const renderContent = () => {
    switch (currentTab) {
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
          <AdminPanel 
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
            const isActive = currentTab === item.key;
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img 
              src={currentUser.avatar} 
              alt={currentUser.name} 
              style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} 
            />
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentUser.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentUser.role.split(' ')[0]}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN LAYOUT */}
      <main className="main-content">
        {/* TOP PANEL FOR ROLE SWITCHER */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
          <div className="role-switcher-container">
            <span className="role-label">Phân vai trải nghiệm:</span>
            <select 
              className="role-select" 
              value={currentUser.id} 
              onChange={handleUserChange}
            >
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role.includes('Chủ hộ') ? 'Chủ hộ' : u.role.includes('Admin') ? 'Admin' : 'Thành viên'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* PAGE CONTENT */}
        {renderContent()}
      </main>
    </div>
  );
}
