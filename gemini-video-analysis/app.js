// Gemini Video Analysis Application
class VideoAnalysisApp {
    constructor() {
        this.currentMedia = null;
        this.mediaType = null; // 'video' or 'audio'
        this.analysisSession = null;
        this.chatHistory = [];
        this.isAnalyzing = false;
        
        this.initializeElements();
        this.setupEventListeners();
        this.initializeGeminiSession();
    }

    // Initialize DOM elements
    initializeElements() {
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');

        this.mediaPlayer = document.getElementById('mediaPlayer');
        this.videoPlayer = document.getElementById('videoPlayer');
        this.audioPlayer = document.getElementById('audioPlayer');
        this.analysisStatus = document.getElementById('analysisStatus');
        this.statusText = document.getElementById('statusText');
        this.progressBar = document.querySelector('.progress-bar');
        this.questionSection = document.getElementById('questionSection');
        this.questionInput = document.getElementById('questionInput');
        this.askQuestionBtn = document.getElementById('askQuestion');
        this.chatHistory = document.getElementById('chatHistory');
    }

    // Setup event listeners
    setupEventListeners() {
        // File upload events
        this.fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        
        // Drag and drop events
        this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
        

        
        // Question asking
        this.askQuestionBtn.addEventListener('click', () => this.askQuestion());
        this.questionInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.askQuestion();
        });
        
        // Media player events
        this.videoPlayer.addEventListener('loadedmetadata', () => this.onMediaLoaded());
        this.audioPlayer.addEventListener('loadedmetadata', () => this.onMediaLoaded());
    }

    // Initialize Gemini session
    async initializeGeminiSession() {
        try {
            // Check if LanguageModel is available (Chrome 138+)
            if (typeof LanguageModel !== 'undefined') {
                this.analysisSession = await LanguageModel.create({
                    expectedInputs: [
                        { type: 'audio' }, 
                        { type: 'image' },
                        { type: 'text' }
                    ],
                });
                console.log('Gemini session initialized successfully');
            } else {
                console.warn('LanguageModel not available. Using mock responses for demo.');
                this.analysisSession = null;
            }
        } catch (error) {
            console.error('Failed to initialize Gemini session:', error);
            this.analysisSession = null;
        }
    }

    // Handle file upload
    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (file) {
            await this.processFile(file);
        }
    }

    // Handle drag over
    handleDragOver(event) {
        event.preventDefault();
        this.uploadArea.classList.add('dragover');
    }

    // Handle drag leave
    handleDragLeave(event) {
        event.preventDefault();
        this.uploadArea.classList.remove('dragover');
    }

    // Handle drop
    async handleDrop(event) {
        event.preventDefault();
        this.uploadArea.classList.remove('dragover');
        
        const files = event.dataTransfer.files;
        if (files.length > 0) {
            await this.processFile(files[0]);
        }
    }

    // Process uploaded file
    async processFile(file) {
        try {
            // Validate file type
            if (!this.isValidFileType(file)) {
                this.showError('Please upload a valid video or audio file.');
                return;
            }

            // Check file size (max 100MB)
            if (file.size > 100 * 1024 * 1024) {
                this.showError('File size must be less than 100MB.');
                return;
            }

            this.currentMedia = file;
            this.mediaType = file.type.startsWith('video/') ? 'video' : 'audio';
            
            // Display media player
            this.displayMediaPlayer(file);
            
            // Start analysis
            await this.analyzeMedia(file);
            
        } catch (error) {
            console.error('Error processing file:', error);
            this.showError('Error processing file. Please try again.');
        }
    }

    // Validate file type
    isValidFileType(file) {
        const validTypes = [
            'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
            'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/aac'
        ];
        return validTypes.includes(file.type);
    }

    // Display media player
    displayMediaPlayer(file) {
        const url = URL.createObjectURL(file);
        
        if (this.mediaType === 'video') {
            this.videoPlayer.src = url;
            this.videoPlayer.style.display = 'block';
            this.audioPlayer.style.display = 'none';
        } else {
            this.audioPlayer.src = url;
            this.audioPlayer.style.display = 'block';
            this.videoPlayer.style.display = 'none';
        }
        
        this.mediaPlayer.style.display = 'block';
    }

    // Handle media loaded
    onMediaLoaded() {
        console.log('Media loaded successfully');
    }

    // Analyze media content
    async analyzeMedia(file) {
        if (this.isAnalyzing) return;
        
        this.isAnalyzing = true;
        this.showAnalysisStatus();
        
        try {
            // Update progress
            this.updateProgress(10, 'Reading media file...');
            
            // Extract frames from video or process audio
            const mediaData = await this.extractMediaData(file);
            
            this.updateProgress(30, 'Processing media content...');
            
            // Analyze with Gemini
            const analysis = await this.analyzeWithGemini(mediaData, file);
            
            this.updateProgress(70, 'Generating analysis...');
            
            // Store analysis results
            this.mediaAnalysis = analysis;
            console.log('Media analysis completed:', {
                type: this.mediaType,
                hasFrames: analysis.frames ? analysis.frames.length : 0,
                hasAudio: analysis.hasAudio,
                summary: analysis.summary ? analysis.summary.substring(0, 100) + '...' : 'No summary'
            });
            
            this.updateProgress(100, 'Analysis complete!');
            
            // Show question interface
            setTimeout(() => {
                this.hideAnalysisStatus();
                this.showQuestionInterface();
                if (analysis.error) {
                    this.addSystemMessage('Analysis failed. Please try uploading your media file again.');
                } else {
                    this.addSystemMessage('Media analysis complete! You can now ask questions about the content.');
                }
            }, 1000);
            
        } catch (error) {
            console.error('Error analyzing media:', error);
            this.showError('Error analyzing media. Please try again.');
        } finally {
            this.isAnalyzing = false;
        }
    }

    // Extract media data for analysis
    async extractMediaData(file) {
        return new Promise((resolve) => {
            if (this.mediaType === 'video') {
                this.extractVideoWithAudio(file, resolve);
            } else {
                this.extractAudioData(file, resolve);
            }
        });
    }

    // Extract video frames and audio
    extractVideoWithAudio(file, resolve) {
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const frames = [];
        let audioBlob = null;
        
        video.onloadedmetadata = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            // Extract frames at regular intervals
            const duration = video.duration;
            const frameInterval = Math.max(1, Math.floor(duration / 10)); // 10 frames max
            
            let currentTime = 0;
            const extractFrame = () => {
                if (currentTime >= duration || frames.length >= 10) {
                    // After extracting frames, extract audio
                    this.extractAudioFromVideo(video, file, (audioData) => {
                        resolve({ 
                            type: 'video', 
                            frames, 
                            duration,
                            audio: audioData,
                            hasAudio: audioData !== null && audioData.audioBlob !== null
                        });
                    });
                    return;
                }
                
                video.currentTime = currentTime;
                currentTime += frameInterval;
            };
            
            video.onseeked = () => {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                canvas.toBlob((blob) => {
                    frames.push({
                        time: video.currentTime,
                        image: blob
                    });
                    extractFrame();
                }, 'image/jpeg', 0.8);
            };
            
            extractFrame();
        };
        
        video.src = URL.createObjectURL(file);
    }

    // Extract audio from video file
    extractAudioFromVideo(video, file, callback) {
        // Check if video has audio tracks
        const hasAudio = video.audioTracks && video.audioTracks.length > 0;
        
        if (!hasAudio) {
            console.log('No audio tracks detected in video');
            callback(null); // No audio available
            return;
        }
        
        // Add a timeout to prevent hanging
        const timeout = setTimeout(() => {
            console.log('Audio extraction timed out, using fallback');
            callback(null);
        }, 15000); // 15 second timeout
        
        // Method 1: Try to extract audio using MediaRecorder API
        try {
            const stream = video.captureStream();
            const audioTracks = stream.getAudioTracks();
            
            if (audioTracks.length === 0) {
                console.log('No audio tracks in stream, using fallback');
                callback(null);
                return;
            }
            
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            });
            
            const audioChunks = [];
            
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                }
            };
            
            mediaRecorder.onstop = () => {
                clearTimeout(timeout);
                if (audioChunks.length > 0) {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                    callback({
                        audioBlob: audioBlob,
                        duration: video.duration,
                        sampleRate: 44100,
                        numberOfChannels: 2
                    });
                } else {
                    console.log('No audio data captured');
                    callback(null);
                }
            };
            
            mediaRecorder.onerror = (error) => {
                clearTimeout(timeout);
                console.error('MediaRecorder error:', error);
                callback(null);
            };
            
            // Start recording and stop after a short duration
            mediaRecorder.start();
            setTimeout(() => {
                if (mediaRecorder.state === 'recording') {
                    mediaRecorder.stop();
                }
            }, Math.min(10000, video.duration * 1000)); // Max 10 seconds
            
        } catch (error) {
            clearTimeout(timeout);
            console.log('MediaRecorder not supported or failed:', error);
            // Fallback: Use the original file as audio source
            try {
                callback({
                    audioBlob: file,
                    duration: video.duration,
                    sampleRate: 44100,
                    numberOfChannels: 2
                });
            } catch (fallbackError) {
                console.error('Fallback audio extraction failed:', fallbackError);
                callback(null);
            }
        }
    }

    // Extract audio data
    extractAudioData(file, resolve) {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            try {
                const arrayBuffer = e.target.result;
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                
                // Extract audio features
                const audioData = {
                    type: 'audio',
                    duration: audioBuffer.duration,
                    sampleRate: audioBuffer.sampleRate,
                    numberOfChannels: audioBuffer.numberOfChannels,
                    // For demo purposes, we'll use the file blob directly
                    audioBlob: file
                };
                
                resolve(audioData);
            } catch (error) {
                console.error('Error processing audio:', error);
                resolve({ type: 'audio', audioBlob: file });
            }
        };
        
        reader.readAsArrayBuffer(file);
    }

    // Analyze with Gemini
    async analyzeWithGemini(mediaData, file) {
        if (!this.analysisSession) {
            return {
                summary: 'Gemini AI is not available. Please ensure you are using Chrome 138+ with Gemini Nano enabled.',
                timestamp: new Date().toISOString(),
                error: true
            };
        }

        try {
            const prompt = this.createAnalysisPrompt(mediaData);
            const content = [];
            
            // Add text prompt
            content.push({
                type: 'text',
                value: prompt
            });
            
            // Add media content
            if (mediaData.type === 'video') {
                // Add key frames
                for (const frame of mediaData.frames.slice(0, 5)) { // Limit to 5 frames
                    content.push({
                        type: 'image',
                        value: frame.image
                    });
                }
                
                // Add audio if available and valid
                if (mediaData.hasAudio && mediaData.audio && mediaData.audio.audioBlob) {
                    try {
                        content.push({
                            type: 'audio',
                            value: mediaData.audio.audioBlob
                        });
                    } catch (audioError) {
                        console.log('Audio blob not valid, skipping audio analysis');
                    }
                }
            } else {
                // Add audio
                try {
                    content.push({
                        type: 'audio',
                        value: mediaData.audioBlob
                    });
                } catch (audioError) {
                    console.log('Audio blob not valid for audio file');
                }
            }
            
            const response = await this.analysisSession.prompt([
                {
                    role: 'user',
                    content: content
                }
            ]);
            
            return {
                summary: response.text,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('Error with Gemini analysis:', error);
            return {
                summary: 'Sorry, I encountered an error while analyzing your media. Please try again.',
                timestamp: new Date().toISOString(),
                error: true
            };
        }
    }

    // Create analysis prompt
    createAnalysisPrompt(mediaData) {
        if (mediaData.type === 'video') {
            let prompt = `Please analyze this video content and provide a comprehensive summary including:
1. Main topics and themes
2. Key visual elements and scenes
3. People, objects, and activities shown
4. Overall mood and tone
5. Any text or speech visible
6. Technical aspects (quality, style, etc.)`;

            // Add audio analysis instructions if audio is available
            if (mediaData.hasAudio && mediaData.audio) {
                prompt += `

Additionally, please analyze the audio content including:
7. Type of audio (speech, music, ambient sounds, etc.)
8. Main topics or themes discussed in speech
9. Speakers or performers identified
10. Emotional tone and mood conveyed through audio
11. Audio quality and characteristics
12. Any background music or sound effects

Please provide a comprehensive analysis that combines both visual and audio elements.`;
            }

            prompt += `\n\nPlease be detailed and specific about what you observe and hear.`;
            return prompt;
        } else {
            return `Please analyze this audio content and provide a comprehensive summary including:
1. Type of audio (music, speech, ambient, etc.)
2. Main topics or themes discussed
3. Speakers or performers identified
4. Emotional tone and mood
5. Key points or highlights
6. Audio quality and characteristics

Please be detailed and specific about what you hear.`;
        }
    }



    // Ask question about media
    async askQuestion() {
        const question = this.questionInput.value.trim();
        if (!question) return;
        
        if (!this.currentMedia) {
            this.showError('Please upload a media file first.');
            return;
        }
        
        // Add user question to chat
        this.addUserMessage(question);
        this.questionInput.value = '';
        
        // Show loading state
        this.addAIMessage('Analyzing your question...', true);
        
        try {
            const answer = await this.getAnswer(question);
            this.updateLastAIMessage(answer);
        } catch (error) {
            console.error('Error getting answer:', error);
            this.updateLastAIMessage('Sorry, I encountered an error while processing your question. Please try again.');
        }
    }

    // Get answer from Gemini
    async getAnswer(question) {
        if (!this.analysisSession) {
            return 'Gemini AI is not available. Please ensure you are using Chrome 138+ with Gemini Nano enabled.';
        }

        try {
            const content = [
                {
                    type: 'text',
                    value: `Based on the previously analyzed ${this.mediaType}, please answer this question: ${question}`
                }
            ];
            
            // Add current media context
            if (this.currentMedia && this.mediaAnalysis) {
                if (this.mediaType === 'video' && this.mediaAnalysis.frames) {
                    // Add a representative frame from the analysis
                    const frame = this.mediaAnalysis.frames[0];
                    if (frame && frame.image) {
                        content.push({
                            type: 'image',
                            value: frame.image
                        });
                    }
                } else if (this.mediaType === 'audio') {
                    content.push({
                        type: 'audio',
                        value: this.currentMedia
                    });
                }
            }
            
            const response = await this.analysisSession.prompt([
                {
                    role: 'user',
                    content: content
                }
            ]);
            
            if (response && response.text) {
                return response.text;
            } else {
                return 'I apologize, but I couldn\'t generate a response. Please try asking your question again.';
            }
            
        } catch (error) {
            console.error('Error with Gemini Q&A:', error);
            return 'Sorry, I encountered an error while processing your question. Please try again.';
        }
    }





    // UI Helper Methods
    showAnalysisStatus() {
        this.analysisStatus.style.display = 'block';
        this.updateProgress(0, 'Starting analysis...');
    }

    hideAnalysisStatus() {
        this.analysisStatus.style.display = 'none';
    }

    updateProgress(percentage, text) {
        this.progressBar.style.width = `${percentage}%`;
        this.statusText.textContent = text;
    }

    showQuestionInterface() {
        this.questionSection.style.display = 'block';
    }

    addUserMessage(message) {
        const messageElement = this.createMessageElement(message, 'user');
        this.chatHistory.appendChild(messageElement);
        this.scrollToBottom();
    }

    addAIMessage(message, loading = false) {
        const messageElement = this.createMessageElement(message, 'ai', loading);
        this.chatHistory.appendChild(messageElement);
        this.scrollToBottom();
        return messageElement;
    }

    addSystemMessage(message) {
        const messageElement = this.createMessageElement(message, 'system');
        this.chatHistory.appendChild(messageElement);
        this.scrollToBottom();
    }

    updateLastAIMessage(message) {
        const lastMessage = this.chatHistory.querySelector('.message-ai:last-child .message-bubble');
        if (lastMessage) {
            lastMessage.innerHTML = message;
            lastMessage.classList.remove('loading');
        }
    }

    createMessageElement(message, type, loading = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message message-${type}`;
        
        const avatar = document.createElement('div');
        avatar.className = `message-avatar avatar-${type}`;
        
        const bubble = document.createElement('div');
        bubble.className = `message-bubble ${type}`;
        
        const timestamp = document.createElement('div');
        timestamp.className = 'message-timestamp';
        timestamp.textContent = new Date().toLocaleTimeString();
        
        // Set avatar icon
        switch (type) {
            case 'user':
                avatar.innerHTML = '<i class="fas fa-user"></i>';
                break;
            case 'ai':
                avatar.innerHTML = '<i class="fas fa-robot"></i>';
                break;
            case 'system':
                avatar.innerHTML = '<i class="fas fa-info-circle"></i>';
                break;
        }
        
        // Set message content
        if (loading) {
            bubble.innerHTML = `${message}<span class="loading-dots"></span>`;
            bubble.classList.add('loading');
        } else {
            bubble.textContent = message;
        }
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(bubble);
        messageDiv.appendChild(timestamp);
        
        return messageDiv;
    }

    scrollToBottom() {
        this.chatHistory.scrollTop = this.chatHistory.scrollHeight;
    }

    showError(message) {
        // Create error notification
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger alert-dismissible fade show';
        errorDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        // Insert at top of demo card
        const demoCard = document.querySelector('.demo-card');
        demoCard.insertBefore(errorDiv, demoCard.firstChild);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }
}

// Global function for suggested questions
function askSuggestedQuestion(question) {
    if (window.videoAnalysisApp) {
        window.videoAnalysisApp.questionInput.value = question;
        window.videoAnalysisApp.askQuestion();
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.videoAnalysisApp = new VideoAnalysisApp();
});

// Export for global access
window.VideoAnalysisApp = VideoAnalysisApp; 