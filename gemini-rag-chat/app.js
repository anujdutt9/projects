// Gemini RAG Chat Application - v1.1 (Cache bust: 2024-01-15)
class GeminiRAGChat {
    constructor() {
        this.session = null;
        this.documents = [];
        this.chatHistoryData = [];
        this.currentChatId = null;
        this.isModelReady = false;
        
        // Context-aware RAG system
        this.embeddingModel = null;
        this.documentChunks = [];
        this.chunkEmbeddings = [];
        this.isEmbeddingModelReady = false;
        this.conversationContext = [];
        this.maxContextLength = 4000; // Maximum context length per message
        this.maxChunkSize = 500; // Maximum characters per chunk
        this.overlapSize = 50; // Overlap between chunks
        
        this.initializeElements();
        this.bindEvents();
        this.initializeModel();
        this.initializeEmbeddingModel();
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
        this.chatHistoryContainer = document.getElementById('chatHistory');
        this.newChatBtn = document.getElementById('newChatBtn');
        this.clearHistoryBtn = document.getElementById('clearHistory');
        this.modelStatus = document.getElementById('model-status');
        this.embeddingStatus = document.getElementById('embedding-status');
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
        this.newChatBtn.addEventListener('click', this.startNewChat.bind(this));
        this.clearHistoryBtn.addEventListener('click', this.clearChatHistory.bind(this));

        // Auto-resize textarea
        this.messageInput.addEventListener('input', this.autoResizeTextarea.bind(this));
    }

    async initializeModel() {
        console.log('Starting model initialization...');
        try {
            this.updateModelStatus('loading', 'Initializing Gemini Model...');
            this.showLoadingModal('Initializing Gemini Model', 'Please wait while we set up the AI model...');

            // Check if LanguageModel API is available
            console.log('🔍 Checking LanguageModel API availability...');
            if (typeof LanguageModel === 'undefined') {
                console.error('LanguageModel API not available');
                throw new Error('LanguageModel API not available. Please use Chrome with Gemini Nano support.');
            }
            console.log('✅ LanguageModel API is available');



            // Check model availability first
            console.log('🔍 Checking model availability...');
            try {
                const modelStatus = await LanguageModel.availability();
                console.log('Model status:', modelStatus);
            } catch (availabilityError) {
                console.error('Error checking model availability:', availabilityError);
                // Fallback: try to create the model directly
                console.log('Falling back to direct model creation...');
                this.showLoadingModal('Initializing Gemini Model', 'Please wait while we set up the AI model...');
                this.loadingProgress.style.display = 'block';
                
                this.session = await LanguageModel.create({
                    monitor: (m) => {
                        console.log('Setting up download monitor...');
                        m.addEventListener("downloadprogress", (e) => {
                            const progress = (e.loaded / e.total * 100).toFixed(1);
                            console.log(`Download progress: ${progress}%`);
                            this.updateLoadingProgress(progress);
                            this.loadingMessage.textContent = `Downloading model: ${progress}%`;
                        });
                        
                        m.addEventListener("downloadcomplete", () => {
                            console.log('Download completed, initializing model...');
                            this.loadingMessage.textContent = 'Initializing model...';
                            this.loadingProgress.style.display = 'none';
                        });
                    }
                });
                console.log('Model created successfully via fallback');
                return; // Skip the rest of the initialization
            }
            
            const modelStatus = await LanguageModel.availability();
            
            if (modelStatus === "downloadable") {
                console.log('Model needs to be downloaded');
                // Model needs to be downloaded
                this.showLoadingModal('Downloading Gemini Model', 'Please wait while we download the AI model...');
                this.loadingProgress.style.display = 'block';
                
                console.log('Starting model download...');
                this.session = await LanguageModel.create({
                    monitor: (m) => {
                        console.log('Setting up download monitor...');
                        m.addEventListener("downloadprogress", (e) => {
                            const progress = (e.loaded / e.total * 100).toFixed(1);
                            console.log(`Download progress: ${progress}%`);
                            this.updateLoadingProgress(progress);
                            this.loadingMessage.textContent = `Downloading model: ${progress}%`;
                        });
                        
                        // Handle download completion
                        m.addEventListener("downloadcomplete", () => {
                            console.log('Download completed, initializing model...');
                            this.loadingMessage.textContent = 'Initializing model...';
                            this.loadingProgress.style.display = 'none';
                        });
                    }
                });
                console.log('Model download and creation completed');
            } else if (modelStatus === "available") {
                console.log('Model is already available, loading...');
                // Model is already available, just load it
                this.showLoadingModal('Loading Gemini Model', 'Please wait while we initialize the AI model...');
                this.loadingProgress.style.display = 'none';
                
                console.log('Creating model session...');
                this.session = await LanguageModel.create();
                console.log('Model session created successfully');
            } else {
                console.error('Unknown model status:', modelStatus);
                throw new Error(`Model status unknown: ${modelStatus}`);
            }



            console.log('Model initialization successful!');
            this.isModelReady = true;
            this.updateModelStatus('online', 'Model Ready');
            
            // Immediately hide the loading modal
            console.log('Hiding loading modal...');
            this.hideLoadingModal();
            
            // Force hide modal again after a short delay
            setTimeout(() => {
                console.log('Force hiding modal again...');
                this.hideLoadingModal();
            }, 500);
            
            // Enable send button if documents are uploaded
            this.updateSendButtonState();
            console.log('Application ready for use');

        } catch (error) {
            console.error('Error initializing model:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
            
            this.updateModelStatus('offline', 'Model Error');
            this.hideLoadingModal();
            
            let errorMessage = 'Failed to initialize Gemini model. ';
            if (error.message.includes('LanguageModel API not available')) {
                errorMessage += 'Please ensure you are using Chrome with Gemini Nano support.';
            } else {
                errorMessage += 'Please refresh the page and try again.';
            }
            
            this.showError(errorMessage);
        }
    }

    async initializeEmbeddingModel() {
        try {
            console.log('🔍 Initializing Universal Sentence Encoder...');
            this.updateEmbeddingStatus('loading', 'Loading Embeddings...');
            this.embeddingModel = await use.load();
            this.isEmbeddingModelReady = true;
            this.updateEmbeddingStatus('online', 'Embeddings Ready');
            console.log('✅ Embedding model ready');
            
            // Process existing documents if any
            if (this.documents.length > 0) {
                await this.processDocumentChunks();
            }
        } catch (error) {
            console.error('❌ Error initializing embedding model:', error);
            this.isEmbeddingModelReady = false;
            this.updateEmbeddingStatus('offline', 'Embeddings Error');
        }
    }

    updateEmbeddingStatus(status, message) {
        const icon = this.embeddingStatus.querySelector('i');
        const text = this.embeddingStatus.querySelector('span');
        
        icon.className = 'fas fa-brain';
        text.textContent = `Embeddings: ${message}`;
        
        switch (status) {
            case 'online':
                icon.classList.add('text-success');
                break;
            case 'offline':
                icon.classList.add('text-danger');
                break;
            case 'loading':
                icon.classList.add('text-warning');
                break;
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
        console.log('Hiding loading modal...');
        
        // Method 1: Try Bootstrap modal hide
        try {
            this.loadingModal.hide();
            console.log('Bootstrap modal hide successful');
        } catch (error) {
            console.warn('Bootstrap modal hide failed, using fallback');
        }
        
        // Method 2: Direct DOM manipulation (always works)
        const modalElement = document.getElementById('loadingModal');
        if (modalElement) {
            console.log('Applying direct DOM changes...');
            modalElement.classList.remove('show');
            modalElement.style.display = 'none';
            modalElement.setAttribute('aria-hidden', 'true');
            modalElement.removeAttribute('aria-modal');
            modalElement.removeAttribute('role');
            modalElement.style.paddingRight = '';
        } else {
            console.warn('Modal element not found');
        }
        
        // Remove modal backdrop and body classes
        document.body.classList.remove('modal-open');
        document.body.style.paddingRight = '';
        document.body.style.overflow = '';
        
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) {
            backdrop.remove();
            console.log('Modal backdrop removed');
        }
        
        // Force remove any remaining modal-related elements
        const remainingBackdrops = document.querySelectorAll('.modal-backdrop');
        remainingBackdrops.forEach(backdrop => backdrop.remove());
        
        console.log('Loading modal hidden successfully');
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
        console.log('Processing files:', files.length, 'files selected');
        
        const validFiles = files.filter(file => {
            const validTypes = ['.pdf', '.txt', '.doc', '.docx'];
            const extension = '.' + file.name.split('.').pop().toLowerCase();
            const isValid = validTypes.includes(extension);
            console.log(`File: ${file.name}, Type: ${extension}, Valid: ${isValid}`);
            return isValid;
        });

        if (validFiles.length === 0) {
            console.warn('No valid files found');
            this.showError('Please select valid files (PDF, TXT, DOC, DOCX)');
            return;
        }

        console.log(`Processing ${validFiles.length} valid files`);
        for (const file of validFiles) {
            await this.processFile(file);
        }

        this.updateSendButtonState();
    }

    async processFile(file) {
        const fileId = this.generateId();
        const fileData = {
            id: fileId,
            name: file.name,
            size: file.size,
            type: file.type,
            content: '',
            processed: false
        };

        // Add file to list immediately
        this.addFileToList(fileData);

        try {
            const content = await this.extractFileContent(file);
            fileData.content = content;
            fileData.processed = true;
            this.documents.push(fileData);
            this.updateFileStatus(fileId, 'processed');
            this.updateSendButtonState();
            
            // Process chunks for the new document
            if (this.isEmbeddingModelReady) {
                await this.processDocumentChunks();
            }
        } catch (error) {
            console.error('Error processing file:', file.name, error);
            this.updateFileStatus(fileId, 'error');
            this.showError(`Failed to process ${file.name}: ${error.message}`);
        }
    }

    async extractFileContent(file) {
        console.log('📄 Extracting content from file:', file.name);
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    let content = '';
                    
                    if (file.type === 'text/plain') {
                        content = e.target.result;
                    } else if (file.type === 'application/pdf') {
                        // For PDF files, try to extract text using PDF.js
                        try {
                            content = await this.extractPDFText(e.target.result);
                            console.log('PDF text extraction successful');
                        } catch (pdfError) {
                            console.warn('PDF text extraction failed:', pdfError);
                            content = `PDF Content: ${file.name} - Unable to extract text. Please ensure the PDF contains selectable text.`;
                        }
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

    async extractPDFText(arrayBuffer) {
        // Load PDF.js library dynamically
        if (typeof pdfjsLib === 'undefined') {
            await this.loadPDFJS();
        }
        
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n';
        }
        
        return fullText.trim();
    }

    async loadPDFJS() {
        return new Promise((resolve, reject) => {
            if (typeof pdfjsLib !== 'undefined') {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
            script.onload = () => {
                pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                resolve();
            };
            script.onerror = reject;
            document.head.appendChild(script);
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
        const isReady = this.isModelReady && hasText;
        
        this.sendBtn.disabled = !isReady;
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        console.log('💬 Sending message:', message.substring(0, 50) + (message.length > 50 ? '...' : ''));
        
        if (!message || !this.isModelReady) {
            console.warn('Cannot send message:', {
                hasMessage: !!message,
                isModelReady: this.isModelReady
            });
            return;
        }

        // Create new chat if none exists
        if (!this.currentChatId) {
            console.log('No current chat, starting new session...');
            this.startNewChat();
        }

        // Add user message
        this.addMessage('user', message);
        this.messageInput.value = '';
        this.autoResizeTextarea();
        this.updateSendButtonState();

        // Show typing indicator
        const typingId = this.addTypingIndicator();

        try {
            let prompt;
            
            if (this.documents.length > 0) {
                console.log('Preparing document context...');
                // Prepare context from documents
                const context = await this.prepareIntelligentContext(message);
                console.log('Context length:', context.length, 'characters');
                
                // Create prompt with context
                prompt = this.createPromptWithContext(message, context);
                console.log('Prompt length:', prompt.length, 'characters');
            } else {
                console.log('No documents provided, using general conversation mode');
                // Create a general conversation prompt
                prompt = `You are a helpful AI assistant. Please respond to the following question or request in a helpful and informative way:

User: ${message}

Please provide a clear, helpful response.`;
                console.log('📝 General prompt length:', prompt.length, 'characters');
            }
            
            console.log('🤖 Sending prompt to Gemini...');
            // Get response from Gemini
            let result;
            try {
                console.log('🔍 Prompt:', prompt);
                result = await this.session.prompt(prompt);
                console.log('Received response from Gemini');
                console.log('Response object:', result);
                console.log('Response type:', typeof result);
                console.log('Response text:', result);
            } catch (promptError) {
                console.error('❌ Error calling session.prompt:', promptError);
                this.removeTypingIndicator(typingId);
                this.addMessage('assistant', 'Sorry, I encountered an error while processing your request. Please try again.');
                return;
            }
            
            // Remove typing indicator and add response
            this.removeTypingIndicator(typingId);
            
            if (result && typeof result === 'string' && result.trim().length > 0) {
                console.log('✅ Valid response received, adding message');
                this.addMessage('assistant', result);
            } else {
                console.error('❌ Invalid response from Gemini:', result);
                this.addMessage('assistant', 'Sorry, I received an invalid response. Please try again.');
            }
            
            // Save to chat history
            this.saveChatHistory(message, result);
            
            // Add to conversation context for future messages
            this.addToConversationContext(message, result);

        } catch (error) {
            console.error('❌ Error getting response:', error);
            this.removeTypingIndicator(typingId);
            this.addMessage('assistant', 'Sorry, I encountered an error while processing your request. Please try again.');
        }
    }

    async prepareIntelligentContext(userMessage) {
        if (this.documentChunks.length === 0) {
            return '';
        }
        
        try {
            // Find relevant chunks based on user query
            const relevantChunks = await this.findRelevantChunks(userMessage, 3);
            
            if (relevantChunks.length === 0) {
                return '';
            }
            
            // Build context from relevant chunks
            let context = '';
            for (const result of relevantChunks) {
                const chunk = result.chunk;
                context += `Document: ${chunk.documentName} (Chunk ${chunk.chunkIndex + 1})\nContent: ${chunk.content}\n\n`;
            }
            
            // Add conversation context if available
            const conversationContext = this.getConversationContext();
            if (conversationContext) {
                context += `Previous Conversation:\n${conversationContext}\n\n`;
            }
            
            return context.trim();
        } catch (error) {
            console.error('❌ Error preparing intelligent context:', error);
            // Fallback to old method
            return this.prepareDocumentContext();
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
        // Handle null/undefined text
        if (!text) {
            console.warn('⚠️ Received empty or undefined text from Gemini');
            return 'Sorry, I received an empty response. Please try again.';
        }
        
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
    startNewChat() {
        console.log('🆕 Starting new chat session...');
        
        // Generate new chat ID
        this.currentChatId = this.generateId();
        
        // Create new chat session
        const newChat = {
            id: this.currentChatId,
            title: 'New Chat',
            timestamp: new Date().toISOString(),
            messages: [],
            lastUpdated: new Date().toISOString()
        };
        
        // Add to chat history
        this.chatHistoryData.push(newChat);
        this.saveChatHistoryToStorage();
        
        // Update UI
        this.addChatHistoryItem(newChat);
        this.loadChat(this.currentChatId);
        
        // Clear current messages and conversation context
        this.messages.innerHTML = '';
        this.conversationContext = [];
        this.createNewChat();
        
        console.log('✅ New chat session created:', this.currentChatId);
    }

    saveChatHistory(userMessage, assistantResponse) {
        if (!this.currentChatId) {
            console.warn('⚠️ No current chat ID, creating new chat...');
            this.startNewChat();
        }

        // Find current chat
        const currentChat = this.chatHistoryData.find(chat => chat.id === this.currentChatId);
        if (!currentChat) {
            console.error('❌ Current chat not found, creating new one...');
            this.startNewChat();
            return;
        }

        // Add messages to current chat
        currentChat.messages.push(
            { sender: 'user', text: userMessage, timestamp: new Date().toISOString() },
            { sender: 'assistant', text: assistantResponse, timestamp: new Date().toISOString() }
        );

        // Update chat title if it's still "New Chat"
        if (currentChat.title === 'New Chat') {
            currentChat.title = userMessage.substring(0, 50) + (userMessage.length > 50 ? '...' : '');
        }

        // Update last updated timestamp
        currentChat.lastUpdated = new Date().toISOString();

        // Save to storage
        this.saveChatHistoryToStorage();
        
        // Update UI
        this.updateChatHistoryItem(currentChat);
        
        console.log('💾 Chat history saved for session:', this.currentChatId);
    }

    saveChatHistoryToStorage() {
        localStorage.setItem('geminiRAGChatHistory', JSON.stringify(this.chatHistoryData));
    }

    loadChatHistory() {
        const saved = localStorage.getItem('geminiRAGChatHistory');
        if (saved) {
            try {
                this.chatHistoryData = JSON.parse(saved);
                // Sort by last updated (newest first)
                this.chatHistoryData.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
                this.chatHistoryData.forEach(chat => this.addChatHistoryItem(chat));
                console.log('📚 Loaded', this.chatHistoryData.length, 'chat sessions');
            } catch (error) {
                console.error('❌ Error loading chat history:', error);
                this.chatHistoryData = [];
            }
        }
    }

    addChatHistoryItem(chat) {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.dataset.chatId = chat.id;
        historyItem.onclick = () => this.loadChat(chat.id);
        
        const timestamp = new Date(chat.lastUpdated || chat.timestamp).toLocaleString();
        const messageCount = chat.messages.length;
        
        historyItem.innerHTML = `
            <div class="history-title">${chat.title}</div>
            <div class="history-meta">
                <span class="history-time">${timestamp}</span>
                <span class="history-count">${messageCount} messages</span>
            </div>
        `;
        
        this.chatHistoryContainer.appendChild(historyItem);
    }

    updateChatHistoryItem(chat) {
        const historyItem = this.chatHistoryContainer.querySelector(`[data-chat-id="${chat.id}"]`);
        if (historyItem) {
            const timestamp = new Date(chat.lastUpdated).toLocaleString();
            const messageCount = chat.messages.length;
            
            historyItem.innerHTML = `
                <div class="history-title">${chat.title}</div>
                <div class="history-meta">
                    <span class="history-time">${timestamp}</span>
                    <span class="history-count">${messageCount} messages</span>
                </div>
            `;
        }
    }

    loadChat(chatId) {
        const chat = this.chatHistoryData.find(c => c.id === chatId);
        if (!chat) {
            console.error('❌ Chat not found:', chatId);
            return;
        }

        console.log('📖 Loading chat session:', chatId);
        
        // Set current chat
        this.currentChatId = chatId;
        
        // Clear current messages
        this.messages.innerHTML = '';
        
        // Restore conversation context from chat history
        this.conversationContext = [];
        for (let i = 0; i < chat.messages.length; i += 2) {
            if (i + 1 < chat.messages.length) {
                this.conversationContext.push({
                    user: chat.messages[i].text,
                    assistant: chat.messages[i + 1].text,
                    timestamp: chat.messages[i].timestamp
                });
            }
        }
        
        // Load chat messages
        chat.messages.forEach(msg => {
            this.addMessage(msg.sender, msg.text);
        });
        
        // Update active state
        document.querySelectorAll('.history-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeItem = this.chatHistoryContainer.querySelector(`[data-chat-id="${chatId}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
        
        // Show chat container
        this.createNewChat();
        
        console.log('✅ Chat session loaded:', chatId);
    }

    clearChatHistory() {
        if (confirm('Are you sure you want to clear all chat history? This action cannot be undone.')) {
            this.chatHistoryData = [];
            localStorage.removeItem('geminiRAGChatHistory');
            this.chatHistoryContainer.innerHTML = '';
            this.currentChatId = null;
            this.hideMessagesContainer();
            this.showWelcomeMessage();
            console.log('🗑️ Chat history cleared');
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

    // Intelligent Document Chunking
    createDocumentChunks(text, documentName) {
        const chunks = [];
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        
        let currentChunk = '';
        let chunkId = 0;
        
        for (let i = 0; i < sentences.length; i++) {
            const sentence = sentences[i].trim();
            
            // If adding this sentence would exceed chunk size, save current chunk
            if (currentChunk.length + sentence.length > this.maxChunkSize && currentChunk.length > 0) {
                chunks.push({
                    id: `${documentName}_chunk_${chunkId}`,
                    content: currentChunk.trim(),
                    documentName: documentName,
                    chunkIndex: chunkId
                });
                
                // Start new chunk with overlap
                const overlapText = currentChunk.slice(-this.overlapSize);
                currentChunk = overlapText + ' ' + sentence;
                chunkId++;
            } else {
                currentChunk += (currentChunk ? '. ' : '') + sentence;
            }
        }
        
        // Add the last chunk if it has content
        if (currentChunk.trim().length > 0) {
            chunks.push({
                id: `${documentName}_chunk_${chunkId}`,
                content: currentChunk.trim(),
                documentName: documentName,
                chunkIndex: chunkId
            });
        }
        
        return chunks;
    }

    async processDocumentChunks() {
        if (!this.isEmbeddingModelReady) {
            console.warn('⚠️ Embedding model not ready, skipping chunk processing');
            return;
        }
        
        console.log('🔍 Processing document chunks...');
        this.documentChunks = [];
        this.chunkEmbeddings = [];
        
        for (const doc of this.documents) {
            if (doc.processed && doc.content) {
                const chunks = this.createDocumentChunks(doc.content, doc.name);
                this.documentChunks.push(...chunks);
                console.log(`📄 Created ${chunks.length} chunks for ${doc.name}`);
            }
        }
        
        // Generate embeddings for all chunks
        if (this.documentChunks.length > 0) {
            await this.generateChunkEmbeddings();
        }
    }

    async generateChunkEmbeddings() {
        try {
            console.log('🔍 Generating embeddings for chunks...');
            const chunkTexts = this.documentChunks.map(chunk => chunk.content);
            const embeddings = await this.embeddingModel.embed(chunkTexts);
            
            // Convert to regular arrays for easier manipulation
            this.chunkEmbeddings = await embeddings.array();
            console.log(`✅ Generated embeddings for ${this.chunkEmbeddings.length} chunks`);
        } catch (error) {
            console.error('❌ Error generating embeddings:', error);
        }
    }

    // Semantic Search for Relevant Chunks
    async findRelevantChunks(query, topK = 5) {
        if (!this.isEmbeddingModelReady || this.chunkEmbeddings.length === 0) {
            console.warn('⚠️ Embeddings not available, returning empty results');
            return [];
        }
        
        try {
            // Generate embedding for the query
            const queryEmbedding = await this.embeddingModel.embed([query]);
            const queryVector = await queryEmbedding.array();
            
            // Calculate cosine similarity with all chunks
            const similarities = this.chunkEmbeddings.map((chunkEmbedding, index) => {
                const similarity = this.cosineSimilarity(queryVector[0], chunkEmbedding);
                return {
                    index,
                    similarity,
                    chunk: this.documentChunks[index]
                };
            });
            
            // Sort by similarity and return top K results
            similarities.sort((a, b) => b.similarity - a.similarity);
            const topChunks = similarities.slice(0, topK);
            
            console.log(`🔍 Found ${topChunks.length} relevant chunks for query: "${query}"`);
            return topChunks;
        } catch (error) {
            console.error('❌ Error in semantic search:', error);
            return [];
        }
    }

    cosineSimilarity(vecA, vecB) {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        
        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }
        
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    // Conversation Context Management
    addToConversationContext(userMessage, assistantResponse) {
        this.conversationContext.push({
            user: userMessage,
            assistant: assistantResponse,
            timestamp: new Date().toISOString()
        });
        
        // Keep only last 5 exchanges to manage context length
        if (this.conversationContext.length > 5) {
            this.conversationContext = this.conversationContext.slice(-5);
        }
    }

    getConversationContext() {
        if (this.conversationContext.length === 0) return '';
        
        return this.conversationContext.map(exchange => 
            `User: ${exchange.user}\nAssistant: ${exchange.assistant}`
        ).join('\n\n');
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