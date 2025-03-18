function sendMessage() {
    const userInput = document.getElementById('user-input');
    const chatBox = document.getElementById('chat-box');

    const userMessage = userInput.value.trim();
    if (!userMessage) return; // Don't send empty messages

    // Add user's message to the chat box
    const userMessageElement = document.createElement('div');
    userMessageElement.classList.add('message', 'user-message');
    userMessageElement.textContent = userMessage;
    chatBox.appendChild(userMessageElement);

    // Clear the input field
    userInput.value = '';

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
        const aiMessageElement = document.createElement('div');
        aiMessageElement.classList.add('message', 'ai-message');
        aiMessageElement.textContent = `You said: "${userMessage}"`;
        chatBox.appendChild(aiMessageElement);

        // Auto-scroll to the latest message
        chatBox.scrollTop = chatBox.scrollHeight;
    }, 1000);
}

// Allow sending messages by pressing Enter
document.getElementById('user-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});