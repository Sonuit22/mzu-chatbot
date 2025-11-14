/* chat.js - connect UI to Render backend, typing animation, draggable, suggested questions */

// ========== CONFIG ==========
const API_URL = "https://mzu-rag-api-tecg.onrender.com/chat"; // <-- your Render API
// If you enable token-based auth later, add Authorization header in fetch (example commented below).

// ========== ELEMENTS ==========
const openBtn = document.getElementById("chatbot-button");
const chatWindow = document.getElementById("chatbot-window");
const closeBtn = document.getElementById("chatbot-close");
const sendBtn = document.getElementById("chatbot-send");
const inputEl = document.getElementById("chatbot-input");
const messagesEl = document.getElementById("chatbot-messages");
const suggestionBtns = document.querySelectorAll(".suggestion-btn");

// ========== OPEN/CLOSE ==========
openBtn.addEventListener("click", () => {
  chatWindow.style.display = "flex";
  openBtn.style.display = "none";
  inputEl.focus();
});
closeBtn.addEventListener("click", () => {
  chatWindow.style.display = "none";
  openBtn.style.display = "flex";
});

// ========== UTIL: add message ==========
function addMessage(text, who="bot", preserve=false){
  const el = document.createElement("div");
  el.className = `message ${who}`;
  if(who === "bot" && !preserve) {
    el.innerText = text;
  } else {
    el.textContent = text;
  }
  messagesEl.appendChild(el);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return el;
}

// ========== Typing bubble ==========
function addTyping(){
  const wrapper = document.createElement("div");
  wrapper.className = "message bot typing";
  wrapper.innerHTML = `<span class="dot"></span><span class="dot"></span><span class="dot"></span>`;
  messagesEl.appendChild(wrapper);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return wrapper;
}
function removeTyping(){
  const last = messagesEl.lastElementChild;
  if(last && last.classList.contains("typing")) last.remove();
}

// ========== SEND LOGIC ==========
async function sendQuery(text){
  // show user text
  addMessage(text, "user");
  inputEl.value = "";

  // typing placeholder
  const typingBubble = addTyping();

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // "Authorization": "Bearer YOUR_API_AUTH_TOKEN" // if you add token in Render env, uncomment and set
      },
      body: JSON.stringify({ query: text })
    });

    if(!res.ok){
      // handle non-200 gracefully
      const txt = await res.text().catch(()=>"");
      removeTyping();
      addMessage(`⚠ Server error (${res.status})`, "bot");
      console.error("Server error:", res.status, txt);
      return;
    }

    const data = await res.json();
    removeTyping();
    addMessage(data.answer || "I don't know the answer to that.", "bot");

  } catch (e) {
    removeTyping();
    addMessage("⚠ Error connecting to server.", "bot");
    console.error("Fetch error:", e);
  }
}

// send from UI
sendBtn.addEventListener("click", () => {
  const text = inputEl.value.trim();
  if(text) sendQuery(text);
});
inputEl.addEventListener("keypress", e => {
  if(e.key === "Enter") {
    const text = inputEl.value.trim();
    if(text) sendQuery(text);
  }
});

// suggestions
suggestionBtns.forEach(b=>{
  b.addEventListener("click", ()=> sendQuery(b.innerText));
});

// ========== Draggable chat window ==========
(function makeDraggable() {
  const handle = document.querySelector(".draggable-handle");
  let dragging = false, startX=0, startY=0, startLeft=0, startTop=0;

  handle.addEventListener("mousedown", (e)=>{
    dragging = true;
    startX = e.clientX; startY = e.clientY;
    const rect = chatWindow.getBoundingClientRect();
    startLeft = rect.left; startTop = rect.top;
    chatWindow.style.transition = "none";
    document.body.style.userSelect = "none";
  });

  document.addEventListener("mousemove", (e)=>{
    if(!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    chatWindow.style.left = (startLeft + dx) + "px";
    chatWindow.style.top = (startTop + dy) + "px";
    chatWindow.style.right = "auto";
    chatWindow.style.bottom = "auto";
  });

  document.addEventListener("mouseup", ()=> {
    if(dragging) {
      dragging = false;
      chatWindow.style.transition = "";
      document.body.style.userSelect = "";
    }
  });

  // touch support
  handle.addEventListener("touchstart", (e)=>{
    dragging = true;
    const t = e.touches[0];
    startX = t.clientX; startY = t.clientY;
    const rect = chatWindow.getBoundingClientRect();
    startLeft = rect.left; startTop = rect.top;
  });
  document.addEventListener("touchmove", (e)=>{
    if(!dragging) return;
    const t = e.touches[0];
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;
    chatWindow.style.left = (startLeft + dx) + "px";
    chatWindow.style.top = (startTop + dy) + "px";
    chatWindow.style.right = "auto";
    chatWindow.style.bottom = "auto";
  });
  document.addEventListener("touchend", ()=> { dragging = false; });
})();

// ========== Small helper: show greeting once ==========
(function greetOnce(){
  const greeted = sessionStorage.getItem("mzu_greeted");
  if(!greeted){
    setTimeout(()=> {
      chatWindow.style.display = "flex";
      openBtn.style.display = "none";
      addMessage("Hi 👋 I'm the MZU Assistant. Ask me anything about Mizoram University.", "bot");
      sessionStorage.setItem("mzu_greeted", "1");
    }, 700);
  }
})();
