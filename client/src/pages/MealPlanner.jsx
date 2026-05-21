import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Calendar, Plus, Trash2, CheckCircle, RefreshCw, ShoppingCart, HelpCircle } from 'lucide-react';

export default function MealPlanner({ currentUser, refreshTrigger, triggerRefresh }) {
  const [mealPlan, setMealPlan] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [showSelectModal, setShowSelectModal] = useState(null); // { day, mealType }

  const daysOfWeek = [
    { key: 'Mon', label: 'Thứ 2' },
    { key: 'Tue', label: 'Thứ 3' },
    { key: 'Wed', label: 'Thứ 4' },
    { key: 'Thu', label: 'Thứ 5' },
    { key: 'Fri', label: 'Thứ 6' },
    { key: 'Sat', label: 'Thứ 7' },
    { key: 'Sun', label: 'Chủ Nhật' }
  ];

  const mealTypes = [
    { key: 'breakfast', label: 'Sáng' },
    { key: 'lunch', label: 'Trưa' },
    { key: 'dinner', label: 'Tối' }
  ];

  useEffect(() => {
    fetchPlannerData();
  }, [refreshTrigger]);

  const fetchPlannerData = async () => {
    try {
      const [planData, recipesData] = await Promise.all([
        api.getMealPlan(),
        api.getRecipes()
      ]);
      setMealPlan(planData);
      setRecipes(recipesData);
    } catch (err) {
      console.error("Error loading planner data:", err);
    }
  };

  const handleSelectRecipe = async (recipeId) => {
    if (!showSelectModal) return;
    const { day, mealType } = showSelectModal;

    const recipe = recipes.find(r => r.id === recipeId);
    try {
      await api.updateMealPlan({
        dayOfWeek: day,
        mealType,
        recipeId: recipeId || null,
        recipeName: recipe ? recipe.name : ''
      });
      setShowSelectModal(null);
      triggerRefresh();
    } catch (err) {
      console.error("Error updating slot:", err);
    }
  };

  const handleClearSlot = async (day, mealType) => {
    try {
      await api.updateMealPlan({
        dayOfWeek: day,
        mealType,
        recipeId: null,
        recipeName: ''
      });
      triggerRefresh();
    } catch (err) {
      console.error("Error clearing slot:", err);
    }
  };

  const handleGenerateShopping = async () => {
    if (mealPlan.length === 0) {
      alert("Hãy lên thực đơn cho tuần trước khi tự động sinh danh sách mua sắm!");
      return;
    }

    if (confirm("Hệ thống sẽ đối chiếu nguyên liệu cho tất cả các món ăn đã lên lịch với lượng thực phẩm hiện tại trong tủ lạnh để sinh danh sách mua sắm còn thiếu. Bạn có muốn tiếp tục?")) {
      try {
        const result = await api.generateShoppingFromPlan(currentUser.id);
        alert(result.message);
        triggerRefresh();
      } catch (err) {
        console.error("Error generating shopping list:", err);
      }
    }
  };

  // Find slot data
  const getSlot = (day, mealType) => {
    return mealPlan.find(p => p.dayOfWeek === day && p.mealType === mealType);
  };

  return (
    <div className="fade-in">
      <div className="top-header">
        <div className="page-title">
          <h1>Kế hoạch bữa ăn tuần</h1>
          <p>Thiết lập thực đơn dinh dưỡng cho cả tuần và để hệ thống tự động tính toán, sinh danh sách đồ cần đi chợ.</p>
        </div>
        <button className="btn btn-purple" onClick={handleGenerateShopping} style={{ gap: '6px' }}>
          <ShoppingCart size={18} /> Phân tích & Sinh danh sách mua sắm
        </button>
      </div>

      {/* PLANNER MATRIX */}
      <div className="glass-card" style={{ padding: '1rem', overflowX: 'auto' }}>
        <table className="meal-plan-table">
          <thead>
            <tr>
              <th style={{ width: '80px', textAlign: 'left' }}>Bữa</th>
              {daysOfWeek.map(day => (
                <th key={day.key}>{day.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mealTypes.map(type => (
              <tr key={type.key}>
                <td style={{ fontWeight: 700, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', verticalAlign: 'middle' }}>
                  {type.label}
                </td>
                
                {daysOfWeek.map(day => {
                  const slot = getSlot(day.key, type.key);

                  return (
                    <td key={day.key} className="meal-plan-cell">
                      {slot ? (
                        <div className="meal-slot filled">
                          <div>
                            <div className="meal-slot-header">{type.label}</div>
                            <div className="meal-slot-name" title={slot.recipeName}>
                              {slot.recipeName}
                            </div>
                          </div>
                          
                          <button 
                            className="modal-close" 
                            style={{ alignSelf: 'flex-end', marginTop: '8px', padding: '2px' }}
                            onClick={() => handleClearSlot(day.key, type.key)}
                            title="Xóa món ăn"
                          >
                            <Trash2 size={12} style={{ color: 'var(--danger)' }} />
                          </button>
                        </div>
                      ) : (
                        <div 
                          className="meal-slot" 
                          onClick={() => setShowSelectModal({ day: day.key, mealType: type.key })}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="meal-slot-header">{type.label}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '10px' }}>
                            <Plus size={10} /> Thêm món
                          </div>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="glass-card" style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <HelpCircle size={24} style={{ color: 'var(--purple)', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <h4 style={{ fontWeight: 700, marginBottom: '4px' }}>Hướng dẫn lên thực đơn thông minh:</h4>
          <ul style={{ paddingLeft: '15px', color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.5' }}>
            <li>Nhấp vào ô trống của bữa ăn trong ngày để chọn một món từ thư viện công thức.</li>
            <li>Sau khi hoàn thành thực đơn cả tuần, nhấn nút <strong>"Phân tích & Sinh danh sách mua sắm"</strong>.</li>
            <li>Hệ thống sẽ phân tích tất cả các nguyên liệu cần có cho kế hoạch bữa ăn, đối chiếu với tủ lạnh và đưa những nguyên liệu còn thiếu vào <strong>"Danh sách đi chợ"</strong>.</li>
          </ul>
        </div>
      </div>

      {/* SELECT RECIPE MODAL */}
      {showSelectModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                Chọn món ăn cho {daysOfWeek.find(d => d.key === showSelectModal.day)?.label} - Bữa {mealTypes.find(t => t.key === showSelectModal.mealType)?.label}
              </h3>
              <button className="modal-close" onClick={() => setShowSelectModal(null)}>✕</button>
            </div>

            <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
              <div 
                className="shopping-list-item" 
                style={{ cursor: 'pointer', padding: '12px' }}
                onClick={() => handleSelectRecipe('')}
              >
                <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>-- Không chọn món (Để trống) --</span>
              </div>
              
              {recipes.map(recipe => (
                <div 
                  key={recipe.id}
                  className="shopping-list-item"
                  style={{ cursor: 'pointer', padding: '12px' }}
                  onClick={() => handleSelectRecipe(recipe.id)}
                >
                  <div>
                    <span style={{ fontWeight: 600 }}>{recipe.name}</span>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Chuẩn bị: {recipe.prepTime} phút | Độ khó: {recipe.difficulty}
                    </div>
                  </div>
                  <span className="badge badge-info">Chọn</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
