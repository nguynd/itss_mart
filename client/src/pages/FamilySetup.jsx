import React, { useState } from 'react';
import { api } from '../api';
import { ShoppingCart, Home, Users, ArrowRight, AlertCircle, CheckCircle, Copy, RefreshCw } from 'lucide-react';

export default function FamilySetup({ onSetupComplete }) {
  const [tab, setTab]           = useState('create'); // 'create' | 'join'
  const [familyName, setFamilyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [created, setCreated]   = useState(null); // { family, inviteCode }

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, user, family } = await api.family.create(familyName);
      localStorage.setItem('itss_token', token);
      localStorage.setItem('itss_user', JSON.stringify(user));
      setCreated({ family, inviteCode: family.inviteCode });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, user } = await api.family.join(inviteCode);
      localStorage.setItem('itss_token', token);
      localStorage.setItem('itss_user', JSON.stringify(user));
      onSetupComplete(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(created?.inviteCode || '');
  };

  if (created) {
    return (
      <div className="auth-page">
        <div className="auth-blob auth-blob-1" />
        <div className="auth-blob auth-blob-2" />
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏠</div>
          <h1 className="auth-heading">Gia đình đã tạo!</h1>
          <p className="auth-subheading">Chia sẻ mã này để mời thành viên tham gia</p>

          <div style={{
            background: 'rgba(16,185,129,0.1)',
            border: '2px dashed rgba(16,185,129,0.4)',
            borderRadius: '16px',
            padding: '1.5rem',
            margin: '1.5rem 0',
          }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Mã mời gia đình
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '8px', color: 'var(--primary)', fontFamily: 'monospace' }}>
              {created.inviteCode}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '8px' }}>
              {created.family.name}
            </div>
          </div>

          <button
            className="auth-btn-outline"
            onClick={copyCode}
            style={{ marginBottom: '12px', gap: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Copy size={16} /> Sao chép mã mời
          </button>

          <button
            id="family-enter-app"
            className="auth-btn"
            onClick={() => onSetupComplete(JSON.parse(localStorage.getItem('itss_user')))}
          >
            <span>Vào ứng dụng</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-blob auth-blob-1" />
      <div className="auth-blob auth-blob-2" />
      <div className="auth-blob auth-blob-3" />

      <div className="auth-card auth-card-wide">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon"><ShoppingCart size={28} /></div>
          <div>
            <div className="auth-logo-title">ITSS Mart</div>
            <div className="auth-logo-sub">Thiết lập gia đình</div>
          </div>
        </div>

        <h1 className="auth-heading">Thiết lập gia đình</h1>
        <p className="auth-subheading">Tạo gia đình mới hoặc tham gia gia đình đã có</p>

        {/* Tabs */}
        <div className="family-setup-tabs">
          <button
            id="tab-create"
            className={`family-setup-tab ${tab === 'create' ? 'active' : ''}`}
            onClick={() => { setTab('create'); setError(''); }}
          >
            <Home size={18} />
            <span>Tạo gia đình mới</span>
          </button>
          <button
            id="tab-join"
            className={`family-setup-tab ${tab === 'join' ? 'active' : ''}`}
            onClick={() => { setTab('join'); setError(''); }}
          >
            <Users size={18} />
            <span>Tham gia gia đình</span>
          </button>
        </div>

        {error && (
          <div className="auth-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {tab === 'create' ? (
          <form onSubmit={handleCreate} className="auth-form">
            <div className="auth-field">
              <label className="auth-label">Tên gia đình</label>
              <div className="auth-input-wrap">
                <Home size={16} className="auth-input-icon" />
                <input
                  id="family-name"
                  type="text"
                  className="auth-input"
                  placeholder="VD: Gia đình Nguyễn"
                  value={familyName}
                  onChange={e => setFamilyName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>
            <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '12px', padding: '12px 14px', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              💡 Bạn sẽ được gán vai trò <strong style={{ color: 'var(--primary)' }}>Chủ hộ</strong> và nhận mã mời để thêm thành viên
            </div>
            <button id="create-family-btn" type="submit" className="auth-btn" disabled={loading}>
              {loading ? <span className="auth-spinner" /> : <><span>Tạo gia đình</span><ArrowRight size={18} /></>}
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="auth-form">
            <div className="auth-field">
              <label className="auth-label">Mã mời gia đình</label>
              <div className="auth-input-wrap">
                <Users size={16} className="auth-input-icon" />
                <input
                  id="join-code"
                  type="text"
                  className="auth-input"
                  placeholder="VD: ABC123"
                  value={inviteCode}
                  onChange={e => setInviteCode(e.target.value.toUpperCase())}
                  maxLength={10}
                  style={{ letterSpacing: '4px', fontFamily: 'monospace', fontWeight: 700 }}
                  required
                  autoFocus
                />
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Nhờ chủ hộ cung cấp mã 6 ký tự
              </span>
            </div>
            <button id="join-family-btn" type="submit" className="auth-btn" disabled={loading}>
              {loading ? <span className="auth-spinner" /> : <><span>Tham gia gia đình</span><ArrowRight size={18} /></>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
