import { useState, useEffect } from 'react';
import { api } from '../api';
import {
  Thermometer, ShoppingCart, ChefHat, CalendarRange,
  ShieldAlert, Sparkles, ArrowRight, Clock, Package
} from 'lucide-react';

export default function Dashboard({ currentUser, onTabChange, refreshTrigger }) {
  const [fridge, setFridge]       = useState([]);
  const [shopping, setShopping]   = useState([]);
  const [recipes, setRecipes]     = useState([]);
  const [mealPlan, setMealPlan]   = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    loadAll();
  }, [refreshTrigger]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [f, s, r, m] = await Promise.all([
        api.getFridge(),
        api.getShopping(),
        api.getRecipes(),
        api.getMealPlan(),
      ]);
      setFridge(f);
      setShopping(s);
      setRecipes(r);
      setMealPlan(m);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Đang tải tổng quan...
      </div>
    );
  }

  // --- Derived stats ---
  const activeItems    = fridge.filter(i => i.status === 'fresh' || i.status === 'expiring' || i.status === 'expired');
  const expiringItems  = fridge.filter(i => i.status === 'expiring');
  const expiredItems   = fridge.filter(i => i.status === 'expired');
  const pendingShop    = shopping.filter(i => !i.completed);
  const completedShop  = shopping.filter(i => i.completed);

  // Items expiring soonest (top 5)
  const soonExpiring = [...expiringItems]
    .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))
    .slice(0, 5);

  const stats = [
    {
      label: 'Thực phẩm trong tủ',
      value: activeItems.length,
      unit: 'loại',
      icon: <Thermometer size={28} />,
      iconClass: 'green',
      tab: 'fridge',
    },
    {
      label: 'Cần mua sắm',
      value: pendingShop.length,
      unit: 'mặt hàng',
      icon: <ShoppingCart size={28} />,
      iconClass: 'blue',
      tab: 'shopping',
    },
    {
      label: 'Công thức có sẵn',
      value: recipes.length,
      unit: 'món',
      icon: <ChefHat size={28} />,
      iconClass: 'amber',
      tab: 'recipes',
    },
    {
      label: 'Bữa đã lên kế hoạch',
      value: mealPlan.length,
      unit: 'bữa / tuần',
      icon: <CalendarRange size={28} />,
      iconClass: 'purple',
      tab: 'mealplan',
    },
  ];

  const quickActions = [
    { label: 'Quản lý tủ lạnh',  tab: 'fridge',    color: 'var(--primary)',   bg: 'rgba(16,185,129,0.12)' },
    { label: 'Danh sách đi chợ', tab: 'shopping',  color: 'var(--secondary)', bg: 'rgba(59,130,246,0.12)' },
    { label: 'Tìm công thức',    tab: 'recipes',   color: 'var(--warning)',   bg: 'rgba(245,158,95,0.12)'  },
    { label: 'Lập thực đơn',     tab: 'mealplan',  color: 'var(--purple)',    bg: 'rgba(139,92,246,0.12)'  },
    { label: 'Xem báo cáo',      tab: 'analytics', color: '#38bdf8',          bg: 'rgba(56,189,248,0.12)'  },
    { label: 'Quản lý gia đình', tab: 'family',    color: '#f472b6',          bg: 'rgba(244,114,182,0.12)' },
  ];

  return (
    <div className="fade-in">
      {/* HEADER */}
      <div className="top-header">
        <div className="page-title">
          <h1>Xin chào, {currentUser?.name?.split(' ').pop()} 👋</h1>
          <p>Tổng quan hệ thống quản lý thực phẩm gia đình — ITSS Mart Nhóm 22.</p>
        </div>
      </div>

      {/* ALERT BANNERS */}
      {(expiredItems.length > 0 || expiringItems.length > 0) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '1.5rem' }}>
          {expiredItems.length > 0 && (
            <div className="alert-bar danger">
              <ShieldAlert size={20} />
              <span>
                Có <strong>{expiredItems.length}</strong> thực phẩm đã <strong>quá hạn sử dụng</strong>!
                Hãy kiểm tra và dọn dẹp ngay.
              </span>
              <button
                className="btn btn-secondary"
                style={{ marginLeft: 'auto', padding: '4px 12px', fontSize: '0.8rem' }}
                onClick={() => onTabChange('fridge')}
              >
                Xem tủ lạnh <ArrowRight size={14} />
              </button>
            </div>
          )}
          {expiringItems.length > 0 && (
            <div className="alert-bar warning">
              <Sparkles size={20} />
              <span>
                Có <strong>{expiringItems.length}</strong> thực phẩm <strong>sắp hết hạn</strong> trong 3 ngày tới.
                Hãy ưu tiên chế biến!
              </span>
              <button
                className="btn btn-secondary"
                style={{ marginLeft: 'auto', padding: '4px 12px', fontSize: '0.8rem' }}
                onClick={() => onTabChange('recipes')}
              >
                Gợi ý nấu <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* STATS GRID */}
      <div className="dashboard-grid">
        {stats.map(s => (
          <div
            key={s.tab}
            className="glass-card stat-card"
            style={{ cursor: 'pointer' }}
            onClick={() => onTabChange(s.tab)}
          >
            <div className={`stat-icon ${s.iconClass}`}>
              {s.icon}
            </div>
            <div>
              <div className="stat-number">
                {s.value}{' '}
                <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                  {s.unit}
                </span>
              </div>
              <div className="stat-title">{s.label}</div>
            </div>
            <ArrowRight
              size={16}
              style={{ marginLeft: 'auto', color: 'var(--text-muted)', opacity: 0.5 }}
            />
          </div>
        ))}
      </div>

      {/* BOTTOM SECTION */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '0.5rem' }}>

        {/* SOON EXPIRING LIST */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} style={{ color: 'var(--warning)' }} />
              Sắp hết hạn
            </h3>
            <button
              className="btn btn-secondary"
              style={{ padding: '4px 12px', fontSize: '0.8rem' }}
              onClick={() => onTabChange('fridge')}
            >
              Xem tất cả
            </button>
          </div>

          {soonExpiring.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0', fontSize: '0.9rem' }}>
              <Sparkles size={32} style={{ opacity: 0.3, display: 'block', margin: '0 auto 8px' }} />
              Không có thực phẩm nào sắp hết hạn. Tốt lắm!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {soonExpiring.map(item => {
                const daysLeft = Math.ceil(
                  (new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)
                );
                return (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 14px', borderRadius: '12px',
                      background: 'rgba(245,158,95,0.07)',
                      border: '1px solid rgba(245,158,95,0.2)',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{item.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {item.quantity} {item.unit} · {item.storageLocation}
                      </div>
                    </div>
                    <span className="badge badge-warning">
                      {daysLeft <= 0 ? 'Hôm nay' : `${daysLeft} ngày`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* QUICK ACTIONS */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Package size={18} style={{ color: 'var(--primary)' }} />
            Truy cập nhanh
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', flexGrow: 1 }}>
            {quickActions.map(action => (
              <button
                key={action.tab}
                onClick={() => onTabChange(action.tab)}
                style={{
                  padding: '14px',
                  borderRadius: '14px',
                  background: action.bg,
                  border: `1px solid ${action.color}30`,
                  color: action.color,
                  fontFamily: 'var(--font-family)',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'var(--transition)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <ArrowRight size={14} />
                {action.label}
              </button>
            ))}
          </div>

          {/* Shopping summary strip */}
          {pendingShop.length > 0 && (
            <div style={{
              marginTop: '1rem', padding: '10px 14px', borderRadius: '12px',
              background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                🛒 Chưa mua: <strong style={{ color: 'var(--text-main)' }}>{pendingShop.length}</strong>
                {completedShop.length > 0 && ` · Đã mua: ${completedShop.length}`}
              </span>
              <button
                className="btn btn-secondary"
                style={{ padding: '4px 12px', fontSize: '0.8rem' }}
                onClick={() => onTabChange('shopping')}
              >
                Đi chợ
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
