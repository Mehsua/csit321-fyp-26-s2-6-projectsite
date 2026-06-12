import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

const S = {
  container: { display: 'flex', height: '100%', background: '#f9fafb', fontFamily: 'system-ui, sans-serif' },
  sidebar: { width: 200, background: '#1e1e2e', display: 'flex', flexDirection: 'column', flexShrink: 0 },
  sidebarLogo: { padding: '16px 16px 8px', color: '#fff', fontWeight: 700, fontSize: 16, borderBottom: '1px solid #333' },
  sidebarSub: { fontSize: 10, color: '#aaa', fontWeight: 400 },
  sidebarItem: (active) => ({
    padding: '10px 16px', cursor: 'pointer', fontSize: 13, color: active ? '#4ade80' : '#ccc',
    background: active ? '#2a2a3e' : 'transparent', borderLeft: active ? '3px solid #4ade80' : '3px solid transparent',
  }),
  sidebarLogout: { padding: '10px 16px', cursor: 'pointer', fontSize: 13, color: '#ff8888', borderTop: '1px solid #333', marginTop: 'auto' },
  content: { flex: 1, overflowY: 'auto', padding: 20 },
  pageTitle: { fontSize: 20, fontWeight: 600, marginBottom: 16 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 },
  statCard: (alert) => ({ background: '#fff', border: `1px solid ${alert ? '#fca5a5' : '#e5e7eb'}`, borderRadius: 8, padding: '14px 16px' }),
  statNum: (alert) => ({ fontSize: 28, fontWeight: 700, color: alert ? '#dc2626' : '#111' }),
  statLabel: { fontSize: 12, color: '#666', marginTop: 2 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' },
  th: { background: '#f3f4f6', padding: '8px 12px', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid #e5e7eb' },
  td: { padding: '8px 12px', borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle' },
  tag: (color) => ({ fontSize: 11, padding: '2px 6px', borderRadius: 4, border: `1px solid ${color || '#d1d5db'}`, color: color || '#374151' }),
  btnSm: (color) => ({ fontSize: 12, padding: '3px 8px', border: `1px solid ${color || '#d1d5db'}`, borderRadius: 4, cursor: 'pointer', background: '#fff', color: color || '#374151', marginRight: 4 }),
  btnPrimary: { fontSize: 13, padding: '6px 14px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' },
  btn: { fontSize: 13, padding: '6px 12px', background: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', marginLeft: 6 },
  input: { fontSize: 13, padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, outline: 'none', width: '100%' },
  filterRow: { display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' },
  modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modalBox: { background: '#fff', borderRadius: 10, width: 560, maxHeight: '85vh', overflowY: 'auto', padding: 24 },
  formGroup: { marginBottom: 12 },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 4 },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  sectionTitle: { fontSize: 14, fontWeight: 600, marginBottom: 10 },
  miniTable: { width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 8 },
  miniTh: { padding: '6px 8px', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid #e5e7eb', color: '#555' },
  miniTd: { padding: '6px 8px', borderBottom: '1px solid #f3f4f6' },
  statusBadge: (status) => ({
    fontSize: 11, padding: '2px 6px', borderRadius: 4,
    background: status === 'open' ? '#fee2e2' : '#dcfce7',
    color: status === 'open' ? '#dc2626' : '#16a34a',
    border: `1px solid ${status === 'open' ? '#fca5a5' : '#bbf7d0'}`,
  }),
  loading: { textAlign: 'center', padding: 40, color: '#999', fontSize: 14 },
};

function emptyRecipeForm() {
  return { name: '', description: '', category: '', cookingTime: '', servings: '', instructions: '', ingredientNames: '', dietaryTagNames: '', allergenNames: '', calories: '', protein_g: '', carbs_g: '', fats_g: '' };
}

export default function AdminPage({ user, onLogout, onNavigate }) {
  const [section, setSection] = useState('dashboard');

  const [dashStats, setDashStats] = useState(null);
  const [recentRecipes, setRecentRecipes] = useState([]);
  const [recentErrors, setRecentErrors] = useState([]);
  const [dashLoading, setDashLoading] = useState(false);

  const [recipes, setRecipes] = useState([]);
  const [recipeTotal, setRecipeTotal] = useState(0);
  const [recipeSearch, setRecipeSearch] = useState('');
  const [recipesLoading, setRecipesLoading] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [recipeForm, setRecipeForm] = useState(emptyRecipeForm());
  const [recipeError, setRecipeError] = useState('');

  const [users, setUsers] = useState([]);
  const [userTotal, setUserTotal] = useState(0);
  const [userSearch, setUserSearch] = useState('');
  const [usersLoading, setUsersLoading] = useState(false);

  const [errorLogs, setErrorLogs] = useState([]);
  const [logTotal, setLogTotal] = useState(0);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logFilter, setLogFilter] = useState({ status: '' });

  const loadDashboard = useCallback(async () => {
    setDashLoading(true);
    try {
      const data = await api.get('/api/admin/dashboard');
      setDashStats({ totalRecipes: data.totalRecipes, registeredUsers: data.registeredUsers, activeSessions: data.activeSessions, unresolvedErrors: data.unresolvedErrors });
      setRecentRecipes(data.recentRecipes || []);
      setRecentErrors(data.recentErrors || []);
    } catch { /* ignore */ }
    finally { setDashLoading(false); }
  }, []);

  const loadRecipes = useCallback(async () => {
    setRecipesLoading(true);
    try {
      const params = new URLSearchParams({ search: recipeSearch });
      const data = await api.get(`/api/admin/recipes?${params}`);
      setRecipes(data.recipes || []);
      setRecipeTotal(data.total || 0);
    } catch { /* ignore */ }
    finally { setRecipesLoading(false); }
  }, [recipeSearch]);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const params = new URLSearchParams({ search: userSearch });
      const data = await api.get(`/api/admin/users?${params}`);
      setUsers(data.users || []);
      setUserTotal(data.total || 0);
    } catch { /* ignore */ }
    finally { setUsersLoading(false); }
  }, [userSearch]);

  const loadErrorLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const params = new URLSearchParams({ status: logFilter.status });
      const data = await api.get(`/api/admin/error-logs?${params}`);
      setErrorLogs(data.logs || []);
      setLogTotal(data.total || 0);
    } catch { /* ignore */ }
    finally { setLogsLoading(false); }
  }, [logFilter.status]);

  useEffect(() => { if (section === 'dashboard') loadDashboard(); }, [section, loadDashboard]);
  useEffect(() => { if (section === 'recipes') loadRecipes(); }, [section, loadRecipes]);
  useEffect(() => { if (section === 'users') loadUsers(); }, [section, loadUsers]);
  useEffect(() => { if (section === 'error-logs') loadErrorLogs(); }, [section, loadErrorLogs]);

  async function handleSaveRecipe(e) {
    e.preventDefault();
    setRecipeError('');
    if (!recipeForm.name.trim()) { setRecipeError('Recipe name is required'); return; }
    const payload = {
      name: recipeForm.name.trim(),
      description: recipeForm.description || null,
      category: recipeForm.category || null,
      cookingTime: recipeForm.cookingTime ? parseInt(recipeForm.cookingTime, 10) : null,
      servings: recipeForm.servings ? parseInt(recipeForm.servings, 10) : null,
      instructions: recipeForm.instructions || null,
      ingredientNames: recipeForm.ingredientNames.split('\n').map(s => s.trim()).filter(Boolean),
      dietaryTagNames: recipeForm.dietaryTagNames.split(',').map(s => s.trim()).filter(Boolean),
      allergenNames: recipeForm.allergenNames.split(',').map(s => s.trim()).filter(Boolean),
      nutrition: (recipeForm.calories || recipeForm.protein_g || recipeForm.carbs_g || recipeForm.fats_g) ? {
        calories: recipeForm.calories ? parseFloat(recipeForm.calories) : null,
        protein_g: recipeForm.protein_g ? parseFloat(recipeForm.protein_g) : null,
        carbs_g: recipeForm.carbs_g ? parseFloat(recipeForm.carbs_g) : null,
        fats_g: recipeForm.fats_g ? parseFloat(recipeForm.fats_g) : null,
      } : null,
    };
    try {
      if (editingRecipe?.recipe_id) {
        await api.put(`/api/admin/recipes/${editingRecipe.recipe_id}`, payload);
      } else {
        await api.post('/api/admin/recipes', payload);
      }
      setEditingRecipe(null);
      loadRecipes();
    } catch (err) {
      setRecipeError(err.message || 'Save failed');
    }
  }

  async function handleDeleteRecipe(recipeId) {
    if (!window.confirm('Delete this recipe?')) return;
    try { await api.delete(`/api/admin/recipes/${recipeId}`); loadRecipes(); }
    catch { /* ignore */ }
  }

  async function handleUserAction(userId, action) {
    try { await api.put(`/api/admin/users/${userId}/${action}`); loadUsers(); }
    catch { /* ignore */ }
  }

  async function handleResolveLog(logId) {
    try { await api.put(`/api/admin/error-logs/${logId}/resolve`); loadErrorLogs(); }
    catch { /* ignore */ }
  }

  async function handleClearResolved() {
    if (!window.confirm('Delete all resolved error logs?')) return;
    try { await api.delete('/api/admin/error-logs/resolved'); loadErrorLogs(); }
    catch { /* ignore */ }
  }

  function openAddRecipe() {
    setEditingRecipe({});
    setRecipeForm(emptyRecipeForm());
    setRecipeError('');
  }

  function openEditRecipe(r) {
    setEditingRecipe(r);
    setRecipeForm({
      name: r.name || '',
      description: r.description || '',
      category: r.category || '',
      cookingTime: r.cooking_time ? String(r.cooking_time) : '',
      servings: r.servings ? String(r.servings) : '',
      instructions: r.instructions || '',
      ingredientNames: '',
      dietaryTagNames: (r.dietary_tags || []).join(', '),
      allergenNames: (r.allergens || []).join(', '),
      calories: '', protein_g: '', carbs_g: '', fats_g: '',
    });
    setRecipeError('');
  }

  function renderDashboard() {
    if (dashLoading) return <div style={S.loading}>Loading dashboard…</div>;
    const stats = dashStats || { totalRecipes: '—', registeredUsers: '—', activeSessions: '—', unresolvedErrors: '—' };
    return (
      <div>
        <div style={S.pageTitle}>Dashboard</div>
        <div style={S.statsGrid}>
          {[
            { label: 'Total Recipes', val: stats.totalRecipes, alert: false },
            { label: 'Registered Users', val: stats.registeredUsers, alert: false },
            { label: 'Active Sessions', val: stats.activeSessions, alert: false },
            { label: 'Unresolved Errors', val: stats.unresolvedErrors, alert: stats.unresolvedErrors > 0 },
          ].map(s => (
            <div key={s.label} style={S.statCard(s.alert)}>
              <div style={S.statNum(s.alert)}>{s.val}</div>
              <div style={S.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <div style={S.sectionTitle}>Recently Added Recipes</div>
            <table style={S.miniTable}>
              <thead><tr><th style={S.miniTh}>Recipe Name</th><th style={S.miniTh}>Category</th><th style={S.miniTh}>Added</th></tr></thead>
              <tbody>
                {recentRecipes.length === 0
                  ? <tr><td style={S.miniTd} colSpan={3}>No recipes yet</td></tr>
                  : recentRecipes.map(r => (
                    <tr key={r.recipe_id}>
                      <td style={S.miniTd}>{r.name}</td>
                      <td style={S.miniTd}>{r.category || '—'}</td>
                      <td style={S.miniTd}>{r.created_at ? new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
            <div style={{ textAlign: 'right', marginTop: 6 }}>
              <span style={{ fontSize: 12, color: '#2563eb', cursor: 'pointer' }} onClick={() => setSection('recipes')}>View All Recipes ›</span>
            </div>
          </div>

          <div>
            <div style={S.sectionTitle}>Recent Error Logs</div>
            <table style={S.miniTable}>
              <thead><tr><th style={S.miniTh}>Type</th><th style={S.miniTh}>Message</th><th style={S.miniTh}>Status</th></tr></thead>
              <tbody>
                {recentErrors.length === 0
                  ? <tr><td style={S.miniTd} colSpan={3}>No errors logged</td></tr>
                  : recentErrors.map(e => (
                    <tr key={e.log_id}>
                      <td style={S.miniTd}>{e.error_type}</td>
                      <td style={S.miniTd}>{e.message.slice(0, 40)}{e.message.length > 40 ? '…' : ''}</td>
                      <td style={S.miniTd}><span style={S.statusBadge(e.is_resolved ? 'resolved' : 'open')}>{e.is_resolved ? 'Resolved' : 'Open'}</span></td>
                    </tr>
                  ))}
              </tbody>
            </table>
            <div style={{ textAlign: 'right', marginTop: 6 }}>
              <span style={{ fontSize: 12, color: '#2563eb', cursor: 'pointer' }} onClick={() => setSection('error-logs')}>View All Logs ›</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderRecipes() {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={S.pageTitle}>Recipe Management</div>
          <button style={S.btnPrimary} onClick={openAddRecipe}>+ Add New Recipe</button>
        </div>
        <div style={S.filterRow}>
          <input style={{ ...S.input, width: 240 }} placeholder="Search recipes…" value={recipeSearch} onChange={e => setRecipeSearch(e.target.value)} />
        </div>
        {recipesLoading ? <div style={S.loading}>Loading…</div> : (
          <>
            <table style={S.table}>
              <thead>
                <tr>
                  {['Recipe Name', 'Category', 'Dietary Tags', 'Allergens', 'Ingredients', 'Nutrition', 'Actions'].map(h => <th key={h} style={S.th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {recipes.length === 0
                  ? <tr><td style={S.td} colSpan={7}>No recipes found</td></tr>
                  : recipes.map(r => (
                    <tr key={r.recipe_id}>
                      <td style={{ ...S.td, fontWeight: 500 }}>{r.name}</td>
                      <td style={S.td}>{r.category || '—'}</td>
                      <td style={S.td}>{(r.dietary_tags || []).map(t => <span key={t} style={{ ...S.tag(), marginRight: 3 }}>{t}</span>)}</td>
                      <td style={S.td}>{(r.allergens || []).length === 0 ? '—' : (r.allergens || []).map(a => <span key={a} style={{ ...S.tag('#fca5a5'), color: '#dc2626', marginRight: 3 }}>{a}</span>)}</td>
                      <td style={S.td}>{r.ingredient_count}</td>
                      <td style={S.td}>{r.has_nutrition ? '✓' : '—'}</td>
                      <td style={S.td}>
                        <button style={S.btnSm()} onClick={() => openEditRecipe(r)}>Edit</button>
                        <button style={S.btnSm('#dc2626')} onClick={() => handleDeleteRecipe(r.recipe_id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            <div style={{ fontSize: 12, color: '#777', marginTop: 8 }}>Showing {recipes.length} of {recipeTotal}</div>
          </>
        )}
      </div>
    );
  }

  function renderUsers() {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={S.pageTitle}>User Management</div>
          <div style={{ fontSize: 12, color: '#777' }}>{userTotal} users</div>
        </div>
        <div style={S.filterRow}>
          <input style={{ ...S.input, width: 240 }} placeholder="Search by name or email…" value={userSearch} onChange={e => setUserSearch(e.target.value)} />
        </div>
        {usersLoading ? <div style={S.loading}>Loading…</div> : (
          <>
            <table style={S.table}>
              <thead>
                <tr>{['Name', 'Email', 'Role', 'Status', 'Favourites', 'Actions'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {users.length === 0
                  ? <tr><td style={S.td} colSpan={6}>No users found</td></tr>
                  : users.map(u => {
                    const isAdmin = u.role === 'admin';
                    const isLocked = u.is_locked;
                    const isInactive = !u.is_active;
                    return (
                      <tr key={u.user_id}>
                        <td style={{ ...S.td, fontWeight: 500 }}>{u.name}</td>
                        <td style={S.td}>{u.email}</td>
                        <td style={S.td}><span style={S.tag(isAdmin ? '#bfdbfe' : undefined)}>{u.role}</span></td>
                        <td style={S.td}>
                          {isInactive ? <span style={{ color: '#dc2626', fontSize: 12 }}>Inactive</span>
                            : isLocked ? <span style={{ color: '#ea580c', fontSize: 12 }}>🔒 Locked</span>
                            : <span style={{ color: '#16a34a', fontSize: 12 }}>● Active</span>}
                        </td>
                        <td style={S.td}>—</td>
                        <td style={S.td}>
                          {isAdmin ? <span style={{ ...S.btnSm('#d1d5db'), color: '#9ca3af' }}>Protected</span> : (
                            <>
                              {isLocked
                                ? <button style={S.btnSm('#16a34a')} onClick={() => handleUserAction(u.user_id, 'unlock')}>Unlock</button>
                                : <button style={S.btnSm('#ea580c')} onClick={() => handleUserAction(u.user_id, 'lock')}>Lock</button>}
                              {isInactive
                                ? <button style={S.btnSm('#16a34a')} onClick={() => handleUserAction(u.user_id, 'reactivate')}>Reactivate</button>
                                : <button style={S.btnSm('#dc2626')} onClick={() => handleUserAction(u.user_id, 'deactivate')}>Deactivate</button>}
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
            <div style={{ fontSize: 12, color: '#777', marginTop: 8 }}>Showing {users.length} of {userTotal}</div>
          </>
        )}
      </div>
    );
  }

  function renderErrorLogs() {
    const open = errorLogs.filter(l => !l.is_resolved).length;
    const resolved = errorLogs.filter(l => l.is_resolved).length;
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={S.pageTitle}>Error Logs</div>
          <div>
            <button style={S.btn} onClick={handleClearResolved}>Clear Resolved</button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          {[{ label: 'Open', val: open, alert: true }, { label: 'Resolved', val: resolved, alert: false }, { label: 'Total', val: logTotal, alert: false }].map(s => (
            <div key={s.label} style={{ ...S.statCard(s.alert && open > 0), flex: 1, padding: '10px 14px' }}>
              <div style={{ ...S.statNum(s.alert && open > 0), fontSize: 20 }}>{s.val}</div>
              <div style={S.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={S.filterRow}>
          <select style={{ ...S.input, width: 140 }} value={logFilter.status} onChange={e => setLogFilter(f => ({ ...f, status: e.target.value }))}>
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        {logsLoading ? <div style={S.loading}>Loading…</div> : (
          <table style={S.table}>
            <thead>
              <tr>{['Timestamp', 'Type', 'Message', 'Endpoint', 'Status', 'Action'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {errorLogs.length === 0
                ? <tr><td style={S.td} colSpan={6}>No error logs</td></tr>
                : errorLogs.map(l => (
                  <tr key={l.log_id}>
                    <td style={S.td}>{new Date(l.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                    <td style={S.td}>{l.error_type}</td>
                    <td style={S.td}>{l.message.slice(0, 50)}{l.message.length > 50 ? '…' : ''}</td>
                    <td style={S.td}>{l.endpoint || '—'}</td>
                    <td style={S.td}><span style={S.statusBadge(l.is_resolved ? 'resolved' : 'open')}>{l.is_resolved ? 'Resolved' : 'Open'}</span></td>
                    <td style={S.td}>
                      {!l.is_resolved && <button style={S.btnSm('#16a34a')} onClick={() => handleResolveLog(l.log_id)}>Resolve</button>}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
    );
  }

  function renderRecipeModal() {
    const isEdit = !!editingRecipe?.recipe_id;
    return (
      <div style={S.modal} onClick={e => { if (e.target === e.currentTarget) setEditingRecipe(null); }}>
        <div style={S.modalBox}>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>{isEdit ? 'Edit Recipe' : 'Add New Recipe'}</div>
          {recipeError && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '8px 12px', borderRadius: 6, fontSize: 13, marginBottom: 12 }}>{recipeError}</div>}
          <form onSubmit={handleSaveRecipe}>
            <div style={S.formGroup}>
              <label style={S.label}>Recipe Name *</label>
              <input style={S.input} value={recipeForm.name} onChange={e => setRecipeForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Chicken Rendang" />
            </div>
            <div style={S.twoCol}>
              <div style={S.formGroup}>
                <label style={S.label}>Category</label>
                <input style={S.input} value={recipeForm.category} onChange={e => setRecipeForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. Malay" />
              </div>
              <div style={S.formGroup}>
                <label style={S.label}>Cooking Time (min)</label>
                <input style={S.input} type="number" value={recipeForm.cookingTime} onChange={e => setRecipeForm(f => ({ ...f, cookingTime: e.target.value }))} />
              </div>
            </div>
            <div style={S.formGroup}>
              <label style={S.label}>Description</label>
              <input style={S.input} value={recipeForm.description} onChange={e => setRecipeForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div style={S.formGroup}>
              <label style={S.label}>Instructions</label>
              <textarea style={{ ...S.input, height: 80, resize: 'vertical' }} value={recipeForm.instructions} onChange={e => setRecipeForm(f => ({ ...f, instructions: e.target.value }))} placeholder="Step-by-step cooking instructions…" />
            </div>
            <div style={S.formGroup}>
              <label style={S.label}>Ingredients (one per line)</label>
              <textarea style={{ ...S.input, height: 80, resize: 'vertical' }} value={recipeForm.ingredientNames} onChange={e => setRecipeForm(f => ({ ...f, ingredientNames: e.target.value }))} placeholder="chicken breast&#10;garlic&#10;ginger" />
            </div>
            <div style={S.twoCol}>
              <div style={S.formGroup}>
                <label style={S.label}>Dietary Tags (comma-separated)</label>
                <input style={S.input} value={recipeForm.dietaryTagNames} onChange={e => setRecipeForm(f => ({ ...f, dietaryTagNames: e.target.value }))} placeholder="Halal, Vegan" />
              </div>
              <div style={S.formGroup}>
                <label style={S.label}>Allergens (comma-separated)</label>
                <input style={S.input} value={recipeForm.allergenNames} onChange={e => setRecipeForm(f => ({ ...f, allergenNames: e.target.value }))} placeholder="Peanuts, Dairy" />
              </div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 8 }}>Nutrition Info (optional)</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
              {[['calories', 'Calories (kcal)'], ['protein_g', 'Protein (g)'], ['carbs_g', 'Carbs (g)'], ['fats_g', 'Fats (g)']].map(([key, lbl]) => (
                <div key={key}>
                  <label style={{ ...S.label, fontSize: 11 }}>{lbl}</label>
                  <input style={S.input} type="number" value={recipeForm[key]} onChange={e => setRecipeForm(f => ({ ...f, [key]: e.target.value }))} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button type="button" style={S.btn} onClick={() => setEditingRecipe(null)}>Cancel</button>
              <button type="submit" style={S.btnPrimary}>{isEdit ? 'Save Changes' : 'Add Recipe'}</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={S.container}>
      <div style={S.sidebar}>
        <div style={S.sidebarLogo}>
          🍳 FoodBot<br />
          <span style={S.sidebarSub}>Admin Panel</span>
        </div>
        {[
          { key: 'dashboard', label: '📊 Dashboard' },
          { key: 'recipes', label: '📖 Recipes' },
          { key: 'users', label: '👥 Users' },
          { key: 'error-logs', label: '⚠ Error Logs' },
        ].map(item => (
          <div key={item.key} style={S.sidebarItem(section === item.key)} onClick={() => setSection(item.key)}>
            {item.label}
          </div>
        ))}
        <div style={S.sidebarLogout} onClick={onLogout}>⏻ Logout</div>
      </div>
      <div style={S.content}>
        {section === 'dashboard' && renderDashboard()}
        {section === 'recipes' && renderRecipes()}
        {section === 'users' && renderUsers()}
        {section === 'error-logs' && renderErrorLogs()}
      </div>
      {editingRecipe !== null && renderRecipeModal()}
    </div>
  );
}
