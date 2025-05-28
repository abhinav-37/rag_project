class ChatBot {
    constructor() {
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.chatMessages = document.getElementById('chatMessages');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.connectionStatus = document.getElementById('connectionStatus');
        this.documentCount = document.getElementById('documentCount');
        this.charCount = document.getElementById('charCount');
        
        this.initializeEventListeners();
        this.checkServerStatus();
    }

    initializeEventListeners() {
        this.sendButton.addEventListener('click', () => this.sendMessage());
        
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        this.messageInput.addEventListener('input', () => {
            this.updateCharCount();
            this.toggleSendButton();
        });

        // Initial state
        this.updateCharCount();
        this.toggleSendButton();
    }

    updateCharCount() {
        const length = this.messageInput.value.length;
        this.charCount.textContent = `${length}/500`;
        
        if (length > 450) {
            this.charCount.style.color = '#e74c3c';
        } else if (length > 400) {
            this.charCount.style.color = '#f39c12';
        } else {
            this.charCount.style.color = '#666';
        }
    }

    toggleSendButton() {
        const hasText = this.messageInput.value.trim().length > 0;
        this.sendButton.disabled = !hasText;
    }

    async checkServerStatus() {
        try {
            const response = await fetch('/api/health');
            const data = await response.json();
            
            if (data.status === 'healthy') {
                this.connectionStatus.textContent = 'Connected';
                this.connectionStatus.style.color = '#27ae60';
            } else {
                this.connectionStatus.textContent = 'Disconnected';
                this.connectionStatus.style.color = '#e74c3c';
            }
            
        } catch (error) {
            console.error('Error checking server status:', error);
            this.connectionStatus.textContent = 'Error';
            this.connectionStatus.style.color = '#e74c3c';
            this.documentCount.textContent = 'Unable to load';
        }
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;

        // Add user message to chat
        this.addMessage(message, 'user');
        
        // Clear input
        this.messageInput.value = '';
        this.updateCharCount();
        this.toggleSendButton();

        // Show loading
        this.showLoading();

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Add bot response to chat
            this.addMessage(data.response, 'bot', data.sources);
            
        } catch (error) {
            console.error('Error sending message:', error);
            this.addMessage(
                "I'm sorry, there was an error processing your request. Please try again later.",
                'bot'
            );
        } finally {
            this.hideLoading();
        }
    }

    addMessage(content, sender, sources = []) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;

        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        const textP = document.createElement('p');
        textP.textContent = content;
        messageContent.appendChild(textP);

        messageDiv.appendChild(messageContent);
        this.chatMessages.appendChild(messageDiv);

        // Scroll to bottom
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    showLoading() {
        this.loadingOverlay.classList.remove('hidden');
        this.sendButton.disabled = true;
    }

    hideLoading() {
        this.loadingOverlay.classList.add('hidden');
        this.toggleSendButton();
    }
}

// Initialize the chatbot when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ChatBot();
});
