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
    allergen_warning: r.allergen_warning
  };
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  app: { display: "flex", flexDirection: "column", height: "100vh", fontFamily: "system-ui, -apple-system, sans-serif", fontSize: 14, color: "#1a1a1a", background: "#fff" },
  topbar: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", height: 48, borderBottom: "1px solid #e5e5e5", flexShrink: 0, background: "#fff" },
  logo: { display: "flex", alignItems: "center", gap: 8, fontWeight: 600, fontSize: 16 },
  logoIcon: { width: 28, height: 28, background: "#16a34a", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, fontWeight: 700 },
  topRight: { display: "flex", gap: 8, alignItems: "center" },
  btn: { padding: "5px 12px", borderRadius: 6, border: "1px solid #e5e5e5", background: "#fff", cursor: "pointer", fontSize: 13, color: "#555" },
  btnPrimary: { padding: "5px 12px", borderRadius: 6, border: "none", background: "#16a34a", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 500 },
  btnDanger: { padding: "5px 10px", borderRadius: 6, border: "none", background: "#fee2e2", color: "#dc2626", cursor: "pointer", fontSize: 12 },
  body: { display: "flex", flex: 1, overflow: "hidden" },
  sidebar: { width: 240, borderRight: "1px solid #e5e5e5", display: "flex", flexDirection: "column", background: "#fafafa", flexShrink: 0 },
  sidebarTop: { padding: 12, borderBottom: "1px solid #e5e5e5" },
  newChatBtn: { width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e5e5", background: "#fff", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 6, color: "#333" },
  sideSection: { padding: "10px 12px 4px", fontSize: 11, color: "#999", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" },
  histItem: (active) => ({ padding: "7px 12px", fontSize: 13, color: active ? "#16a34a" : "#555", cursor: "pointer", background: active ? "#f0fdf4" : "transparent", borderLeft: active ? "2px solid #16a34a" : "2px solid transparent", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }),
  sideBottom: { marginTop: "auto", padding: 12, borderTop: "1px solid #e5e5e5" },
  avatar: (color = "#16a34a") => ({ width: 28, height: 28, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: "#fff", flexShrink: 0 }),
  main: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  messages: { flex: 1, overflowY: "auto", padding: "24px 0" },
  msgWrap: (isUser) => ({ display: "flex", gap: 10, alignItems: "flex-start", padding: "4px 40px", flexDirection: isUser ? "row-reverse" : "row" }),
  bubble: (isUser) => ({ maxWidth: "70%", padding: "10px 14px", borderRadius: 12, fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap", background: isUser ? "#16a34a" : "#f4f4f4", color: isUser ? "#fff" : "#1a1a1a" }),
  recipeCard: { background: "#fff", border: "1px solid #e5e5e5", borderRadius: 12, padding: "12px 14px", marginTop: 6, maxWidth: 380 },
  recipeTitle: { fontWeight: 600, fontSize: 14, marginBottom: 4 },
  recipeMeta: { fontSize: 12, color: "#666", marginBottom: 8, display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" },
  badge: (type) => {
    const map = { match: ["#f0fdf4", "#16a34a"], warn: ["#fffbeb", "#d97706"], info: ["#eff6ff", "#2563eb"], red: ["#fef2f2", "#dc2626"] };
    const [bg, text] = map[type] || map.info;
    return { fontSize: 11, padding: "2px 7px", borderRadius: 10, background: bg, color: text, fontWeight: 500 };
  },
  recipeBtns: { display: "flex", gap: 6, flexWrap: "wrap" },
  recipeBtn: { fontSize: 12, padding: "4px 10px", border: "1px solid #e5e5e5", borderRadius: 6, background: "#fff", cursor: "pointer", color: "#333" },
  recipeBtnPrimary: { fontSize: 12, padding: "4px 10px", border: "none", borderRadius: 6, background: "#16a34a", color: "#fff", cursor: "pointer" },
  scoreBar: { height: 4, borderRadius: 2, background: '#e5e5e5', margin: '6px 0', overflow: 'hidden' },
  scoreFill: (pct) => ({ height: '100%', borderRadius: 2, background: pct >= 70 ? '#16a34a' : pct >= 40 ? '#d97706' : '#dc2626', width: `${pct}%`, transition: 'width 0.3s ease' }),
  chips: { display: "flex", flexWrap: "wrap", gap: 6, padding: "8px 40px 0" },
  chip: { fontSize: 12, padding: "5px 12px", border: "1px solid #e5e5e5", borderRadius: 12, background: "#fff", cursor: "pointer", color: "#555" },
  inputArea: { padding: "12px 40px 20px", borderTop: "1px solid #e5e5e5", flexShrink: 0 },
  inputWrap: { display: "flex", gap: 8, alignItems: "flex-end", border: "1px solid #d1d5db", borderRadius: 12, padding: "8px 12px", background: "#fff" },
  textarea: { flex: 1, border: "none", outline: "none", fontSize: 14, resize: "none", fontFamily: "inherit", lineHeight: 1.5, background: "transparent", color: "#1a1a1a" },
  sendBtn: { width: 34, height: 34, borderRadius: "50%", background: "#16a34a", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  // Auth
  authPage: { display: "flex", flex: 1, alignItems: "center", justifyContent: "center", background: "#fafafa" },
  authCard: { background: "#fff", border: "1px solid #e5e5e5", borderRadius: 16, padding: 32, width: 360 },
  authTitle: { fontSize: 20, fontWeight: 600, marginBottom: 4 },
  authSub: { fontSize: 13, color: "#666", marginBottom: 24 },
  formGroup: { marginBottom: 16 },
  label: { display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "#333" },
  input: { width: "100%", padding: "8px 12px", border: "1px solid #e5e5e5", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" },
  formBtn: { width: "100%", padding: "10px", borderRadius: 8, border: "none", background: "#16a34a", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 4 },
  formLink: { fontSize: 13, color: "#16a34a", textAlign: "center", marginTop: 12, cursor: "pointer" },
  // Profile
  profilePage: { flex: 1, overflowY: "auto", padding: "32px 40px" },
  profileCard: { background: "#fff", border: "1px solid #e5e5e5", borderRadius: 12, padding: 24, maxWidth: 480, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 600, marginBottom: 16 },
  checkRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 10 },
  checkBox: (checked) => ({ width: 18, height: 18, borderRadius: 4, border: `2px solid ${checked ? "#16a34a" : "#d1d5db"}`, background: checked ? "#16a34a" : "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }),
  // Admin
  adminPage: { flex: 1, overflowY: "auto", padding: "24px 32px" },
  adminHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  table: { width: "100%", borderCollapse: "collapse", background: "#fff", border: "1px solid #e5e5e5", borderRadius: 12, overflow: "hidden" },
  th: { textAlign: "left", padding: "10px 14px", borderBottom: "1px solid #e5e5e5", fontSize: 12, color: "#666", fontWeight: 600, background: "#fafafa" },
  td: { padding: "10px 14px", borderBottom: "1px solid #f3f4f6", fontSize: 13, verticalAlign: "top" },
  // Modal
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
  modalCard: { background: "#fff", borderRadius: 16, padding: 28, width: 480, maxHeight: "80vh", overflowY: "auto" },
  modalTitle: { fontSize: 18, fontWeight: 600, marginBottom: 16 },
  statusBar: (ok) => ({ padding: "8px 14px", borderRadius: 8, background: ok ? "#f0fdf4" : "#fef3c7", color: ok ? "#16a34a" : "#d97706", fontSize: 12, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }),
};

// ─── Components ───────────────────────────────────────────────────────────────
function RecipeModal({ recipe, onClose, instructions, onFetchInstructions, onSave, isSaved, onAddToList, onAddToMealPlan, user }) {
  const pct = Math.round((recipe.score ?? 0) * 100);
  const inst = instructions || {};

  return (
    <div style={S.modalOverlay} onClick={onClose}>
      <div style={{ ...S.modalCard, width: 520 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div>
            <div style={S.modalTitle}>{recipe.name}</div>
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
          {user && (
            <button
              style={{ ...S.btn, fontSize: 12, padding: '6px 12px', background: '#f0fdf4', borderColor: '#16a34a', color: '#16a34a', flex: 1 }}
              onClick={() => onAddToMealPlan && onAddToMealPlan(recipe)}
            >
              📅 Add to Meal Plan
            </button>
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
    <div style={S.recipeCard}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
        <div style={S.recipeTitle}>{recipe.name}</div>
        <span style={S.badge(pct === 100 ? "match" : pct >= 60 ? "warn" : "red")}>{pct}%</span>
      </div>
      <div style={S.scoreBar}>
        <div style={S.scoreFill(pct)} />
      </div>
      <div style={S.recipeMeta}>
        <span>{recipe.cookTime} mins</span>
        {recipe.dietary.slice(0, 2).map(d => <span key={d} style={S.badge("match")}>{d}</span>)}
        {recipe.allergen_warning && <span style={S.badge("red")}>⚠ Allergen</span>}
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

  async function addRecipeToMealPlan(recipe) {
    if (!user) return;
    try {
      await api.post('/api/meal-plan/items', { recipeId: recipe.recipe_id, dayNumber: 1 });
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
          <div style={{ background: '#fffbe6', borderBottom: '1px solid #e0c060', padding: '6px 20px', fontSize: 12, color: '#806000', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span>ℹ Guest Mode — Sign up to save favourites & preferences</span>
            <span style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
              <span style={{ textDecoration: 'underline', cursor: 'pointer' }} onClick={() => setPage('register')}>Sign Up</span>
              <span style={{ textDecoration: 'underline', cursor: 'pointer' }} onClick={() => setPage('login')}>Login</span>
            </span>
          </div>
        ) : (
          <div style={{ background: '#e8f5e9', borderBottom: '1px solid #aad0aa', padding: '5px 20px', fontSize: 12, color: '#2a6a2a', display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
            <span>✓ {user.name || 'User'} &nbsp;|&nbsp; {user.isAdmin ? 'Admin' : 'Registered'}</span>
            <span>
              {[prefs.halal && 'Halal', prefs.vegetarian && 'Vegetarian', prefs.vegan && 'Vegan', prefs.glutenFree && 'Gluten-Free'].filter(Boolean).join(' · ') || 'No dietary filters'}
              {prefs.allergens.length > 0 ? ` · No ${prefs.allergens.slice(0, 2).join('/')}` : ''}
            </span>
          </div>
        )}
        <div style={S.messages}>
          {messages.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 40px" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🍳</div>
              <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>What's in your kitchen?</div>
              <div style={{ fontSize: 14, color: "#666", marginBottom: 28 }}>Enter your ingredients and I'll find recipes. Or ask me anything about cooking.</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                {SUGGESTIONS.map(s => (
                  <button key={s} style={{ ...S.chip, fontSize: 13, padding: "7px 14px" }} onClick={() => sendMessage(s)}>{s}</button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => {
            if (msg.type === 'support_answer') {
              return (
                <div key={i} style={{ padding: '4px 40px' }}>
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
                <div key={i} style={{ padding: '4px 40px' }}>
                  <IngredientConfirmMsg
                    ingredients={msg.ingredients}
                    confirmed={msg.confirmed}
                    onConfirm={(finalIngredients) => runRecommend(finalIngredients, msg.id)}
                  />
                </div>
              );
            }
            return (
              <div key={i}>
                <div style={S.msgWrap(msg.role === "user")}>
                  <div style={S.avatar(msg.role === "user" ? "#2563eb" : "#16a34a")}>
                    {msg.role === "user" ? (user?.name?.[0]?.toUpperCase() || "U") : "FB"}
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
            <div style={S.msgWrap(false)}>
              <div style={S.avatar("#16a34a")}>FB</div>
              <div style={{ ...S.bubble(false), color: "#999" }}>Thinking…</div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {messages.length > 0 && (
          <div style={S.chips}>
            {["Substitute an ingredient", "Make it vegetarian", "Simpler version?", "What pairs well with this?"].map(c => (
              <button key={c} style={S.chip} onClick={() => sendMessage(c)}>{c}</button>
            ))}
          </div>
        )}

        <div style={S.inputArea}>
          <div style={S.inputWrap}>
            <textarea
              ref={textareaRef}
              rows={1}
              style={S.textarea}
              placeholder="Type ingredients or ask a question…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button style={S.sendBtn} onClick={() => sendMessage()} aria-label="Send">
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
        <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 20 }}>My profile</div>
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontSize: 20, fontWeight: 600 }}>My Favourites</div>
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
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🍳</div>
            <div style={S.authTitle}>{isLogin ? "Welcome back" : "Create account"}</div>
            <div style={S.authSub}>{isLogin ? "Sign in to FoodBot" : "Join FoodBot to save recipes"}</div>
          </div>
          {authError && <div style={{ background: "#fef2f2", color: "#dc2626", padding: "8px 12px", borderRadius: 8, fontSize: 13, marginBottom: 12 }}>{authError}</div>}
          <form onSubmit={isLogin ? handleLogin : handleRegister}>
            {isLogin ? (
              <>
                <div style={S.formGroup}>
                  <label style={S.label}>Email</label>
                  <input style={S.input} type="email" placeholder="you@email.com" value={authForm.email} onChange={e => setAuthForm(p => ({ ...p, email: e.target.value }))} />
                </div>
                <div style={S.formGroup}>
                  <label style={S.label}>Password</label>
                  <input style={S.input} type="password" placeholder="••••••••" value={authForm.password} onChange={e => setAuthForm(p => ({ ...p, password: e.target.value }))} />
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
            <button type="submit" style={S.formBtn}>{isLogin ? "Sign in" : "Create account"}</button>
          </form>
          <div style={S.formLink} onClick={() => { setPage(isLogin ? "register" : "login"); setAuthError(""); }}>
            {isLogin ? "Don't have an account? Register →" : "Already have an account? Sign in →"}
          </div>
          {isLogin && (
            <div style={{ ...S.formLink, color: '#888', marginTop: 8 }} onClick={() => setPage("chat")}>
              Continue as Guest
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Layout ────────────────────────────────────────────────────────────────
  return (
    <div style={S.app}>
      {/* Topbar */}
      <div style={S.topbar}>
        <div style={S.logo} onClick={() => setPage("chat")} role="button" tabIndex={0}>
          <div style={S.logoIcon}>FB</div>
          FoodBot
        </div>
        <div style={S.topRight}>
          <button style={S.btn} title="Help / FAQ" onClick={() => setHelpOpen(true)}>❓</button>
          <button
            style={{ ...S.btn, color: page === 'shopping-list' ? '#16a34a' : '#555' }}
            title="Shopping List"
            onClick={() => setPage('shopping-list')}
          >
            🛒
          </button>
          <button style={S.btn} title="Reset Chat" onClick={resetChat}>↺</button>
          {user ? (
            <>
              {user.isAdmin && <button style={{ ...S.btn, color: page === "admin" ? "#16a34a" : "#555" }} onClick={() => setPage("admin")}>Admin</button>}
              <button title="My Favourites" style={{ ...S.btn, color: page === "favourites" ? "#16a34a" : "#555" }} onClick={() => setPage("favourites")}>♡</button>
              <button
                title="Meal Plan"
                style={{ ...S.btn, color: page === 'meal-plan' ? '#16a34a' : '#555' }}
                onClick={() => setPage('meal-plan')}
              >
                📅
              </button>
              <button style={{ ...S.btn, color: page === "profile" ? "#16a34a" : "#555" }} title="👤 Profile" onClick={() => setPage("profile")}>👤 Profile</button>
              <div style={{ ...S.avatar("#2563eb"), width: 30, height: 30, fontSize: 12, cursor: "pointer" }} onClick={() => setPage("profile")}>{user?.name?.[0]?.toUpperCase() || '?'}</div>
              <button style={S.btn} onClick={handleLogout}>Sign out</button>
            </>
          ) : (
            <>
              <button style={S.btn} onClick={() => { setPage("login"); setAuthError(""); }}>Sign in</button>
              <button style={S.btnPrimary} onClick={() => { setPage("register"); setAuthError(""); }}>Sign Up</button>
            </>
          )}
        </div>
      </div>

      {sessionExpired && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#dc2626', color: '#fff', padding: '10px 20px', borderRadius: 8, zIndex: 200, fontSize: 13, fontWeight: 500, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
          ⏱ Session expired — starting a new conversation…
        </div>
      )}

      {showForgotPwd && (
        <div style={S.modalOverlay} onClick={() => setShowForgotPwd(false)}>
          <div style={{ ...S.modalCard, width: 360 }} onClick={e => e.stopPropagation()}>
            <div style={S.modalTitle}>Reset Password</div>
            {forgotMsg ? (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#16a34a', marginBottom: 16 }}>
                {forgotMsg}
              </div>
            ) : (
              <form onSubmit={handleForgotPassword}>
                <div style={S.formGroup}>
                  <label style={S.label}>Email Address</label>
                  <input style={S.input} type="email" placeholder="you@email.com"
                    value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} />
                </div>
                <button type="submit" style={S.formBtn}>Send Reset Email</button>
              </form>
            )}
            <div style={{ ...S.formLink, color: '#888', marginTop: 12 }}
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
              <button style={S.newChatBtn} onClick={newChat}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="#555" strokeWidth="1.5" strokeLinecap="round" /></svg>
                New chat
              </button>
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              <div style={S.sideSection}>Chats</div>
              {sessions.map(s => (
                <div key={s.id} style={S.histItem(s.id === activeSession)} onClick={() => setActiveSession(s.id)}>{s.title}</div>
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
        <div style={S.main}>
          {page === "chat" && renderChat()}
          {page === "login" && renderAuth(true)}
          {page === "register" && renderAuth(false)}
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
          <div style={S.modalCard} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={S.modalTitle}>❓ Help / FAQ</div>
              <button style={{ ...S.btn, padding: '4px 10px' }} onClick={() => setHelpOpen(false)}>✕</button>
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.8, color: '#444' }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>How to use FoodBot</div>
              <div style={{ marginBottom: 12 }}>
                <strong>1. Enter your ingredients</strong> — Type what you have on hand (e.g. "I have chicken, garlic and tomatoes").
              </div>
              <div style={{ marginBottom: 12 }}>
                <strong>2. Confirm the list</strong> — FoodBot extracts the ingredients and asks you to confirm or edit them.
              </div>
              <div style={{ marginBottom: 12 }}>
                <strong>3. Get recipes</strong> — FoodBot scores all recipes and shows the top 5 matches with missing ingredients highlighted.
              </div>
              <div style={{ marginBottom: 12 }}>
                <strong>4. View a recipe</strong> — Click "View instructions" to see full cooking steps, nutrition info, and a shopping list for missing items.
              </div>
              <div style={{ borderTop: '1px solid #e5e5e5', paddingTop: 12, fontSize: 12, color: '#666' }}>
                Register a free account to save favourites, set dietary preferences, and manage allergen alerts.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
