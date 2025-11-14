const API_URL = "https://mzu-rag-api-tecg.onrender.com/chat";

// ===== Open / Close chat =====
document.getElementById("chatbot-button").onclick = () => {
    document.getElementById("chatbot-window").style.display = "flex";
};
document.getElementById("chatbot-close").onclick = () => {
    document.getElementById("chatbot-window").style.display = "none";
};

// ===== Messaging UI =====
function addMessage(text, sender) {
    const msgBox = document.getElementById("chatbot-messages");
    const div = document.createElement("div");
    div.className = `message ${sender}`;
    div.textContent = text;
    msgBox.appendChild(div);
    msgBox.scrollTop = msgBox.scrollHeight;
}

// Typing animation
function addTyping() {
    const msgBox = document.getElementById("chatbot-messages");
    const div = document.createElement("div");
    div.className = "message bot typing";
    msgBox.appendChild(div);
    msgBox.scrollTop = msgBox.scrollHeight;
}

// Remove typing bubble
function removeTyping() {
    const msgBox = document.getElementById("chatbot-messages");
    if (msgBox.lastChild && msgBox.lastChild.classList.contains("typing")) {
        msgBox.removeChild(msgBox.lastChild);
    }
}

// ===== Send message logic =====
async function sendMessage(text = null) {
    const input = document.getElementById("chatbot-input");
    if (!text) text = input.value.trim();
    if (!text) return;

    addMessage(text, "user");
    input.value = "";

    addTyping();

    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ query: text })
        });

        const data = await res.json();
        removeTyping();
        addMessage(data.answer || "No answer returned.", "bot");

    } catch (err) {
        removeTyping();
        addMessage("⚠ Server error.", "bot");
    }
}

// Send via button or Enter key
document.getElementById("chatbot-send").onclick = () => sendMessage();
document.getElementById("chatbot-input").addEventListener("keypress", e => {
    if (e.key === "Enter") sendMessage();
});

// ===== Suggested Questions =====
document.querySelectorAll(".suggestion-btn").forEach(btn => {
    btn.onclick = () => sendMessage(btn.innerText);
});

// ===== Make Chat Window Draggable =====
const chatWindow = document.getElementById("chatbot-window");
let isDragging = false, offsetX, offsetY;

chatWindow.addEventListener("mousedown", (e) => {
    isDragging = true;
    offsetX = e.clientX - chatWindow.offsetLeft;
    offsetY = e.clientY - chatWindow.offsetTop;
    chatWindow.style.cursor = "grabbing";
});

document.addEventListener("mousemove", (e) => {
    if (isDragging) {
        chatWindow.style.left = `${e.clientX - offsetX}px`;
        chatWindow.style.top = `${e.clientY - offsetY}px`;
    }
});

document.addEventListener("mouseup", () => {
    isDragging = false;
    chatWindow.style.cursor = "grab";
});
