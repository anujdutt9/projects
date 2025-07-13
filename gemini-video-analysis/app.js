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
        
        // Add test button after a short delay to ensure DOM is ready
        setTimeout(() => this.addTestButton(), 1000);
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
    
    // Add test button for debugging
    addTestButton() {
        const demoCard = document.querySelector('.demo-card');
        if (demoCard) {
            const testButton = document.createElement('button');
            testButton.className = 'btn btn-warning mb-3';
            testButton.innerHTML = '<i class="fas fa-bug me-2"></i>Test Gemini with Sample Image';
            testButton.onclick = () => this.testGeminiWithSampleImage();
            
            // Insert after the upload area
            const uploadArea = document.getElementById('uploadArea');
            uploadArea.parentNode.insertBefore(testButton, uploadArea.nextSibling);
        }
    }
    
    // Test Gemini with a sample image file
    async testGeminiWithSampleImage() {
        console.log('=== Testing Gemini with Sample Image ===');
        
        // Check if Gemini is available
        if (!this.analysisSession) {
            console.error('Gemini session not available');
            this.showError('Gemini session not available. Please ensure you are using Chrome 138+ with Gemini Nano enabled.');
            return;
        }
        
        // Check if the model is ready
        try {
            console.log('Checking model availability...');
            const modelStatus = await LanguageModel.availability();
            console.log('Model status:', modelStatus);
            
            if (modelStatus !== "available") {
                this.showError(`Gemini model is not available (status: ${modelStatus}). Please ensure Gemini Nano is enabled in Chrome.`);
                return;
            }
        } catch (error) {
            console.error('Model not available:', error);
            this.showError('Gemini model is not available. Please ensure Gemini Nano is enabled in Chrome.');
            return;
        }
        
        // Create a file input for the test image
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        
        fileInput.onchange = async (event) => {
            const file = event.target.files[0];
            if (!file) return;
            
            try {
                console.log('Test image file selected:', {
                    name: file.name,
                    type: file.type,
                    size: file.size
                });
                
                // Test with Gemini
                const testPrompt = 'What do you see in this image? Please describe the colors, objects, people, and any text visible.';
                
                console.log('Sending test image to Gemini...');
                const response = await this.analysisSession.prompt([
                    {
                        role: 'user',
                        content: [
                            { type: 'text', value: testPrompt },
                            { type: 'image', value: file }
                        ]
                    }
                ]);

                console.log('Gemini response:', response);
                
                console.log('Gemini test response:', {
                    hasResponse: !!response,
                    responseType: typeof response,
                    hasText: !!(response && response.text),
                    responseKeys: response ? Object.keys(response) : 'no response',
                    responseText: response && response.text ? response.text.substring(0, 200) + '...' : 'No text'
                });
                
                if (response && response.text) {
                    this.addSystemMessage('✅ Gemini test successful! Response: ' + response.text.substring(0, 100) + '...');
                    console.log('✅ Gemini test successful!');
                } else {
                    this.addSystemMessage('❌ Gemini test failed - no response received');
                    console.log('❌ Gemini test failed - no response received');
                }
                
            } catch (error) {
                console.error('Test failed with error:', error);
                this.addSystemMessage('❌ Gemini test failed with error: ' + error.message);
            } finally {
                // Clean up
                document.body.removeChild(fileInput);
            }
        };
        
        // Trigger file selection
        document.body.appendChild(fileInput);
        fileInput.click();
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
            console.log('Initializing Gemini session...');
            console.log('LanguageModel available:', typeof LanguageModel !== 'undefined');
            
            // Check if LanguageModel API is available
            if (typeof LanguageModel === 'undefined') {
                console.error('LanguageModel API not available');
                throw new Error('LanguageModel API not available. Please use Chrome with Gemini Nano support.');
            }
            console.log('LanguageModel API is available');

            // Check model availability first
            console.log('Checking model availability...');
            let modelStatus;
            try {
                modelStatus = await LanguageModel.availability();
                console.log('Model status:', modelStatus);
            } catch (availabilityError) {
                console.error('Error checking model availability:', availabilityError);
                // Fallback: try to create the model directly
                console.log('Falling back to direct model creation...');
                this.analysisSession = await LanguageModel.create({
                    expectedInputs: [
                        { type: 'audio' }, 
                        { type: 'image' }
                    ],
                });
                console.log('Model created successfully via fallback');
                return;
            }
            
            if (modelStatus === "downloadable") {
                console.log('Model needs to be downloaded');
                this.updateProgress(10, 'Downloading Gemini Model...');
                
                this.analysisSession = await LanguageModel.create({
                    expectedInputs: [
                        { type: 'audio' }, 
                        { type: 'image' }
                    ],
                    monitor: (m) => {
                        console.log('Setting up download monitor...');
                        m.addEventListener("downloadprogress", (e) => {
                            const progress = (e.loaded / e.total * 100).toFixed(1);
                            console.log(`Download progress: ${progress}%`);
                            this.updateProgress(10 + (progress * 0.8), `Downloading model: ${progress}%`);
                        });
                        
                        m.addEventListener("downloadcomplete", () => {
                            console.log('Download completed, initializing model...');
                            this.updateProgress(90, 'Initializing model...');
                        });
                    }
                });
                console.log('Model download and creation completed');
            } else if (modelStatus === "available") {
                console.log('Model is already available, loading...');
                this.updateProgress(50, 'Loading Gemini Model...');
                
                this.analysisSession = await LanguageModel.create({
                    expectedInputs: [
                        { type: 'audio' }, 
                        { type: 'image' }
                    ],
                });
                console.log('Model session created successfully');
            } else {
                console.error('Unknown model status:', modelStatus);
                throw new Error(`Model status unknown: ${modelStatus}`);
            }
            
            console.log('Gemini session initialized successfully:', {
                sessionExists: !!this.analysisSession,
                hasPrompt: typeof this.analysisSession.prompt === 'function'
            });
            
        } catch (error) {
            console.error('Failed to initialize Gemini session:', error);
            this.analysisSession = null;
            this.showError('Failed to initialize Gemini. Please ensure you are using Chrome with Gemini Nano support.');
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
            this.mediaData = mediaData; // Store the media data for Q&A
            console.log('Media analysis completed:', {
                type: this.mediaType,
                hasFrames: mediaData.frames ? mediaData.frames.length : 0,
                hasAudio: mediaData.hasAudio,
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
        if (this.mediaType === 'video') {
            return new Promise((resolve) => {
                this.extractVideoFrames(file, resolve);
            });
        } else {
            return new Promise((resolve) => {
                this.extractAudioData(file, resolve);
            });
        }
    }

    // Extract video frames using canvas method (simplified approach)
    extractVideoFrames(file, resolve) {
        console.log('Starting canvas frame extraction for:', file.name);
        this.extractVideoFramesCanvas(file, resolve);
    }
    
    // Canvas method for video frame extraction
    extractVideoFramesCanvas(file, resolve) {
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const frames = [];
        
        video.onloadedmetadata = () => {
            console.log('Video metadata loaded:', {
                duration: video.duration,
                width: video.videoWidth,
                height: video.videoHeight
            });
            
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            // Extract frames at regular intervals
            const duration = video.duration;
            const numFrames = Math.min(5, Math.floor(duration)); // Max 5 frames for fallback
            const frameInterval = duration / numFrames;
            
            console.log('Frame extraction plan:', {
                duration,
                numFrames,
                frameInterval
            });
            
            let frameIndex = 0;
            
            const extractFrame = () => {
                if (frameIndex >= numFrames) {
                    console.log('Frame extraction complete:', frames.length, 'frames extracted');
                    resolve({ 
                        type: 'video', 
                        frames, 
                        duration,
                        hasAudio: false
                    });
                    return;
                }
                
                const currentTime = frameIndex * frameInterval;
                video.currentTime = currentTime;
                frameIndex++;
            };
            
            video.onseeked = () => {
                try {
                    console.log('Video seeked to:', video.currentTime, 'Canvas size:', canvas.width, 'x', canvas.height);
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    console.log('Image drawn to canvas');
                    
                    canvas.toBlob((blob) => {
                        if (blob) {
                            console.log('Frame blob created:', blob.type, blob.size, 'bytes');
                            frames.push({
                                time: video.currentTime,
                                image: blob
                            });
                            console.log('Frame extracted at time:', video.currentTime, 'Total frames:', frames.length);
                        } else {
                            console.error('Blob creation failed - blob is null');
                        }
                        extractFrame();
                    }, 'image/jpeg', 0.8);
                } catch (error) {
                    console.error('Error extracting frame:', error);
                    extractFrame(); // Continue with next frame
                }
            };
            
            video.onerror = (error) => {
                console.error('Video error:', error);
                resolve({ 
                    type: 'video', 
                    frames: [], 
                    duration: 0,
                    hasAudio: false,
                    error: true
                });
            };
            
            // Start frame extraction
            extractFrame();
        };
        
        video.onerror = (error) => {
            console.error('Video loading error:', error);
            resolve({ 
                type: 'video', 
                frames: [], 
                duration: 0,
                hasAudio: false,
                error: true
            });
        };
        
        video.src = URL.createObjectURL(file);
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
        
        // Check if the model is ready
        try {
            console.log('Checking model availability for analysis...');
            const modelStatus = await LanguageModel.availability();
            console.log('Model status for analysis:', modelStatus);
            
            if (modelStatus !== "available") {
                return {
                    summary: `Gemini model is not available (status: ${modelStatus}). Please ensure Gemini Nano is enabled in Chrome.`,
                    timestamp: new Date().toISOString(),
                    error: true
                };
            }
        } catch (error) {
            console.error('Model not available for analysis:', error);
            return {
                summary: 'Gemini model is not available. Please ensure Gemini Nano is enabled in Chrome.',
                timestamp: new Date().toISOString(),
                error: true
            };
        }

        try {
            if (mediaData.type === 'video') {
                return await this.analyzeVideoFrames(mediaData);
            } else {
                return await this.analyzeAudio(mediaData);
            }
        } catch (error) {
            console.error('Error with Gemini analysis:', error);
            return {
                summary: 'Sorry, I encountered an error while analyzing your media. Please try again.',
                timestamp: new Date().toISOString(),
                error: true
            };
        }
    }

    // Analyze video frames individually
    async analyzeVideoFrames(mediaData) {
        console.log('Starting individual frame analysis for video');
        
        const framesToAnalyze = mediaData.frames.slice(0, 5); // Limit to 5 frames
        const frameAnalyses = [];
        
        for (let i = 0; i < framesToAnalyze.length; i++) {
            const frame = framesToAnalyze[i];
            if (!frame || !frame.image) continue;
            
            console.log(`Analyzing frame ${i + 1}/${framesToAnalyze.length} at time ${frame.time}s`);
            
            try {
                console.log(`Preparing to analyze frame ${i + 1}:`, {
                    hasImage: !!frame.image,
                    imageType: frame.image ? frame.image.type : 'none',
                    imageSize: frame.image ? frame.image.size : 'none'
                });
                
                const framePrompt = `Please analyze this single frame from a video and describe what you see. Include:
1. Objects, people, or activities visible
2. Setting or environment
3. Any text or signs
4. Colors, lighting, and visual style
5. What might be happening in this moment

Frame timestamp: ${frame.time.toFixed(1)} seconds into the video.`;
                
                console.log('Sending frame to Gemini with prompt:', framePrompt.substring(0, 100) + '...');
                
                const response = await this.analysisSession.prompt([
                    {
                        role: 'user',
                        content: [
                            { type: 'text', value: framePrompt },
                            { type: 'image', value: frame.image }
                        ]
                    }
                ]);

                console.log('Gemini response:', response);
                
                console.log(`Frame ${i + 1} Gemini response:`, {
                    hasResponse: !!response,
                    responseType: typeof response,
                    hasText: !!(response && response.text),
                    responseKeys: response ? Object.keys(response) : 'no response'
                });
                
                if (response && response.text) {
                    frameAnalyses.push({
                        time: frame.time,
                        analysis: response.text
                    });
                    console.log(`Frame ${i + 1} analysis complete:`, response.text.substring(0, 100) + '...');
                } else {
                    console.log(`Frame ${i + 1} analysis failed - no response`);
                }
                
                // Small delay between frames to avoid overwhelming the API
                await new Promise(resolve => setTimeout(resolve, 500));
                
            } catch (error) {
                console.error(`Error analyzing frame ${i + 1}:`, error);
            }
        }
        
        console.log('Individual frame analysis complete:', frameAnalyses.length, 'frames analyzed');
        
        // Now create a comprehensive summary from all frame analyses
        if (frameAnalyses.length > 0) {
            const summaryPrompt = `Based on the analysis of ${frameAnalyses.length} key frames from a video, please provide a comprehensive summary of the entire video content. 

Frame analyses:
${frameAnalyses.map((fa, index) => `${index + 1}. At ${fa.time.toFixed(1)}s: ${fa.analysis}`).join('\n\n')}

Please provide a coherent summary that:
1. Identifies the main topic or theme of the video
2. Describes the key scenes and progression
3. Mentions important people, objects, or activities
4. Captures the overall mood and style
5. Highlights any significant changes or events across the frames

Make this summary flow naturally as if describing a complete video.`;
            
            const summaryResponse = await this.analysisSession.prompt([
                {
                    role: 'user',
                    content: [{ type: 'text', value: summaryPrompt }]
                }
            ]);
            
            return {
                summary: summaryResponse.text,
                frameAnalyses: frameAnalyses,
                timestamp: new Date().toISOString()
            };
        } else {
            return {
                summary: 'Unable to analyze video frames. Please try again.',
                frameAnalyses: [],
                timestamp: new Date().toISOString(),
                error: true
            };
        }
    }

    // Analyze audio content
    async analyzeAudio(mediaData) {
        console.log('Analyzing audio content');
        
        try {
            const audioPrompt = this.createAnalysisPrompt(mediaData);
            
            const response = await this.analysisSession.prompt([
                {
                    role: 'user',
                    content: [
                        { type: 'text', value: audioPrompt },
                        { type: 'audio', value: mediaData.audioBlob }
                    ]
                }
            ]);
            
            return {
                summary: response.text,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('Error analyzing audio:', error);
            return {
                summary: 'Sorry, I encountered an error while analyzing the audio. Please try again.',
                timestamp: new Date().toISOString(),
                error: true
            };
        }
    }

    // Create analysis prompt
    createAnalysisPrompt(mediaData) {
        if (mediaData.type === 'video') {
            return `Please analyze this video content and provide a comprehensive summary including:
1. Main topics and themes
2. Key visual elements and scenes
3. People, objects, and activities shown
4. Overall mood and tone
5. Any text or speech visible
6. Technical aspects (quality, style, etc.)

Please be detailed and specific about what you observe visually.`;
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
        
        // Check if the model is ready
        try {
            console.log('Checking model availability for Q&A...');
            const modelStatus = await LanguageModel.availability();
            console.log('Model status for Q&A:', modelStatus);
            
            if (modelStatus !== "available") {
                return `Gemini model is not available (status: ${modelStatus}). Please ensure Gemini Nano is enabled in Chrome.`;
            }
        } catch (error) {
            console.error('Model not available for Q&A:', error);
            return 'Gemini model is not available. Please ensure Gemini Nano is enabled in Chrome.';
        }

        try {
            let content = [];
            
            if (this.mediaType === 'video' && this.mediaAnalysis && this.mediaAnalysis.frameAnalyses) {
                // Use the detailed frame analyses for video Q&A
                const frameAnalyses = this.mediaAnalysis.frameAnalyses;
                const qaPrompt = `Based on the detailed analysis of ${frameAnalyses.length} key frames from a video, please answer this question: ${question}

Frame-by-frame analysis:
${frameAnalyses.map((fa, index) => `${index + 1}. At ${fa.time.toFixed(1)}s: ${fa.analysis}`).join('\n\n')}

Please provide a detailed answer that references specific frames and timestamps when relevant.`;
                
                content.push({ type: 'text', value: qaPrompt });
                
            } else if (this.mediaType === 'audio') {
                // For audio, use the original approach
                content.push({
                    type: 'text',
                    value: `Based on the previously analyzed audio, please answer this question: ${question}`
                });
                
                if (this.currentMedia) {
                    content.push({
                        type: 'audio',
                        value: this.currentMedia
                    });
                }
            } else {
                // Fallback for video without frame analyses
                content.push({
                    type: 'text',
                    value: `Based on the previously analyzed ${this.mediaType}, please answer this question: ${question}`
                });
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