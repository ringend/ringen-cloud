
const AI_CHAT_JS_VERSION = "1-23-26v01";

const API_ENDPOINT = "https://ai-fd-01-ep2-bcajb8eqfed2epdu.b01.azurefd.net/chat";
const STT_ENDPOINT = "https://ai-fd-ajdgcqhvb4cba7ag.b01.azurefd.net/stt";
const AI_ERROR = "I am so sorry, I am taking a coffee break right now. Please come back later.";

const INITIAL_TIMEOUT_MS = 90000;  // Wait up to XXXms for first token
const STALL_TIMEOUT_MS = 10000;    // If no token arrives for XXXms, abort.

let controller = null;
let mediaRecorder = null;
let audioChunks = [];

console.log("✅ ai-chat.js loaded");
console.log(`📦 ai-chat.js version: ${AI_CHAT_JS_VERSION}`);

// ======================================================
// SESSION ID GENERATION
// ======================================================
function generateSessionId() {
    const now = new Date();
    const pad = (n) => n.toString().padStart(2, "0");

    const datePart = [
        now.getFullYear(),
        pad(now.getMonth() + 1),
        pad(now.getDate())
    ].join("");

    const timePart = [
        pad(now.getHours()),
        pad(now.getMinutes()),
        pad(now.getSeconds())
    ].join("");

    const randomPart = Math.floor(100000 + Math.random() * 900000);

    return `${datePart}-${timePart}-${randomPart}`;
}

let sessionId = localStorage.getItem("session_id");
if (!sessionId) {
    sessionId = generateSessionId();
    localStorage.setItem("session_id", sessionId);
}

console.log(`🆔 Session ID: ${sessionId}`);


// ======================================================
// DOM READY WRAPPER
// ======================================================
document.addEventListener("DOMContentLoaded", () => {

    const messagesDiv = document.getElementById("ai-messages");
    const inputBox = document.getElementById("ai-input");
    const sendBtn = document.getElementById("ai-send");
    const stopBtn = document.getElementById("ai-stop");
    const micBtn = document.getElementById("ai-mic");
    const spinner = document.getElementById("ai-spinner");
    const newBtn = document.getElementById("ai-new");

    // ======================================================
    // UI HELPERS
    // ======================================================
    function addUserBubble(text) {
        const bubble = document.createElement("div");
        bubble.className = "msg user";
        bubble.textContent = text;
        messagesDiv.appendChild(bubble);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    function addAssistantBubble(initialText = "") {
        const bubble = document.createElement("div");
        bubble.className = "msg ai";
        bubble.textContent = initialText;
        messagesDiv.appendChild(bubble);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
        return bubble;
    }

    function appendAssistantTokens(bubble, text) {
        bubble.textContent += text;
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }


    // ======================================================
    // SEND MESSAGE (NO CLIENT-SIDE HISTORY)
    // ======================================================
    async function sendMessage(userMessage) {
        console.log("📤 Message sent:", userMessage);

        addUserBubble(userMessage);
        spinner.style.display = "inline-block";

        controller = new AbortController();
        let assistantBubble = addAssistantBubble("");

        let initialTimeout;
        let stallTimeout;
        let firstTokenReceived = false;

        function startInitialTimer() {
            initialTimeout = setTimeout(() => {
                console.warn("⏳ Initial response timeout");
                controller.abort();
            }, INITIAL_TIMEOUT_MS);
        }

        function resetStallTimer() {
            clearTimeout(stallTimeout);
            stallTimeout = setTimeout(() => {
                console.warn("⏳ Streaming stalled");
                controller.abort();
            }, STALL_TIMEOUT_MS);
        }

        startInitialTimer();

        try {
            const response = await fetch(API_ENDPOINT, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                signal: controller.signal,
                body: JSON.stringify({
                    session_id: sessionId,
                    message: userMessage
                })
            });

            if (!response.ok) {
                assistantBubble.textContent = AI_ERROR;
                spinner.style.display = "none";
                return;
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });

                if (!firstTokenReceived) {
                    firstTokenReceived = true;
                    clearTimeout(initialTimeout);
                    resetStallTimer();
                } else {
                    resetStallTimer();
                }

                appendAssistantTokens(assistantBubble, chunk);
            }

        } catch (err) {
            if (err.name === "AbortError") {
            console.log("🛑 Streaming aborted by user");
             // Do nothing — leave the assistant bubble as-is
            } else {
            console.error("❌ Chat error:", err);
                assistantBubble.textContent = AI_ERROR;
            }
        } finally {
            clearTimeout(initialTimeout);
            clearTimeout(stallTimeout); 
            spinner.style.display = "none";
        }
    }


    // ======================================================
    // EVENT LISTENERS (MATCH YOUR HTML)
    // ======================================================
    sendBtn.addEventListener("click", () => {
        const text = inputBox.value.trim();
        if (text.length > 0) {
            sendMessage(text);
            inputBox.value = "";
        }
    });

    inputBox.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            const text = inputBox.value.trim();
            if (text.length > 0) {
                sendMessage(text);
                inputBox.value = "";
            }
        }
    });

    stopBtn.addEventListener("click", () => {
        if (controller) {
            controller.abort();
            console.log("🛑 Streaming aborted");
        }
    });

    newBtn.addEventListener("click", () => {
    // Generate a new session ID
        sessionId = generateSessionId();
        localStorage.setItem("session_id", sessionId);
        console.log(`🆕 New conversation started. Session ID: ${sessionId}`);

    // Clear chat UI
    messagesDiv.innerHTML = "";
    });


// ======================================================
// SPEECH-TO-TEXT
// ======================================================
micBtn.addEventListener("mousedown", () => {
    console.log("🎤 Hold start");
    startRecording();
});

micBtn.addEventListener("mouseup", () => {
    console.log("🛑 Hold end");
    stopRecording();
});

micBtn.addEventListener("mouseleave", () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
        stopRecording();
    }
});

// Mobile support
micBtn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    console.log("🎤 Touch start");
    startRecording();
});

micBtn.addEventListener("touchend", (e) => {
    e.preventDefault();
    console.log("🛑 Touch end");
    stopRecording();
});

async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);

  audioChunks = [];

  const audioContext = new AudioContext();
  const source = audioContext.createMediaStreamSource(stream);
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;

  source.connect(analyser);

  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  const bar = document.getElementById("ai-visualizer-bar");
  const vis = document.getElementById("ai-visualizer");
  vis.style.display = "block";

  function draw() {
    analyser.getByteFrequencyData(dataArray);
    const volume = Math.max(...dataArray);
    const percent = Math.min(100, (volume / 255) * 100);
    bar.style.width = percent + "%";
    requestAnimationFrame(draw);
  }

  draw();

  mediaRecorder.ondataavailable = event => {
    audioChunks.push(event.data);
  };

  mediaRecorder.onstop = () => {
    const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
    sendAudioToBackendSTT(audioBlob);

  };

  mediaRecorder.start();
  console.log("🎙️ Recording started");
}

function stopRecording() {
  if (mediaRecorder) {
    mediaRecorder.stop();
    console.log("🛑 Recording stopped");
  }
  document.getElementById("ai-visualizer").style.display = "none";
}

async function sendAudioToBackendSTT(audioBlob) {
  console.log("📤 Sending audio to STT backend...");

  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.webm");

  try {
    const response = await fetch(STT_ENDPOINT, {
      method: "POST",
      body: formData
    });

    const result = await response.json();
    console.log("📥 STT response:", result);

    // The STT service returns the transcription in `result.transcript`
    if (result.transcript && result.transcript.trim().length > 0) {
        sendMessage(result.transcript);
    } else {
        console.warn("⚠️ No transcript returned from STT");
    }

  } catch (err) {
    console.error("❌ STT request failed:", err);
  }
}

});
