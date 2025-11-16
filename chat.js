/* chat.js - MZU AI Assistant (Smart UI, Suggestions, Timeout-safe for Render) */

/* ============================================================
   CONFIG
============================================================ */
const API_URL = "https://mzu-rag-api-bmm8.onrender.com/chat";

/* ============================================================
   ELEMENTS
============================================================ */
const openBtn = document.getElementById("chatbot-button");
const chatWindow = document.getElementById("chatbot-window");
const closeBtn = document.getElementById("chatbot-close");
const sendBtn = document.getElementById("chatbot-send");
const inputEl = document.getElementById("chatbot-input");
const messagesEl = document.getElementById("chatbot-messages");
const suggestionBox = document.getElementById("suggestions");

/* ============================================================
   FETCH WITH TIMEOUT (Render Free Plan Friendly)
============================================================ */
async function fetchWithTimeout(resource, options = {}) {
  const { timeout = 70000 } = options; // 70 seconds for cold-start
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(id);
  }
}

/* ============================================================
   POSITION RESET ON OPEN
============================================================ */
function resetChatPosition() {
  chatWindow.style.left = "";
  chatWindow.style.top = "";
  chatWindow.style.right = "30px";
  chatWindow.style.bottom = "110px";
}

/* ============================================================
   OPEN / CLOSE CHAT
============================================================ */
openBtn.addEventListener("click", () => {
  resetChatPosition();
  chatWindow.style.display = "flex";
  openBtn.style.display = "none";
  inputEl.focus();
});

closeBtn.addEventListener("click", () => {
  chatWindow.style.display = "none";
  openBtn.style.display = "flex";
});

/* ============================================================
   ADD MESSAGE
============================================================ */
function addMessage(text, who = "bot") {
  const el = document.createElement("div");

  if (who === "user") el.className = "user-msg";
  else if (who === "bot") el.className = "bot-msg";
  else el.className = "error-msg";

  el.textContent = text;
  messagesEl.appendChild(el);
  messagesEl.scrollTop = messagesEl.scrollHeight;

  return el;
}

/* ============================================================
   TYPING INDICATOR
============================================================ */
function addTyping() {
  const wrapper = document.createElement("div");
  wrapper.className = "bot-msg typing";
  wrapper.innerHTML = `
    <span class="dot" style="animation-delay:0s"></span>
    <span class="dot" style="animation-delay:0.2s"></span>
    <span class="dot" style="animation-delay:0.4s"></span>
  `;
  messagesEl.appendChild(wrapper);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return wrapper;
}

function removeTyping() {
  document.querySelectorAll(".typing").forEach(n => n.remove());
}

/* ============================================================
   SEND QUERY TO BACKEND
============================================================ */
async function sendQuery(text) {
  addMessage(text, "user");
  inputEl.value = "";
  suggestionBox.innerHTML = ""; // hide suggestions

  const typingBubble = addTyping();

  try {
    const res = await fetchWithTimeout(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: text }),
      timeout: 70000
    });

    if (!res.ok) {
      removeTyping();
      addMessage(`⚠ Server error (${res.status})`, "error");
      return;
    }

    const data = await res.json();
    removeTyping();
    addMessage(data.answer || "I don't know the answer to that.", "bot");

  } catch (e) {
    removeTyping();
    addMessage("⚠ Server is waking up... please try again in a few seconds.", "error");
  }
}

/* SEND BUTTON */
sendBtn.addEventListener("click", () => {
  const text = inputEl.value.trim();
  if (text) sendQuery(text);
});

/* ENTER KEY */
inputEl.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    const text = inputEl.value.trim();
    if (text) sendQuery(text);
  }
});

/* ============================================================
   SMART AUTO-SUGGESTIONS
============================================================ */
const smartSuggestions = [
  "What is the NIRF ranking of Mizoram University?",
  "Latest notifications",
  "Latest recruitments",
  "Departments in MZU",
  "Courses offered at MZU",
  "Library information",
  "Hostel details",
  "Placement cell details",
  "MZU contact information",
  "Vice-Chancellor of Mizoram University",
  "Academic calendar",
  "Admission process",
  "Scholarships offered",
  "MZU location"
];

inputEl.addEventListener("input", () => {
  const query = inputEl.value.trim().toLowerCase();

  suggestionBox.innerHTML = "";
  if (!query) return;

  const filtered = smartSuggestions
    .filter(s => s.toLowerCase().includes(query))
    .slice(0, 5);

  filtered.forEach(text => {
    const b = document.createElement("button");
    b.className = "suggestion-btn";
    b.textContent = text;
    b.onclick = () => sendQuery(text);
    suggestionBox.appendChild(b);
  });
});

/* ============================================================
   DRAGGABLE CHAT WINDOW
============================================================ */
(function makeDraggable() {
  const handle = document.querySelector(".draggable-handle");
  let dragging = false, startX = 0, startY = 0, startLeft = 0, startTop = 0;

  handle.addEventListener("mousedown", (e) => {
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    const rect = chatWindow.getBoundingClientRect();
    startLeft = rect.left;
    startTop = rect.top;
    document.body.style.userSelect = "none";
  });

  document.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    chatWindow.style.left = startLeft + (e.clientX - startX) + "px";
    chatWindow.style.top = startTop + (e.clientY - startY) + "px";
    chatWindow.style.right = "auto";
    chatWindow.style.bottom = "auto";
  });

  document.addEventListener("mouseup", () => {
    dragging = false;
    document.body.style.userSelect = "";
  });
})();

/* ============================================================
   GREETING ONCE
============================================================ */
(function greetOnce() {
  if (!sessionStorage.getItem("mzu_greeted")) {
    setTimeout(() => {
      resetChatPosition();
      chatWindow.style.display = "flex";
      openBtn.style.display = "none";
      addMessage("Hi 👋 I'm the MZU Assistant.", "bot");
      sessionStorage.setItem("mzu_greeted", "1");
    }, 700);
  }
})();
