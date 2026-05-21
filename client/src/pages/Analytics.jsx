import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { BarChart3, PieChart, TrendingUp, AlertTriangle, CheckSquare, Sparkles } from 'lucide-react';

export default function Analytics({ currentUser, refreshTrigger }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, [refreshTrigger]);

  const fetchAnalytics = async () => {
    try {
      const stats = await api.getAnalytics();
      setData(stats);
    } catch (err) {
      console.error("Error fetching analytics:", err);
    }
  };

  if (!data) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Đang tải phân tích thống kê...</div>;
  }

  // Formatting currency
  const formatVND = (num) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  const totalSpend = Object.values(data.spendByCategory).reduce((a, b) => a + b, 0);

  // SVG configurations for charts
  // 1. Pie Chart calculations (Wasted, Consumed, Active)
  const pieTotal = data.wastedCount + data.consumedCount + data.activeCount || 1;
  const pWasted = (data.wastedCount / pieTotal) * 100;
  const pConsumed = (data.consumedCount / pieTotal) * 100;
  const pActive = (data.activeCount / pieTotal) * 100;

  // Render SVG Pie Chart parts
  // Simple circular dasharray or paths
  let accumulatedAngle = 0;
  const getCoordinatesForPercent = (percent) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  const getPieSlicePath = (percent) => {
    if (percent === 0) return '';
    if (percent >= 100) return 'M 0 -1 A 1 1 0 1 1 -0.0001 -1 L 0 0 Z';
    
    const startPercent = accumulatedAngle;
    accumulatedAngle += percent / 100;
    const endPercent = accumulatedAngle;

    const [startX, startY] = getCoordinatesForPercent(startPercent);
    const [endX, endY] = getCoordinatesForPercent(endPercent);
    
    // Large arc flag
    const largeArcFlag = percent > 50 ? 1 : 0;

    // Scale from radius 1 to radius 80 for display, centered at (100, 100)
    const r = 70;
    const cx = 100;
    const cy = 100;

    const sX = cx + startX * r;
    const sY = cy + startY * r;
    const eX = cx + endX * r;
    const eY = cy + endY * r;

    return `M ${cx} ${cy} L ${sX} ${sY} A ${r} ${r} 0 ${largeArcFlag} 1 ${eX} ${eY} Z`;
  };

  // Reset angle for rendering
  accumulatedAngle = 0;
  const pathWasted = getPieSlicePath(pWasted);
  const pathConsumed = getPieSlicePath(pConsumed);
  const pathActive = getPieSlicePath(pActive);

  // 2. Bar Chart coordinates for Category spend
  const cats = Object.keys(data.spendByCategory);
  const maxSpend = Math.max(...Object.values(data.spendByCategory)) || 1;

  // 3. Line Chart coordinates for Monthly trends
  const trendMax = Math.max(...data.monthlyTrends.map(t => t.spend)) || 1;

  return (
    <div className="fade-in">
      <div className="top-header">
        <div className="page-title">
          <h1>Báo cáo & Thống kê</h1>
          <p>Phân tích hiệu suất sử dụng thực phẩm, chi tiêu đi chợ và tỷ lệ hao phí trong gia đình.</p>
        </div>
      </div>

      {/* METRICS ROW */}
      <div className="dashboard-grid">
        <div className="glass-card stat-card">
          <div className="stat-icon red" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
            <AlertTriangle size={28} />
          </div>
          <div>
            <div className="stat-number" style={{ color: data.wasteRate > 15 ? 'var(--danger)' : 'var(--warning)' }}>
              {data.wasteRate}%
            </div>
            <div className="stat-title">Tỷ lệ lãng phí thực phẩm</div>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon green">
            <Sparkles size={28} />
          </div>
          <div>
            <div className="stat-number">{data.consumedCount} món</div>
            <div className="stat-title">Thực phẩm đã sử dụng ngon miệng</div>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon blue">
            <CheckSquare size={28} />
          </div>
          <div>
            <div className="stat-number">{formatVND(totalSpend)}</div>
            <div className="stat-title">Ước tính chi phí tháng này</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
        {/* PIE CHART - FOOD WASTE vs USE */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 style={{ alignSelf: 'flex-start', fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PieChart size={18} style={{ color: 'var(--primary)' }} />
            Tình trạng tiêu dùng tủ lạnh
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', width: '100%', gap: '20px' }}>
            <svg width="200" height="200" viewBox="0 0 200 200" style={{ transform: 'rotate(-90deg)' }}>
              {pWasted > 0 && <path d={pathWasted} fill="var(--danger)" opacity="0.85" />}
              {pConsumed > 0 && <path d={pathConsumed} fill="var(--primary)" opacity="0.85" />}
              {pActive > 0 && <path d={pathActive} fill="var(--secondary)" opacity="0.85" />}
              {pieTotal === 0 && <circle cx="100" cy="100" r="70" fill="rgba(255,255,255,0.05)" />}
              {/* Inner hole for donut chart look */}
              <circle cx="100" cy="100" r="40" fill="#0f172a" />
            </svg>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                <span style={{ width: 12, height: 12, borderRadius: '3px', background: 'var(--primary)' }}></span>
                <span>Đã dùng hết: {Math.round(pConsumed)}% ({data.consumedCount} món)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                <span style={{ width: 12, height: 12, borderRadius: '3px', background: 'var(--secondary)' }}></span>
                <span>Đang trữ kho: {Math.round(pActive)}% ({data.activeCount} món)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                <span style={{ width: 12, height: 12, borderRadius: '3px', background: 'var(--danger)' }}></span>
                <span style={{ color: data.wasteRate > 0 ? 'var(--danger)' : 'inherit' }}>
                  Lãng phí (Hỏng/Hết hạn): {Math.round(pWasted)}% ({data.wastedCount} món)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* BAR CHART - SPENDING CATEGORY */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={18} style={{ color: 'var(--secondary)' }} />
            Cơ cấu chi tiêu mua sắm
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flexGrow: 1, justifyContent: 'center' }}>
            {cats.map(cat => {
              const val = data.spendByCategory[cat] || 0;
              const pct = (val / maxSpend) * 100;

              return (
                <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '80px', fontSize: '0.85rem', fontWeight: 500 }}>{cat}</div>
                  <div style={{ flexGrow: 1, height: '14px', background: 'rgba(255,255,255,0.05)', borderRadius: '7px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        width: `${pct}%`, 
                        height: '100%', 
                        background: 'linear-gradient(90deg, var(--secondary) 0%, #60a5fa 100%)',
                        borderRadius: '7px',
                        transition: 'width 0.8s ease-out'
                      }}
                    ></div>
                  </div>
                  <div style={{ width: '90px', textAlign: 'right', fontSize: '0.85rem', fontWeight: 600 }}>{formatVND(val)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MONTHLY TRENDS (LINE CHART) */}
      <div className="glass-card" style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={18} style={{ color: 'var(--purple)' }} />
          Xu hướng chi tiêu & lãng phí 6 tháng qua
        </h3>

        <div style={{ position: 'relative', height: '200px', width: '100%', marginTop: '1.5rem' }}>
          <svg viewBox="0 0 600 180" width="100%" height="100%">
            {/* Grid lines */}
            <line x1="40" y1="20" x2="580" y2="20" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
            <line x1="40" y1="70" x2="580" y2="70" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
            <line x1="40" y1="120" x2="580" y2="120" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
            <line x1="40" y1="150" x2="580" y2="150" stroke="rgba(255,255,255,0.1)" />

            {/* Render Trend line coordinates */}
            {(() => {
              const points = data.monthlyTrends.map((t, idx) => {
                const x = 50 + idx * 100;
                // spend scale: 150 (bottom) to 30 (top)
                const y = 150 - (t.spend / trendMax) * 110;
                return { x, y };
              });

              const d = points.reduce((acc, p, idx) => {
                return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
              }, '');

              return (
                <>
                  {/* Path */}
                  <path d={d} fill="none" stroke="var(--purple)" strokeWidth="3" />
                  
                  {/* Dots */}
                  {points.map((p, idx) => (
                    <g key={idx}>
                      <circle cx={p.x} cy={p.y} r="5" fill="var(--purple)" stroke="#0f172a" strokeWidth="2" />
                      {/* Text value */}
                      <text x={p.x} y={p.y - 12} fill="var(--text-main)" fontSize="10" textAnchor="middle" fontWeight="600">
                        {Math.round(data.monthlyTrends[idx].spend / 1000)}k
                      </text>
                      {/* X axis labels */}
                      <text x={p.x} y="168" fill="var(--text-muted)" fontSize="11" textAnchor="middle">
                        {data.monthlyTrends[idx].month}
                      </text>
                    </g>
                  ))}
                </>
              );
            })()}
          </svg>
        </div>
      </div>
    </div>
  );
}
