const AI_CHAT_JS_VERSION = "12-29-25v01";

// === CONFIGURABLE VARIABLES ===
const API_ENDPOINT = "https://ai-fd-ajdgcqhvb4cba7ag.b01.azurefd.net/api/chat";
const LLM_MODEL = "llama3.1:8b";
const AI_ERROR = "I am so sorry, I am taking a coffee break right now.   Please come back later.";

let conversationHistory = [];
let controller = null;
let systemPrompt = "";
let mediaRecorder = null;
let audioChunks = [];

console.log("✅ ai-chat.js loaded");
console.log(`📦 ai-chat.js version: ${AI_CHAT_JS_VERSION}`);
console.log(`📦 Using llm: ${LLM_MODEL}`);

// Load the system prompt on page load
fetch("/ai-prompts/base-prompt.txt")
  .then(res => res.text())
  .then(text => {
    systemPrompt = text.trim();
    console.log("📜 System prompt loaded");
  })
  .catch(err => console.error("❌ Failed to load system prompt:", err));

function showSpinner() {
  document.getElementById("ai-spinner").style.display = "block";
}

function hideSpinner() {
  document.getElementById("ai-spinner").style.display = "none";
}

// === Append chat bubbles ===
function appendMessage(role, text) {
  const container = document.getElementById("ai-messages");

  const div = document.createElement("div");
  div.className = `msg ${role}`;
  div.textContent = text;

  container.appendChild(div);

  container.scrollTo({
    top: container.scrollHeight,
    behavior: "smooth"
  });

  return div; // Return bubble so we can update it during streaming
}

// Function to send to stt
async function sendAudioToServer(audioBlob) {
  const formData = new FormData();
  formData.append("audio", audioBlob, "speech.webm");

  try {
    const response = await fetch("https://ai-fd-ajdgcqhvb4cba7ag.b01.azurefd.net/stt", {
      method: "POST",
      body: formData
    });

    const data = await response.json();

    if (data.transcript) {
      console.log("📝 Transcription:", data.transcript);
      sendToOllama(data.transcript);
    } else {
      console.error("❌ No transcription returned");
    }
  } catch (err) {
    console.error("❌ STT error:", err);
  }
}

async function sendToOllama(prompt) {
  controller = new AbortController();

  // Add user bubble immediately
  appendMessage("user", prompt);

  // Store the user's message in conversation history
  conversationHistory.push({ role: "user", content: prompt });

  // Optional pruning (keeps last 20 messages)
  if (conversationHistory.length > 20) {
    conversationHistory.shift();
  }

  showSpinner();

  let aiBubble = null;

  try {
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          ...conversationHistory,
        ],
        stream: true
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let fullText = "";
    let buffer = "";
    let hasStartedStreaming = false;

    // Create an empty AI bubble to stream into
    aiBubble = appendMessage("ai", "");

    // Smooth update throttle
    let lastUpdate = 0;
    const UPDATE_INTERVAL = 25; // ms (25 FPS)

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      if (!hasStartedStreaming) {
        console.log("💬 AI has started streaming a response...");
        hasStartedStreaming = true;
      }

      const chunk = decoder.decode(value);
      const lines = chunk.trim().split("\n");

      for (const line of lines) {
        if (!line) continue;
        const json = JSON.parse(line);

        if (json.message && json.message.content) {
          buffer += json.message.content; // Add tokens to buffer
        }
      }

      // Smooth update: only update bubble every X ms
      const now = performance.now();
      if (now - lastUpdate > UPDATE_INTERVAL) {
        fullText += buffer;
        buffer = "";
        aiBubble.textContent = fullText;
        lastUpdate = now;

        // Keep conversation scrolling
        const container = document.getElementById("ai-messages");
        container.scrollTo({
          top: container.scrollHeight,
          behavior: "smooth"
        });
      }
    }

    // Flush any remaining buffered text
    if (buffer.length > 0) {
      fullText += buffer;
      aiBubble.textContent = fullText;
    }

    hideSpinner();

    // Store assistant response in memory
    conversationHistory.push({ role: "assistant", content: fullText });

    // Prune again if needed
    if (conversationHistory.length > 20) {
      conversationHistory.shift();
    }

  } catch (err) {
    console.error("❌ AI error:", err);

    // Ignore AbortError from STOP button
    if (err.name === "AbortError") {
      console.log("⛔ Stream stopped by user.");
      return; // Exit silently
    }

    if (aiBubble) {
      aiBubble.className = "msg error";
      aiBubble.textContent = AI_ERROR;
    } else {
      appendMessage("error", AI_ERROR);
    }

  } finally {
    hideSpinner();
  }
}

// STT 
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
    sendAudioToServer(audioBlob);
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

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("ai-send");
  const stopBtn = document.getElementById("ai-stop");
  const input = document.getElementById("ai-input");
  const micBtn = document.getElementById("ai-mic");

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

  if (btn && input) {
    btn.addEventListener("click", () => {
      console.log("✅ Send Button clicked");
      const prompt = input.value.trim();
      if (prompt.length > 0) {
        input.value = "";
        sendToOllama(prompt);
      }
    });
  }

  if (stopBtn) {
    stopBtn.addEventListener("click", () => {
      console.log("🛑 Stop requested");
      if (controller) {
        controller.abort();
        controller = null;
        hideSpinner();
      }
    });
  }
});
