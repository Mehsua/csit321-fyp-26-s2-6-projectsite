import { useState, useRef, useEffect } from "react";
import { api, setToken, getToken } from "./lib/api";

// ─── Seed Data ────────────────────────────────────────────────────────────────
const RECIPES = [
  {
    id: 1, name: "Lemon Garlic Chicken", cuisine: "Western", prepTime: 10, cookTime: 25,
    ingredients: ["chicken", "garlic", "lemon", "olive oil", "salt", "pepper"],
    instructions: "1. Season chicken with salt and pepper.\n2. Heat olive oil in a pan over medium-high heat.\n3. Sear chicken 5-6 mins each side until golden.\n4. Add minced garlic and cook 1 min.\n5. Squeeze lemon juice over chicken.\n6. Rest 5 mins before serving.",
    allergens: [], dietary: ["halal", "gluten-free"], calories: 320
  },
  {
    id: 2, name: "Garlic Butter Chicken Thighs", cuisine: "Western", prepTime: 5, cookTime: 35,
    ingredients: ["chicken", "garlic", "butter", "thyme", "salt", "pepper"],
    instructions: "1. Pat chicken dry, season generously.\n2. Melt butter in oven-safe skillet.\n3. Sear thighs skin-side down 8 mins.\n4. Flip, add garlic and thyme.\n5. Bake at 200°C for 20 mins.\n6. Baste with pan juices before serving.",
    allergens: ["dairy"], dietary: ["halal"], calories: 410
  },
  {
    id: 3, name: "Beef Fried Rice", cuisine: "Asian", prepTime: 15, cookTime: 15,
    ingredients: ["rice", "beef", "egg", "soy sauce", "garlic", "onion", "oil"],
    instructions: "1. Cook rice a day ahead and refrigerate.\n2. Slice beef thinly, marinate in soy sauce.\n3. Stir-fry beef in hot wok, set aside.\n4. Scramble eggs, set aside.\n5. Fry garlic and onion until fragrant.\n6. Add rice, stir-fry on high heat.\n7. Return beef and eggs, mix well.",
    allergens: ["soy", "egg"], dietary: ["halal"], calories: 520
  },
  {
    id: 4, name: "Tomato Pasta", cuisine: "Italian", prepTime: 5, cookTime: 20,
    ingredients: ["pasta", "tomato", "garlic", "olive oil", "basil", "salt"],
    instructions: "1. Boil salted water, cook pasta al dente.\n2. Sauté garlic in olive oil 1 min.\n3. Add crushed tomatoes, simmer 10 mins.\n4. Season with salt and fresh basil.\n5. Toss pasta in sauce.\n6. Serve with optional parmesan.",
    allergens: ["gluten"], dietary: ["vegetarian"], calories: 380
  },
  {
    id: 5, name: "Scrambled Eggs on Toast", cuisine: "Western", prepTime: 2, cookTime: 8,
    ingredients: ["egg", "butter", "bread", "salt", "pepper"],
    instructions: "1. Whisk eggs with salt and pepper.\n2. Melt butter in non-stick pan on low heat.\n3. Add eggs, stir gently and continuously.\n4. Remove from heat while still slightly wet.\n5. Toast bread.\n6. Serve eggs on toast immediately.",
    allergens: ["egg", "dairy", "gluten"], dietary: ["vegetarian"], calories: 290
  },
  {
    id: 6, name: "Chicken Fried Rice", cuisine: "Asian", prepTime: 10, cookTime: 15,
    ingredients: ["rice", "chicken", "egg", "soy sauce", "garlic", "spring onion", "oil"],
    instructions: "1. Use day-old cold rice for best results.\n2. Dice chicken, stir-fry until cooked.\n3. Push aside, scramble egg in same wok.\n4. Add garlic and rice, fry on high heat.\n5. Season with soy sauce.\n6. Garnish with chopped spring onion.",
    allergens: ["soy", "egg"], dietary: ["halal"], calories: 480
  },
  {
    id: 7, name: "Vegetable Stir Fry", cuisine: "Asian", prepTime: 10, cookTime: 10,
    ingredients: ["broccoli", "carrot", "capsicum", "garlic", "soy sauce", "oil", "onion"],
    instructions: "1. Cut all vegetables into bite-size pieces.\n2. Heat wok on high until smoking.\n3. Add oil and fry garlic 30 seconds.\n4. Add harder veg first (carrot, broccoli).\n5. Add remaining veg, toss constantly.\n6. Season with soy sauce, serve immediately.",
    allergens: ["soy"], dietary: ["vegan", "vegetarian", "gluten-free", "halal"], calories: 180
  },
  {
    id: 8, name: "Honey Soy Salmon", cuisine: "Asian", prepTime: 10, cookTime: 15,
    ingredients: ["salmon", "soy sauce", "honey", "garlic", "ginger", "oil"],
    instructions: "1. Mix soy sauce, honey, garlic, ginger as marinade.\n2. Marinate salmon 15+ mins.\n3. Heat oil in pan over medium-high.\n4. Cook salmon 4 mins skin side down.\n5. Flip, pour marinade over, cook 3 more mins.\n6. Baste with glaze before serving.",
    allergens: ["fish", "soy"], dietary: ["gluten-free"], calories: 350
  },
  {
    id: 9, name: "Mushroom Omelette", cuisine: "Western", prepTime: 5, cookTime: 8,
    ingredients: ["egg", "mushroom", "butter", "cheese", "salt", "pepper"],
    instructions: "1. Slice mushrooms, sauté in butter until golden.\n2. Whisk 3 eggs with salt and pepper.\n3. Pour eggs into same pan on medium.\n4. When edges set, add mushrooms and cheese.\n5. Fold omelette in half.\n6. Slide onto plate and serve.",
    allergens: ["egg", "dairy"], dietary: ["vegetarian", "gluten-free"], calories: 310
  },
  {
    id: 10, name: "Minestrone Soup", cuisine: "Italian", prepTime: 15, cookTime: 30,
    ingredients: ["tomato", "carrot", "onion", "celery", "pasta", "garlic", "olive oil", "salt"],
    instructions: "1. Sauté onion, carrot, celery in olive oil 5 mins.\n2. Add garlic, cook 1 min.\n3. Add crushed tomatoes and 1L water.\n4. Simmer 15 mins.\n5. Add pasta, cook until tender.\n6. Season, serve with crusty bread.",
    allergens: ["gluten"], dietary: ["vegan", "vegetarian"], calories: 220
  }
];


// ─── Recipe Matching ──────────────────────────────────────────────────────────
function matchRecipes(inputText, userPrefs = {}) {
  const words = inputText.toLowerCase().split(/[\s,]+/).filter(w => w.length > 2);
  return RECIPES
    .map(recipe => {
      const matched = recipe.ingredients.filter(ing =>
        words.some(w => ing.includes(w) || w.includes(ing.replace(/s$/, "")))
      );
      const score = matched.length / recipe.ingredients.length;
      const missing = recipe.ingredients.filter(ing =>
        !words.some(w => ing.includes(w) || w.includes(ing.replace(/s$/, "")))
      ).filter(ing => !["salt", "pepper", "oil", "olive oil"].includes(ing));

      // Filter by user prefs
      if (userPrefs.halal && !recipe.dietary.includes("halal")) return null;
      if (userPrefs.vegetarian && !recipe.dietary.includes("vegetarian")) return null;
      if (userPrefs.vegan && !recipe.dietary.includes("vegan")) return null;
      if (userPrefs.glutenFree && !recipe.dietary.includes("gluten-free")) return null;
      if (userPrefs.allergens?.length) {
        if (recipe.allergens.some(a => userPrefs.allergens.includes(a))) return null;
      }

      return { ...recipe, score, matched, missing };
    })
    .filter(r => r && r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

// ─── Ollama API ───────────────────────────────────────────────────────────────
async function askOllama(messages, onChunk) {
  try {
    const res = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3.2",
        messages,
        stream: true,
      }),
    });
    if (!res.ok) throw new Error("Ollama not reachable");
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let full = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      const lines = chunk.split("\n").filter(Boolean);
      for (const line of lines) {
        try {
          const json = JSON.parse(line);
          if (json.message?.content) {
            full += json.message.content;
            onChunk(full);
          }
        } catch {}
      }
    }
    return full;
  } catch {
    return null;
  }
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  app: { display: "flex", flexDirection: "column", height: "100vh", fontFamily: "system-ui, -apple-system, sans-serif", fontSize: 14, color: "#1a1a1a", background: "#fff" },
  topbar: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", height: 48, borderBottom: "1px solid #e5e5e5", flexShrink: 0, background: "#fff" },
  logo: { display: "flex", alignItems: "center", gap: 8, fontWeight: 600, fontSize: 16 },
  logoIcon: { width: 28, height: 28, background: "#16a34a", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 16 },
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
  chips: { display: "flex", flexWrap: "wrap", gap: 6, padding: "8px 40px 0" },
  chip: { fontSize: 12, padding: "5px 12px", border: "1px solid #e5e5e5", borderRadius: 12, background: "#fff", cursor: "pointer", color: "#555" },
  inputArea: { padding: "12px 40px 20px", borderTop: "1px solid #e5e5e5", flexShrink: 0 },
  inputWrap: { display: "flex", gap: 8, alignItems: "flex-end", border: "1px solid #d1d5db", borderRadius: 12, padding: "8px 12px", background: "#fff" },
  textarea: { flex: 1, border: "none", outline: "none", fontSize: 14, resize: "none", fontFamily: "inherit", lineHeight: 1.5, background: "transparent", color: "#1a1a1a" },
  sendBtn: { width: 34, height: 34, borderRadius: "50%", background: "#16a34a", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  inputHint: { fontSize: 11, color: "#aaa", textAlign: "center", marginTop: 6 },
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
function RecipeModal({ recipe, onClose }) {
  return (
    <div style={S.modalOverlay} onClick={onClose}>
      <div style={S.modalCard} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div style={S.modalTitle}>{recipe.name}</div>
          <button style={{ ...S.btn, padding: "4px 10px" }} onClick={onClose}>✕</button>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          <span style={S.badge("info")}>{recipe.cuisine}</span>
          <span style={S.badge("info")}>⏱ {recipe.prepTime + recipe.cookTime} mins</span>
          <span style={S.badge("info")}>🔥 {recipe.calories} kcal</span>
          {recipe.dietary.map(d => <span key={d} style={S.badge("match")}>{d}</span>)}
        </div>
        <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>Ingredients</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
          {recipe.ingredients.map(i => (
            <span key={i} style={{ fontSize: 12, padding: "3px 9px", background: "#f4f4f4", borderRadius: 8, color: "#333" }}>{i}</span>
          ))}
        </div>
        {recipe.allergens.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 13 }}>⚠ Allergens</div>
            <div style={{ display: "flex", gap: 6 }}>
              {recipe.allergens.map(a => <span key={a} style={S.badge("red")}>{a}</span>)}
            </div>
          </div>
        )}
        <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>Instructions</div>
        <div style={{ fontSize: 13, lineHeight: 1.7, color: "#333", whiteSpace: "pre-wrap" }}>{recipe.instructions}</div>
      </div>
    </div>
  );
}

function RecipeCardMsg({ recipe, onView, onSave, saved }) {
  const pct = Math.round(recipe.score * 100);
  return (
    <div style={S.recipeCard}>
      <div style={S.recipeTitle}>{recipe.name}</div>
      <div style={S.recipeMeta}>
        <span style={S.badge(pct === 100 ? "match" : pct >= 60 ? "warn" : "red")}>{pct}% match</span>
        <span>{recipe.prepTime + recipe.cookTime} mins</span>
        <span>{recipe.calories} kcal</span>
        {recipe.dietary.slice(0, 2).map(d => <span key={d} style={S.badge("match")}>{d}</span>)}
        {recipe.missing.length > 0 && <span style={S.badge("warn")}>Missing: {recipe.missing.slice(0, 2).join(", ")}</span>}
      </div>
      <div style={S.recipeBtns}>
        <button style={S.recipeBtnPrimary} onClick={() => onView(recipe)}>View instructions</button>
        <button style={S.recipeBtn} onClick={() => onSave(recipe)}>{saved ? "✓ Saved" : "♡ Save"}</button>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("chat"); // chat | login | register | profile | admin | favourites
  const [user, setUser] = useState(null);
  const [sessions, setSessions] = useState([{ id: 1, title: "New chat", messages: [] }]);
  const [activeSession, setActiveSession] = useState(1);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [viewRecipe, setViewRecipe] = useState(null);
  const [favourites, setFavourites] = useState([]);
  const [ollamaOnline, setOllamaOnline] = useState(null);
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [authError, setAuthError] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [prefs, setPrefs] = useState({ halal: false, vegetarian: false, vegan: false, glutenFree: false, allergens: [] });
  const [adminRecipes, setAdminRecipes] = useState(RECIPES);
  const [editRecipe, setEditRecipe] = useState(null);
  const [adminTab, setAdminTab] = useState("recipes");
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const currentSession = sessions.find(s => s.id === activeSession);
  const messages = currentSession?.messages || [];

  // Check Ollama on mount
  useEffect(() => {
    fetch("http://localhost:11434/api/tags").then(() => setOllamaOnline(true)).catch(() => setOllamaOnline(false));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function updateMessages(newMsgs) {
    setSessions(prev => prev.map(s => s.id === activeSession ? { ...s, messages: newMsgs } : s));
  }

  function newChat() {
    const id = Date.now();
    setSessions(prev => [{ id, title: "New chat", messages: [] }, ...prev]);
    setActiveSession(id);
  }

  async function sendMessage(text = input) {
    const msg = text.trim();
    if (!msg || loading) return;
    setInput("");

    const userMsg = { role: "user", content: msg };
    const newMsgs = [...messages, userMsg];
    updateMessages(newMsgs);

    // Update session title from first message
    if (messages.length === 0) {
      setSessions(prev => prev.map(s => s.id === activeSession ? { ...s, title: msg.slice(0, 40) } : s));
    }

    setLoading(true);

    // Check if ingredient-type query
    const ingredientKeywords = ["have", "got", "using", "use", "with", "make", "cook", "ingredients", "fridge"];
    const isIngredientQuery = ingredientKeywords.some(k => msg.toLowerCase().includes(k)) || msg.includes(",");
    const matches = isIngredientQuery ? matchRecipes(msg, prefs) : [];

    // Build system prompt
    const systemPrompt = `You are RecipeBot, a friendly AI assistant for a recipe and cooking chatbot. You help users find recipes based on their ingredients, answer cooking questions, and provide customer support.

Current user: ${user ? user.name : "Guest"}
User dietary preferences: ${Object.entries(prefs).filter(([k, v]) => v && k !== "allergens").map(([k]) => k).join(", ") || "none set"}
User allergens: ${prefs.allergens.join(", ") || "none"}

${matches.length > 0 ? `Recipe matching results have already been shown to the user for their ingredient query. The top match is "${matches[0].name}". Acknowledge these results briefly and offer to help further.` : ""}

Guidelines:
- Be concise and friendly
- For ingredient queries, the system already shows recipe cards, so just acknowledge them briefly
- For cooking questions, give helpful practical advice
- For customer support questions (account, how to use the app, etc.), explain clearly
- Keep responses under 3 sentences unless detailed instructions are needed`;

    const ollamaMessages = [
      { role: "system", content: systemPrompt },
      ...newMsgs.filter(m => m.role !== "system").map(m => ({ role: m.role, content: m.content }))
    ];

    // Streaming response
    const botMsg = { role: "assistant", content: "", recipes: matches };
    const withBot = [...newMsgs, botMsg];
    updateMessages(withBot);

    if (ollamaOnline) {
      await askOllama(ollamaMessages, (partial) => {
        setSessions(prev => prev.map(s =>
          s.id === activeSession
            ? { ...s, messages: s.messages.map((m, i) => i === s.messages.length - 1 ? { ...m, content: partial } : m) }
            : s
        ));
      });
    } else {
      // Fallback responses
      const fallback = matches.length > 0
        ? `I found ${matches.length} recipe${matches.length > 1 ? "s" : ""} matching your ingredients! Check out "${matches[0].name}" — it's a ${Math.round(matches[0].score * 100)}% match. Let me know if you'd like substitution suggestions or more options.`
        : `I can help with that! Try entering some ingredients you have on hand and I'll find matching recipes. You can also ask me cooking questions or get help with the app.`;

      await new Promise(r => setTimeout(r, 600));
      setSessions(prev => prev.map(s =>
        s.id === activeSession
          ? { ...s, messages: s.messages.map((m, i) => i === s.messages.length - 1 ? { ...m, content: fallback } : m) }
          : s
      ));
    }

    setLoading(false);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  function saveToFavourites(recipe) {
    setFavourites(prev => prev.find(f => f.id === recipe.id) ? prev : [...prev, recipe]);
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
    setAuthError("");
    if (!authForm.name || !authForm.email || authForm.password.length < 8) {
      setAuthError("Please fill all fields. Password must be at least 8 characters.");
      return;
    }
    try {
      await api.post("/api/auth/register", {
        email: authForm.email,
        password: authForm.password,
        name: authForm.name,
      });
      setPage("login");
      setAuthError("");
    } catch (err) {
      setAuthError(err.message || "Registration failed. Please try again.");
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

          {messages.map((msg, i) => (
            <div key={i}>
              <div style={S.msgWrap(msg.role === "user")}>
                <div style={S.avatar(msg.role === "user" ? "#2563eb" : "#16a34a")}>
                  {msg.role === "user" ? (user?.name?.[0]?.toUpperCase() || "U") : "RB"}
                </div>
                <div style={{ maxWidth: "72%" }}>
                  {msg.content && <div style={S.bubble(msg.role === "user")}>{msg.content}</div>}
                  {msg.recipes?.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: msg.content ? 8 : 0 }}>
                      {msg.recipes.map(r => (
                        <RecipeCardMsg key={r.id} recipe={r} onView={setViewRecipe} onSave={saveToFavourites} saved={favourites.some(f => f.id === r.id)} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {loading && messages[messages.length - 1]?.role !== "assistant" && (
            <div style={S.msgWrap(false)}>
              <div style={S.avatar("#16a34a")}>RB</div>
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
          <div style={S.inputHint}>
            {ollamaOnline === true && "🟢 Llama 3.2 connected via Ollama"}
            {ollamaOnline === false && "🟡 Ollama offline — using fallback responses. Run: ollama serve"}
            {ollamaOnline === null && "Checking Ollama…"}
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

  function renderAdmin() {
    return (
      <div style={S.adminPage}>
        <div style={S.adminHeader}>
          <div style={{ fontSize: 20, fontWeight: 600 }}>Admin panel</div>
          <div style={{ display: "flex", gap: 8 }}>
            {["recipes", "users"].map(t => (
              <button key={t} style={{ ...S.btn, background: adminTab === t ? "#f0fdf4" : "#fff", color: adminTab === t ? "#16a34a" : "#555", borderColor: adminTab === t ? "#bbf7d0" : "#e5e5e5" }} onClick={() => setAdminTab(t)}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
            ))}
          </div>
        </div>

        {adminTab === "recipes" && (
          <>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
              <button style={S.btnPrimary} onClick={() => setEditRecipe({ id: Date.now(), name: "", cuisine: "", ingredients: [], dietary: [], allergens: [], prepTime: 0, cookTime: 0, instructions: "", calories: 0 })}>+ Add recipe</button>
            </div>
            <table style={S.table}>
              <thead>
                <tr>
                  {["Name", "Cuisine", "Ingredients", "Dietary", "Allergens", "Actions"].map(h => <th key={h} style={S.th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {adminRecipes.map(r => (
                  <tr key={r.id}>
                    <td style={{ ...S.td, fontWeight: 500 }}>{r.name}</td>
                    <td style={S.td}>{r.cuisine}</td>
                    <td style={S.td}><div style={{ fontSize: 12, color: "#666" }}>{r.ingredients.slice(0, 3).join(", ")}{r.ingredients.length > 3 ? "…" : ""}</div></td>
                    <td style={S.td}>{r.dietary.map(d => <span key={d} style={{ ...S.badge("match"), marginRight: 4 }}>{d}</span>)}</td>
                    <td style={S.td}>{r.allergens.length === 0 ? <span style={{ color: "#999", fontSize: 12 }}>None</span> : r.allergens.map(a => <span key={a} style={{ ...S.badge("red"), marginRight: 4 }}>{a}</span>)}</td>
                    <td style={S.td}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button style={S.recipeBtn} onClick={() => setViewRecipe(r)}>View</button>
                        <button style={S.recipeBtn} onClick={() => setEditRecipe(r)}>Edit</button>
                        <button style={S.btnDanger} onClick={() => setAdminRecipes(prev => prev.filter(x => x.id !== r.id))}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {adminTab === "users" && (
          <table style={S.table}>
            <thead>
              <tr>{["Name", "Email", "Role", "Sessions"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {user?.isAdmin && (
                <tr>
                  <td style={S.td}>{user.name}</td>
                  <td style={S.td}>{user.email}</td>
                  <td style={S.td}><span style={S.badge("info")}>admin</span></td>
                  <td style={S.td}>—</td>
                </tr>
              )}
              {user && !user.isAdmin && (
                <tr>
                  <td style={S.td}>{user.name}</td>
                  <td style={S.td}>{user.email}</td>
                  <td style={S.td}><span style={S.badge("match")}>user</span></td>
                  <td style={S.td}>{sessions.length}</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
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
            <div style={S.authSub}>{isLogin ? "Sign in to RecipeBot" : "Join RecipeBot to save recipes"}</div>
          </div>
          {authError && <div style={{ background: "#fef2f2", color: "#dc2626", padding: "8px 12px", borderRadius: 8, fontSize: 13, marginBottom: 12 }}>{authError}</div>}
          <form onSubmit={isLogin ? handleLogin : handleRegister}>
            {!isLogin && (
              <div style={S.formGroup}>
                <label style={S.label}>Name</label>
                <input style={S.input} placeholder="Your name" value={authForm.name} onChange={e => setAuthForm(p => ({ ...p, name: e.target.value }))} />
              </div>
            )}
            <div style={S.formGroup}>
              <label style={S.label}>Email</label>
              <input style={S.input} type="email" placeholder="you@email.com" value={authForm.email} onChange={e => setAuthForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div style={S.formGroup}>
              <label style={S.label}>Password</label>
              <input style={S.input} type="password" placeholder="••••••••" value={authForm.password} onChange={e => setAuthForm(p => ({ ...p, password: e.target.value }))} />
            </div>
            <button type="submit" style={S.formBtn}>{isLogin ? "Sign in" : "Create account"}</button>
          </form>
          <div style={S.formLink} onClick={() => { setPage(isLogin ? "register" : "login"); setAuthError(""); }}>
            {isLogin ? "Don't have an account? Register →" : "Already have an account? Sign in →"}
          </div>
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
          <div style={S.logoIcon}>RB</div>
          RecipeBot
        </div>
        <div style={S.topRight}>
          {user ? (
            <>
              {user.isAdmin && <button style={{ ...S.btn, color: page === "admin" ? "#16a34a" : "#555" }} onClick={() => setPage("admin")}>Admin</button>}
              <button style={{ ...S.btn, color: page === "profile" ? "#16a34a" : "#555" }} onClick={() => setPage("profile")}>Profile</button>
              <div style={{ ...S.avatar("#2563eb"), width: 30, height: 30, fontSize: 12, cursor: "pointer" }} onClick={() => setPage("profile")}>{user.name[0].toUpperCase()}</div>
              <button style={S.btn} onClick={handleLogout}>Sign out</button>
            </>
          ) : (
            <>
              <button style={S.btn} onClick={() => { setPage("login"); setAuthError(""); }}>Sign in</button>
              <button style={S.btnPrimary} onClick={() => { setPage("register"); setAuthError(""); }}>Register</button>
            </>
          )}
        </div>
      </div>

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
          {ollamaOnline === false && page === "chat" && (
            <div style={{ background: "#fffbeb", borderBottom: "1px solid #fde68a", padding: "8px 20px", fontSize: 13, color: "#92400e", display: "flex", alignItems: "center", gap: 8 }}>
              ⚠ Ollama is not running. Start it with <code style={{ background: "#fef3c7", padding: "1px 6px", borderRadius: 4 }}>ollama serve</code> for Llama 3.2 responses.
            </div>
          )}
          {page === "chat" && renderChat()}
          {page === "login" && renderAuth(true)}
          {page === "register" && renderAuth(false)}
          {page === "profile" && user && renderProfile()}
          {page === "admin" && user?.isAdmin && renderAdmin()}
        </div>
      </div>

      {/* Recipe detail modal */}
      {viewRecipe && <RecipeModal recipe={viewRecipe} onClose={() => setViewRecipe(null)} />}

      {/* Edit recipe modal */}
      {editRecipe && (
        <div style={S.modalOverlay} onClick={() => setEditRecipe(null)}>
          <div style={S.modalCard} onClick={e => e.stopPropagation()}>
            <div style={S.modalTitle}>{editRecipe.name ? `Edit: ${editRecipe.name}` : "Add recipe"}</div>
            {[["name", "Recipe name"], ["cuisine", "Cuisine"], ["ingredients", "Ingredients (comma-separated)"], ["dietary", "Dietary tags (comma-separated)"], ["allergens", "Allergens (comma-separated)"], ["instructions", "Instructions"]].map(([field, label]) => (
              <div key={field} style={S.formGroup}>
                <label style={S.label}>{label}</label>
                {field === "instructions"
                  ? <textarea style={{ ...S.input, height: 80, resize: "vertical" }} value={editRecipe[field]} onChange={e => setEditRecipe(p => ({ ...p, [field]: e.target.value }))} />
                  : <input style={S.input} value={Array.isArray(editRecipe[field]) ? editRecipe[field].join(", ") : editRecipe[field]}
                    onChange={e => setEditRecipe(p => ({ ...p, [field]: ["ingredients", "dietary", "allergens"].includes(field) ? e.target.value.split(",").map(s => s.trim()).filter(Boolean) : e.target.value }))} />
                }
              </div>
            ))}
            <div style={{ display: "flex", gap: 8 }}>
              <button style={S.btnPrimary} onClick={() => {
                setAdminRecipes(prev => prev.find(r => r.id === editRecipe.id) ? prev.map(r => r.id === editRecipe.id ? editRecipe : r) : [...prev, editRecipe]);
                setEditRecipe(null);
              }}>Save</button>
              <button style={S.btn} onClick={() => setEditRecipe(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
