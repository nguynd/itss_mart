import React, { useState } from 'react';
import { api } from '../api';
import { ShoppingCart, Mail, Lock, Eye, EyeOff, User, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';



export default function Register({ onRegisterSuccess, onGoLogin }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', role: 'Thành viên (Member)' });
  const [showPw, setShowPw]     = useState(false);
  const [showCf, setShowCf]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  // Password strength
  const pw = form.password;
  const strength = pw.length === 0 ? 0 : pw.length < 6 ? 1 : pw.length < 10 ? 2 : 3;
  const strengthLabel = ['', 'Yếu', 'Trung bình', 'Mạnh'];
  const strengthColor = ['', '#ef4444', '#f59e0b', '#22c55e'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    setLoading(true);
    try {
      const { token, user } = await api.auth.register(form.name, form.email, form.password, form.role);
      localStorage.setItem('itss_token', token);
      localStorage.setItem('itss_user', JSON.stringify(user));
      setSuccess('Đăng ký thành công! Đang chuyển hướng...');
      setTimeout(() => onRegisterSuccess(user), 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-blob auth-blob-1" />
      <div className="auth-blob auth-blob-2" />
      <div className="auth-blob auth-blob-3" />

      <div className="auth-card auth-card-wide">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <ShoppingCart size={28} />
          </div>
          <div>
            <div className="auth-logo-title">ITSS Mart</div>
            <div className="auth-logo-sub">Nhóm 22 · Chủ đề 04</div>
          </div>
        </div>

        <h1 className="auth-heading">Tạo tài khoản</h1>
        <p className="auth-subheading">Tham gia quản lý bếp nhà thông minh</p>

        {error && (
          <div className="auth-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="auth-success">
            <CheckCircle size={16} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Name */}
          <div className="auth-field">
            <label className="auth-label">Họ và tên</label>
            <div className="auth-input-wrap">
              <User size={16} className="auth-input-icon" />
              <input
                id="reg-name"
                type="text"
                className="auth-input"
                placeholder="Nguyễn Văn A"
                value={form.name}
                onChange={set('name')}
                required
                autoFocus
              />
            </div>
          </div>

          {/* Email */}
          <div className="auth-field">
            <label className="auth-label">Email</label>
            <div className="auth-input-wrap">
              <Mail size={16} className="auth-input-icon" />
              <input
                id="reg-email"
                type="email"
                className="auth-input"
                placeholder="email@example.com"
                value={form.email}
                onChange={set('email')}
                required
              />
            </div>
          </div>



          {/* Password */}
          <div className="auth-field">
            <label className="auth-label">Mật khẩu</label>
            <div className="auth-input-wrap">
              <Lock size={16} className="auth-input-icon" />
              <input
                id="reg-password"
                type={showPw ? 'text' : 'password'}
                className="auth-input"
                placeholder="Ít nhất 6 ký tự"
                value={form.password}
                onChange={set('password')}
                required
              />
              <button type="button" className="auth-eye-btn" onClick={() => setShowPw(v => !v)} tabIndex={-1}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {/* Strength bar */}
            {pw.length > 0 && (
              <div className="auth-strength">
                <div className="auth-strength-bar">
                  {[1, 2, 3].map(i => (
                    <div
                      key={i}
                      className="auth-strength-seg"
                      style={{ background: i <= strength ? strengthColor[strength] : 'var(--border)' }}
                    />
                  ))}
                </div>
                <span style={{ color: strengthColor[strength], fontSize: '0.75rem' }}>
                  {strengthLabel[strength]}
                </span>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="auth-field">
            <label className="auth-label">Xác nhận mật khẩu</label>
            <div className="auth-input-wrap">
              <Lock size={16} className="auth-input-icon" />
              <input
                id="reg-confirm"
                type={showCf ? 'text' : 'password'}
                className="auth-input"
                placeholder="Nhập lại mật khẩu"
                value={form.confirm}
                onChange={set('confirm')}
                required
              />
              <button type="button" className="auth-eye-btn" onClick={() => setShowCf(v => !v)} tabIndex={-1}>
                {showCf ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {form.confirm.length > 0 && form.password !== form.confirm && (
              <span className="auth-field-error">Mật khẩu không khớp</span>
            )}
          </div>

          <button id="reg-submit" type="submit" className="auth-btn" disabled={loading}>
            {loading ? (
              <span className="auth-spinner" />
            ) : (
              <>
                <span>Tạo tài khoản</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="auth-divider">
          <span>Đã có tài khoản?</span>
        </div>

        <button id="go-login" type="button" className="auth-btn-outline" onClick={onGoLogin}>
          Đăng nhập
        </button>
      </div>
    </div>
  );
}
