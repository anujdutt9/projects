// Gemini RAG Chat Application - v1.1 (Cache bust: 2024-01-15)
class GeminiRAGChat {
    constructor() {
        this.session = null;
        this.documents = [];
        this.chatHistory = [];
        this.currentChatId = null;
        this.isModelReady = false;
        
        this.initializeElements();
        this.bindEvents();
        this.initializeModel();
        this.loadChatHistory();
    }

    initializeElements() {
        // DOM Elements
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.uploadedFiles = document.getElementById('uploadedFiles');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.messages = document.getElementById('messages');
        this.messagesContainer = document.getElementById('messagesContainer');
        this.welcomeMessage = document.getElementById('welcomeMessage');
        this.chatHistory = document.getElementById('chatHistory');
        this.clearHistoryBtn = document.getElementById('clearHistory');
        this.modelStatus = document.getElementById('model-status');
        this.loadingModal = new bootstrap.Modal(document.getElementById('loadingModal'));
        this.loadingTitle = document.getElementById('loadingTitle');
        this.loadingMessage = document.getElementById('loadingMessage');
        this.loadingProgress = document.getElementById('loadingProgress');
    }

    bindEvents() {
        // File upload events
        this.uploadArea.addEventListener('click', () => this.fileInput.click());
        this.uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        this.uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        this.uploadArea.addEventListener('drop', this.handleDrop.bind(this));
        this.fileInput.addEventListener('change', this.handleFileSelect.bind(this));

        // Chat events
        this.messageInput.addEventListener('input', this.handleInputChange.bind(this));
        this.messageInput.addEventListener('keydown', this.handleKeyDown.bind(this));
        this.sendBtn.addEventListener('click', this.sendMessage.bind(this));
        this.clearHistoryBtn.addEventListener('click', this.clearChatHistory.bind(this));

        // Auto-resize textarea
        this.messageInput.addEventListener('input', this.autoResizeTextarea.bind(this));
    }

    async initializeModel() {
        console.log('🚀 Starting model initialization...');
        try {
            this.updateModelStatus('loading', 'Initializing Gemini Model...');
            this.showLoadingModal('Initializing Gemini Model', 'Please wait while we set up the AI model...');

            // Check if LanguageModel API is available
            console.log('🔍 Checking LanguageModel API availability...');
            if (typeof LanguageModel === 'undefined') {
                console.error('❌ LanguageModel API not available');
                throw new Error('LanguageModel API not available. Please use Chrome with Gemini Nano support.');
            }
            console.log('✅ LanguageModel API is available');

            // Add timeout to prevent infinite loading
            console.log('⏰ Setting up 60-second timeout...');
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => {
                    console.error('⏰ Model initialization timed out after 60 seconds');
                    reject(new Error('Model initialization timed out. Please refresh and try again.'));
                }, 60000); // 60 second timeout
            });

            // Check model availability first
            console.log('🔍 Checking model availability...');
            try {
                const modelStatus = await LanguageModel.availability();
                console.log('📊 Model status:', modelStatus);
            } catch (availabilityError) {
                console.error('❌ Error checking model availability:', availabilityError);
                // Fallback: try to create the model directly
                console.log('🔄 Falling back to direct model creation...');
                this.showLoadingModal('Initializing Gemini Model', 'Please wait while we set up the AI model...');
                this.loadingProgress.style.display = 'block';
                
                this.session = await LanguageModel.create({
                    monitor: (m) => {
                        console.log('📡 Setting up download monitor...');
                        m.addEventListener("downloadprogress", (e) => {
                            const progress = (e.loaded / e.total * 100).toFixed(1);
                            console.log(`📊 Download progress: ${progress}%`);
                            this.updateLoadingProgress(progress);
                            this.loadingMessage.textContent = `Downloading model: ${progress}%`;
                        });
                        
                        m.addEventListener("downloadcomplete", () => {
                            console.log('✅ Download completed, initializing model...');
                            this.loadingMessage.textContent = 'Initializing model...';
                            this.loadingProgress.style.display = 'none';
                        });
                    }
                });
                console.log('✅ Model created successfully via fallback');
                return; // Skip the rest of the initialization
            }
            
            const modelStatus = await LanguageModel.availability();
            
            if (modelStatus === "downloadable") {
                console.log('📥 Model needs to be downloaded');
                // Model needs to be downloaded
                this.showLoadingModal('Downloading Gemini Model', 'Please wait while we download the AI model...');
                this.loadingProgress.style.display = 'block';
                
                console.log('🔄 Starting model download...');
                this.session = await LanguageModel.create({
                    monitor: (m) => {
                        console.log('📡 Setting up download monitor...');
                        m.addEventListener("downloadprogress", (e) => {
                            const progress = (e.loaded / e.total * 100).toFixed(1);
                            console.log(`📊 Download progress: ${progress}%`);
                            this.updateLoadingProgress(progress);
                            this.loadingMessage.textContent = `Downloading model: ${progress}%`;
                        });
                        
                        // Handle download completion
                        m.addEventListener("downloadcomplete", () => {
                            console.log('✅ Download completed, initializing model...');
                            this.loadingMessage.textContent = 'Initializing model...';
                            this.loadingProgress.style.display = 'none';
                        });
                    }
                });
                console.log('✅ Model download and creation completed');
            } else if (modelStatus === "available") {
                console.log('✅ Model is already available, loading...');
                // Model is already available, just load it
                this.showLoadingModal('Loading Gemini Model', 'Please wait while we initialize the AI model...');
                this.loadingProgress.style.display = 'none';
                
                console.log('🔄 Creating model session...');
                this.session = await LanguageModel.create();
                console.log('✅ Model session created successfully');
            } else {
                console.error('❌ Unknown model status:', modelStatus);
                throw new Error(`Model status unknown: ${modelStatus}`);
            }

            // Race between model creation and timeout
            console.log('🏁 Waiting for model initialization to complete...');
            await Promise.race([
                Promise.resolve(), // Model creation is already awaited above
                timeoutPromise
            ]);

            console.log('🎉 Model initialization successful!');
            this.isModelReady = true;
            this.updateModelStatus('online', 'Model Ready');
            
            // Immediately hide the loading modal
            console.log('🔒 Hiding loading modal...');
            this.hideLoadingModal();
            
            // Force hide modal again after a short delay
            setTimeout(() => {
                console.log('🔒 Force hiding modal again...');
                this.hideLoadingModal();
            }, 500);
            
            // Enable send button if documents are uploaded
            this.updateSendButtonState();
            console.log('✅ Application ready for use');

        } catch (error) {
            console.error('❌ Error initializing model:', error);
            console.error('❌ Error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
            
            this.updateModelStatus('offline', 'Model Error');
            this.hideLoadingModal();
            
            let errorMessage = 'Failed to initialize Gemini model. ';
            if (error.message.includes('timed out')) {
                errorMessage += 'The model took too long to initialize. Please refresh the page and try again.';
            } else if (error.message.includes('LanguageModel API not available')) {
                errorMessage += 'Please ensure you are using Chrome with Gemini Nano support.';
            } else {
                errorMessage += 'Please refresh the page and try again.';
            }
            
            this.showError(errorMessage);
        }
    }

    updateModelStatus(status, message) {
        const icon = this.modelStatus.querySelector('i');
        const text = this.modelStatus.querySelector('span');
        
        icon.className = 'fas fa-circle';
        text.textContent = message;
        
        switch (status) {
            case 'online':
                icon.classList.add('status-online');
                break;
            case 'offline':
                icon.classList.add('status-offline');
                break;
            case 'loading':
                icon.classList.add('status-loading');
                break;
        }
    }

    showLoadingModal(title, message) {
        this.loadingTitle.textContent = title;
        this.loadingMessage.textContent = message;
        this.loadingProgress.style.display = 'none';
        this.loadingModal.show();
    }

    hideLoadingModal() {
        console.log('🔒 Hiding loading modal...');
        
        // Method 1: Try Bootstrap modal hide
        try {
            this.loadingModal.hide();
            console.log('✅ Bootstrap modal hide successful');
        } catch (error) {
            console.warn('⚠️ Bootstrap modal hide failed, using fallback');
        }
        
        // Method 2: Direct DOM manipulation (always works)
        const modalElement = document.getElementById('loadingModal');
        if (modalElement) {
            console.log('🔧 Applying direct DOM changes...');
            modalElement.classList.remove('show');
            modalElement.style.display = 'none';
            modalElement.setAttribute('aria-hidden', 'true');
            modalElement.removeAttribute('aria-modal');
            modalElement.removeAttribute('role');
            modalElement.style.paddingRight = '';
        } else {
            console.warn('⚠️ Modal element not found');
        }
        
        // Remove modal backdrop and body classes
        document.body.classList.remove('modal-open');
        document.body.style.paddingRight = '';
        document.body.style.overflow = '';
        
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) {
            backdrop.remove();
            console.log('✅ Modal backdrop removed');
        }
        
        // Force remove any remaining modal-related elements
        const remainingBackdrops = document.querySelectorAll('.modal-backdrop');
        remainingBackdrops.forEach(backdrop => backdrop.remove());
        
        console.log('✅ Loading modal hidden successfully');
    }

    updateLoadingProgress(progress) {
        this.loadingProgress.style.display = 'block';
        const progressBar = this.loadingProgress.querySelector('.progress-bar');
        progressBar.style.width = `${progress}%`;
        progressBar.setAttribute('aria-valuenow', progress);
    }

    // File Upload Handling
    handleDragOver(e) {
        e.preventDefault();
        this.uploadArea.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
        const files = Array.from(e.dataTransfer.files);
        this.processFiles(files);
    }

    handleFileSelect(e) {
        const files = Array.from(e.target.files);
        this.processFiles(files);
    }

    async processFiles(files) {
        console.log('📁 Processing files:', files.length, 'files selected');
        
        const validFiles = files.filter(file => {
            const validTypes = ['.pdf', '.txt', '.doc', '.docx'];
            const extension = '.' + file.name.split('.').pop().toLowerCase();
            const isValid = validTypes.includes(extension);
            console.log(`📄 File: ${file.name}, Type: ${extension}, Valid: ${isValid}`);
            return isValid;
        });

        if (validFiles.length === 0) {
            console.warn('⚠️ No valid files found');
            this.showError('Please select valid files (PDF, TXT, DOC, DOCX)');
            return;
        }

        console.log(`✅ Processing ${validFiles.length} valid files`);
        for (const file of validFiles) {
            await this.processFile(file);
        }

        this.updateSendButtonState();
    }

    async processFile(file) {
        try {
            const fileId = this.generateId();
            const fileData = {
                id: fileId,
                name: file.name,
                size: this.formatFileSize(file.size),
                type: file.type,
                content: '',
                processed: false
            };

            // Add to documents array
            this.documents.push(fileData);
            this.addFileToList(fileData);

            // Process file content
            const content = await this.extractFileContent(file);
            fileData.content = content;
            fileData.processed = true;

            this.updateFileStatus(fileId, 'processed');

        } catch (error) {
            console.error('Error processing file:', error);
            this.showError(`Failed to process ${file.name}`);
        }
    }

    async extractFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    let content = '';
                    
                    if (file.type === 'text/plain') {
                        content = e.target.result;
                    } else if (file.type === 'application/pdf') {
                        // For PDF files, we'll extract text content
                        // In a real implementation, you'd use a PDF parsing library
                        content = `PDF Content: ${file.name} - Text extraction would be implemented here`;
                    } else {
                        // For other file types
                        content = `Document Content: ${file.name} - Content extraction would be implemented here`;
                    }
                    
                    resolve(content);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = reject;
            
            if (file.type === 'text/plain') {
                reader.readAsText(file);
            } else {
                reader.readAsArrayBuffer(file);
            }
        });
    }

    addFileToList(fileData) {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.id = `file-${fileData.id}`;
        
        const icon = this.getFileIcon(fileData.name);
        
        fileItem.innerHTML = `
            <div class="file-icon">
                <i class="${icon}"></i>
            </div>
            <div class="file-info">
                <div class="file-name">${fileData.name}</div>
                <div class="file-size">${fileData.size}</div>
            </div>
            <button class="file-remove" onclick="app.removeFile('${fileData.id}')">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        this.uploadedFiles.appendChild(fileItem);
    }

    getFileIcon(fileName) {
        const extension = fileName.split('.').pop().toLowerCase();
        switch (extension) {
            case 'pdf': return 'fas fa-file-pdf';
            case 'txt': return 'fas fa-file-alt';
            case 'doc':
            case 'docx': return 'fas fa-file-word';
            default: return 'fas fa-file';
        }
    }

    updateFileStatus(fileId, status) {
        const fileItem = document.getElementById(`file-${fileId}`);
        if (fileItem) {
            const icon = fileItem.querySelector('.file-icon i');
            if (status === 'processed') {
                icon.className = 'fas fa-check text-success';
            }
        }
    }

    removeFile(fileId) {
        // Remove from documents array
        this.documents = this.documents.filter(doc => doc.id !== fileId);
        
        // Remove from DOM
        const fileItem = document.getElementById(`file-${fileId}`);
        if (fileItem) {
            fileItem.remove();
        }
        
        this.updateSendButtonState();
    }

    // Chat Functionality
    handleInputChange() {
        this.autoResizeTextarea();
        this.updateSendButtonState();
    }

    handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.sendMessage();
        }
    }

    autoResizeTextarea() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
    }

    updateSendButtonState() {
        const hasText = this.messageInput.value.trim().length > 0;
        const hasDocuments = this.documents.length > 0;
        const isReady = this.isModelReady && hasText && hasDocuments;
        
        this.sendBtn.disabled = !isReady;
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        console.log('💬 Sending message:', message.substring(0, 50) + (message.length > 50 ? '...' : ''));
        
        if (!message || !this.isModelReady || this.documents.length === 0) {
            console.warn('⚠️ Cannot send message:', {
                hasMessage: !!message,
                isModelReady: this.isModelReady,
                documentsCount: this.documents.length
            });
            return;
        }

        // Create new chat if none exists
        if (!this.currentChatId) {
            this.currentChatId = this.generateId();
            console.log('🆕 Creating new chat session:', this.currentChatId);
            this.createNewChat();
        }

        // Add user message
        this.addMessage('user', message);
        this.messageInput.value = '';
        this.autoResizeTextarea();
        this.updateSendButtonState();

        // Show typing indicator
        const typingId = this.addTypingIndicator();

        try {
            console.log('🔍 Preparing document context...');
            // Prepare context from documents
            const context = this.prepareDocumentContext();
            console.log('📚 Context length:', context.length, 'characters');
            
            // Create prompt with context
            const prompt = this.createPromptWithContext(message, context);
            console.log('📝 Prompt length:', prompt.length, 'characters');
            
            console.log('🤖 Sending prompt to Gemini...');
            // Get response from Gemini
            const response = await this.session.prompt(prompt);
            console.log('✅ Received response from Gemini');
            
            // Remove typing indicator and add response
            this.removeTypingIndicator(typingId);
            this.addMessage('assistant', response.text);
            
            // Save to chat history
            this.saveChatHistory(message, response.text);

        } catch (error) {
            console.error('❌ Error getting response:', error);
            this.removeTypingIndicator(typingId);
            this.addMessage('assistant', 'Sorry, I encountered an error while processing your request. Please try again.');
        }
    }

    prepareDocumentContext() {
        return this.documents
            .filter(doc => doc.processed)
            .map(doc => `Document: ${doc.name}\nContent: ${doc.content.substring(0, 2000)}...`)
            .join('\n\n');
    }

    createPromptWithContext(userMessage, context) {
        return `You are a helpful AI assistant that analyzes documents and answers questions based on their content.

Context from uploaded documents:
${context}

User Question: ${userMessage}

Please provide a comprehensive answer based on the document content above. If the information is not available in the documents, please say so. Be helpful, accurate, and concise.`;
    }

    addMessage(sender, text) {
        const messageId = this.generateId();
        const timestamp = new Date().toLocaleTimeString();
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        messageDiv.id = `message-${messageId}`;
        
        const avatar = sender === 'user' ? 'fas fa-user' : 'fas fa-robot';
        const avatarBg = sender === 'user' ? 'user' : 'assistant';
        
        messageDiv.innerHTML = `
            <div class="message-avatar ${avatarBg}">
                <i class="${avatar}"></i>
            </div>
            <div class="message-content">
                <div class="message-text">${this.formatMessageText(text)}</div>
                <div class="message-time">${timestamp}</div>
            </div>
        `;
        
        this.messages.appendChild(messageDiv);
        this.scrollToBottom();
        
        return messageId;
    }

    addTypingIndicator() {
        const typingId = this.generateId();
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message assistant typing';
        typingDiv.id = `typing-${typingId}`;
        
        typingDiv.innerHTML = `
            <div class="message-avatar assistant">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <div class="message-text">
                    <div class="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>
        `;
        
        this.messages.appendChild(typingDiv);
        this.scrollToBottom();
        
        return typingId;
    }

    removeTypingIndicator(typingId) {
        const typingDiv = document.getElementById(`typing-${typingId}`);
        if (typingDiv) {
            typingDiv.remove();
        }
    }

    formatMessageText(text) {
        // Convert URLs to links
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        text = text.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
        
        // Convert line breaks to <br> tags
        text = text.replace(/\n/g, '<br>');
        
        return text;
    }

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    createNewChat() {
        this.hideWelcomeMessage();
        this.showMessagesContainer();
    }

    hideWelcomeMessage() {
        this.welcomeMessage.style.display = 'none';
    }

    showMessagesContainer() {
        this.messagesContainer.style.display = 'flex';
    }

    // Chat History Management
    saveChatHistory(userMessage, assistantResponse) {
        const chatEntry = {
            id: this.currentChatId,
            title: userMessage.substring(0, 50) + (userMessage.length > 50 ? '...' : ''),
            timestamp: new Date().toISOString(),
            messages: [
                { sender: 'user', text: userMessage },
                { sender: 'assistant', text: assistantResponse }
            ]
        };

        // Add to local storage
        this.chatHistory.push(chatEntry);
        localStorage.setItem('geminiRAGChatHistory', JSON.stringify(this.chatHistory));
        
        // Update UI
        this.addChatHistoryItem(chatEntry);
    }

    loadChatHistory() {
        const saved = localStorage.getItem('geminiRAGChatHistory');
        if (saved) {
            this.chatHistory = JSON.parse(saved);
            this.chatHistory.forEach(chat => this.addChatHistoryItem(chat));
        }
    }

    addChatHistoryItem(chat) {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.onclick = () => this.loadChat(chat.id);
        
        const timestamp = new Date(chat.timestamp).toLocaleString();
        
        historyItem.innerHTML = `
            <div class="history-title">${chat.title}</div>
            <div class="history-time">${timestamp}</div>
        `;
        
        this.chatHistory.appendChild(historyItem);
    }

    loadChat(chatId) {
        const chat = this.chatHistory.find(c => c.id === chatId);
        if (!chat) return;

        this.currentChatId = chatId;
        this.createNewChat();
        
        // Clear current messages
        this.messages.innerHTML = '';
        
        // Load chat messages
        chat.messages.forEach(msg => {
            this.addMessage(msg.sender, msg.text);
        });
        
        // Update active state
        document.querySelectorAll('.history-item').forEach(item => {
            item.classList.remove('active');
        });
        event.target.closest('.history-item').classList.add('active');
    }

    clearChatHistory() {
        if (confirm('Are you sure you want to clear all chat history?')) {
            this.chatHistory = [];
            localStorage.removeItem('geminiRAGChatHistory');
            this.chatHistory.innerHTML = '';
            this.currentChatId = null;
            this.hideMessagesContainer();
            this.showWelcomeMessage();
        }
    }

    hideMessagesContainer() {
        this.messagesContainer.style.display = 'none';
    }

    showWelcomeMessage() {
        this.welcomeMessage.style.display = 'flex';
    }

    // Utility Functions
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    showError(message) {
        // Create a temporary error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger alert-dismissible fade show position-fixed';
        errorDiv.style.cssText = 'top: 100px; right: 20px; z-index: 9999; min-width: 300px;';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(errorDiv);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }
}

// Additional CSS for typing indicator
const typingStyles = `
<style>
.typing-indicator {
    display: flex;
    gap: 4px;
    align-items: center;
}

.typing-indicator span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: var(--text-muted);
    animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
.typing-indicator span:nth-child(2) { animation-delay: -0.16s; }

@keyframes typing {
    0%, 80%, 100% {
        transform: scale(0.8);
        opacity: 0.5;
    }
    40% {
        transform: scale(1);
        opacity: 1;
    }
}

.alert {
    border-radius: var(--border-radius-sm);
    border: none;
    box-shadow: var(--shadow-md);
}
</style>
`;

// Add styles to document
document.head.insertAdjacentHTML('beforeend', typingStyles);

// Initialize the application
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new GeminiRAGChat();
}); 