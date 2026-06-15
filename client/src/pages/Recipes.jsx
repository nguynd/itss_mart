import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Search, Clock, Award, CheckCircle2, AlertCircle, ShoppingCart, ChefHat, Sparkles } from 'lucide-react';
import { formatQuantity } from '../utils/format';

export default function Recipes({ currentUser, refreshTrigger, triggerRefresh }) {
  const [recipes, setRecipes] = useState([]);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // all, can-cook, missing
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  useEffect(() => {
    fetchRecipes();
  }, [refreshTrigger]);

  const fetchRecipes = async () => {
    try {
      // Fetch suggested recipes that include fridge stock analysis
      const data = await api.getSuggestions();
      setRecipes(data);
    } catch (err) {
      console.error("Error fetching recipe suggestions:", err);
    }
  };

  const handleCook = async (recipe) => {
    try {
      const result = await api.cookRecipe(recipe.id);
      alert(result.message);
      setSelectedRecipe(null);
      triggerRefresh();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddMissing = async (recipe) => {
    try {
      const result = await api.addMissingIngredients(recipe.id, currentUser.id);
      alert(result.message);
      // Refresh the modal calculations by fetching suggestions again
      const data = await api.getSuggestions();
      setRecipes(data);
      const updatedRecipe = data.find(r => r.id === recipe.id);
      setSelectedRecipe(updatedRecipe);
      triggerRefresh();
    } catch (err) {
      console.error("Error adding missing ingredients:", err);
    }
  };

  // Filter recipes
  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.name.toLowerCase().includes(search.toLowerCase()) ||
      recipe.ingredients.some(ing => ing.name.toLowerCase().includes(search.toLowerCase()));
    
    if (activeFilter === 'can-cook') {
      return matchesSearch && recipe.canCook;
    } else if (activeFilter === 'missing') {
      return matchesSearch && !recipe.canCook;
    }
    return matchesSearch;
  });

  return (
    <div className="fade-in">
      <div className="top-header">
        <div className="page-title">
          <h1>Gợi ý món ăn thông minh</h1>
          <p>Thuật toán tự động đối sánh nguyên liệu hiện có trong tủ lạnh để đưa ra các công thức nấu nướng tối ưu.</p>
        </div>
      </div>

      {/* FILTER TABS & SEARCH */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '1.5rem' }}>
        <div className="tab-container" style={{ marginBottom: 0 }}>
          <button 
            className={`tab-btn ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            Tất cả công thức ({recipes.length})
          </button>
          <button 
            className={`tab-btn ${activeFilter === 'can-cook' ? 'active' : ''}`}
            onClick={() => setActiveFilter('can-cook')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Sparkles size={14} /> Nấu ngay được ({recipes.filter(r => r.canCook).length})
          </button>
          <button 
            className={`tab-btn ${activeFilter === 'missing' ? 'active' : ''}`}
            onClick={() => setActiveFilter('missing')}
          >
            Thiếu nguyên liệu ({recipes.filter(r => !r.canCook).length})
          </button>
        </div>

        <div style={{ position: 'relative', width: '280px' }}>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Tìm theo món ăn hoặc nguyên liệu..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '40px' }}
          />
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '12px', color: 'var(--text-muted)' }} />
        </div>
      </div>

      {/* RECIPES CATALOG */}
      {filteredRecipes.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <ChefHat size={48} style={{ color: 'var(--text-muted)', marginBottom: '10px', opacity: 0.5 }} />
          <p>Không tìm thấy món ăn nào phù hợp với bộ lọc hiện tại.</p>
        </div>
      ) : (
        <div className="recipes-grid">
          {filteredRecipes.map(recipe => (
            <div 
              key={recipe.id} 
              className="recipe-card"
              onClick={() => setSelectedRecipe(recipe)}
              style={{ cursor: 'pointer' }}
            >
              <div className="recipe-img-container">
                <img src={recipe.image} alt={recipe.name} className="recipe-img" />
                <div className="recipe-badge-match">
                  <span className={`badge ${recipe.canCook ? 'badge-fresh' : 'badge-info'}`}>
                    {recipe.canCook ? 'Đủ 100% đồ' : `Khớp ${recipe.matchPercentage}%`}
                  </span>
                </div>
              </div>

              <div className="recipe-info">
                <h3 className="recipe-title">{recipe.name}</h3>
                
                <div className="recipe-meta-row">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> {recipe.prepTime} phút</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Award size={12} /> Độ khó: {recipe.difficulty}</span>
                </div>

                <div className="recipe-ingredients-preview">
                  Nguyên liệu chính: {recipe.ingredients.slice(0, 3).map(i => i.name).join(', ')}...
                </div>

                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: recipe.canCook ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 600 }}>
                    {recipe.canCook ? 'Có thể nấu ngay!' : `Thiếu ${recipe.missingIngredients.length} thứ`}
                  </span>
                  <span style={{ color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600 }}>Chi tiết →</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* RECIPE DETAIL MODAL */}
      {selectedRecipe && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3 className="modal-title">{selectedRecipe.name}</h3>
              <button className="modal-close" onClick={() => setSelectedRecipe(null)}>✕</button>
            </div>

            <img 
              src={selectedRecipe.image} 
              alt={selectedRecipe.name} 
              style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: '16px', marginBottom: '1.25rem' }} 
            />

            <div style={{ display: 'flex', gap: '20px', marginBottom: '1.25rem', padding: '10px 0', borderBottom: '1px solid var(--border)', borderTop: '1px solid var(--border)' }}>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Thời gian nấu</div>
                <div style={{ fontWeight: 600 }}>{selectedRecipe.prepTime} phút</div>
              </div>
              <div style={{ flex: 1, borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Độ khó</div>
                <div style={{ fontWeight: 600 }}>{selectedRecipe.difficulty}</div>
              </div>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Nguyên liệu tủ lạnh</div>
                <div style={{ fontWeight: 600, color: selectedRecipe.canCook ? 'var(--primary)' : 'var(--warning)' }}>
                  {selectedRecipe.canCook ? 'Đủ 100%' : `Khớp ${selectedRecipe.matchPercentage}%`}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '1.5rem' }}>
              {/* INGREDIENTS LIST */}
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '10px' }}>Nguyên liệu cần</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedRecipe.ingredients.map((ing, idx) => {
                    // Check if missing
                    const missingIng = selectedRecipe.missingIngredients.find(m => m.name.toLowerCase() === ing.name.toLowerCase());
                    const isAvailable = !missingIng;

                    return (
                      <div 
                        key={idx} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between', 
                          fontSize: '0.9rem', 
                          padding: '6px 10px', 
                          borderRadius: '8px',
                          background: isAvailable ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.05)',
                          border: `1px solid ${isAvailable ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.1)'}`
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {isAvailable ? (
                            <CheckCircle2 size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                          ) : (
                            <AlertCircle size={16} style={{ color: 'var(--danger)', flexShrink: 0 }} />
                          )}
                          <span>{ing.name}</span>
                        </div>
                        <span style={{ fontWeight: 500, color: isAvailable ? 'var(--text-main)' : 'var(--danger)' }}>
                          {formatQuantity(ing.quantity, ing.unit)}
                          {!isAvailable && (
                            <span style={{ fontSize: '0.75rem', display: 'block', textAlign: 'right', fontWeight: 400 }}>
                              (Thiếu: {formatQuantity(missingIng.missing, ing.unit)})
                            </span>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* STEPS INSTRUCTIONS */}
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '10px' }}>Hướng dẫn chế biến</h4>
                <ol style={{ paddingLeft: '15px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {selectedRecipe.instructions.map((step, idx) => (
                    <li key={idx} style={{ lineHeight: '1.4' }}>{step}</li>
                  ))}
                </ol>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedRecipe(null)}>Đóng</button>
              
              {!selectedRecipe.canCook && (
                <button 
                  className="btn btn-secondary" 
                  onClick={() => handleAddMissing(selectedRecipe)}
                  style={{ color: 'var(--secondary)', borderColor: 'rgba(59,130,246,0.3)', gap: '6px' }}
                >
                  <ShoppingCart size={16} /> Thêm đồ thiếu vào giỏ
                </button>
              )}

              <button 
                className="btn btn-primary" 
                disabled={!selectedRecipe.canCook}
                onClick={() => handleCook(selectedRecipe)}
                style={{ gap: '6px' }}
              >
                <ChefHat size={16} /> Chế biến món ăn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
