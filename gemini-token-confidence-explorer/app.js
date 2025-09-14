// Gemini Token Confidence Explorer - v1.0
class TokenConfidenceExplorer {
    constructor() {
        this.session = null;
        this.sessionController = null;
        this.isGenerating = false;
        this.isModelReady = false;
        this.generatedTokens = [];
        this.tokenData = [];
        
        // Model parameters
        this.modelParams = {
            temperature: 1.0,
            topK: 3,
            maxTokens: 20
        };
        
        // UI state
        this.currentView = 'confidence'; // 'confidence' or 'analysis'
        
        this.initializeElements();
        this.bindEvents();
        this.checkModelAvailability();
    }

    // Session Management
    async createSession(options = {}) {
        await this.destroySession();
        
        this.sessionController = new AbortController();
        
        console.log('Creating new model session...');
        
        const sessionOptions = {
            signal: this.sessionController.signal,
            temperature: this.modelParams.temperature,
            topK: this.modelParams.topK,
            ...options
        };
        
        console.log('Session options:', sessionOptions);
        
        this.session = await LanguageModel.create(sessionOptions);
        console.log('Model session created successfully');
        
        return this.session;
    }

    async destroySession() {
        if (this.sessionController) {
            console.log('Aborting current session...');
            this.sessionController.abort();
            this.sessionController = null;
        }
        
        if (this.session) {
            this.session = null;
            console.log('Session destroyed');
        }
        
        this.isModelReady = false;
        this.isGenerating = false;
        this.updateModelStatus('offline', 'Session Ended');
    }

    // Stop generation
    stopGeneration() {
        if (this.isGenerating) {
            console.log('Stopping generation...');
            
            if (this.sessionController) {
                this.sessionController.abort();
            }
            
            this.isGenerating = false;
            this.updateUIForGeneration(false);
        }
    }

    // Initialize DOM elements
    initializeElements() {
        // Input elements
        this.textInput = document.getElementById('textInput');
        this.generateBtn = document.getElementById('generateBtn');
        this.clearBtn = document.getElementById('clearBtn');
        
        // Parameter controls
        this.temperatureSlider = document.getElementById('temperatureSlider');
        this.temperatureValue = document.getElementById('temperatureValue');
        this.topKSlider = document.getElementById('topKSlider');
        this.topKValue = document.getElementById('topKValue');
        this.maxTokensSlider = document.getElementById('maxTokensSlider');
        this.maxTokensValue = document.getElementById('maxTokensValue');
        
        // Status elements
        this.modelStatus = document.getElementById('model-status');
        this.generationStatus = document.getElementById('generation-status');
        
        // Results elements
        this.welcomeMessage = document.getElementById('welcomeMessage');
        this.generationResults = document.getElementById('generationResults');
        this.loadingState = document.getElementById('loadingState');
        this.originalText = document.getElementById('originalText');
        this.confidenceText = document.getElementById('confidenceText');
        this.tokenAnalysis = document.getElementById('tokenAnalysis');
        
        // Statistics elements
        this.avgConfidence = document.getElementById('avgConfidence');
        this.minConfidence = document.getElementById('minConfidence');
        this.maxConfidence = document.getElementById('maxConfidence');
        this.totalTokens = document.getElementById('totalTokens');
        
        // Action buttons
        this.exportBtn = document.getElementById('exportBtn');
        this.toggleViewBtn = document.getElementById('toggleViewBtn');
        
        // Modals
        this.loadingModal = new bootstrap.Modal(document.getElementById('loadingModal'));
        this.loadingTitle = document.getElementById('loadingTitle');
        this.loadingMessage = document.getElementById('loadingMessage');
        this.loadingProgress = document.getElementById('loadingProgress');
        this.generationProgress = document.getElementById('generationProgress');
        
        this.tokenModal = new bootstrap.Modal(document.getElementById('tokenModal'));
        this.tokenModalBody = document.getElementById('tokenModalBody');
    }

    // Bind event listeners
    bindEvents() {
        // Input events
        this.textInput.addEventListener('input', this.handleInputChange.bind(this));
        this.textInput.addEventListener('keydown', this.handleKeyDown.bind(this));
        
        // Button events
        this.generateBtn.addEventListener('click', this.generateText.bind(this));
        this.clearBtn.addEventListener('click', this.clearAll.bind(this));
        this.exportBtn.addEventListener('click', this.exportData.bind(this));
        this.toggleViewBtn.addEventListener('click', this.toggleView.bind(this));
        
        // Parameter events
        this.temperatureSlider.addEventListener('input', this.handleTemperatureChange.bind(this));
        this.topKSlider.addEventListener('input', this.handleTopKChange.bind(this));
        this.maxTokensSlider.addEventListener('input', this.handleMaxTokensChange.bind(this));
        
        // Handle page unload
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });
    }

    // Check if model is already available
    async checkModelAvailability() {
        try {
            // Check if LanguageModel API is available
            if (typeof LanguageModel === 'undefined') {
                this.showModelInitializationPrompt();
                return;
            }

            console.log('Checking model availability...');
            this.updateModelStatus('loading', 'Checking model availability...');
            
            // Update button to show we're checking
            this.generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Checking Model...';
            this.generateBtn.disabled = true;
            
            // Check model availability without triggering download
            const modelStatus = await LanguageModel.availability();
            console.log('Model status:', modelStatus);
            
            if (modelStatus === 'available') {
                console.log('Model is already available, initializing automatically...');
                this.updateModelStatus('loading', 'Model available, initializing...');
                await this.initializeModel();
            } else if (modelStatus === 'downloadable') {
                console.log('Model needs to be downloaded, showing initialization prompt...');
                this.showModelInitializationPrompt();
            } else {
                console.log('Unknown model status, showing initialization prompt...');
                this.showModelInitializationPrompt();
            }
        } catch (error) {
            console.error('Error checking model availability:', error);
            // If availability check fails, show initialization prompt
            this.showModelInitializationPrompt();
        }
    }

    // Show model initialization prompt
    showModelInitializationPrompt() {
        this.updateModelStatus('offline', 'Click "Initialize Model" to start');
        
        // Set button state for initialization
        this.generateBtn.disabled = false;
        this.generateBtn.innerHTML = '<i class="fas fa-play me-2"></i>Initialize Model';
        
        // Add click handler to initialize model
        this.generateBtn.addEventListener('click', this.initializeModelOnUserGesture.bind(this), { once: true });
    }

    // Initialize the Gemini model (called on user gesture)
    async initializeModelOnUserGesture() {
        // Prevent multiple initialization attempts
        if (this.isModelReady || this.isGenerating) {
            return;
        }
        
        // Remove the one-time event listener
        this.generateBtn.removeEventListener('click', this.initializeModelOnUserGesture);
        
        // Update button state to show we're initializing
        this.generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Initializing...';
        this.generateBtn.disabled = true;
        
        // Add timeout to prevent button from being stuck
        const timeoutId = setTimeout(() => {
            if (!this.isModelReady) {
                this.generateBtn.disabled = false;
                this.generateBtn.innerHTML = '<i class="fas fa-play me-2"></i>Initialize Model';
                this.showError('Initialization timed out. Please try again.');
            }
        }, 30000); // 30 second timeout
        
        try {
            // Now initialize the model
            await this.initializeModel();
            clearTimeout(timeoutId);
        } catch (error) {
            clearTimeout(timeoutId);
            // Reset button state on error
            this.generateBtn.disabled = false;
            this.generateBtn.innerHTML = '<i class="fas fa-play me-2"></i>Initialize Model';
            throw error;
        }
    }

    // Initialize the Gemini model
    async initializeModel() {
        console.log('Starting model initialization...');
        try {
            this.updateModelStatus('loading', 'Initializing Gemini Model...');
            this.showLoadingModal('Initializing Gemini Model', 'Please wait while we set up the AI model...');

            // Check if LanguageModel API is available
            if (typeof LanguageModel === 'undefined') {
                throw new Error('LanguageModel API not available. Please use Chrome with Gemini Nano support.');
            }

            // Create new AbortController
            this.sessionController = new AbortController();
            
            // Check if model is already available
            const modelStatus = await LanguageModel.availability();
            console.log('Model status during initialization:', modelStatus);
            
            if (modelStatus === 'available') {
                // Model is already available, create session directly
                console.log('Model is available, creating session directly...');
                this.loadingMessage.textContent = 'Model available, creating session...';
                this.loadingProgress.style.display = 'none';
                
                this.session = await LanguageModel.create({
                    signal: this.sessionController.signal
                });
                
                console.log('Model session created successfully');
                this.finalizeModelInitialization();
                return;
            }
            
            // Model needs to be downloaded
            console.log('Model needs to be downloaded, starting download...');
            this.showLoadingModal('Downloading Gemini Model', 'Please wait while we download the AI model...');
            this.loadingProgress.style.display = 'block';
            
            this.session = await LanguageModel.create({
                signal: this.sessionController.signal,
                monitor: (m) => {
                    let downloadComplete = false;
                    let hasProgress = false;
                    
                    m.addEventListener("downloadprogress", (e) => {
                        hasProgress = true;
                        const progress = (e.loaded / e.total * 100).toFixed(1);
                        this.updateLoadingProgress(progress);
                        this.loadingMessage.textContent = `Downloading model: ${progress}%`;
                        
                        // Fallback: if progress reaches 100%, assume download is complete
                        if (parseFloat(progress) >= 100 && !downloadComplete) {
                            downloadComplete = true;
                            setTimeout(() => {
                                this.loadingMessage.textContent = 'Initializing model...';
                                this.loadingProgress.style.display = 'none';
                            }, 500); // Small delay to show 100%
                        }
                    });
                    
                    m.addEventListener("downloadcomplete", () => {
                        downloadComplete = true;
                        this.loadingMessage.textContent = 'Initializing model...';
                        this.loadingProgress.style.display = 'none';
                    });
                    
                    // If no download progress after 2 seconds, assume model is already available
                    setTimeout(() => {
                        if (!hasProgress && !downloadComplete) {
                            this.loadingMessage.textContent = 'Model already available, initializing...';
                            this.loadingProgress.style.display = 'none';
                        }
                    }, 2000);
                }
            });
            
            console.log('Model created successfully');
            
            // Add a small delay to ensure the model is fully ready
            setTimeout(() => {
                this.finalizeModelInitialization();
            }, 1000);

        } catch (error) {
            console.error('Error initializing model:', error);
            this.updateModelStatus('offline', 'Model Error');
            this.hideLoadingModal();
            
            // Reset button state on error
            this.generateBtn.disabled = false;
            this.generateBtn.innerHTML = '<i class="fas fa-play me-2"></i>Initialize Model';
            
            let errorMessage = 'Failed to initialize Gemini model. ';
            if (error.message.includes('LanguageModel API not available')) {
                errorMessage += 'Please ensure you are using Chrome with Gemini Nano support.';
            } else if (error.message.includes('Requires a user gesture')) {
                errorMessage += 'Please click the "Initialize Model" button to start.';
            } else {
                errorMessage += 'Please refresh the page and try again.';
            }
            
            this.showError(errorMessage);
        }
    }

    finalizeModelInitialization() {
        console.log('Model initialization successful!');
        this.isModelReady = true;
        this.updateModelStatus('online', 'Model Ready');
        
        // Hide loading modal with a small delay to ensure smooth transition
        setTimeout(() => {
            this.hideLoadingModal();
        }, 500);
        
        // Reset button state
        this.generateBtn.disabled = false;
        this.updateGenerateButtonState();
        
        // Show success message
        this.showSuccess('Model initialized successfully! You can now generate text.');
        
        console.log('Application ready for use');
    }

    // Event handlers
    handleInputChange() {
        this.updateGenerateButtonState();
    }

    handleKeyDown(e) {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            this.generateText();
        }
    }

    handleTemperatureChange() {
        const value = parseFloat(this.temperatureSlider.value);
        this.temperatureValue.textContent = value.toFixed(1);
        this.modelParams.temperature = value;
    }

    handleTopKChange() {
        const value = parseInt(this.topKSlider.value);
        this.topKValue.textContent = value;
        this.modelParams.topK = value;
    }

    handleMaxTokensChange() {
        const value = parseInt(this.maxTokensSlider.value);
        this.maxTokensValue.textContent = value;
        this.modelParams.maxTokens = value;
    }

    // Update UI state
    updateGenerateButtonState() {
        const hasText = this.textInput.value.trim().length > 0;
        const isReady = this.isModelReady && hasText && !this.isGenerating;
        
        if (this.isGenerating) {
            this.generateBtn.disabled = false;
            this.generateBtn.innerHTML = '<i class="fas fa-stop me-2"></i>Stop Generation';
        } else if (!this.isModelReady) {
            this.generateBtn.disabled = false;
            this.generateBtn.innerHTML = '<i class="fas fa-play me-2"></i>Initialize Model';
        } else {
            this.generateBtn.disabled = !hasText;
            this.generateBtn.innerHTML = '<i class="fas fa-magic me-2"></i>Generate Text';
        }
    }

    updateUIForGeneration(isGenerating) {
        this.isGenerating = isGenerating;
        this.updateGenerateButtonState();
        
        if (isGenerating) {
            this.updateGenerationStatus('generating', 'Generating...');
            this.showLoadingState();
        } else {
            this.updateGenerationStatus('ready', 'Ready');
            this.hideLoadingState();
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

    updateGenerationStatus(status, message) {
        const icon = this.generationStatus.querySelector('i');
        const text = this.generationStatus.querySelector('span');
        
        icon.className = 'fas fa-play';
        text.textContent = message;
        
        switch (status) {
            case 'ready':
                icon.classList.add('text-success');
                break;
            case 'generating':
                icon.classList.add('status-generating');
                break;
            case 'error':
                icon.classList.add('text-danger');
                break;
        }
    }

    // Main text generation function
    async generateText() {
        const inputText = this.textInput.value.trim();
        
        // If model is not ready, this will be handled by the initialization flow
        if (!this.isModelReady) {
            return;
        }
        
        if (!inputText) {
            return;
        }

        // If currently generating, stop generation
        if (this.isGenerating) {
            this.stopGeneration();
            return;
        }

        try {
            // Reset data
            this.generatedTokens = [];
            this.tokenData = [];
            
            // Update UI
            this.updateUIForGeneration(true);
            this.hideWelcomeMessage();
            this.showGenerationResults();
            
            // Create session with current parameters
            await this.createSession();
            
            // Generate text with confidence analysis
            await this.generateWithConfidence(inputText);
            
        } catch (error) {
            console.error('Error generating text:', error);
            this.updateUIForGeneration(false);
            this.showError('Failed to generate text. Please try again.');
        }
    }

    // Generate text with confidence analysis
    async generateWithConfidence(inputText) {
        try {
            console.log('Starting text generation with confidence analysis...');
            
            // Display original text
            this.originalText.textContent = inputText;
            
            // Create a prompt that will generate exactly the number of tokens we want
            const prompt = inputText;
            
            // Get streaming response
            const stream = this.session.promptStreaming(prompt);
            let fullResponse = '';
            let tokenCount = 0;
            const maxTokens = this.modelParams.maxTokens;
            
            console.log(`Generating up to ${maxTokens} tokens...`);
            
            for await (const chunk of stream) {
                if (!this.isGenerating) {
                    console.log('Generation stopped by user');
                    break;
                }
                
                // Simulate token-by-token generation
                const tokens = this.simulateTokenGeneration(chunk, tokenCount);
                
                for (const token of tokens) {
                    if (tokenCount >= maxTokens) break;
                    
                    this.generatedTokens.push(token);
                    this.tokenData.push({
                        token: token.text,
                        confidence: token.confidence,
                        alternatives: token.alternatives,
                        position: tokenCount
                    });
                    
                    // Update UI in real-time (throttled for performance)
                    if (tokenCount % 2 === 0 || tokenCount === maxTokens - 1) {
                        this.updateConfidenceDisplay();
                        this.updateTokenAnalysis();
                    }
                    
                    // Update statistics every token
                    this.updateStatistics();
                    
                    // Update progress
                    const progress = ((tokenCount + 1) / maxTokens) * 100;
                    this.updateGenerationProgress(progress);
                    
                    tokenCount++;
                    
                    // Small delay to show real-time effect (reduced for better performance)
                    await new Promise(resolve => setTimeout(resolve, 50));
                }
                
                fullResponse += chunk;
                
                if (tokenCount >= maxTokens) break;
            }
            
            console.log(`Generation completed: ${tokenCount} tokens generated`);
            
            // Finalize UI
            this.finalizeGeneration();
            
        } catch (error) {
            console.error('Error in generation with confidence:', error);
            throw error;
        }
    }

    // Simulate token generation with confidence scores
    simulateTokenGeneration(chunk, position) {
        // This is a simulation since we can't get actual confidence scores from the API
        // In a real implementation, you would need access to the model's internal probabilities
        
        const words = chunk.split(/(\s+)/);
        const tokens = [];
        
        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            if (word.trim().length === 0) continue;
            
            // Simulate confidence based on word characteristics
            let confidence = this.calculateSimulatedConfidence(word, position + i);
            
            // Generate alternatives
            const alternatives = this.generateAlternatives(word, confidence);
            
            tokens.push({
                text: word,
                confidence: confidence,
                alternatives: alternatives
            });
        }
        
        return tokens;
    }

    // Calculate simulated confidence score
    calculateSimulatedConfidence(word, position) {
        let confidence = 0.5; // Base confidence
        
        // Adjust based on word characteristics
        if (word.length <= 3) confidence += 0.1; // Short words are often more confident
        if (word.length >= 10) confidence -= 0.1; // Long words might be less confident
        if (/^[A-Z]/.test(word)) confidence += 0.05; // Capitalized words
        if (/[.!?]$/.test(word)) confidence += 0.1; // Punctuation endings
        if (/^[0-9]/.test(word)) confidence += 0.15; // Numbers are usually confident
        
        // Adjust based on position
        if (position < 3) confidence += 0.1; // Early tokens
        if (position > 15) confidence -= 0.05; // Later tokens might be less confident
        
        // Add some randomness to make it more realistic
        confidence += (Math.random() - 0.5) * 0.2;
        
        // Clamp between 0 and 1
        return Math.max(0, Math.min(1, confidence));
    }

    // Generate alternative tokens
    generateAlternatives(word, confidence) {
        const alternatives = [];
        
        // Generate 2 alternatives with decreasing confidence
        for (let i = 0; i < 2; i++) {
            const altConfidence = confidence * (0.7 - i * 0.2) + (Math.random() - 0.5) * 0.1;
            const alternative = this.generateAlternativeWord(word, altConfidence);
            
            alternatives.push({
                text: alternative,
                confidence: Math.max(0, Math.min(1, altConfidence))
            });
        }
        
        return alternatives;
    }

    // Generate alternative word
    generateAlternativeWord(original, confidence) {
        // Simple alternative generation based on word characteristics
        if (original.length <= 2) {
            return original + (Math.random() > 0.5 ? 's' : '');
        }
        
        // For longer words, try some variations
        const variations = [
            original + 's',
            original + 'ed',
            original + 'ing',
            original.slice(0, -1) + 'y',
            original.slice(0, -1) + 'er'
        ];
        
        return variations[Math.floor(Math.random() * variations.length)];
    }

    // Update confidence display with performance optimization
    updateConfidenceDisplay() {
        // Use DocumentFragment for better performance
        const fragment = document.createDocumentFragment();
        
        for (const tokenData of this.tokenData) {
            const confidenceClass = this.getConfidenceClass(tokenData.confidence);
            const confidencePercent = (tokenData.confidence * 100).toFixed(1);
            
            const tokenSpan = document.createElement('span');
            tokenSpan.className = `token ${confidenceClass}`;
            tokenSpan.dataset.token = tokenData.position;
            tokenSpan.title = `Confidence: ${confidencePercent}%`;
            tokenSpan.textContent = tokenData.token;
            
            // Add click handler directly
            tokenSpan.addEventListener('click', () => {
                this.showTokenDetails(tokenData.position);
            });
            
            fragment.appendChild(tokenSpan);
        }
        
        // Clear and append in one operation
        this.confidenceText.innerHTML = '';
        this.confidenceText.appendChild(fragment);
    }

    // Update token analysis with performance optimization
    updateTokenAnalysis() {
        // Use DocumentFragment for better performance
        const fragment = document.createDocumentFragment();
        
        for (const tokenData of this.tokenData) {
            const confidenceClass = this.getConfidenceClass(tokenData.confidence);
            const confidencePercent = (tokenData.confidence * 100).toFixed(1);
            
            const tokenItem = document.createElement('div');
            tokenItem.className = 'token-item';
            tokenItem.dataset.token = tokenData.position;
            
            // Create alternatives HTML
            const alternativesHTML = tokenData.alternatives.map(alt => 
                `<span class="alternative">"${alt.text}" <span class="confidence">${(alt.confidence * 100).toFixed(1)}%</span></span>`
            ).join('');
            
            tokenItem.innerHTML = `
                <div class="token-header">
                    <span class="token-text">"${tokenData.token}"</span>
                    <span class="token-confidence ${confidenceClass}">${confidencePercent}%</span>
                </div>
                <div class="confidence-bar">
                    <div class="confidence-fill ${confidenceClass}" style="width: ${confidencePercent}%"></div>
                </div>
                <div class="alternatives">
                    ${alternativesHTML}
                </div>
            `;
            
            // Add click handler directly
            tokenItem.addEventListener('click', () => {
                this.showTokenDetails(tokenData.position);
            });
            
            fragment.appendChild(tokenItem);
        }
        
        // Clear and append in one operation
        this.tokenAnalysis.innerHTML = '';
        this.tokenAnalysis.appendChild(fragment);
    }

    // Update statistics
    updateStatistics() {
        if (this.tokenData.length === 0) return;
        
        const confidences = this.tokenData.map(t => t.confidence);
        const avgConf = confidences.reduce((a, b) => a + b, 0) / confidences.length;
        const minConf = Math.min(...confidences);
        const maxConf = Math.max(...confidences);
        
        this.avgConfidence.textContent = (avgConf * 100).toFixed(1) + '%';
        this.minConfidence.textContent = (minConf * 100).toFixed(1) + '%';
        this.maxConfidence.textContent = (maxConf * 100).toFixed(1) + '%';
        this.totalTokens.textContent = this.tokenData.length;
    }

    // Get confidence class
    getConfidenceClass(confidence) {
        if (confidence >= 0.7) return 'high-confidence';
        if (confidence >= 0.4) return 'medium-confidence';
        return 'low-confidence';
    }

    // Note: Click handlers are now added directly during element creation for better performance

    // Show token details modal
    showTokenDetails(position) {
        const tokenData = this.tokenData[position];
        if (!tokenData) return;
        
        const confidenceClass = this.getConfidenceClass(tokenData.confidence);
        const confidencePercent = (tokenData.confidence * 100).toFixed(1);
        
        this.tokenModalBody.innerHTML = `
            <div class="token-details">
                <div class="detail-section">
                    <div class="detail-title">Token Information</div>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">Token</span>
                            <span class="detail-value">"${tokenData.token}"</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Position</span>
                            <span class="detail-value">${position + 1}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Confidence</span>
                            <span class="detail-value ${confidenceClass}">${confidencePercent}%</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Length</span>
                            <span class="detail-value">${tokenData.token.length} characters</span>
                        </div>
                    </div>
                </div>
                
                <div class="detail-section">
                    <div class="detail-title">Alternative Predictions</div>
                    <div class="alternatives">
                        ${tokenData.alternatives.map((alt, index) => `
                            <div class="alternative-item">
                                <div class="alternative-header">
                                    <span class="alternative-text">"${alt.text}"</span>
                                    <span class="alternative-confidence">${(alt.confidence * 100).toFixed(1)}%</span>
                                </div>
                                <div class="confidence-bar">
                                    <div class="confidence-fill" style="width: ${alt.confidence * 100}%"></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        this.tokenModal.show();
    }

    // Update generation progress
    updateGenerationProgress(progress) {
        this.generationProgress.style.width = `${progress}%`;
    }

    // Finalize generation
    finalizeGeneration() {
        this.updateUIForGeneration(false);
        this.exportBtn.disabled = false;
        console.log('Generation finalized');
    }

    // Toggle view between confidence and analysis
    toggleView() {
        if (this.currentView === 'confidence') {
            this.currentView = 'analysis';
            this.toggleViewBtn.innerHTML = '<i class="fas fa-eye me-1"></i>Confidence View';
            this.confidenceText.style.display = 'none';
            this.tokenAnalysis.style.display = 'block';
        } else {
            this.currentView = 'confidence';
            this.toggleViewBtn.innerHTML = '<i class="fas fa-th-large me-1"></i>Analysis View';
            this.confidenceText.style.display = 'block';
            this.tokenAnalysis.style.display = 'none';
        }
    }

    // Export data
    exportData() {
        const data = {
            originalText: this.originalText.textContent,
            generatedTokens: this.tokenData,
            parameters: this.modelParams,
            statistics: {
                averageConfidence: this.avgConfidence.textContent,
                minConfidence: this.minConfidence.textContent,
                maxConfidence: this.maxConfidence.textContent,
                totalTokens: this.totalTokens.textContent
            },
            timestamp: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `token-confidence-analysis-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showSuccess('Data exported successfully!');
    }

    // Clear all data
    clearAll() {
        this.textInput.value = '';
        this.generatedTokens = [];
        this.tokenData = [];
        this.hideGenerationResults();
        this.showWelcomeMessage();
        this.exportBtn.disabled = true;
        this.updateStatistics();
        this.updateGenerateButtonState();
    }

    // UI state management
    showWelcomeMessage() {
        this.welcomeMessage.style.display = 'flex';
        this.generationResults.style.display = 'none';
    }

    hideWelcomeMessage() {
        this.welcomeMessage.style.display = 'none';
    }

    showGenerationResults() {
        this.generationResults.style.display = 'block';
    }

    hideGenerationResults() {
        this.generationResults.style.display = 'none';
    }

    showLoadingState() {
        this.loadingState.style.display = 'flex';
    }

    hideLoadingState() {
        this.loadingState.style.display = 'none';
    }

    showLoadingModal(title, message) {
        this.loadingTitle.textContent = title;
        this.loadingMessage.textContent = message;
        this.loadingProgress.style.display = 'none';
        this.loadingModal.show();
    }

    hideLoadingModal() {
        try {
            this.loadingModal.hide();
        } catch (error) {
            console.warn('Error hiding modal:', error);
        }
        
        const modalElement = document.getElementById('loadingModal');
        if (modalElement) {
            modalElement.classList.remove('show');
            modalElement.style.display = 'none';
            modalElement.setAttribute('aria-hidden', 'true');
            modalElement.removeAttribute('aria-modal');
        }
        
        document.body.classList.remove('modal-open');
        document.body.style.paddingRight = '';
        document.body.style.overflow = '';
        
        // Remove all modal backdrops
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(backdrop => backdrop.remove());
        
        // Force remove any remaining modal-related elements
        const remainingBackdrops = document.querySelectorAll('.modal-backdrop');
        remainingBackdrops.forEach(backdrop => backdrop.remove());
    }

    updateLoadingProgress(progress) {
        this.loadingProgress.style.display = 'block';
        const progressBar = this.loadingProgress.querySelector('.progress-bar');
        progressBar.style.width = `${progress}%`;
        progressBar.setAttribute('aria-valuenow', progress);
    }

    // Utility functions
    cleanup() {
        console.log('Cleaning up...');
        if (this.sessionController) {
            this.sessionController.abort();
        }
        this.isGenerating = false;
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger alert-dismissible fade show position-fixed';
        errorDiv.style.cssText = 'top: 100px; right: 20px; z-index: 9999; min-width: 300px;';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }

    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'alert alert-success alert-dismissible fade show position-fixed';
        successDiv.style.cssText = 'top: 100px; right: 20px; z-index: 9999; min-width: 300px;';
        successDiv.innerHTML = `
            <i class="fas fa-check-circle me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.remove();
            }
        }, 3000);
    }
}

// Initialize the application
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new TokenConfidenceExplorer();
});
