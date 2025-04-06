<template>
  <div class="app-container"> 
    <header class="header">
      <div class="logo">
        <Sparkles class="logo-icon" />
        <h1>Gemini Writer API</h1>
      </div>
      <div class="info-container">
        <button class="info-button" @mouseenter="showTooltip = true" @mouseleave="showTooltip = false">
          <HelpCircle class="info-icon" />
        </button>
        <div v-if="showTooltip" class="tooltip">
          <p>Este proyecto utiliza la API de Gemini AI. Actualmente cuenta con créditos limitados (50), por lo que podría fallar o no responder si se agotan.</p>
        </div>
      </div>
    </header>

   
    <main class="chat-container"> 
      <div v-if="!conversations.length" class="welcome-message">
        <Sparkles class="welcome-icon" />
        <h2>¿En qué puedo ayudarte hoy?</h2>
        <div class="prompt-suggestions">
          <button class="prompt-button" @click="setPrompt('Dame ejemplos de citas')">
            Dame ejemplos de citas
          </button>
          <button class="prompt-button" @click="setPrompt('Dame un dato interesante sobre ciencia')">
            Dame un dato interesante sobre ciencia
          </button>
        </div>
      </div>
      
      
      <div class="messages-container" ref="messagesContainer">
        <div v-for="(item, index) in conversations" :key="index" class="message-group">
          <div class="user-message">
            <div class="message-content user-content">{{ item.prompt }}</div>
          </div>
          
          <div class="ai-message">
            <div class="message-content ai-content">
              <div v-if="index === conversations.length - 1 && isTyping" class="typing-indicator">
                <span></span><span></span><span></span>
              </div>
              <div v-else>
                <span v-if="index === conversations.length - 1" class="typed-text">{{ typedText }}</span>
                <span v-else>{{ item.response }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    
    <div class="input-area">
      <div class="input-wrapper">
        <div class="gemini-input-container">
          <textarea
            ref="promptInput"
            v-model="prompt"
            placeholder="Escribe un mensaje para Gemini..."
            rows="1"
            @keydown.enter.prevent="onEnterPress"
            class="gemini-input"
          ></textarea>
          <button 
            @click="generateText" 
            :disabled="loading || !prompt.trim()" 
            class="send-button"
            aria-label="Enviar mensaje"
          >
            <Send v-if="!loading" class="send-icon" />
            <Loader2 v-else class="loading-icon spin-icon" />
          </button>
        </div>
        <div class="input-footer">
          <span class="disclaimer">
            <Info class="info-icon" /> Gemini puede ocasionalmente generar información incorrecta
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue';
import axios from 'axios';
import { Sparkles, Send, Loader2, HelpCircle, Info } from 'lucide-vue-next';

// Estados
const prompt = ref('');
const loading = ref(false);
const conversations = ref([]);
const typedText = ref('');
const isTyping = ref(false);
const typingSpeed = 15;
let typingTimer = null;
const messagesContainer = ref(null);
const promptInput = ref(null);
const showTooltip = ref(false);

// Función para establecer prompt rápido
const setPrompt = (text) => {
  prompt.value = text;
  nextTick(() => {
    promptInput.value.focus();
  });
};

// Generar texto cuando se envía el formulario
const generateText = async () => {
  if (!prompt.value.trim() || loading.value) return;
  
  const currentPrompt = prompt.value;
  prompt.value = '';
  loading.value = true;
  isTyping.value = true;
  
  conversations.value.push({
    prompt: currentPrompt,
    response: ''
  });
  
  nextTick(() => {
    adjustTextareaHeight();
    scrollToBottom();
  });
  
  try {
    const response = await axios.post(
      'http://localhost:3000/generate',
      { prompt: currentPrompt }
    );
    
    const responseText = response.data.text;
    conversations.value[conversations.value.length - 1].response = responseText;
    startTypingAnimation(responseText);
  } catch (error) {
    const errorMessage = `Error: ${error.response?.data?.error || error.message}`;
    conversations.value[conversations.value.length - 1].response = errorMessage;
    startTypingAnimation(errorMessage);
  } finally {
    loading.value = false;
  }
};

// Animación de escritura
const startTypingAnimation = (text) => {
  typedText.value = '';
  let charIndex = 0;
  
  clearInterval(typingTimer);
  
  typingTimer = setInterval(() => {
    if (charIndex < text.length) {
      typedText.value += text.charAt(charIndex);
      charIndex++;
      scrollToBottom();
    } else {
      clearInterval(typingTimer);
      isTyping.value = false;
    }
  }, typingSpeed);
};

// Manejar tecla Enter
const onEnterPress = (e) => {
  if (!e.shiftKey) {
    e.preventDefault();
    generateText();
  }
};

// Ajustar altura del textarea automáticamente
const adjustTextareaHeight = () => {
  if (!promptInput.value) return;
  promptInput.value.style.height = 'auto';
  promptInput.value.style.height = `${promptInput.value.scrollHeight}px`;
};

// Scroll al fondo del contenedor de mensajes
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
};

// Inicializar
onMounted(() => {
  adjustTextareaHeight();
  promptInput.value?.focus();
});

// Observar cambios en el prompt
watch(prompt, () => {
  nextTick(() => {
    adjustTextareaHeight();
  });
});
</script>

<style scoped>
/* Variables de color */
:root {
  --primary-color: #4285f4;
  --primary-hover: #3367d6;
  --bg-color: #ffffff;
  --text-color: #202124;
  --border-color: #dadce0;
  --hover-color: #f1f3f4;
  --prompt-bg: #f8f9fa;
  --prompt-hover: #e8eaed;
  --tooltip-bg: #ffffff;
  --tooltip-text: #3c4043;
  --radius-medium: 12px;
  --radius-large: 24px;
  --transition: all 0.2s ease;
}

/* Estilos generales */
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--bg-color);
  color: var(--text-color);
  font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* Header */
.header {
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--bg-color);
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--primary-color);
}

h1 {
  font-size: 1.25rem;
  font-weight: 500;
}

/* Botón de información */
.info-container {
  position: relative;
}

.info-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: var(--transition);
}

.info-button:hover {
  background-color: var(--hover-color);
}

.info-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: #5f6368;
}

.tooltip {
  position: absolute;
  right: 0;
  top: 100%;
  width: 280px;
  padding: 1rem;
  background-color: var(--tooltip-bg);
  border-radius: var(--radius-medium);
  box-shadow: 0 1px 2px 0 rgba(60, 64, 67, 0.3), 0 2px 6px 2px rgba(60, 64, 67, 0.15);
  z-index: 10;
  color: var(--tooltip-text);
  font-size: 0.875rem;
  line-height: 1.5;
}

.tooltip p {
  margin: 0;
}

/* Área de chat */
.chat-container {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  background-color: var(--bg-color);
}

.welcome-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
  text-align: center;
  padding: 1rem;
}

.welcome-icon {
  width: 3rem;
  height: 3rem;
  color: var(--primary-color);
  margin-bottom: 1.5rem;
}

.welcome-message h2 {
  font-size: 1.5rem;
  font-weight: 500;
  margin-bottom: 1.5rem;
}

.prompt-suggestions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.prompt-button {
  padding: 0.75rem 1.5rem;
  background-color: var(--prompt-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-large);
  font-size: 0.9375rem;
  cursor: pointer;
  transition: var(--transition);
}

.prompt-button:hover {
  background-color: var(--prompt-hover);
  border-color: var(--primary-color);
}

/* Mensajes */
.messages-container {
  max-width: 800px;
  width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.message-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.user-message {
  display: flex;
  justify-content: flex-end;
}

.ai-message {
  display: flex;
  justify-content: flex-start;
}

.message-content {
  max-width: 85%;
  padding: 1rem;
  border-radius: var(--radius-medium);
  line-height: 1.6;
  font-size: 0.9375rem;
}

.user-content {
  background-color: var(--prompt-bg);
  border-top-right-radius: 4px;
}

.ai-content {
  background-color: var(--prompt-bg);
  border-top-left-radius: 4px;
}

/* Área de entrada estilo Gemini */
.input-area {
  padding: 1rem;
  background-color: var(--bg-color);
  border-top: 1px solid var(--border-color);
}

.input-wrapper {
  max-width: 800px;
  margin: 0 auto;
}

.gemini-input-container {
  position: relative;
  border-radius: var(--radius-large);
  background-color: var(--bg-color);
  border: 1px solid var(--border-color);
  box-shadow: 0 1px 6px rgba(32, 33, 36, 0.08);
  transition: var(--transition);
}

.gemini-input-container:focus-within {
  box-shadow: 0 1px 6px rgba(32, 33, 36, 0.28);
  border-color: rgba(66, 133, 244, 0.3);
}

.gemini-input {
  width: 100%;
  min-height: 56px;
  max-height: 200px;
  padding: 1rem 3.5rem 1rem 1rem;
  background: transparent;
  border: none;
  color: var(--text-color);
  font-size: 1rem;
  line-height: 1.5;
  resize: none;
  outline: none;
  border-radius: var(--radius-large);
}

.send-button {
  position: absolute;
  right: 0.75rem;
  bottom: 0.75rem;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background-color: #000000;
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: var(--transition);
}

.send-button:hover:not(:disabled) {
  background-color: #333333;
  transform: translateY(-1px);
}

.send-button:disabled {
  background-color: #dadce0;
  cursor: not-allowed;
}

.send-icon, .loading-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.spin-icon {
  animation: spin 1s linear infinite;
}

.input-footer {
  margin-top: 0.75rem;
  text-align: center;
}

.disclaimer {
  font-size: 0.75rem;
  color: #70757a;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.info-icon {
  width: 0.875rem;
  height: 0.875rem;
}

/* Animaciones */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.typing-indicator {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.typing-indicator span {
  display: inline-block;
  width: 0.5rem;
  height: 0.5rem;
  background-color: #5f6368;
  border-radius: 50%;
  animation: typing-dot 1.4s infinite ease-in-out both;
}

.typing-indicator span:nth-child(1) {
  animation-delay: -0.32s;
}

.typing-indicator span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes typing-dot {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

/* Scrollbar */
.messages-container::-webkit-scrollbar {
  width: 6px;
}

.messages-container::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

/* ========== RESPONSIVE DESIGN ========== */

/* Tablets (768px - 1024px) */
@media (max-width: 1024px) {
  .header {
    padding: 0.875rem 1.25rem;
  }

  .welcome-message h2 {
    font-size: 1.375rem;
  }

  .prompt-suggestions {
    flex-wrap: wrap;
    justify-content: center;
    max-width: 500px;
    margin: 0 auto;
  }

  .prompt-button {
    padding: 0.625rem 1.25rem;
    font-size: 0.875rem;
  }

  .message-content {
    max-width: 90%;
    padding: 0.875rem;
    font-size: 0.875rem;
  }

  .gemini-input {
    font-size: 0.9375rem;
    min-height: 52px;
  }
}

/* Teléfonos grandes (576px - 768px) */
@media (max-width: 768px) {
  .header {
    padding: 0.75rem 1rem;
  }

  .logo h1 {
    font-size: 1.125rem;
  }

  .info-icon {
    width: 1.125rem;
    height: 1.125rem;
  }

  .welcome-message {
    height: 50vh;
    padding: 0.5rem;
  }

  .welcome-icon {
    width: 2.5rem;
    height: 2.5rem;
    margin-bottom: 1rem;
  }

  .welcome-message h2 {
    font-size: 1.25rem;
    margin-bottom: 1rem;
  }

  .prompt-suggestions {
    flex-direction: column;
    width: 100%;
    max-width: 300px;
    gap: 0.75rem;
  }

  .prompt-button {
    width: 100%;
    padding: 0.75rem;
  }

  .messages-container {
    gap: 1.25rem;
  }

  .message-group {
    gap: 0.5rem;
  }

  .gemini-input-container {
    border-radius: 20px;
  }

  .gemini-input {
    min-height: 48px;
    padding: 0.75rem 3rem 0.75rem 0.75rem;
    font-size: 0.875rem;
  }

  .send-button {
    width: 2rem;
    height: 2rem;
    right: 0.5rem;
    bottom: 0.5rem;
  }

  .send-icon, .loading-icon {
    width: 1rem;
    height: 1rem;
  }

  .disclaimer {
    font-size: 0.6875rem;
  }

  .tooltip {
    width: 240px;
    right: -50px;
    font-size: 0.8125rem;
    padding: 0.75rem;
  }
}

/* Teléfonos pequeños (hasta 576px) */
@media (max-width: 576px) {
  .header {
    padding: 0.625rem 0.875rem;
  }

  .logo h1 {
    font-size: 1rem;
  }

  .logo-icon {
    width: 1rem;
    height: 1rem;
  }

  .welcome-message {
    height: 55vh;
    padding: 0 0.5rem;
  }

  .welcome-message h2 {
    font-size: 1.125rem;
    padding: 0 1rem;
  }

  .prompt-suggestions {
    max-width: 260px;
  }

  .prompt-button {
    font-size: 0.8125rem;
  }

  .chat-container {
    padding: 0.75rem;
  }

  .message-content {
    max-width: 95%;
    padding: 0.75rem;
    font-size: 0.8125rem;
    line-height: 1.5;
  }

  .gemini-input {
    min-height: 44px;
    padding: 0.625rem 2.75rem 0.625rem 0.625rem;
  }

  .send-button {
    width: 1.75rem;
    height: 1.75rem;
  }

  .input-area {
    padding: 0.75rem;
  }

  .input-footer {
    margin-top: 0.5rem;
  }

  .tooltip {
    width: 200px;
    right: -30px;
    font-size: 0.75rem;
    padding: 0.5rem;
  }
}

/* Pequeños ajustes para pantallas muy pequeñas */
@media (max-width: 400px) {
  .prompt-suggestions {
    max-width: 220px;
  }

  .prompt-button {
    padding: 0.625rem;
  }

  .welcome-message h2 {
    font-size: 1rem;
  }

  .gemini-input {
    font-size: 0.8125rem;
  }
}

/* Orientación horizontal en móviles */
@media (max-height: 500px) and (orientation: landscape) {
  .welcome-message {
    height: 40vh;
    padding-top: 1rem;
  }

  .prompt-suggestions {
    flex-direction: row;
    flex-wrap: wrap;
    max-width: 350px;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .prompt-button {
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
  }

  .input-area {
    padding: 0.5rem;
  }
}

/* Tablets en modo retrato */
@media (min-width: 768px) and (max-width: 1024px) and (orientation: portrait) {
  .welcome-message {
    height: 50vh;
  }

  .prompt-suggestions {
    max-width: 450px;
  }
}
</style>