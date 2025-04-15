// Global variables
let lang = localStorage.getItem('lang') || 'en';
let theme = localStorage.getItem('theme') || 'light';
let recognition;
let isRecognizing = false;
let transcript = '';
let timer;
let isAutoTranslateEnabled = localStorage.getItem('autoTranslate') === 'true' || false;
let isSpeakEnabled = localStorage.getItem('speakEnabled') === 'true' || false;

// Add backend API URL
const API_URL = 'http://localhost:5001';
const CHAT_ENDPOINT = 'http://localhost:5001/api/chat';
let isBackendAvailable = true;

// DOM elements
const themeSelect = document.getElementById('theme-toggle');
const languageSelect = document.getElementById('lang-toggle');
const micBtn = document.getElementById('voice-btn');
const sendBtn = document.getElementById('send-btn');
const messageInput = document.getElementById('user-input');
const chatContainer = document.getElementById('chat-box');
const voiceStatus = document.getElementById('voice-status') || document.createElement('div');
if (!document.getElementById('voice-status')) {
    voiceStatus.id = 'voice-status';
    voiceStatus.style.display = 'none';
    document.body.appendChild(voiceStatus);
}

const voiceDetected = document.createElement('div');
voiceDetected.className = 'voice-detected';
document.body.appendChild(voiceDetected);

// Initialize the app
function initApp() {
    console.log('Initializing app with theme:', theme, 'language:', lang);
    
    // Set initial language and theme
    updateLanguage(lang);
    updateTheme(theme);
    
    // Start checking backend availability
    startBackendAvailabilityCheck();
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize speech recognition
    setupSpeechRecognition();
    
    // Initialize speech synthesis
    setupSpeechSynthesis();
    
    // Initialize toolbar buttons
    setupToolbarButtons();
    
    // Update feature indicators
    updateFeatureIndicators();
    
    // Fix any initial night theme issues
    if (theme === 'night') {
        document.body.setAttribute('data-theme', 'night');
        document.querySelectorAll('#theme-menu .dropdown-item').forEach(item => {
            if (item.getAttribute('data-theme') === 'night') {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }
}

// Set up event listeners
function setupEventListeners() {
    // Theme selection
    document.querySelectorAll('#theme-menu .dropdown-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            theme = e.currentTarget.getAttribute('data-theme');
            localStorage.setItem('theme', theme);
            updateTheme(theme);
            document.querySelector('.theme-dropdown').classList.remove('active');
        });
    });
    
    // Theme dropdown toggle
    themeSelect.addEventListener('click', (e) => {
        e.stopPropagation();
        const themeDropdown = document.querySelector('.theme-dropdown');
        const langDropdown = document.querySelector('.lang-dropdown');
        
        // Close language dropdown if open
        langDropdown.classList.remove('active');
        
        // Toggle theme dropdown
        themeDropdown.classList.toggle('active');
    });
    
    // Language selection
    document.querySelectorAll('#lang-menu .dropdown-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const previousLang = lang;
            lang = e.currentTarget.getAttribute('data-lang');
            localStorage.setItem('lang', lang);
            updateLanguage(lang);
            document.querySelector('.lang-dropdown').classList.remove('active');
            
            if (previousLang !== lang) {
                translateChatHistory(previousLang, lang);
            }
        });
    });
    
    languageSelect.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelector('.lang-dropdown').classList.toggle('active');
        document.querySelector('.theme-dropdown').classList.remove('active');
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', () => {
        document.querySelector('.theme-dropdown').classList.remove('active');
        document.querySelector('.lang-dropdown').classList.remove('active');
    });
    
    // Microphone button
    micBtn.addEventListener('click', toggleVoiceInput);
    
    // Send button
    sendBtn.addEventListener('click', sendMessage);
    
    // Enter key to send message
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Modal event listeners
    document.getElementById('about-link')?.addEventListener('click', (e) => {
        e.preventDefault();
        showModal('About AI Assistant', getAboutContent());
    });
    
    document.getElementById('help-link')?.addEventListener('click', (e) => {
        e.preventDefault();
        showModal('Help & Tips', getHelpContent());
    });
    
    document.getElementById('close-modal')?.addEventListener('click', () => {
        document.getElementById('info-modal').classList.remove('active');
    });
}

// Update the language
function updateLanguage(language) {
    document.documentElement.lang = language;
    document.documentElement.dir = (language === 'ar' || language === 'ur') ? 'rtl' : 'ltr';
    document.title = languages[language].title;
    document.querySelector('.chat-header h2').textContent = languages[language].title;
    document.querySelector('.status-text').textContent = languages[language].online;
    messageInput.placeholder = languages[language].placeholder;
    
    // Update language toggle button
    document.querySelector('.current-lang').textContent = language.toUpperCase();
    
    // Update toolbar button tooltips
    if (document.getElementById('clear-chat-btn')) {
        document.getElementById('clear-chat-btn').querySelector('.tooltip').textContent = 
            language === 'en' ? 'Clear chat' : 
            language === 'ar' ? 'مسح المحادثة' : 
            language === 'ur' ? 'چیٹ صاف کریں' : 'Clear chat';
    }
    
    if (document.getElementById('export-chat-btn')) {
        document.getElementById('export-chat-btn').querySelector('.tooltip').textContent = 
            language === 'en' ? 'Export chat' : 
            language === 'ar' ? 'تصدير المحادثة' : 
            language === 'ur' ? 'چیٹ ایکسپورٹ کریں' : 'Export chat';
    }
    
    if (document.getElementById('auto-translate-btn')) {
        document.getElementById('auto-translate-btn').querySelector('.tooltip').textContent = 
            language === 'en' ? 'Auto translate' : 
            language === 'ar' ? 'ترجمة تلقائية' : 
            language === 'ur' ? 'آٹو ٹرانسلیٹ' : 'Auto translate';
    }
    
    // Update speak button tooltip if it exists
    if (document.getElementById('speak-btn')) {
        document.getElementById('speak-btn').querySelector('.tooltip').textContent = 
            languages[language].speakMessages || 'Speak messages';
    }
    
    // Update feature indicators
    updateFeatureIndicators();
}

// Update the theme
function updateTheme(selectedTheme) {
    console.log('Updating theme to:', selectedTheme);
    
    // First, apply the correct theme class to both body and html elements
    document.body.classList.remove('light', 'night', 'desert', 'emerald', 'azure', 'ramadan', 'calligraphy');
    document.body.classList.add(selectedTheme);
    
    // Set data-theme attribute on both body and html
    document.body.setAttribute('data-theme', selectedTheme);
    document.documentElement.setAttribute('data-theme', selectedTheme);
    
    // Update the theme toggle display
    document.querySelector('.current-theme').textContent = 
        selectedTheme.charAt(0).toUpperCase() + selectedTheme.slice(1);
    
    // Update active state in dropdown
    document.querySelectorAll('#theme-menu .dropdown-item').forEach(item => {
        if (item.getAttribute('data-theme') === selectedTheme) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // Force repaint by getting and setting CSS variables
    const computedStyle = getComputedStyle(document.documentElement);
    const bgColor = computedStyle.getPropertyValue(`--bg-color`).trim();
    const secondaryGradient = computedStyle.getPropertyValue(`--secondary-gradient`).trim();
    
    document.body.style.backgroundColor = bgColor;
    document.body.style.background = secondaryGradient;
    
    // Log for debugging
    console.log('Theme updated:', selectedTheme, 'Background:', secondaryGradient);
}

// Initialize speech recognition
function setupSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = lang;
        
        // When recognition returns a result
        recognition.onresult = function(event) {
            let interimTranscript = '';
            let finalTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            
            transcript = finalTranscript || interimTranscript;
            messageInput.value = transcript;
            
            // If we have a final transcript and it ends with a period or question mark, send it
            if (finalTranscript && (finalTranscript.endsWith('.') || finalTranscript.endsWith('?') || finalTranscript.endsWith('!'))) {
                // Wait a bit to allow user to see the transcript before sending
                setTimeout(() => {
                    sendMessage();
                    transcript = '';
                }, 500);
            }
        };
        
        // Handle when recognition starts
        recognition.onstart = function() {
            isRecognizing = true;
            micBtn.classList.add('active');
            document.getElementById('voice-detection-active').style.display = 'flex';
            
            // Display visual feedback
            const pulsingDot = document.createElement('div');
            pulsingDot.className = 'pulsing-dot';
            micBtn.appendChild(pulsingDot);
        };
        
        // Handle when recognition ends
        recognition.onend = function() {
            isRecognizing = false;
            micBtn.classList.remove('active');
            document.getElementById('voice-detection-active').style.display = 'none';
            
            // Remove visual feedback
            const pulsingDot = micBtn.querySelector('.pulsing-dot');
            if (pulsingDot) {
                micBtn.removeChild(pulsingDot);
            }
            
            // If there's text in the input and we just stopped recording, send the message
            if (messageInput.value.trim()) {
                sendMessage();
            }
        };
        
        // Handle errors
        recognition.onerror = function(event) {
            console.error('Speech recognition error', event.error);
            
            // Show user-friendly error
            if (event.error === 'not-allowed') {
                createMessage(languages[lang].microphoneBlocked || "Microphone access was blocked. Please allow microphone access to use voice input.", 'bot', false);
            }
            
            isRecognizing = false;
            micBtn.classList.remove('active');
            document.getElementById('voice-detection-active').style.display = 'none';
        };
    } else {
        // Hide voice input button if not supported
        micBtn.style.display = 'none';
        document.getElementById('voice-detection-active').style.display = 'none';
    }
}

// Initialize speech synthesis
function setupSpeechSynthesis() {
    // Check if browser supports speech synthesis
    if ('speechSynthesis' in window) {
        // Ready to go
        console.log('Speech synthesis supported');
        
        // Add speak button to toolbar if it doesn't exist
        if (!document.getElementById('speak-btn')) {
            const chatToolbar = document.querySelector('.chat-toolbar');
            if (chatToolbar) {
                const speakBtn = document.createElement('button');
                speakBtn.id = 'speak-btn';
                speakBtn.className = 'toolbar-btn';
                speakBtn.innerHTML = `
                    <i class="fas fa-volume-up"></i>
                    <span class="tooltip">${languages[lang].speakMessages || 'Speak messages'}</span>
                `;
                if (isSpeakEnabled) {
                    speakBtn.classList.add('active');
                }
                speakBtn.addEventListener('click', toggleSpeakMessages);
                chatToolbar.appendChild(speakBtn);
            }
        } else {
            // Update tooltip if button already exists
            const tooltip = document.querySelector('#speak-btn .tooltip');
            if (tooltip) {
                tooltip.textContent = languages[lang].speakMessages || 'Speak messages';
            }
        }
    } else {
        console.warn('Speech synthesis not supported');
    }
}

// Toggle text-to-speech functionality
function toggleSpeakMessages() {
    if (!('speechSynthesis' in window)) return;
    
    const speakBtn = document.getElementById('speak-btn');
    isSpeakEnabled = !isSpeakEnabled;
    localStorage.setItem('speakEnabled', isSpeakEnabled);
    
    if (isSpeakEnabled) {
        speakBtn.classList.add('active');
    } else {
        speakBtn.classList.remove('active');
        window.speechSynthesis.cancel(); // Stop any ongoing speech
    }
    
    // Update feature indicators
    updateFeatureIndicators();
}

// Speak text using the appropriate language
function speakText(text, langCode) {
    if (!('speechSynthesis' in window) || !isSpeakEnabled) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    // Create speech utterance
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Map our language codes to BCP 47 language tags for speech synthesis
    const langMap = {
        'en': 'en-US',
        'es': 'es-ES',
        'fr': 'fr-FR',
        'de': 'de-DE',
        'zh': 'zh-CN',
        'ja': 'ja-JP',
        'hi': 'hi-IN',
        'ru': 'ru-RU',
        'pt': 'pt-BR',
        'tr': 'tr-TR',
        'it': 'it-IT',
        'ar': 'ar-SA',
        'ur': 'ur-PK'
    };
    
    // Set language
    utterance.lang = langMap[langCode] || langCode;
    
    // Adjust speech parameters
    utterance.rate = 1.0; // Normal speed
    utterance.pitch = 1.0; // Normal pitch
    utterance.volume = 1.0; // Full volume
    
    // Speak the text
    window.speechSynthesis.speak(utterance);
}

// Initialize toolbar buttons
function setupToolbarButtons() {
    // Clear chat button
    const clearChatBtn = document.getElementById('clear-chat-btn');
    if (clearChatBtn) {
        clearChatBtn.addEventListener('click', clearChat);
    }
    
    // Export chat button
    const exportChatBtn = document.getElementById('export-chat-btn');
    if (exportChatBtn) {
        exportChatBtn.addEventListener('click', () => {
            const messages = document.querySelectorAll('.message');
            let chatText = '';
            
            messages.forEach(message => {
                const sender = message.classList.contains('user-message') ? 'User' : 'AI';
                chatText += `${sender}: ${message.textContent}\n\n`;
            });
            
            const blob = new Blob([chatText], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `chat_export_${new Date().toISOString().slice(0, 10)}.txt`;
            a.click();
            URL.revokeObjectURL(url);
        });
    }
    
    // Auto translate button
    const autoTranslateBtn = document.getElementById('auto-translate-btn');
    if (autoTranslateBtn) {
        // Set initial state
        if (isAutoTranslateEnabled) {
            autoTranslateBtn.classList.add('active');
        }
        
        autoTranslateBtn.addEventListener('click', () => {
            isAutoTranslateEnabled = !isAutoTranslateEnabled;
            localStorage.setItem('autoTranslate', isAutoTranslateEnabled);
            
            if (isAutoTranslateEnabled) {
                autoTranslateBtn.classList.add('active');
            } else {
                autoTranslateBtn.classList.remove('active');
            }
            
            // Update feature indicators
            updateFeatureIndicators();
        });
    }
    
    // Update feature indicators based on speak status
    updateFeatureIndicators();
}

// Update feature indicators
function updateFeatureIndicators() {
    const translationActiveIndicator = document.getElementById('translation-active');
    if (translationActiveIndicator) {
        if (isAutoTranslateEnabled) {
            translationActiveIndicator.style.display = 'flex';
            translationActiveIndicator.querySelector('span').textContent = 
                lang === 'en' ? 'Auto-translation active' : 
                lang === 'ar' ? 'الترجمة التلقائية نشطة' : 
                lang === 'ur' ? 'آٹو ٹرانسلیشن فعال ہے' : 'Auto-translation active';
        } else {
            translationActiveIndicator.style.display = 'none';
        }
    }
    
    // Update speak indicator
    const speakActiveIndicator = document.getElementById('speak-active');
    if (speakActiveIndicator) {
        if (isSpeakEnabled) {
            speakActiveIndicator.style.display = 'flex';
            speakActiveIndicator.querySelector('span').textContent = languages[lang].textToSpeechActive || 'Text-to-speech active';
        } else {
            speakActiveIndicator.style.display = 'none';
        }
    } else if (isSpeakEnabled) {
        // Create indicator if it doesn't exist
        const featureIndicators = document.querySelector('.feature-indicators');
        if (featureIndicators) {
            const indicator = document.createElement('div');
            indicator.id = 'speak-active';
            indicator.className = 'feature-indicator';
            indicator.innerHTML = `
                <i class="fas fa-volume-up"></i>
                <span>${languages[lang].textToSpeechActive || 'Text-to-speech active'}</span>
            `;
            featureIndicators.appendChild(indicator);
        }
    }
}

// Toggle voice input
function toggleVoiceInput() {
    if (!recognition) return;
    
    if (isRecognizing) {
        recognition.stop();
    } else {
        messageInput.value = '';
        transcript = '';
        recognition.lang = lang;
        recognition.start();
    }
}

// Show detected language notification
function showDetectedLanguage(detectedLang) {
    // Get the language name for display
    const langNames = {
        en: 'English',
        ur: 'Urdu',
        ar: 'Arabic',
        zh: 'Chinese',
        ja: 'Japanese',
        hi: 'Hindi',
        ru: 'Russian',
        pt: 'Portuguese',
        tr: 'Turkish',
        it: 'Italian',
        es: 'Spanish',
        fr: 'French',
        de: 'German'
    };
    
    const langName = langNames[detectedLang] || detectedLang;
    
    // Create and show the notification
    voiceDetected.textContent = `${languages[lang].detected}: ${langName}`;
    voiceDetected.classList.add('show');
    
    // Clear any existing timers
    clearTimeout(timer);
    
    // Set a timer to hide the notification
    timer = setTimeout(() => {
        voiceDetected.classList.remove('show');
    }, 3000);
}

// Send message to backend with fallback
function sendMessageToBackend(message) {
    if (!isBackendAvailable) {
        // Use local fallback if backend is unavailable
        generateLocalBotResponse(message);
        return;
    }
    
    // Show typing indicator
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.style.display = 'flex';
    }
    
    console.log("Sending message to:", CHAT_ENDPOINT);
    
    // Try to send to backend
    fetch(CHAT_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Session-ID': 'frontend-session-1'
        },
        body: JSON.stringify({
            message: message
        })
    })
    .then(response => {
        console.log("Response status:", response.status);
        if (!response.ok) {
            throw new Error(`Backend error: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        // Hide typing indicator
        if (typingIndicator) {
            typingIndicator.style.display = 'none';
        }
        
        // Display the bot's response
        console.log("Received data:", data);
        if (data.response) {
            createMessage(data.response, 'bot', false);
        } else {
            throw new Error('No response received from backend');
        }
        
        // Update connection status
        setConnectionStatus(true);
    })
    .catch(error => {
        console.error('Backend error:', error);
        
        // Hide typing indicator
        if (typingIndicator) {
            typingIndicator.style.display = 'none';
        }
        
        // Fallback to local response
        generateLocalBotResponse(message);
        
        // Update connection status
        setConnectionStatus(false);
    });
}

// Update connection status display
function setConnectionStatus(isConnected) {
    const connectionStatus = document.getElementById('connection-status');
    if (!connectionStatus) return;
    
    if (isConnected) {
        connectionStatus.innerHTML = '<i class="fas fa-wifi"></i><span>Connected</span>';
        connectionStatus.classList.remove('disconnected');
        isBackendAvailable = true;
    } else {
        connectionStatus.innerHTML = '<i class="fas fa-wifi-slash"></i><span>Offline</span>';
        connectionStatus.classList.add('disconnected');
        isBackendAvailable = false;
    }
}

// Load chat history from backend with fallback
function loadChatHistory() {
    fetch(`${API_URL}/chat`)
    .then(response => {
        if (!response.ok) {
            throw new Error('Backend error');
        }
        return response.json();
    })
    .then(data => {
        // Only clear and repopulate if we got a valid response
        if (Array.isArray(data) && data.length > 0) {
            // Clear current chat display
            chatContainer.innerHTML = '';
            
            // Add each message to the UI
            data.forEach(msg => {
                createMessage(msg.text, msg.sender, false); // Don't save to backend
            });
        } else {
            // If empty history, create welcome message
            createMessage(languages[lang].welcome, 'bot', false);
        }
    })
    .catch(error => {
        console.error('Error loading chat history:', error);
        // Set backend as unavailable for future requests
        isBackendAvailable = false;
        // Create welcome message as fallback
        createMessage(languages[lang].welcome, 'bot', false);
    });
}

// Send message (updated to handle hybrid approach)
function sendMessage() {
    const message = messageInput.value.trim();
    
    if (message) {
        // Create user message and show in UI
        createMessage(message, 'user', isBackendAvailable);
        
        // Clear input
        messageInput.value = '';
        
        // If backend is not available, generate response locally
        if (!isBackendAvailable) {
            generateLocalBotResponse(message);
        }
        // Otherwise, the response will come from the backend via sendMessageToBackend
    }
}

// Create message element with option to skip backend saving
function createMessage(text, sender, saveToBackend = true) {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${sender}-message`;
    
    // Format markdown text with proper HTML formatting
    if (sender === 'bot') {
        // Convert markdown headings and formatting to HTML
        let formattedText = text
            // Convert ** bold ** to <strong>
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            // Preserve line breaks
            .replace(/\n/g, '<br>');
            
        // Fix numbered lists with proper regex to avoid double numbering
        // Correctly handle the case of "1. 1." at the beginning of a line
        formattedText = formattedText.replace(/(\d+\.\s*)?(\d+)\.\s(.+)(<br>|$)/g, function(match, prefix, num, content) {
            // If we have something like "1. 1." at the start, just use the second number
            if (prefix) {
                return `<li value="${num}">${content}</li>`;
            } else {
                return `<li value="${num}">${content}</li>`;
            }
        });
        
        if (formattedText.includes('<li')) {
            formattedText = '<ol>' + formattedText.replace(/<br><li/g, '<li') + '</ol>';
        }
        
        messageElement.innerHTML = formattedText;
    } else {
        messageElement.textContent = text;
    }
    
    // Add translation prefix if it's a translated message
    if (text.startsWith(languages[lang].translatedPrefix)) {
        messageElement.classList.add('translated-message');
    }
    
    // Add speak button to messages if speech synthesis is enabled
    if ('speechSynthesis' in window) {
        const speakMessageBtn = document.createElement('button');
        speakMessageBtn.className = 'speak-message-btn';
        speakMessageBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
        speakMessageBtn.title = languages[lang].speakText || 'Speak this text';
        speakMessageBtn.addEventListener('click', function() {
            // Add speaking visual feedback
            this.classList.add('speaking');
            messageElement.classList.add('speaking');
            
            // Speak the text (use textContent to avoid speaking HTML tags)
            const textToSpeak = sender === 'bot' ? messageElement.textContent : text;
            speakText(textToSpeak, lang);
            
            // Remove speaking classes after speech completes
            const utterance = new SpeechSynthesisUtterance(textToSpeak);
            utterance.onend = () => {
                speakMessageBtn.classList.remove('speaking');
                messageElement.classList.remove('speaking');
            };
            
            // Fallback in case the end event doesn't fire
            setTimeout(() => {
                speakMessageBtn.classList.remove('speaking');
                messageElement.classList.remove('speaking');
            }, text.length * 90); // Rough estimate of speech duration
        });
        messageElement.appendChild(speakMessageBtn);
    }
    
    // Add offline indicator if backend is unavailable
    if (!isBackendAvailable && sender === 'bot') {
        const offlineIndicator = document.createElement('span');
        offlineIndicator.className = 'offline-indicator';
        offlineIndicator.innerHTML = '<i class="fas fa-cloud-slash"></i>';
        offlineIndicator.title = 'Generated offline';
        messageElement.appendChild(offlineIndicator);
    }
    
    chatContainer.appendChild(messageElement);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    // Speak bot messages automatically if enabled
    if (sender === 'bot' && isSpeakEnabled) {
        speakText(text, lang);
    }
    
    // Save message to backend if it's a user message and we should save
    if (sender === 'user' && saveToBackend && isBackendAvailable) {
        sendMessageToBackend(text);
    }
}

// Clear chat history (both locally and on the server)
function clearChat() {
    // Clear UI
    chatContainer.innerHTML = '';
    
    // If backend is available, clear server history too
    if (isBackendAvailable) {
        fetch(CHAT_ENDPOINT, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            console.log('Chat history cleared:', data);
            // Add welcome message back
            createMessage(languages[lang].welcome, 'bot', false);
        })
        .catch(error => {
            console.error('Error clearing chat history:', error);
            isBackendAvailable = false;
            // Add welcome message back
            createMessage(languages[lang].welcome, 'bot', false);
        });
    } else {
        // Add welcome message back even if backend is unavailable
        createMessage(languages[lang].welcome, 'bot', false);
    }
}

// Translate all chat messages when language is changed
async function translateChatHistory(fromLang, toLang) {
    // Show translation status
    showTranslationStatus(toLang);
    
    // Get all messages
    const messages = document.querySelectorAll('.message');
    const totalMessages = messages.length;
    let completedTranslations = 0;
    
    try {
        // Process messages sequentially for more reliable translations
        for (let i = 0; i < messages.length; i++) {
            const message = messages[i];
            const isUserMessage = message.classList.contains('user-message');
            const sender = isUserMessage ? 'user' : 'bot';
            
            // Skip already translated messages and handle special cases
            if (!isUserMessage && message.textContent === languages[fromLang]?.welcome) {
                message.textContent = languages[toLang]?.welcome || message.textContent;
                completedTranslations++;
                updateTranslationProgress(completedTranslations, totalMessages);
                continue;
            }
            
            // Skip system messages or already translated messages
            if (message.classList.contains('system-message') || 
                message.textContent.startsWith(languages[fromLang]?.translatedPrefix || '')) {
                completedTranslations++;
                updateTranslationProgress(completedTranslations, totalMessages);
                continue;
            }
            
            // Get text content to translate (for bot messages, get innerText to preserve formatting)
            const textToTranslate = sender === 'bot' ? 
                message.innerText || message.textContent : 
                message.textContent;
            
            // Add a small animation to show translation in progress
            message.classList.add('translating');
            
            try {
                // Translate the message
                const translatedText = await translateMessage(textToTranslate, fromLang, toLang);
                
                // Add translation prefix
                const prefix = languages[toLang]?.translatedPrefix || 'Translated: ';
                
                if (sender === 'bot') {
                    // For bot messages, we need to preserve HTML formatting
                    // First, save any special elements in the message
                    const specialElements = message.querySelectorAll('button, .offline-indicator');
                    
                    // Set the translated text
                    message.innerHTML = prefix + translatedText;
                    
                    // Re-add any special elements
                    specialElements.forEach(el => message.appendChild(el));
                } else {
                    // For user messages, just set text
                    message.textContent = prefix + translatedText;
                }
                
                // Add translated class for styling
                message.classList.add('translated-message');
            } catch (error) {
                console.error('Error translating message:', error);
                // Add error indicator
                message.classList.add('translation-error');
            }
            
            // Remove translation animation
            message.classList.remove('translating');
            
            // Update progress
            completedTranslations++;
            updateTranslationProgress(completedTranslations, totalMessages);
            
            // Add a small delay between translations to avoid rate limiting
            if (i < messages.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        }
    } finally {
        // Hide translation status when done
        hideTranslationStatus();
    }
}

// Update translation progress
function updateTranslationProgress(completed, total) {
    const statusElement = document.getElementById('translation-status');
    if (statusElement) {
        const percent = Math.round((completed / total) * 100);
        statusElement.innerHTML = `<div class="progress-bar"><div class="progress" style="width: ${percent}%"></div></div>${languages[lang].translatingAll} (${completed}/${total})`;
    }
}

// Show translation status for all messages
function showTranslationStatus(toLang) {
    // Create status element if it doesn't exist
    if (!document.getElementById('translation-status')) {
        const statusElement = document.createElement('div');
        statusElement.id = 'translation-status';
        statusElement.className = 'translation-status';
        document.body.appendChild(statusElement);
    }
    
    const statusElement = document.getElementById('translation-status');
    statusElement.textContent = languages[toLang].translatingAll;
    statusElement.classList.add('visible');
}

// Hide translation status
function hideTranslationStatus() {
    const statusElement = document.getElementById('translation-status');
    if (statusElement) {
        statusElement.classList.remove('visible');
        setTimeout(() => {
            statusElement.remove();
        }, 500);
    }
}

// Simulate translation (in a real app, use a translation API)
async function translateMessage(text, fromLang, toLang) {
    if (fromLang === toLang) return text;
    
    // Check if it's the welcome message
    if (text === languages[fromLang]?.welcome) {
        return languages[toLang]?.welcome || text;
    }
    
    try {
        // Use a free translation API
        const apiUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${fromLang}|${toLang}`;
        
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        if (data && data.responseData && data.responseData.translatedText) {
            return data.responseData.translatedText;
        } else {
            console.error('Translation API error:', data);
            // Fallback to original text with indicator
            return text + ' [→ ' + toLang + ']';
        }
    } catch (error) {
        console.error('Translation failed:', error);
        // Fallback to original text with indicator
        return text + ' [→ ' + toLang + ']';
    }
}

// Show modal with content
function showModal(title, content) {
    const modal = document.getElementById('info-modal');
    if (!modal) return;
    
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = content;
    modal.classList.add('active');
}

// Get about content
function getAboutContent() {
    return `
        <p>AI Assistant is a multilingual chat application that supports 13 languages with automatic language detection and translation capabilities.</p>
        <p>Features include:</p>
        <ul>
            <li>Multiple language support</li>
            <li>Voice input with language detection</li>
            <li>Auto-translation between languages</li>
            <li>Multiple visual themes</li>
            <li>Right-to-left language support</li>
        </ul>
        <p>Version 1.2.0</p>
    `;
}

// Get help content
function getHelpContent() {
    return `
        <h4>Getting Started</h4>
        <p>Just type your message in the input field and press Enter or click the Send button.</p>
        
        <h4>Voice Input</h4>
        <p>Click the microphone icon to use voice input. Speak clearly and the app will detect your language automatically.</p>
        
        <h4>Changing Language</h4>
        <p>Click the language selector in the top right to change the interface language.</p>
        
        <h4>Changing Theme</h4>
        <p>Click the theme selector in the top right to change the visual theme.</p>
        
        <h4>Auto-Translation</h4>
        <p>Enable auto-translation to automatically translate messages between languages.</p>
    `;
}

// Function to check if backend is available
function checkBackendAvailability() {
    return fetch(`${API_URL}/chat`)
        .then(response => {
            return response.ok;
        })
        .catch(error => {
            console.log('Backend unavailable:', error);
            return false;
        })
        .finally(() => {
            updateConnectionStatus();
        });
}

// Update connection status indicator
function updateConnectionStatus() {
    const statusElement = document.getElementById('connection-status');
    if (!statusElement) return;
    
    if (isBackendAvailable) {
        statusElement.classList.remove('offline');
        statusElement.innerHTML = '<i class="fas fa-wifi"></i><span>Connected</span>';
    } else {
        statusElement.classList.add('offline');
        statusElement.innerHTML = '<i class="fas fa-cloud-slash"></i><span>Offline</span>';
    }
}

// Start checking backend availability
function startBackendAvailabilityCheck() {
    // Check immediately
    checkBackendAvailability()
        .then(available => {
            isBackendAvailable = available;
            console.log('Backend available:', isBackendAvailable);
            
            if (isBackendAvailable) {
                // Load chat history from backend if available
                loadChatHistory();
            } else {
                // Create welcome message if backend is not available
                createMessage(languages[lang].welcome, 'bot', false);
            }
        });
    
    // Then check every 30 seconds
    setInterval(() => {
        checkBackendAvailability().then(available => {
            // If backend just became available and wasn't before
            if (available && !isBackendAvailable) {
                isBackendAvailable = true;
                console.log('Backend connection restored');
                
                // Optionally reload chat history when backend becomes available again
                // Uncomment the following line if you want to reload history when backend reconnects
                // loadChatHistory();
            } else if (!available && isBackendAvailable) {
                isBackendAvailable = false;
                console.log('Backend connection lost');
            } else {
                isBackendAvailable = available;
            }
        });
    }, 30000);
}

// Generate a local bot response when backend is unavailable
function generateLocalBotResponse(message) {
    // Local fallback logic similar to backend's generateBotResponse
    const lowerMessage = message.toLowerCase();
    let botResponse = '';
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
        botResponse = "Hello! How can I help you today?";
    } else if (lowerMessage.includes('how are you')) {
        botResponse = "I'm doing well, thank you for asking! How can I assist you?";
    } else if (lowerMessage.includes('help')) {
        botResponse = "I'd be happy to help! You can ask me about this AI assistant, its features, or how to use it.";
    } else if (lowerMessage.includes('feature') || lowerMessage.includes('can you do')) {
        botResponse = "This AI assistant supports multiple languages, voice input, text-to-speech, and various themes. What would you like to know more about?";
    } else if (lowerMessage.includes('language') || lowerMessage.includes('translate')) {
        botResponse = "I support 13 languages including English, Spanish, French, German, Chinese, Japanese, Hindi, Russian, Portuguese, Turkish, Italian, Arabic, and Urdu. You can change the language using the language dropdown.";
    } else if (lowerMessage.includes('theme') || lowerMessage.includes('color') || lowerMessage.includes('dark mode')) {
        botResponse = "You can choose from 7 different themes: Light, Night, Desert, Emerald, Azure, Ramadan, and Calligraphy. Just click the theme button in the toolbar to change it.";
    } else if (lowerMessage.includes('voice') || lowerMessage.includes('speak') || lowerMessage.includes('talk')) {
        botResponse = "You can use voice input by clicking the microphone button. I can also read messages aloud if you enable the text-to-speech feature by clicking the speaker button.";
    } else {
        botResponse = "I'm currently running in offline mode, but I understand your message. Is there anything specific you'd like to know about this AI assistant?";
    }
    
    // Add a slight delay to simulate processing time
    setTimeout(() => {
        createMessage(botResponse, 'bot', false);
    }, 500);
}

// Check with backend to see if a newer version is available
function checkForUpdates() {
    if (!isBackendAvailable) return false;
    
    return fetch(CHAT_ENDPOINT)
        .then(response => response.json())
        .then(data => {
            if (data.version && data.version !== APP_VERSION) {
                console.log(`New version available: ${data.version}`);
                return true;
            }
            return false;
        })
        .catch(() => {
            console.log('Could not check for updates');
            return false;
        });
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);