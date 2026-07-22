import { useState, useRef, useEffect } from "react";
import { api, setToken, getToken } from "./lib/api";
import IngredientConfirmMsg from './components/IngredientConfirmMsg';
import SupportAnswerMsg from './components/SupportAnswerMsg';
import ShoppingListPage from './components/ShoppingListPage';
import MealPlanPage from './components/MealPlanPage';
import AdminPage from './components/AdminPage';

// ─── Recipe Adapter ────────────────────────────────────────────────────────────
function adaptRecipe(r) {
  const nutrition = r.nutrition
    ? {
        calories: r.nutrition.calories ?? null,
        protein: r.nutrition.protein_g ?? r.nutrition.protein ?? null,
        carbs: r.nutrition.carbs_g ?? r.nutrition.carbs ?? null,
        fats: r.nutrition.fats_g ?? r.nutrition.fats ?? null,
        fibre: r.nutrition.fibre_g ?? r.nutrition.fibre ?? null,
      }
    : null;
  return {
    id: r.recipe_id,
    recipe_id: r.recipe_id,
    name: r.name,
    cuisine: r.category,
    cookTime: r.cooking_time,
    prepTime: 0,
    calories: nutrition?.calories ?? null,
    nutrition,
    ingredients: [...(r.matching_ingredients || []), ...(r.missing_ingredients || [])],
    instructions: r.instructions || '',
    dietary: r.dietary_tags || [],
    allergens: r.allergens || [],
    score: r.score,
    matched: r.matching_ingredients || [],
    missing: r.missing_ingredients || [],
    allergen_warning: r.allergen_warning,
    medical_warnings: r.medical_warnings || [],
  };
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  app: { display: "flex", flexDirection: "column", height: "100vh", fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-primary)", background: "var(--bg)" },

  topbar: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", height: 54, borderBottom: "1px solid var(--border)", flexShrink: 0, background: "var(--surface)", boxShadow: "var(--shadow-xs)" },
  logo: { display: "flex", alignItems: "center", gap: 9, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "var(--text-primary)", cursor: "pointer", letterSpacing: "-0.01em", userSelect: "none" },
  logoIcon: { width: 34, height: 34, background: "var(--primary)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 17, fontWeight: 700, flexShrink: 0, boxShadow: "0 2px 10px rgba(232,96,44,0.45)" },
  topRight: { display: "flex", gap: 6, alignItems: "center" },
  btn: { padding: "6px 13px", borderRadius: "var(--r-md)", border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", fontSize: 13, color: "var(--text-secondary)", fontFamily: "var(--font-body)", fontWeight: 500 },
  btnPrimary: { padding: "6px 14px", borderRadius: "var(--r-md)", border: "none", background: "var(--primary)", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "var(--font-body)", boxShadow: "0 2px 8px rgba(232,96,44,0.30)" },
  btnDanger: { padding: "5px 10px", borderRadius: "var(--r-sm)", border: "none", background: "var(--red-light)", color: "var(--red)", cursor: "pointer", fontSize: 12, fontFamily: "var(--font-body)", fontWeight: 500 },

  body: { display: "flex", flex: 1, overflow: "hidden" },

  sidebar: { width: 248, background: "var(--sidebar-bg)", display: "flex", flexDirection: "column", flexShrink: 0, borderRight: "1px solid var(--sidebar-border)" },
  sidebarTop: { padding: "14px 12px 12px", borderBottom: "1px solid var(--sidebar-border)" },
  newChatBtn: { width: "100%", padding: "9px 12px", borderRadius: "var(--r-md)", border: "1px solid rgba(255,255,255,0.12)", background: "transparent", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 7, color: "var(--sidebar-text)", fontFamily: "var(--font-body)", fontWeight: 500 },
  sideSection: { padding: "14px 14px 5px", fontSize: 10, color: "var(--sidebar-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" },
  histItem: (active) => ({ padding: "8px 14px", fontSize: 13, color: active ? "var(--sidebar-active)" : "var(--sidebar-text)", cursor: "pointer", background: active ? "var(--sidebar-active-bg)" : "transparent", borderLeft: active ? "2px solid var(--sidebar-active)" : "2px solid transparent", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: active ? 600 : 400 }),
  sideBottom: { marginTop: "auto", padding: "12px", borderTop: "1px solid var(--sidebar-border)" },
  avatar: (color = "var(--primary)") => ({ width: 30, height: 30, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0 }),

  main: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  messages: { flex: 1, overflowY: "auto", padding: "20px 0 8px" },
  msgWrap: (isUser) => ({ display: "flex", gap: 10, alignItems: "flex-start", padding: "5px 40px", flexDirection: isUser ? "row-reverse" : "row" }),
  bubble: (isUser) => ({ maxWidth: "72%", padding: "11px 15px", borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px", fontSize: 14, lineHeight: 1.65, whiteSpace: "pre-wrap", background: isUser ? "var(--primary)" : "var(--surface)", color: isUser ? "#fff" : "var(--text-primary)", boxShadow: isUser ? "0 2px 10px rgba(232,96,44,0.28)" : "var(--shadow-sm)", border: isUser ? "none" : "1px solid var(--border-light)" }),

  recipeCard: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: "14px 16px", marginTop: 8, maxWidth: 400, boxShadow: "var(--shadow-sm)" },
  recipeTitle: { fontWeight: 600, fontSize: 14, marginBottom: 5, color: "var(--text-primary)", letterSpacing: "-0.01em" },
  recipeMeta: { fontSize: 12, color: "var(--text-muted)", marginBottom: 10, display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" },
  badge: (type) => {
    const map = { match: ["var(--green-light)", "var(--green)"], warn: ["var(--amber-light)", "var(--amber)"], info: ["var(--blue-light)", "var(--blue)"], red: ["var(--red-light)", "var(--red)"] };
    const [bg, text] = map[type] || map.info;
    return { fontSize: 11, padding: "2px 8px", borderRadius: "var(--r-full)", background: bg, color: text, fontWeight: 600 };
  },
  recipeBtns: { display: "flex", gap: 7, flexWrap: "wrap", marginTop: 10 },
  recipeBtn: { fontSize: 12, padding: "5px 12px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", background: "var(--surface)", cursor: "pointer", color: "var(--text-secondary)", fontFamily: "var(--font-body)", fontWeight: 500 },
  recipeBtnPrimary: { fontSize: 12, padding: "5px 12px", border: "none", borderRadius: "var(--r-md)", background: "var(--primary)", color: "#fff", cursor: "pointer", fontFamily: "var(--font-body)", fontWeight: 600, boxShadow: "0 1px 4px rgba(232,96,44,0.25)" },
  scoreBar: { height: 4, borderRadius: 3, background: "var(--border)", margin: "8px 0 10px", overflow: "hidden" },
  scoreFill: (pct) => ({ height: "100%", borderRadius: 3, background: pct >= 70 ? "var(--green)" : pct >= 40 ? "var(--amber)" : "var(--red)", width: `${pct}%`, transition: "width 0.4s ease" }),

  chips: { display: "flex", flexWrap: "wrap", gap: 7, padding: "8px 40px 4px" },
  chip: { fontSize: 12, padding: "6px 14px", border: "1px solid var(--border)", borderRadius: "var(--r-full)", background: "var(--surface)", cursor: "pointer", color: "var(--text-secondary)", fontFamily: "var(--font-body)", fontWeight: 500, whiteSpace: "nowrap" },

  inputArea: { padding: "10px 40px 20px", borderTop: "1px solid var(--border-light)", flexShrink: 0, background: "var(--bg)" },
  inputWrap: { display: "flex", gap: 10, alignItems: "flex-end", border: "1.5px solid var(--border)", borderRadius: "var(--r-lg)", padding: "10px 12px", background: "var(--surface)", boxShadow: "var(--shadow-xs)" },
  textarea: { flex: 1, border: "none", outline: "none", fontSize: 14, resize: "none", fontFamily: "var(--font-body)", lineHeight: 1.5, background: "transparent", color: "var(--text-primary)" },
  sendBtn: { width: 36, height: 36, borderRadius: "50%", background: "var(--primary)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 8px rgba(232,96,44,0.38)" },

  // Auth
  authPage: { display: "flex", flex: 1, alignItems: "center", justifyContent: "center", background: "var(--bg-secondary)" },
  authCard: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", overflow: "hidden", width: 390, boxShadow: "var(--shadow-lg)" },
  authTitle: { fontSize: 22, fontWeight: 700, marginBottom: 4, fontFamily: "var(--font-display)", color: "#fff", letterSpacing: "-0.02em" },
  authSub: { fontSize: 13, color: "rgba(255,255,255,0.75)", marginBottom: 0 },
  formGroup: { marginBottom: 16 },
  label: { display: "block", fontSize: 11, fontWeight: 700, marginBottom: 6, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" },
  input: { width: "100%", padding: "10px 13px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "var(--font-body)", background: "var(--bg)", color: "var(--text-primary)" },
  formBtn: { width: "100%", padding: "11px", borderRadius: "var(--r-md)", border: "none", background: "var(--primary)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", marginTop: 4, fontFamily: "var(--font-body)", boxShadow: "0 3px 10px rgba(232,96,44,0.32)" },
  formLink: { fontSize: 13, color: "var(--primary)", textAlign: "center", marginTop: 14, cursor: "pointer", fontWeight: 500 },

  // Profile
  profilePage: { flex: 1, overflowY: "auto", padding: "28px 40px", background: "var(--bg)" },
  profileCard: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: 24, maxWidth: 520, marginBottom: 18, boxShadow: "var(--shadow-xs)" },
  sectionTitle: { fontSize: 15, fontWeight: 700, marginBottom: 16, color: "var(--text-primary)", fontFamily: "var(--font-display)", letterSpacing: "-0.01em" },
  checkRow: { display: "flex", alignItems: "center", gap: 11, marginBottom: 11 },
  checkBox: (checked) => ({ width: 20, height: 20, borderRadius: 5, border: `2px solid ${checked ? "var(--primary)" : "var(--border)"}`, background: checked ? "var(--primary)" : "var(--surface)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }),

  // Admin
  adminPage: { flex: 1, overflowY: "auto", padding: "24px 32px", background: "var(--bg)" },
  adminHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 },
  table: { width: "100%", borderCollapse: "collapse", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", overflow: "hidden", boxShadow: "var(--shadow-xs)" },
  th: { textAlign: "left", padding: "11px 16px", borderBottom: "1px solid var(--border)", fontSize: 11, color: "var(--text-muted)", fontWeight: 700, background: "var(--bg-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" },
  td: { padding: "11px 16px", borderBottom: "1px solid var(--border-light)", fontSize: 13, verticalAlign: "top", color: "var(--text-primary)" },

  // Modal
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(28,18,8,0.58)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(4px)" },
  modalCard: { background: "var(--surface)", borderRadius: "var(--r-xl)", padding: 30, width: 520, maxHeight: "88vh", overflowY: "auto", boxShadow: "var(--shadow-xl)", border: "1px solid var(--border-light)" },
  modalTitle: { fontSize: 20, fontWeight: 700, marginBottom: 18, fontFamily: "var(--font-display)", color: "var(--text-primary)", letterSpacing: "-0.02em" },
  statusBar: (ok) => ({ padding: "9px 14px", borderRadius: "var(--r-md)", background: ok ? "var(--green-light)" : "var(--amber-light)", color: ok ? "var(--green)" : "var(--amber)", fontSize: 12, marginBottom: 13, display: "flex", alignItems: "center", gap: 7, fontWeight: 600 }),
};

// ─── Components ───────────────────────────────────────────────────────────────
function RecipeModal({ recipe, onClose, instructions, onFetchInstructions, onSave, isSaved, onAddToList, onAddToMealPlan, user }) {
  const pct = Math.round((recipe.score ?? 0) * 100);
  const inst = instructions || {};
  const [pickingDay, setPickingDay] = useState(false);

  return (
    <div style={S.modalOverlay} role="presentation" onClick={onClose}>
      <div
        style={{ ...S.modalCard, width: 540 }}
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="recipe-modal-title"
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
        onKeyDown={e => { if (e.key === 'Escape') onClose(); }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div>
            <div id="recipe-modal-title" style={S.modalTitle}>{recipe.name}</div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
              {recipe.cookTime} min &nbsp;|&nbsp;
              <span style={S.badge(pct >= 70 ? "match" : pct >= 40 ? "warn" : "red")}>{pct}% match</span>
            </div>
          </div>
          <button style={{ ...S.btn, padding: "4px 10px" }} onClick={onClose}>✕</button>
        </div>

        {/* Dietary tags */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
          {recipe.dietary.map(d => <span key={d} style={S.badge("match")}>{d}</span>)}
          {recipe.allergen_warning && <span style={S.badge("red")}>⚠ Allergen warning</span>}
        </div>

        {/* Nutrition card */}
        {recipe.calories && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
            {[['kcal', recipe.calories], ['protein', recipe.nutrition?.protein ?? '—'], ['carbs', recipe.nutrition?.carbs ?? '—'], ['fats', recipe.nutrition?.fats ?? '—']].map(([label, val]) => (
              <div key={label} style={{ background: '#f9fafb', border: '1px solid #e5e5e5', borderRadius: 8, padding: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>{val}</div>
                <div style={{ fontSize: 11, color: '#666' }}>{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Ingredient checklist */}
        <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>Ingredients</div>
        <div style={{ fontSize: 13, marginBottom: 16 }}>
          {recipe.matched.map((i, idx) => (
            <div key={`matched-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', borderBottom: '1px solid #f3f4f6' }}>
              <span style={{ color: '#16a34a', fontSize: 16 }}>✓</span>
              <span>{i}</span>
              <span style={{ fontSize: 11, color: '#888', marginLeft: 'auto' }}>you have this</span>
            </div>
          ))}
          {recipe.missing.map((i, idx) => (
            <div key={`missing-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', borderBottom: '1px solid #f3f4f6' }}>
              <span style={{ color: '#dc2626', fontSize: 16 }}>○</span>
              <span style={{ color: '#dc2626' }}>{i}</span>
              <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 8, border: '1px solid #fca5a5', color: '#dc2626', marginLeft: 'auto' }}>missing</span>
            </div>
          ))}
        </div>

        {/* Allergens */}
        {recipe.allergens.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 13 }}>⚠ Allergens</div>
            <div style={{ display: "flex", gap: 6 }}>
              {recipe.allergens.map(a => <span key={a} style={S.badge("red")}>{a}</span>)}
            </div>
          </div>
        )}

        {/* Medical warnings */}
        {recipe.medical_warnings?.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 13 }}>⚕ Medical Flags</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {recipe.medical_warnings.map((w, i) => (
                <span key={i} style={{ ...S.badge('warn'), display: 'inline-block', width: 'fit-content' }}>⚠ {w}</span>
              ))}
            </div>
          </div>
        )}

        {/* Cooking instructions */}
        <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>
          Cooking Instructions
          {inst.loading && <span style={{ fontWeight: 400, color: '#999', marginLeft: 8, fontSize: 12 }}>Loading…</span>}
        </div>
        {!inst.loading && !inst.steps && (
          <button style={{ ...S.btn, fontSize: 12, marginBottom: 12 }} onClick={onFetchInstructions}>
            Load cooking instructions
          </button>
        )}
        {inst.steps && (
          <>
            <div style={{ fontSize: 13, lineHeight: 1.7, color: '#333', whiteSpace: 'pre-wrap', marginBottom: 8 }}>
              {inst.steps}
            </div>
            {inst.ai_generated && (
              <div style={{ padding: '7px 10px', background: '#f5f5f5', border: '1px dashed #ccc', borderRadius: 6, fontSize: 11, color: '#888', marginBottom: 12 }}>
                ⚠ AI-generated instructions — may vary from traditional recipe
              </div>
            )}
          </>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
          <button style={{ ...S.recipeBtn, flex: 1 }} onClick={() => onAddToList && onAddToList(recipe)} title="Add missing ingredients to shopping list">🛒 Add to List</button>
          {user && !pickingDay && (
            <button
              style={{ ...S.btn, fontSize: 12, padding: '6px 12px', background: '#f0fdf4', borderColor: '#16a34a', color: '#16a34a', flex: 1 }}
              onClick={() => setPickingDay(true)}
            >
              📅 Add to Meal Plan
            </button>
          )}
          {user && pickingDay && (
            <div style={{ display: 'flex', gap: 4, flex: 1 }}>
              {[1, 2, 3].map(d => (
                <button
                  key={d}
                  style={{ ...S.btn, flex: 1, fontSize: 12, padding: '6px 4px', background: '#f0fdf4', borderColor: '#16a34a', color: '#16a34a' }}
                  onClick={() => { onAddToMealPlan && onAddToMealPlan(recipe, d); setPickingDay(false); }}
                >
                  Day {d}
                </button>
              ))}
              <button style={{ ...S.btn, fontSize: 12, padding: '6px 8px' }} onClick={() => setPickingDay(false)}>✕</button>
            </div>
          )}
          {onSave && (
            <button style={isSaved ? { ...S.recipeBtnPrimary, flex: 1 } : { ...S.recipeBtn, flex: 1 }} onClick={() => onSave(recipe)}>
              {isSaved ? '✓ Saved' : '♡ Save'}
            </button>
          )}
          <button style={{ ...S.recipeBtnPrimary, flex: 1 }} onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}

function RecipeCardMsg({ recipe, onView, onSave, saved, onAddToList }) {
  const pct = Math.round((recipe.score ?? 0) * 100);
  return (
    <div style={S.recipeCard} className="recipe-card card-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
        <div style={S.recipeTitle}>{recipe.name}</div>
        <span style={S.badge(pct === 100 ? "match" : pct >= 60 ? "warn" : "red")}>{pct}%</span>
      </div>
      <div style={S.scoreBar}>
        <div style={S.scoreFill(pct)} />
      </div>
      <div style={S.recipeMeta}>
        <span>{recipe.cookTime} mins</span>
        {recipe.calories && <span style={{ fontWeight: 600, color: '#374151' }}>{recipe.calories} kcal</span>}
        {recipe.dietary.slice(0, 2).map(d => <span key={d} style={S.badge("match")}>{d}</span>)}
        {recipe.allergen_warning && <span style={S.badge("red")}>⚠ Allergen</span>}
        {recipe.medical_warnings?.length > 0 && <span style={S.badge("warn")}>⚠ Medical</span>}
      </div>
      {recipe.missing.length > 0 && (
        <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
          Missing: {recipe.missing.slice(0, 3).map(m => (
            <span key={m} style={{ fontSize: 11, padding: '2px 7px', borderRadius: 10, border: '1px solid #e5e5e5', color: '#555', marginRight: 4 }}>{m}</span>
          ))}
        </div>
      )}
      <div style={S.recipeBtns}>
        <button style={S.recipeBtnPrimary} onClick={() => onView(recipe)}>View instructions</button>
        <button style={S.recipeBtn} onClick={() => onSave(recipe)}>{saved ? "✓ Saved" : "♡ Save"}</button>
        <button style={S.recipeBtn} onClick={() => onAddToList && onAddToList(recipe)} title="Add missing ingredients to shopping list">🛒</button>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("chat"); // chat | login | register | profile | admin | favourites | shopping-list | meal-plan
  const [confirmedIngredients, setConfirmedIngredients] = useState([]);
  const [mealPlan, setMealPlan] = useState(null);
  const [mealPlanLoading, setMealPlanLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [sessions, setSessions] = useState([{ id: 1, title: "New chat", messages: [] }]);
  const [activeSession, setActiveSession] = useState(1);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [viewRecipe, setViewRecipe] = useState(null);
  const [favourites, setFavourites] = useState([]);
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [authError, setAuthError] = useState("");
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showForgotPwd, setShowForgotPwd] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  const [regDietaryTags, setRegDietaryTags] = useState([]);
  const [regAllergens, setRegAllergens] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [prefs, setPrefs] = useState({ halal: false, vegetarian: false, vegan: false, glutenFree: false, allergens: [] });
  const [recipeInstructions, setRecipeInstructions] = useState({});
  const [helpOpen, setHelpOpen] = useState(false);
  const [savePrefsStatus, setSavePrefsStatus] = useState(null);
  const [tasteProfile, setTasteProfile] = useState({ preferred_cuisines: [], spice_level: 'medium', max_cooking_time: null });
  const [medicalConditions, setMedicalConditions] = useState([]);
  const [saveTasteStatus, setSaveTasteStatus] = useState(null);
  const [saveMedicalStatus, setSaveMedicalStatus] = useState(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const [shoppingListItems, setShoppingListItems] = useState([]);
  const [sessionExpired, setSessionExpired] = useState(false);
  const lastActivityRef = useRef(Date.now());
  const resettingRef = useRef(false);

  const currentSession = sessions.find(s => s.id === activeSession);
  const messages = currentSession?.messages || [];

  // JWT restore + guest session on mount
  useEffect(() => {
    async function loadUserData() {
      const [prefsData, favsData] = await Promise.all([
        api.get('/api/users/me/preferences').catch(() => null),
        api.get('/api/users/me/favourites').catch(() => null),
      ]);
      if (prefsData) {
        setPrefs({
          halal: prefsData.dietaryTags.includes('Halal'),
          vegetarian: prefsData.dietaryTags.includes('Vegetarian'),
          vegan: prefsData.dietaryTags.includes('Vegan'),
          glutenFree: prefsData.dietaryTags.includes('GlutenFree'),
          allergens: prefsData.allergenNames || [],
        });
      }
      if (favsData?.favourites) {
        setFavourites(favsData.favourites.map(f => ({
          id: f.recipe_id,
          recipe_id: f.recipe_id,
          name: f.name,
          cookTime: f.cooking_time,
          score: f.score ?? 0,
          matched: [],
          missing: [],
          dietary: f.dietary_tags || [],
          allergens: f.allergens || [],
          allergen_warning: false,
          nutrition: f.nutrition || null,
          calories: f.nutrition?.calories ?? null,
          saved_at: f.saved_at,
        })));
      }
      const shoppingData = await api.get('/api/shopping-list').catch(() => null);
      if (shoppingData?.items) setShoppingListItems(shoppingData.items);
      const [tasteData, medicalData] = await Promise.all([
        api.get('/api/users/me/taste-profile').catch(() => null),
        api.get('/api/users/me/medical-profile').catch(() => null),
      ]);
      if (tasteData?.preferred_cuisines) setTasteProfile(tasteData);
      if (medicalData?.conditions) setMedicalConditions(medicalData.conditions);
    }

    async function initApp() {
      const storedToken = getToken();
      if (storedToken) {
        try {
          const { user: profile } = await api.get("/api/auth/me");
          setUser({
            name: profile.name,
            email: profile.email,
            role: profile.role,
            isAdmin: profile.role === "admin",
          });
          const session = await api.post("/api/sessions");
          setSessionId(session.session_id);
          await loadUserData();
        } catch (_) {
          setToken(null);
          setUser(null);
          const session = await api.post("/api/sessions").catch(() => null);
          if (session) setSessionId(session.session_id);
        }
      } else {
        const session = await api.post("/api/sessions").catch(() => null);
        if (session) setSessionId(session.session_id);
      }
    }
    initApp();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const THIRTY_MIN = 30 * 60 * 1000;
    const interval = setInterval(() => {
      if (Date.now() - lastActivityRef.current > THIRTY_MIN) {
        if (resettingRef.current) return;
        resettingRef.current = true;
        setSessionExpired(true);
        const newId = Date.now();
        setTimeout(async () => {
          setSessions([{ id: newId, title: 'New chat', messages: [] }]);
          setActiveSession(newId);
          setSessionExpired(false);
          lastActivityRef.current = Date.now();
          resettingRef.current = false;
          const newSession = await api.post('/api/sessions').catch(() => null);
          if (newSession) setSessionId(newSession.session_id);
        }, 3000);
      }
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  function updateMessages(newMsgs) {
    setSessions(prev => prev.map(s => s.id === activeSession ? { ...s, messages: newMsgs } : s));
  }

  function newChat() {
    const id = Date.now();
    setSessions(prev => [{ id, title: "New chat", messages: [] }, ...prev]);
    setActiveSession(id);
  }

  async function sendMessage(text = input) {
    const sid = activeSession;
    lastActivityRef.current = Date.now();
    const msg = text.trim();
    if (!msg || loading) return;
    setInput("");

    const userMsg = { role: "user", content: msg };
    const newMsgs = [...messages, userMsg];
    updateMessages(newMsgs);

    if (messages.length === 0) {
      setSessions(prev => prev.map(s => s.id === sid ? { ...s, title: msg.slice(0, 40) } : s));
    }

    setLoading(true);

    // Support detection: help/troubleshooting queries bypass ingredient flow
    const supportKeywords = ['help', 'support', 'contact', 'problem', 'issue', 'error', "can't", 'cannot', 'not working', 'broken', 'forgot', 'guide', 'tutorial', 'how do i', 'how to use'];
    const msgLower = msg.toLowerCase();
    const isSupportQuery = supportKeywords.some(k => msgLower.includes(k)) && !msg.includes(',');

    if (isSupportQuery) {
      try {
        const result = await api.post('/api/support/query', { message: msg });
        const supportMsg = {
          role: 'assistant',
          type: 'support_answer',
          id: Date.now(),
          matched: result.matched,
          question: result.question,
          answer: result.answer,
          category: result.category,
          escalated: false,
        };
        updateMessages([...newMsgs, supportMsg]);
        setLoading(false);
        return;
      } catch {
        // Fall through to ingredient check or general chat on error
      }
    }

    // Ingredient extraction + confirmation flow
    const ingredientKeywords = ["have", "got", "using", "use", "with", "make", "cook", "ingredients", "fridge"];
    const isIngredientQuery = ingredientKeywords.some(k => msg.toLowerCase().includes(k)) || msg.includes(",");

    if (isIngredientQuery) {
      try {
        const { ingredients } = await api.post('/api/chat/extract-ingredients', { text: msg });
        if (ingredients.length > 0) {
          const confirmMsg = {
            role: 'assistant',
            type: 'ingredient_confirm',
            id: Date.now(),
            ingredients,
            confirmed: false,
          };
          updateMessages([...newMsgs, confirmMsg]);
          setLoading(false);
          return;
        }
      } catch {
        // Fall through to general chat on extraction error
      }
    }

    // General chat
    const chatMessages = newMsgs
      .filter(m => (m.role === 'user' || m.role === 'assistant') && m.type !== 'ingredient_confirm')
      .map(m => ({ role: m.role, content: m.content || '' }))
      .slice(-20);

    const botMsg = { role: 'assistant', id: Date.now(), content: '' };
    updateMessages([...newMsgs, botMsg]);

    try {
      const { reply } = await api.post('/api/chat', { messages: chatMessages });
      setSessions(prev => prev.map(s =>
        s.id === sid
          ? { ...s, messages: s.messages.map((m, i) => i === s.messages.length - 1 ? { ...m, content: reply } : m) }
          : s
      ));
    } catch (err) {
      const fallback = (err.status >= 400 && err.status < 500)
        ? 'Sorry, there was a problem with your message. Please try again.'
        : 'I can help with cooking! Try entering some ingredients you have on hand.';
      setSessions(prev => prev.map(s =>
        s.id === sid
          ? { ...s, messages: s.messages.map((m, i) => i === s.messages.length - 1 ? { ...m, content: fallback } : m) }
          : s
      ));
    }

    setLoading(false);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  async function saveToFavourites(recipe) {
    if (favourites.some(f => f.id === recipe.id)) return;
    if (user) {
      try {
        await api.post('/api/users/me/favourites', {
          recipeId: recipe.recipe_id || recipe.id,
          score: recipe.score ?? null,
        });
      } catch (err) {
        if (err.status === 409) return;
      }
    }
    setFavourites(prev => [...prev, recipe]);
  }

  async function removeFavourite(recipeId) {
    if (user) {
      try {
        await api.delete(`/api/users/me/favourites/${recipeId}`);
      } catch (_) {}
    }
    setFavourites(prev => prev.filter(f => f.id !== recipeId && f.recipe_id !== recipeId));
  }

  async function runRecommend(ingredients, confirmMsgId) {
    const sid = activeSession;
    // Mark the confirmation message as confirmed (disables its buttons) and update its ingredients
    setSessions(prev => prev.map(s =>
      s.id === sid
        ? { ...s, messages: s.messages.map((m) => m.id === confirmMsgId ? { ...m, confirmed: true, ingredients } : m) }
        : s
    ));
    setConfirmedIngredients(ingredients);

    setLoading(true);

    const dietaryTags = [];
    if (prefs.halal) dietaryTags.push('Halal');
    if (prefs.vegetarian) dietaryTags.push('Vegetarian');
    if (prefs.vegan) dietaryTags.push('Vegan');
    if (prefs.glutenFree) dietaryTags.push('GlutenFree');

    try {
      const { recipes } = await api.post('/api/recipes/recommend', {
        ingredients,
        dietary_tags: dietaryTags,
        allergen_names: prefs.allergens,
        taste_profile: user ? tasteProfile : null,
        medical_conditions: user ? medicalConditions : [],
      });
      const adapted = (recipes || []).map(adaptRecipe);
      const count = adapted.length;
      const content = count > 0
        ? `I found ${count} recipe${count !== 1 ? 's' : ''} matching your ingredients. Here are the top results:`
        : "I couldn't find matching recipes. Try adjusting your ingredients or dietary filters.";

      setSessions(prev => prev.map(s =>
        s.id === sid
          ? { ...s, messages: [...s.messages, { role: 'assistant', content, recipes: adapted }] }
          : s
      ));
    } catch {
      setSessions(prev => prev.map(s =>
        s.id === sid
          ? { ...s, messages: [...s.messages, { role: 'assistant', content: 'Something went wrong searching for recipes. Please try again.' }] }
          : s
      ));
    }

    setLoading(false);
  }

  async function handleEscalate(msgId) {
    const sid = activeSession;
    const session = sessions.find(s => s.id === sid);
    const supportMsg = session?.messages.find(m => m.id === msgId);
    if (!supportMsg || supportMsg.escalated) return;
    try {
      const result = await api.post('/api/support/escalate', {
        message: supportMsg.question || supportMsg.content || 'User requested support escalation',
      });
      setSessions(prev => prev.map(s =>
        s.id === sid
          ? { ...s, messages: s.messages.map(m => m.id === msgId ? { ...m, escalated: true, contactInfo: result.contact_info } : m) }
          : s
      ));
    } catch {
      setSessions(prev => prev.map(s =>
        s.id === sid
          ? { ...s, messages: s.messages.map(m => m.id === msgId ? { ...m, escalated: true, contactInfo: 'support@foodbot.com' } : m) }
          : s
      ));
    }
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  async function handleLogin(e) {
    e.preventDefault();
    setAuthError("");
    if (!authForm.email || !authForm.password) {
      setAuthError("Email and password are required.");
      return;
    }
    try {
      const result = await api.post("/api/auth/login", {
        email: authForm.email,
        password: authForm.password,
      });
      setToken(result.access_token);
      setUser({
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        isAdmin: result.user.role === "admin",
      });
      setPage("chat");
      setAuthError("");
      const session = await api.post("/api/sessions");
      setSessionId(session.session_id);
      const [prefsData, favsData] = await Promise.all([
        api.get('/api/users/me/preferences').catch(() => null),
        api.get('/api/users/me/favourites').catch(() => null),
      ]);
      if (prefsData) {
        setPrefs({
          halal: prefsData.dietaryTags.includes('Halal'),
          vegetarian: prefsData.dietaryTags.includes('Vegetarian'),
          vegan: prefsData.dietaryTags.includes('Vegan'),
          glutenFree: prefsData.dietaryTags.includes('GlutenFree'),
          allergens: prefsData.allergenNames || [],
        });
      }
      if (favsData?.favourites) {
        setFavourites(favsData.favourites.map(f => ({
          id: f.recipe_id,
          recipe_id: f.recipe_id,
          name: f.name,
          cookTime: f.cooking_time,
          score: f.score ?? 0,
          matched: [],
          missing: [],
          dietary: f.dietary_tags || [],
          allergens: f.allergens || [],
          allergen_warning: false,
          nutrition: f.nutrition || null,
          calories: f.nutrition?.calories ?? null,
          saved_at: f.saved_at,
        })));
      }
      const shoppingData = await api.get('/api/shopping-list').catch(() => null);
      if (shoppingData?.items) setShoppingListItems(shoppingData.items);
      const [tasteData, medicalData] = await Promise.all([
        api.get('/api/users/me/taste-profile').catch(() => null),
        api.get('/api/users/me/medical-profile').catch(() => null),
      ]);
      if (tasteData?.preferred_cuisines) setTasteProfile(tasteData);
      if (medicalData?.conditions) setMedicalConditions(medicalData.conditions);
    } catch (err) {
      if (err.status === 423) {
        const lockUntil = err.data?.lock_until
          ? new Date(err.data.lock_until).toLocaleTimeString()
          : "15 minutes";
        setAuthError(`Account locked. Try again after ${lockUntil}.`);
      } else {
        setAuthError(err.message || "Login failed. Please try again.");
      }
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setAuthError('');
    if (!authForm.name || !authForm.email || authForm.password.length < 8) {
      setAuthError('Please fill all fields. Password must be at least 8 characters.');
      return;
    }
    if (authForm.password !== confirmPassword) {
      setAuthError('Passwords do not match.');
      return;
    }
    try {
      await api.post('/api/auth/register', {
        email: authForm.email,
        password: authForm.password,
        name: authForm.name,
        dietaryTags: regDietaryTags,
        allergens: regAllergens,
      });
      setPage('login');
      setAuthError('');
      setConfirmPassword('');
      setRegDietaryTags([]);
      setRegAllergens([]);
    } catch (err) {
      setAuthError(err.message || 'Registration failed. Please try again.');
    }
  }

  async function handleForgotPassword(e) {
    e.preventDefault();
    setForgotMsg('');
    try {
      await api.post('/api/auth/forgot-password', { email: forgotEmail });
      setForgotMsg('If that email is registered, a reset link has been sent.');
    } catch (_) {
      setForgotMsg('If that email is registered, a reset link has been sent.');
    }
  }

  async function handleLogout() {
    try {
      await api.post("/api/auth/logout");
    } catch (_) {
      // Ignore logout API errors — clear local state regardless
    }
    setToken(null);
    setUser(null);
    setPage("chat");
    setSessionId(null);
  }

  function resetChat() {
    const id = Date.now();
    setSessions([{ id, title: 'New chat', messages: [] }]);
    setActiveSession(id);
  }

  async function addToShoppingList(recipe) {
    try {
      const { items } = await api.post('/api/shopping-list/generate', {
        recipeId: recipe.recipe_id,
        sessionIngredients: recipe.matched || [],
      });
      setShoppingListItems(prev => {
        const existingKeys = new Set(prev.map(i => i.ingredient_id || i.name));
        return [...prev, ...items.filter(i => !existingKeys.has(i.ingredient_id || i.name))];
      });
      setPage('shopping-list');
    } catch (_) {}
  }

  async function clearShoppingList() {
    setShoppingListItems([]);
    if (user) {
      await api.delete('/api/shopping-list').catch(() => null);
    }
  }

  async function generateMealPlan() {
    if (!user) return;
    setMealPlanLoading(true);
    try {
      const generated = await api.post('/api/meal-plan/generate', {
        sessionIngredients: confirmedIngredients,
        numDays: 3,
      });
      let { plan } = await api.get('/api/meal-plan');
      if (plan) {
        const perishMap = {};
        for (const genDay of (generated.days || [])) {
          for (const r of (genDay.recipes || [])) {
            perishMap[r.recipe_id] = r.perishable_warnings || [];
          }
        }
        const annotatedDays = plan.days.map(d => ({
          ...d,
          items: d.items.map(item => ({
            ...item,
            perishable_warnings: perishMap[item.recipe_id] || [],
          })),
        }));
        plan = { ...plan, days: annotatedDays };
      }
      setMealPlan(plan);
      setPage('meal-plan');
    } catch (_) {
    } finally {
      setMealPlanLoading(false);
    }
  }

  async function deleteMealPlanItem(itemId) {
    try {
      await api.delete(`/api/meal-plan/items/${itemId}`);
      setMealPlan(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          days: prev.days.map(d => ({
            ...d,
            items: d.items.filter(i => i.item_id !== itemId),
          })),
        };
      });
    } catch (_) {}
  }

  async function addRecipeToMealPlan(recipe, dayNumber = 1) {
    if (!user) return;
    try {
      await api.post('/api/meal-plan/items', { recipeId: recipe.recipe_id, dayNumber });
      const { plan } = await api.get('/api/meal-plan');
      setMealPlan(plan);
    } catch (_) {}
  }

  async function handleAddToShoppingListFromPlan() {
    if (!mealPlan) return;
    const allRecipes = mealPlan.days.flatMap(d => d.items);
    for (const item of allRecipes) {
      if (item.recipe_id) {
        try {
          await api.post('/api/shopping-list/generate', {
            recipeId: item.recipe_id,
            sessionIngredients: confirmedIngredients,
          });
        } catch (_) {}
      }
    }
    // Refresh shopping list state after generating all items
    try {
      const data = await api.get('/api/shopping-list');
      setShoppingListItems(data.items || []);
    } catch (_) {}
    setPage('shopping-list');
  }

  // ── Render ────────────────────────────────────────────────────────────────
  const SUGGESTIONS = [
    "I have chicken, garlic, and lemon",
    "What can I make with eggs and butter?",
    "Show me vegetarian recipes",
    "How do I store fresh herbs?",
  ];

  function renderChat() {
    return (
      <>
        {!user ? (
          <div style={{ background: "var(--amber-light)", borderBottom: "1px solid rgba(217,119,6,0.2)", padding: "7px 24px", fontSize: 12, color: "var(--amber)", display: "flex", alignItems: "center", gap: 8, flexShrink: 0, fontWeight: 500 }}>
            <span>ℹ Guest Mode — Sign up to save favourites, preferences & allergen alerts</span>
            <span style={{ marginLeft: "auto", display: "flex", gap: 14 }}>
              <span style={{ textDecoration: "underline", cursor: "pointer", fontWeight: 700 }} onClick={() => setPage('register')}>Sign Up</span>
              <span style={{ textDecoration: "underline", cursor: "pointer", fontWeight: 700 }} onClick={() => setPage('login')}>Login</span>
            </span>
          </div>
        ) : (
          <div style={{ background: "var(--green-light)", borderBottom: "1px solid rgba(21,128,61,0.15)", padding: "7px 24px", fontSize: 12, color: "var(--green)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0, fontWeight: 500 }}>
            <span>✓ {user.name || 'User'} &nbsp;·&nbsp; {user.isAdmin ? 'Admin' : 'Registered user'}</span>
            <span style={{ color: "var(--text-muted)", fontSize: 11 }}>
              {[prefs.halal && 'Halal', prefs.vegetarian && 'Vegetarian', prefs.vegan && 'Vegan', prefs.glutenFree && 'Gluten-Free'].filter(Boolean).join(' · ') || 'No dietary filters'}
              {prefs.allergens.length > 0 ? ` · No ${prefs.allergens.slice(0, 2).join('/')}` : ''}
            </span>
          </div>
        )}
        <div style={S.messages} aria-live="polite" aria-label="Chat messages">
          {messages.length === 0 && (
            <div className="fade-in" style={{ textAlign: "center", padding: "56px 40px 40px" }}>
              <div style={{ width: 72, height: 72, borderRadius: 22, background: "var(--primary-light)", border: "2px solid rgba(232,96,44,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 34 }}>🍳</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700, marginBottom: 10, color: "var(--text-primary)", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                What's in your kitchen?
              </div>
              <div style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.75, maxWidth: 380, margin: "0 auto 30px" }}>
                Tell me your ingredients — I'll find the best matching recipes, flag allergens, and suggest what to cook tonight.
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                {SUGGESTIONS.map(s => (
                  <button key={s} className="suggestion-chip" style={{ ...S.chip, fontSize: 13, padding: "8px 16px" }} onClick={() => sendMessage(s)}>{s}</button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => {
            if (msg.type === 'support_answer') {
              return (
                <div key={i} className="msg-in" style={{ padding: '4px 40px' }}>
                  <SupportAnswerMsg
                    matched={msg.matched}
                    question={msg.question}
                    answer={msg.answer}
                    category={msg.category}
                    escalated={msg.escalated}
                    contactInfo={msg.contactInfo}
                    onEscalate={() => handleEscalate(msg.id)}
                  />
                </div>
              );
            }
            if (msg.type === 'ingredient_confirm') {
              return (
                <div key={i} className="msg-in" style={{ padding: '4px 40px' }}>
                  <IngredientConfirmMsg
                    ingredients={msg.ingredients}
                    confirmed={msg.confirmed}
                    onConfirm={(finalIngredients) => runRecommend(finalIngredients, msg.id)}
                  />
                </div>
              );
            }
            return (
              <div key={i} className="msg-in">
                <div style={S.msgWrap(msg.role === "user")}>
                  <div style={S.avatar(msg.role === "user" ? "var(--blue)" : "var(--primary)")}>
                    {msg.role === "user" ? (user?.name?.[0]?.toUpperCase() || "U") : "🍳"}
                  </div>
                  <div style={{ maxWidth: "72%" }}>
                    {msg.content && <div style={S.bubble(msg.role === "user")}>{msg.content}</div>}
                    {msg.recipes?.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: msg.content ? 8 : 0 }}>
                        {msg.recipes.map(r => (
                          <RecipeCardMsg key={r.id} recipe={r} onView={setViewRecipe} onSave={saveToFavourites} saved={favourites.some(f => f.id === r.id)} onAddToList={addToShoppingList} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {loading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="msg-in" style={S.msgWrap(false)}>
              <div style={S.avatar("var(--primary)")}>🍳</div>
              <div style={{ ...S.bubble(false), display: "flex", alignItems: "center", padding: "14px 16px" }}>
                <span aria-label="Loading response" style={{ display: "flex", alignItems: "center" }}>
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {messages.length > 0 && (
          <div style={S.chips}>
            {["Substitute an ingredient", "Make it vegetarian", "Simpler version?", "What pairs well with this?"].map(c => (
              <button key={c} className="suggestion-chip" style={S.chip} onClick={() => sendMessage(c)}>{c}</button>
            ))}
          </div>
        )}

        <div style={S.inputArea}>
          <div style={S.inputWrap} className="chat-input-wrap">
            <textarea
              ref={textareaRef}
              rows={1}
              style={S.textarea}
              placeholder="Type ingredients or ask a question…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button type="button" style={S.sendBtn} className="send-btn" aria-label="Send message" onClick={() => sendMessage()}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M14 8L2 2l2.5 6L2 14l12-6z" fill="#fff" /></svg>
            </button>
          </div>
        </div>
      </>
    );
  }

  function renderProfile() {
    const ALLERGEN_OPTIONS = ["peanuts", "shellfish", "dairy", "egg", "gluten", "soy", "fish"];
    return (
      <div style={S.profilePage}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700, marginBottom: 24, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>My Profile</div>
        <div style={S.profileCard}>
          <div style={S.sectionTitle}>Account</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ ...S.avatar("#2563eb"), width: 44, height: 44, fontSize: 16 }}>{user?.name?.[0]?.toUpperCase()}</div>
            <div>
              <div style={{ fontWeight: 600 }}>{user?.name}</div>
              <div style={{ fontSize: 13, color: "#666" }}>{user?.email}</div>
            </div>
          </div>
        </div>
        <div style={S.profileCard}>
          <div style={S.sectionTitle}>Dietary preferences</div>
          {[["halal", "Halal"], ["vegetarian", "Vegetarian"], ["vegan", "Vegan"], ["glutenFree", "Gluten-free"]].map(([key, label]) => (
            <div key={key} style={S.checkRow} onClick={() => setPrefs(p => ({ ...p, [key]: !p[key] }))}>
              <div style={S.checkBox(prefs[key])}>
                {prefs[key] && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" /></svg>}
              </div>
              <span style={{ fontSize: 14, cursor: "pointer" }}>{label}</span>
            </div>
          ))}
        </div>
        <div style={S.profileCard}>
          <div style={S.sectionTitle}>Allergens</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {ALLERGEN_OPTIONS.map(a => {
              const on = prefs.allergens.includes(a);
              return (
                <button key={a} style={{ ...S.btn, background: on ? "#fef2f2" : "#fff", color: on ? "#dc2626" : "#555", borderColor: on ? "#fca5a5" : "#e5e5e5", fontWeight: on ? 600 : 400 }}
                  onClick={() => setPrefs(p => ({ ...p, allergens: on ? p.allergens.filter(x => x !== a) : [...p.allergens, a] }))}>
                  {a}
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: 12, color: "#999", marginTop: 10 }}>Recipes containing these allergens will be filtered out.</div>
        </div>
        <div style={S.profileCard}>
          <div style={S.sectionTitle}>Taste Profile</div>
          <div style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>Preferred cuisines and cooking preferences help us rank recipe recommendations for you.</div>

          <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 8 }}>Preferred Cuisines</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {['Asian', 'Western', 'Italian', 'Indian', 'Mediterranean', 'Mexican'].map(cuisine => {
              const on = tasteProfile.preferred_cuisines.includes(cuisine);
              return (
                <button key={cuisine}
                  style={{ ...S.btn, background: on ? '#f0fdf4' : '#fff', color: on ? '#16a34a' : '#555', borderColor: on ? '#86efac' : '#e5e5e5', fontWeight: on ? 600 : 400 }}
                  onClick={() => setTasteProfile(p => ({
                    ...p,
                    preferred_cuisines: on ? p.preferred_cuisines.filter(c => c !== cuisine) : [...p.preferred_cuisines, cuisine],
                  }))}>
                  {cuisine}
                </button>
              );
            })}
          </div>

          <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 8 }}>Spice Level</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {[['mild', 'Mild'], ['medium', 'Medium'], ['spicy', 'Spicy']].map(([val, label]) => {
              const on = tasteProfile.spice_level === val;
              return (
                <button key={val}
                  style={{ ...S.btn, background: on ? '#f0fdf4' : '#fff', color: on ? '#16a34a' : '#555', borderColor: on ? '#86efac' : '#e5e5e5', fontWeight: on ? 600 : 400 }}
                  onClick={() => setTasteProfile(p => ({ ...p, spice_level: val }))}>
                  {label}
                </button>
              );
            })}
          </div>

          <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 8 }}>Max Cooking Time</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
            {[['', 'Any'], ['20', '≤ 20 min'], ['30', '≤ 30 min'], ['45', '≤ 45 min']].map(([val, label]) => {
              const current = tasteProfile.max_cooking_time ? String(tasteProfile.max_cooking_time) : '';
              const on = current === val;
              return (
                <button key={val || 'any'}
                  style={{ ...S.btn, background: on ? '#f0fdf4' : '#fff', color: on ? '#16a34a' : '#555', borderColor: on ? '#86efac' : '#e5e5e5', fontWeight: on ? 600 : 400 }}
                  onClick={() => setTasteProfile(p => ({ ...p, max_cooking_time: val ? parseInt(val) : null }))}>
                  {label}
                </button>
              );
            })}
          </div>

          <button
            style={{ ...S.formBtn, marginTop: 16, background: saveTasteStatus === 'saving' ? '#aaa' : '#16a34a' }}
            disabled={saveTasteStatus === 'saving'}
            onClick={async () => {
              setSaveTasteStatus('saving');
              try {
                await api.put('/api/users/me/taste-profile', {
                  preferredCuisines: tasteProfile.preferred_cuisines,
                  spiceLevel: tasteProfile.spice_level,
                  maxCookingTime: tasteProfile.max_cooking_time,
                });
                setSaveTasteStatus('saved');
                setTimeout(() => setSaveTasteStatus(null), 2000);
              } catch {
                setSaveTasteStatus('error');
                setTimeout(() => setSaveTasteStatus(null), 3000);
              }
            }}>
            {saveTasteStatus === 'saving' ? 'Saving…' : saveTasteStatus === 'saved' ? '✓ Saved!' : saveTasteStatus === 'error' ? 'Save failed — try again' : 'Save Taste Profile'}
          </button>
        </div>
        <div style={S.profileCard}>
          <div style={S.sectionTitle}>Medical Profile</div>
          <div style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>We will flag recipes that may not suit your health conditions.</div>

          {[
            ['Diabetes',     'Diabetes',     'Flags high-carb recipes (>45g carbs per serving)'],
            ['Hypertension', 'Hypertension', 'Flags high-fat recipes (>20g fat per serving)'],
            ['HeartDisease', 'Heart Disease','Flags high-fat recipes (>20g fat per serving)'],
            ['WeightLoss',   'Weight Loss',  'Flags high-calorie recipes (>450 kcal per serving)'],
          ].map(([val, label, desc]) => {
            const on = medicalConditions.includes(val);
            return (
              <div key={val} style={{ ...S.checkRow, marginBottom: 12 }}
                onClick={() => setMedicalConditions(p => on ? p.filter(c => c !== val) : [...p, val])}>
                <div style={S.checkBox(on)}>
                  {on && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" /></svg>}
                </div>
                <div>
                  <div style={{ fontSize: 14, cursor: 'pointer' }}>{label}</div>
                  <div style={{ fontSize: 11, color: '#888' }}>{desc}</div>
                </div>
              </div>
            );
          })}

          <button
            style={{ ...S.formBtn, background: saveMedicalStatus === 'saving' ? '#aaa' : '#16a34a' }}
            disabled={saveMedicalStatus === 'saving'}
            onClick={async () => {
              setSaveMedicalStatus('saving');
              try {
                await api.put('/api/users/me/medical-profile', { conditions: medicalConditions });
                setSaveMedicalStatus('saved');
                setTimeout(() => setSaveMedicalStatus(null), 2000);
              } catch {
                setSaveMedicalStatus('error');
                setTimeout(() => setSaveMedicalStatus(null), 3000);
              }
            }}>
            {saveMedicalStatus === 'saving' ? 'Saving…' : saveMedicalStatus === 'saved' ? '✓ Saved!' : saveMedicalStatus === 'error' ? 'Save failed — try again' : 'Save Medical Profile'}
          </button>
        </div>
        <div style={S.profileCard}>
          <button
            style={{ ...S.formBtn, background: savePrefsStatus === 'saving' ? '#aaa' : '#16a34a' }}
            disabled={savePrefsStatus === 'saving'}
            onClick={async () => {
              setSavePrefsStatus('saving');
              try {
                const dietaryTags = [
                  prefs.halal && 'Halal',
                  prefs.vegetarian && 'Vegetarian',
                  prefs.vegan && 'Vegan',
                  prefs.glutenFree && 'GlutenFree',
                ].filter(Boolean);
                await api.put('/api/users/me/preferences', {
                  dietaryTags,
                  allergenNames: prefs.allergens,
                });
                setSavePrefsStatus('saved');
                setTimeout(() => setSavePrefsStatus(null), 2000);
              } catch {
                setSavePrefsStatus('error');
                setTimeout(() => setSavePrefsStatus(null), 3000);
              }
            }}
          >
            {savePrefsStatus === 'saving' ? 'Saving…' : savePrefsStatus === 'saved' ? '✓ Saved!' : savePrefsStatus === 'error' ? 'Save failed — try again' : 'Save Preferences'}
          </button>
        </div>
        <div style={S.profileCard}>
          <div style={S.sectionTitle}>Favourites</div>
          {favourites.length === 0
            ? <div style={{ fontSize: 13, color: "#999" }}>No saved recipes yet. Chat to find some!</div>
            : favourites.map(r => (
              <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f3f4f6" }}>
                <span style={{ fontSize: 14 }}>{r.name}</span>
                <div style={{ display: "flex", gap: 6 }}>
                  <button style={S.recipeBtn} onClick={() => setViewRecipe(r)}>View</button>
                  <button style={S.btnDanger} onClick={() => setFavourites(p => p.filter(f => f.id !== r.id))}>Remove</button>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    );
  }


  function renderFavourites() {
    const count = favourites.length;
    const remaining = 50 - count;
    return (
      <div style={S.profilePage}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>My Favourites</div>
          <span style={{ fontSize: 13, color: '#666' }}>{count} / 50</span>
        </div>

        {favourites.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#aaa' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>♡</div>
            <div style={{ fontSize: 13 }}>Save recipes from chat to see them here</div>
          </div>
        ) : (
          favourites.map(r => {
            const pct = Math.round((r.score ?? 0) * 100);
            return (
              <div key={r.id || r.recipe_id} style={{ ...S.recipeCard, marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <div style={S.recipeTitle}>{r.name}</div>
                  {pct > 0 && <span style={S.badge(pct >= 70 ? 'match' : pct >= 40 ? 'warn' : 'red')}>{pct}%</span>}
                </div>
                <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>
                  {r.saved_at && `Saved ${new Date(r.saved_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} · `}
                  {r.dietary?.slice(0, 3).map(d => (
                    <span key={d} style={{ ...S.badge('match'), marginRight: 4 }}>{d}</span>
                  ))}
                </div>
                <div style={S.recipeBtns}>
                  <button style={S.recipeBtnPrimary} onClick={() => setViewRecipe(r)}>View Recipe</button>
                  <button style={S.recipeBtn} onClick={() => addRecipeToMealPlan(r)} title="Add to Meal Plan">📅 Add to Plan</button>
                  <button style={{ ...S.recipeBtn, color: '#dc2626', borderColor: '#fca5a5' }}
                    onClick={() => removeFavourite(r.id || r.recipe_id)}>✕ Remove</button>
                </div>
              </div>
            );
          })
        )}

        <div style={{ marginTop: 16, background: '#f5f5f5', border: '1px solid #ddd', borderRadius: 8, padding: '8px 12px', fontSize: 11, color: '#777', textAlign: 'center' }}>
          Max 50 favourites per account &nbsp;|&nbsp; <strong>{remaining} remaining</strong>
        </div>
      </div>
    );
  }

  function renderAuth(isLogin) {
    return (
      <div style={S.authPage}>
        <div style={S.authCard}>
          {/* Gradient header */}
          <div style={{ background: "linear-gradient(135deg, var(--primary) 0%, #F47C38 100%)", padding: "28px 32px 24px", textAlign: "center" }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", fontSize: 26, backdropFilter: "blur(4px)" }}>🍳</div>
            <div style={S.authTitle}>{isLogin ? "Welcome back" : "Create account"}</div>
            <div style={S.authSub}>{isLogin ? "Sign in to FoodBot" : "Join FoodBot to save recipes"}</div>
          </div>
          {/* Form body */}
          <div style={{ padding: "24px 32px 32px" }}>
          {authError && <div style={{ background: "var(--red-light)", color: "var(--red)", padding: "10px 13px", borderRadius: "var(--r-md)", fontSize: 13, marginBottom: 16, border: "1px solid rgba(220,38,38,0.15)" }}>{authError}</div>}
          <form onSubmit={isLogin ? handleLogin : handleRegister}>
            {isLogin ? (
              <>
                <div style={S.formGroup}>
                  <label style={S.label}>Email</label>
                  <input className="form-input" style={S.input} type="email" placeholder="you@email.com" value={authForm.email} onChange={e => setAuthForm(p => ({ ...p, email: e.target.value }))} />
                </div>
                <div style={S.formGroup}>
                  <label style={S.label}>Password</label>
                  <input className="form-input" style={S.input} type="password" placeholder="••••••••" value={authForm.password} onChange={e => setAuthForm(p => ({ ...p, password: e.target.value }))} />
                </div>
                {isLogin && (
                  <div style={{ textAlign: 'right', marginBottom: 8, marginTop: -8 }}>
                    <span style={{ fontSize: 12, color: '#555', textDecoration: 'underline', cursor: 'pointer' }}
                      onClick={() => { setShowForgotPwd(true); setForgotMsg(''); setForgotEmail(''); }}>
                      Forgot password?
                    </span>
                  </div>
                )}
              </>
            ) : (
              <>
                <div style={S.formGroup}>
                  <label style={S.label}>Full Name</label>
                  <input style={S.input} placeholder="e.g. John Smith" value={authForm.name}
                    onChange={e => setAuthForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div style={S.formGroup}>
                  <label style={S.label}>Email Address</label>
                  <input style={S.input} type="email" placeholder="you@example.com" value={authForm.email}
                    onChange={e => setAuthForm(p => ({ ...p, email: e.target.value }))} />
                </div>
                <div style={S.formGroup}>
                  <label style={S.label}>Password <span style={{ fontWeight: 400, color: '#888' }}>(min. 8 characters)</span></label>
                  <input style={S.input} type="password" placeholder="••••••••" value={authForm.password}
                    onChange={e => setAuthForm(p => ({ ...p, password: e.target.value }))} />
                </div>
                <div style={S.formGroup}>
                  <label style={S.label}>Confirm Password</label>
                  <input style={S.input} type="password" placeholder="Re-enter password" value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)} />
                </div>
                <hr style={{ border: 'none', borderTop: '1px solid #e5e5e5', margin: '16px 0' }} />
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Dietary Preferences <span style={{ fontWeight: 400, color: '#888' }}>(Optional)</span></div>
                {['Halal', 'Vegan', 'Vegetarian', 'Gluten-Free'].map(tag => (
                  <div key={tag} style={S.checkRow}>
                    <div style={S.checkBox(regDietaryTags.includes(tag))}
                      onClick={() => setRegDietaryTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}>
                      {regDietaryTags.includes(tag) && <span style={{ color: '#fff', fontSize: 12 }}>✓</span>}
                    </div>
                    <span style={{ fontSize: 13 }}>{tag}</span>
                  </div>
                ))}
                <hr style={{ border: 'none', borderTop: '1px solid #e5e5e5', margin: '16px 0' }} />
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Allergen Alerts <span style={{ fontWeight: 400, color: '#888' }}>(Optional)</span></div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 0' }}>
                  {['Peanuts', 'Dairy', 'Gluten', 'Shellfish', 'Eggs', 'Soy'].map(allergen => (
                    <div key={allergen} style={{ ...S.checkRow, minWidth: '50%' }}>
                      <div style={S.checkBox(regAllergens.includes(allergen))}
                        onClick={() => setRegAllergens(prev => prev.includes(allergen) ? prev.filter(a => a !== allergen) : [...prev, allergen])}>
                        {regAllergens.includes(allergen) && <span style={{ color: '#fff', fontSize: 12 }}>✓</span>}
                      </div>
                      <span style={{ fontSize: 13 }}>{allergen}</span>
                    </div>
                  ))}
                </div>
                <hr style={{ border: 'none', borderTop: '1px solid #e5e5e5', margin: '16px 0' }} />
                <div style={{ fontSize: 11, color: '#777', marginBottom: 16, lineHeight: 1.6 }}>
                  By creating an account you agree to our Terms of Service and Privacy Policy. Your personal data is handled in compliance with <strong>PDPA (Singapore)</strong>.
                </div>
              </>
            )}
            <button type="submit" className="form-btn" style={S.formBtn}>{isLogin ? "Sign in" : "Create account"}</button>
          </form>
          <div style={S.formLink} onClick={() => { setPage(isLogin ? "register" : "login"); setAuthError(""); }}>
            {isLogin ? "Don't have an account? Register →" : "Already have an account? Sign in →"}
          </div>
          {isLogin && (
            <div style={{ ...S.formLink, color: 'var(--text-muted)', marginTop: 8 }} onClick={() => setPage("chat")}>
              Continue as Guest
            </div>
          )}
          </div>{/* end form body */}
        </div>
      </div>
    );
  }

  // ── Auth full-screen layout ───────────────────────────────────────────────
  if (page === "login" || page === "register") {
    const isLogin = page === "login";
    return (
      <div style={{ display: "flex", height: "100vh", fontFamily: "var(--font-body)", background: "var(--bg)" }}>
        {/* Left panel — branding */}
        <div style={{ flex: "0 0 45%", background: "linear-gradient(160deg, #1C0F06 0%, #2E1A0E 60%, var(--primary) 130%)", display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px 56px", position: "relative", overflow: "hidden" }}>
          {/* Decorative circles */}
          <div style={{ position: "absolute", top: -80, right: -80, width: 320, height: 320, borderRadius: "50%", background: "rgba(232,96,44,0.12)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: -60, left: -60, width: 240, height: 240, borderRadius: "50%", background: "rgba(232,96,44,0.08)", pointerEvents: "none" }} />
          <div style={{ position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 52 }}>
              <div style={{ width: 42, height: 42, borderRadius: 14, background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, boxShadow: "0 4px 16px rgba(232,96,44,0.4)" }}>🍳</div>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>FoodBot</span>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 38, fontWeight: 700, color: "#fff", lineHeight: 1.2, letterSpacing: "-0.03em", marginBottom: 20 }}>
              Cook smarter<br />with what you have
            </div>
            <div style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", lineHeight: 1.75, marginBottom: 40, maxWidth: 340 }}>
              Tell FoodBot what's in your fridge and get personalised recipe recommendations — instantly.
            </div>
            {[
              ["🥗", "Ingredient-based recipe matching"],
              ["⚠", "Allergen & dietary filtering"],
              ["🛒", "Auto-generated shopping lists"],
            ].map(([icon, text]) => (
              <div key={text} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{icon}</div>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel — form */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflowY: "auto", padding: "40px 24px" }}>
          <div style={{ width: "100%", maxWidth: 420 }}>
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em", marginBottom: 6 }}>
                {isLogin ? "Welcome back" : "Create your account"}
              </div>
              <div style={{ fontSize: 14, color: "var(--text-muted)" }}>
                {isLogin ? "Sign in to access your recipes and saved lists." : "Join FoodBot — free, no credit card required."}
              </div>
            </div>

            {authError && <div style={{ background: "var(--red-light)", color: "var(--red)", padding: "10px 13px", borderRadius: "var(--r-md)", fontSize: 13, marginBottom: 20, border: "1px solid rgba(220,38,38,0.15)", fontWeight: 500 }}>{authError}</div>}

            <form onSubmit={isLogin ? handleLogin : handleRegister}>
              {isLogin ? (
                <>
                  <div style={S.formGroup}>
                    <label style={S.label}>Email</label>
                    <input className="form-input" style={S.input} type="email" placeholder="you@email.com" value={authForm.email} onChange={e => setAuthForm(p => ({ ...p, email: e.target.value }))} />
                  </div>
                  <div style={S.formGroup}>
                    <label style={S.label}>Password</label>
                    <input className="form-input" style={S.input} type="password" placeholder="••••••••" value={authForm.password} onChange={e => setAuthForm(p => ({ ...p, password: e.target.value }))} />
                  </div>
                  <div style={{ textAlign: "right", marginBottom: 20, marginTop: -8 }}>
                    <span style={{ fontSize: 12, color: "var(--primary)", cursor: "pointer", fontWeight: 600 }}
                      onClick={() => { setShowForgotPwd(true); setForgotMsg(""); setForgotEmail(""); }}>
                      Forgot password?
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div style={S.formGroup}>
                    <label style={S.label}>Full Name</label>
                    <input className="form-input" style={S.input} placeholder="e.g. John Smith" value={authForm.name} onChange={e => setAuthForm(p => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div style={S.formGroup}>
                    <label style={S.label}>Email Address</label>
                    <input className="form-input" style={S.input} type="email" placeholder="you@example.com" value={authForm.email} onChange={e => setAuthForm(p => ({ ...p, email: e.target.value }))} />
                  </div>
                  <div style={S.formGroup}>
                    <label style={S.label}>Password <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(min. 8 characters)</span></label>
                    <input className="form-input" style={S.input} type="password" placeholder="••••••••" value={authForm.password} onChange={e => setAuthForm(p => ({ ...p, password: e.target.value }))} />
                  </div>
                  <div style={S.formGroup}>
                    <label style={S.label}>Confirm Password</label>
                    <input className="form-input" style={S.input} type="password" placeholder="Re-enter password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                  </div>
                  <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "20px 0" }} />
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: "var(--text-primary)" }}>Dietary Preferences <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(Optional)</span></div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 0", marginBottom: 4 }}>
                    {["Halal", "Vegan", "Vegetarian", "Gluten-Free"].map(tag => (
                      <div key={tag} style={{ ...S.checkRow, minWidth: "50%" }}>
                        <div style={S.checkBox(regDietaryTags.includes(tag))} onClick={() => setRegDietaryTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}>
                          {regDietaryTags.includes(tag) && <span style={{ color: "#fff", fontSize: 12 }}>✓</span>}
                        </div>
                        <span style={{ fontSize: 13 }}>{tag}</span>
                      </div>
                    ))}
                  </div>
                  <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "16px 0" }} />
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: "var(--text-primary)" }}>Allergen Alerts <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(Optional)</span></div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 0", marginBottom: 4 }}>
                    {["Peanuts", "Dairy", "Gluten", "Shellfish", "Eggs", "Soy"].map(allergen => (
                      <div key={allergen} style={{ ...S.checkRow, minWidth: "50%" }}>
                        <div style={S.checkBox(regAllergens.includes(allergen))} onClick={() => setRegAllergens(prev => prev.includes(allergen) ? prev.filter(a => a !== allergen) : [...prev, allergen])}>
                          {regAllergens.includes(allergen) && <span style={{ color: "#fff", fontSize: 12 }}>✓</span>}
                        </div>
                        <span style={{ fontSize: 13 }}>{allergen}</span>
                      </div>
                    ))}
                  </div>
                  <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "16px 0" }} />
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 20, lineHeight: 1.65 }}>
                    By creating an account you agree to our Terms of Service and Privacy Policy. Your personal data is handled in compliance with <strong>PDPA (Singapore)</strong>.
                  </div>
                </>
              )}
              <button type="submit" className="form-btn" style={{ ...S.formBtn, width: "100%", padding: "13px 0", fontSize: 15 }}>
                {isLogin ? "Sign in" : "Create account"}
              </button>
            </form>

            <div style={{ marginTop: 20, textAlign: "center", fontSize: 13, color: "var(--text-muted)" }}>
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <span style={{ color: "var(--primary)", fontWeight: 600, cursor: "pointer" }} onClick={() => { setPage(isLogin ? "register" : "login"); setAuthError(""); }}>
                {isLogin ? "Sign up" : "Sign in"} →
              </span>
            </div>
            {isLogin && (
              <div style={{ marginTop: 12, textAlign: "center", fontSize: 13, color: "var(--text-muted)", cursor: "pointer" }} onClick={() => setPage("chat")}>
                Continue as Guest
              </div>
            )}
          </div>
        </div>

        {showForgotPwd && (
          <div style={S.modalOverlay} onClick={() => setShowForgotPwd(false)}>
            <div style={{ ...S.modalCard, width: 370 }} className="modal-card" onClick={e => e.stopPropagation()}>
              <div style={S.modalTitle}>Reset Password</div>
              {forgotMsg ? (
                <div style={{ background: "var(--green-light)", border: "1px solid var(--green-dim)", borderRadius: "var(--r-md)", padding: "10px 14px", fontSize: 13, color: "var(--green)", marginBottom: 16 }}>
                  ✓ {forgotMsg}
                </div>
              ) : (
                <form onSubmit={handleForgotPassword}>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>Enter your email and we'll send a reset link.</div>
                  <div style={S.formGroup}>
                    <label style={S.label}>Email</label>
                    <input className="form-input" style={S.input} type="email" placeholder="you@email.com" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} />
                  </div>
                  <button type="submit" className="form-btn" style={S.formBtn}>Send Reset Link</button>
                </form>
              )}
              <div style={{ ...S.formLink, color: "var(--text-muted)", marginTop: 12 }} onClick={() => setShowForgotPwd(false)}>← Back to login</div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Layout ────────────────────────────────────────────────────────────────
  return (
    <div style={S.app}>
      {/* Topbar */}
      <div style={S.topbar}>
        <div style={S.logo} onClick={() => setPage("chat")} role="button" tabIndex={0}>
          <div style={S.logoIcon}>🍳</div>
          FoodBot
        </div>
        <div style={S.topRight}>
          <button className="topbar-btn btn-outline" style={S.btn} title="Help / FAQ" aria-label="Help and FAQ" onClick={() => setHelpOpen(true)}>❓ Help</button>
          <button
            className={`topbar-btn btn-outline${page === 'shopping-list' ? ' topbar-btn-active' : ''}`}
            style={S.btn}
            title="Shopping List"
            aria-label="Shopping list"
            onClick={() => setPage('shopping-list')}
          >
            🛒 List
          </button>
          <button className="topbar-btn btn-outline" style={S.btn} title="Reset Chat" aria-label="Reset chat" onClick={resetChat}>↺ Reset</button>
          {user ? (
            <>
              {user.isAdmin && <button className={`topbar-btn btn-outline${page === "admin" ? ' topbar-btn-active' : ''}`} style={S.btn} onClick={() => setPage("admin")}>⚙ Admin</button>}
              <button title="My Favourites" aria-label="My favourites" className={`topbar-btn btn-outline${page === "favourites" ? ' topbar-btn-active' : ''}`} style={S.btn} onClick={() => setPage("favourites")}>♡ Saved</button>
              <button
                title="Meal Plan"
                aria-label="Meal plan"
                className={`topbar-btn btn-outline${page === 'meal-plan' ? ' topbar-btn-active' : ''}`}
                style={S.btn}
                onClick={() => setPage('meal-plan')}
              >
                📅 Plan
              </button>
              <button className={`topbar-btn btn-outline${page === "profile" ? ' topbar-btn-active' : ''}`} style={S.btn} title="Profile" onClick={() => setPage("profile")}>👤 Profile</button>
              <div style={{ ...S.avatar("var(--blue)"), width: 30, height: 30, fontSize: 12, cursor: "pointer", boxShadow: "0 0 0 2px var(--primary)" }} onClick={() => setPage("profile")}>{user?.name?.[0]?.toUpperCase() || '?'}</div>
              <button className="topbar-btn btn-outline" style={S.btn} onClick={handleLogout}>Sign out</button>
            </>
          ) : (
            <>
              <button className="topbar-btn btn-outline" style={S.btn} onClick={() => { setPage("login"); setAuthError(""); }}>Sign in</button>
              <button className="btn-primary" style={S.btnPrimary} onClick={() => { setPage("register"); setAuthError(""); }}>Sign Up</button>
            </>
          )}
        </div>
      </div>

      {sessionExpired && (
        <div className="fade-in" style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: 'var(--text-primary)', color: '#fff', padding: '11px 22px', borderRadius: 'var(--r-xl)', zIndex: 200, fontSize: 13, fontWeight: 500, boxShadow: 'var(--shadow-lg)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ opacity: 0.7 }}>⏱</span> Session expired — starting a new conversation…
        </div>
      )}

      {showForgotPwd && (
        <div style={S.modalOverlay} onClick={() => setShowForgotPwd(false)}>
          <div style={{ ...S.modalCard, width: 370 }} className="modal-card" onClick={e => e.stopPropagation()}>
            <div style={S.modalTitle}>Reset Password</div>
            {forgotMsg ? (
              <div style={{ background: 'var(--green-light)', border: '1px solid var(--green-dim)', borderRadius: 'var(--r-md)', padding: '10px 14px', fontSize: 13, color: 'var(--green)', marginBottom: 16 }}>
                ✓ {forgotMsg}
              </div>
            ) : (
              <form onSubmit={handleForgotPassword}>
                <div style={S.formGroup}>
                  <label style={S.label}>Email Address</label>
                  <input className="form-input" style={S.input} type="email" placeholder="you@email.com"
                    value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} />
                </div>
                <button type="submit" className="form-btn" style={S.formBtn}>Send Reset Email</button>
              </form>
            )}
            <div style={{ ...S.formLink, color: 'var(--text-muted)', marginTop: 12 }}
              onClick={() => setShowForgotPwd(false)}>
              ← Back to login
            </div>
          </div>
        </div>
      )}

      {/* Body */}
      <div style={S.body}>
        {/* Sidebar — only on chat page */}
        {(page === "chat") && (
          <div style={S.sidebar}>
            <div style={S.sidebarTop}>
              <button style={S.newChatBtn} className="sidebar-item new-chat-btn" onClick={newChat}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="var(--sidebar-text)" strokeWidth="1.5" strokeLinecap="round" /></svg>
                New chat
              </button>
            </div>
            <div style={{ flex: 1, overflowY: "auto" }} className="sidebar-scroll">
              <div style={S.sideSection}>Chats</div>
              {sessions.map(s => (
                <div key={s.id} className="sidebar-item" style={S.histItem(s.id === activeSession)} onClick={() => setActiveSession(s.id)}>{s.title}</div>
              ))}
            </div>
            {user && (
              <div style={S.sideBottom}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={S.avatar("#2563eb")}>{user.name[0].toUpperCase()}</div>
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name}</div>
                    <div style={{ fontSize: 11, color: "#999" }}>{user.isAdmin ? "Admin" : "Member"}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Main content */}
        <div id="main-content" style={S.main}>
          {page === "chat" && renderChat()}
          {page === "profile" && user && renderProfile()}
          {page === "favourites" && user && renderFavourites()}
          {page === "admin" && user?.isAdmin && (
            <AdminPage
              user={user}
              onLogout={handleLogout}
              onNavigate={setPage}
            />
          )}
          {page === 'shopping-list' && (
            <ShoppingListPage
              onBack={() => setPage('chat')}
              user={user}
              items={shoppingListItems}
              onClear={clearShoppingList}
            />
          )}
          {page === 'meal-plan' && user && (
            <MealPlanPage
              plan={mealPlan}
              onBack={() => setPage('chat')}
              onRemoveItem={deleteMealPlanItem}
              onGeneratePlan={generateMealPlan}
              onAddToShoppingList={handleAddToShoppingListFromPlan}
              loading={mealPlanLoading}
            />
          )}
        </div>
      </div>

      {/* Recipe detail modal */}
      {viewRecipe && (
        <RecipeModal
          recipe={viewRecipe}
          onClose={() => setViewRecipe(null)}
          instructions={recipeInstructions[viewRecipe.recipe_id]}
          onSave={saveToFavourites}
          isSaved={favourites.some(f => f.id === viewRecipe.id || f.id === viewRecipe.recipe_id)}
          onAddToList={addToShoppingList}
          onAddToMealPlan={addRecipeToMealPlan}
          user={user}
          onFetchInstructions={async () => {
            const id = viewRecipe.recipe_id;
            if (recipeInstructions[id]?.loading || recipeInstructions[id]?.steps) return;
            setRecipeInstructions(p => ({ ...p, [id]: { loading: true } }));
            try {
              const data = await api.get(`/api/recipes/${id}/instructions`);
              setRecipeInstructions(p => ({ ...p, [id]: { steps: data.steps, ai_generated: data.ai_generated, loading: false } }));
            } catch {
              setRecipeInstructions(p => ({ ...p, [id]: { steps: 'Failed to load instructions. Please try again.', ai_generated: false, loading: false } }));
            }
          }}
        />
      )}

      {/* Help modal */}
      {helpOpen && (
        <div style={S.modalOverlay} onClick={() => setHelpOpen(false)}>
          <div style={{ ...S.modalCard, width: 480 }} className="modal-card" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={S.modalTitle}>How to use FoodBot</div>
              <button className="btn-outline" style={{ ...S.btn, padding: '5px 11px' }} onClick={() => setHelpOpen(false)}>✕</button>
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--text-secondary)' }}>
              {[
                ["1. Enter your ingredients", "Type what you have on hand — e.g. \"I have chicken, garlic and tomatoes\"."],
                ["2. Confirm the list", "FoodBot extracts the ingredients and asks you to confirm or edit them."],
                ["3. Get recipes", "FoodBot scores all recipes and shows the top 5 matches with missing ingredients highlighted."],
                ["4. View a recipe", "Click \"View instructions\" for full cooking steps, nutrition info, and a shopping list for missing items."],
              ].map(([title, desc]) => (
                <div key={title} style={{ marginBottom: 14, padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 'var(--r-md)', borderLeft: '3px solid var(--primary)' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>{title}</strong>
                  <div style={{ marginTop: 3, color: 'var(--text-muted)', fontSize: 12 }}>{desc}</div>
                </div>
              ))}
              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                Register a free account to save favourites, set dietary preferences, and manage allergen alerts.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
