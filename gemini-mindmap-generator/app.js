// Gemini Mindmap Generator - Main Application
class GeminiMindmapGenerator {
    constructor() {
        this.currentFile = null;
        this.mindmapData = null;
        this.svg = null;
        this.simulation = null;
        this.nodes = [];
        this.links = [];
        this.history = [];
        
        // RAG system for expandable nodes
        this.embeddingModel = null;
        this.documentChunks = [];
        this.chunkEmbeddings = [];
        this.isEmbeddingModelReady = false;
        this.documentContent = '';
        this.maxChunkSize = 500;
        this.overlapSize = 50;
        
        // Expandable nodes state
        this.expandedNodes = new Set();
        this.nodeDetails = new Map();
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadHistory();
        this.initializeModel();
        this.initializeEmbeddingModel();
    }

    async initializeEmbeddingModel() {
        try {
            console.log('Initializing embedding model...');
            this.updateProcessingStatus('initializing', 'Loading RAG system...');
            
            // Load Universal Sentence Encoder
            this.embeddingModel = await use.load();
            this.isEmbeddingModelReady = true;
            console.log('Embedding model ready');
            this.updateProcessingStatus('ready', 'RAG Ready');
        } catch (error) {
            console.error('Error initializing embedding model:', error);
            this.isEmbeddingModelReady = false;
            this.updateProcessingStatus('error', 'RAG Error');
        }
    }

    async processDocumentContent(text) {
        this.documentContent = text;
        console.log('Processing document content for RAG...');
        
        if (!this.isEmbeddingModelReady) {
            console.warn('Embedding model not ready, skipping chunk processing');
            return;
        }

        // Create document chunks
        this.documentChunks = this.createDocumentChunks(text);
        console.log(`Created ${this.documentChunks.length} chunks`);

        // Generate embeddings
        if (this.documentChunks.length > 0) {
            await this.generateChunkEmbeddings();
        }
    }

    createDocumentChunks(text) {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const chunks = [];
        let currentChunk = '';
        let chunkId = 0;

        for (let i = 0; i < sentences.length; i++) {
            const sentence = sentences[i].trim();
            
            if (currentChunk.length + sentence.length > this.maxChunkSize && currentChunk.length > 0) {
                chunks.push({
                    id: `chunk_${chunkId}`,
                    content: currentChunk.trim(),
                    chunkIndex: chunkId
                });
                
                const overlapText = currentChunk.slice(-this.overlapSize);
                currentChunk = overlapText + ' ' + sentence;
                chunkId++;
            } else {
                currentChunk += (currentChunk ? '. ' : '') + sentence;
            }
        }
        
        if (currentChunk.trim().length > 0) {
            chunks.push({
                id: `chunk_${chunkId}`,
                content: currentChunk.trim(),
                chunkIndex: chunkId
            });
        }
        
        return chunks;
    }

    async generateChunkEmbeddings() {
        try {
            console.log('Generating embeddings for chunks...');
            const chunkTexts = this.documentChunks.map(chunk => chunk.content);
            const embeddings = await this.embeddingModel.embed(chunkTexts);
            this.chunkEmbeddings = await embeddings.array();
            console.log(`Generated embeddings for ${this.chunkEmbeddings.length} chunks`);
        } catch (error) {
            console.error('Error generating embeddings:', error);
        }
    }

    async findRelevantChunks(query, topK = 3) {
        if (!this.isEmbeddingModelReady || this.chunkEmbeddings.length === 0) {
            console.warn('Embeddings not available, returning empty results');
            return [];
        }
        
        try {
            const queryEmbedding = await this.embeddingModel.embed([query]);
            const queryVector = await queryEmbedding.array();
            
            const similarities = this.chunkEmbeddings.map((chunkEmbedding, index) => {
                const similarity = this.cosineSimilarity(queryVector[0], chunkEmbedding);
                return {
                    index,
                    similarity,
                    chunk: this.documentChunks[index]
                };
            });
            
            similarities.sort((a, b) => b.similarity - a.similarity);
            const topChunks = similarities.slice(0, topK);
            
            console.log(`Found ${topChunks.length} relevant chunks for query: "${query}"`);
            return topChunks;
        } catch (error) {
            console.error('Error in semantic search:', error);
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

    async initializeModel() {
        console.log('=== Initializing Gemini Nano model ===');
        
        try {
            // Check if LanguageModel API is available
            if (typeof LanguageModel === 'undefined') {
                console.error('LanguageModel API not available');
                this.updateStatus('error', 'Gemini Nano not available');
                throw new Error('LanguageModel API not available. Please use Chrome with Gemini Nano support.');
            }
            
            console.log('LanguageModel API is available');
            
            // Check model availability
            const modelStatus = await LanguageModel.availability();
            console.log('Model availability:', modelStatus);
            
            if (modelStatus === 'available') {
                console.log('Gemini Nano is available');
                this.updateStatus('ready', 'Ready');
            } else {
                console.log('Gemini Nano is not available:', modelStatus);
                this.updateStatus('error', 'Gemini Nano not available');
                throw new Error(`Gemini Nano is not available: ${modelStatus}`);
            }
            
        } catch (error) {
            console.error('Error initializing model:', error);
            this.updateStatus('error', 'Model Error');
            throw error;
        }
    }

    setupEventListeners() {
        // File upload events
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const removeFile = document.getElementById('removeFile');
        const generateBtn = document.getElementById('generateBtn');

        if (uploadArea) {
            uploadArea.addEventListener('click', () => fileInput.click());
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('dragover');
            });
            uploadArea.addEventListener('dragleave', () => {
                uploadArea.classList.remove('dragover');
            });
            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    this.handleFileSelect(files[0]);
                }
            });
        }

        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.handleFileSelect(e);
                }
            });
        }

        if (removeFile) {
            removeFile.addEventListener('click', () => {
                this.removeFile();
            });
        }

        if (generateBtn) {
            generateBtn.addEventListener('click', () => {
                this.generateMindmap();
            });
        }

        // Mindmap controls
        const resetViewBtn = document.getElementById('resetViewBtn');
        const expandAllBtn = document.getElementById('expandAllBtn');
        const collapseAllBtn = document.getElementById('collapseAllBtn');
        const exportBtn = document.getElementById('exportBtn');
        const exportSVGBtn = document.getElementById('exportSVGBtn');
        const searchBtn = document.getElementById('searchBtn');
        const clearHistory = document.getElementById('clearHistory');

        if (resetViewBtn) {
            resetViewBtn.addEventListener('click', () => {
                this.resetView();
            });
        }

        if (expandAllBtn) {
            expandAllBtn.addEventListener('click', () => {
                this.expandAllNodes();
            });
        }

        if (collapseAllBtn) {
            collapseAllBtn.addEventListener('click', () => {
                this.collapseAllNodes();
            });
        }

        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportMindmap('png');
            });
        }

        if (exportSVGBtn) {
            exportSVGBtn.addEventListener('click', () => {
                this.exportMindmap('svg');
            });
        }

        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.searchNodes();
            });
        }

        if (clearHistory) {
            clearHistory.addEventListener('click', () => {
                this.clearHistory();
            });
        }

        // Node limit slider
        const nodeLimit = document.getElementById('nodeLimit');
        const nodeLimitValue = document.getElementById('nodeLimitValue');
        
        if (nodeLimit && nodeLimitValue) {
            nodeLimit.addEventListener('input', (e) => {
                nodeLimitValue.textContent = e.target.value;
            });
        }
    }

    handleFileSelect(e) {
        let file;
        
        // Handle both event objects and direct File objects
        if (e instanceof Event && e.target && e.target.files) {
            // Called from file input change event
            file = e.target.files[0];
        } else if (e instanceof File) {
            // Called directly with a File object (e.g., from drop event)
            file = e;
        } else {
            console.error('Invalid argument passed to handleFileSelect:', e);
            return;
        }
        
        if (file) {
            this.processFile(file);
        }
    }

    processFile(file) {
        const allowedTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain'
        ];

        if (!allowedTypes.includes(file.type)) {
            this.showError('Please select a valid file type (PDF, DOCX, or TXT)');
            return;
        }

        this.currentFile = file;
        this.displayFileInfo(file);
        document.getElementById('generateBtn').disabled = false;
    }

    displayFileInfo(file) {
        const fileInfo = document.getElementById('fileInfo');
        const fileName = document.getElementById('fileName');
        const fileSize = document.getElementById('fileSize');

        fileName.textContent = file.name;
        fileSize.textContent = this.formatFileSize(file.size);
        fileInfo.style.display = 'block';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    removeFile() {
        this.currentFile = null;
        document.getElementById('fileInfo').style.display = 'none';
        document.getElementById('generateBtn').disabled = true;
        document.getElementById('fileInput').value = '';
    }

    async generateMindmap() {
        console.log('=== Starting mindmap generation ===');
        if (!this.currentFile) {
            console.error('No file selected');
            return;
        }

        console.log('File selected:', this.currentFile.name, this.currentFile.type);
        this.showLoading();
        this.updateStatus('processing');

        try {
            console.log('Step 1: Extracting text from file...');
            this.updateProgress(10, 'Extracting text from document...');
            const text = await this.extractText(this.currentFile);
            console.log('Text extracted, length:', text.length);
            console.log('Text preview:', text.substring(0, 200) + '...');

            console.log('Step 2: Analyzing with Gemini...');
            this.updateProgress(20, 'Preparing document for analysis...');
            const mindmapData = await this.analyzeWithGemini(text);
            console.log('Mindmap data received:', mindmapData);

            this.mindmapData = mindmapData;
            
            console.log('Step 3: Rendering mindmap...');
            this.updateProgress(80, 'Rendering interactive mindmap...');
            this.renderMindmap(mindmapData);
            
            console.log('Step 4: Saving to history...');
            this.updateProgress(90, 'Saving to history...');
            this.saveToHistory();
            
            console.log('Step 5: Showing mindmap...');
            this.updateProgress(100, 'Complete!');
            this.showMindmap();
            
            console.log('=== Mindmap generation completed successfully ===');
        } catch (error) {
            console.error('Error generating mindmap:', error);
            this.showError('Failed to generate mindmap. Please try again.');
        } finally {
            console.log('Step 6: Cleaning up...');
            this.hideLoading();
            this.updateStatus('ready');
        }
    }

    async extractText(file) {
        console.log('Extracting text from file:', file.name, file.type);
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    let text = '';
                    
                    if (file.type === 'application/pdf') {
                        console.log('Processing PDF file...');
                        // For PDF, we'll use a simple text extraction
                        // In a real implementation, you'd use PDF.js
                        text = 'PDF content extraction would go here. For demo purposes, using sample text.';
                    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                        console.log('Processing DOCX file...');
                        // For DOCX, we'll use a simple text extraction
                        // In a real implementation, you'd use mammoth.js
                        text = 'DOCX content extraction would go here. For demo purposes, using sample text.';
                    } else {
                        console.log('Processing text file...');
                        text = e.target.result;
                    }
                    
                    console.log('Text extraction completed. Length:', text.length);
                    
                    // Process document content for RAG
                    await this.processDocumentContent(text);
                    
                    resolve(text);
                } catch (error) {
                    console.error('Error in text extraction:', error);
                    reject(error);
                }
            };
            
            reader.onerror = (error) => {
                console.error('FileReader error:', error);
                reject(error);
            };
            
            if (file.type === 'text/plain') {
                console.log('Reading as text...');
                reader.readAsText(file);
            } else {
                console.log('Reading as ArrayBuffer...');
                reader.readAsArrayBuffer(file);
            }
        });
    }

    async analyzeWithGemini(text) {
        console.log('=== Starting Gemini analysis ===');
        
        // Check if LanguageModel API is available
        if (typeof LanguageModel === 'undefined') {
            console.error('LanguageModel API not available');
            throw new Error('LanguageModel API not available. Please use Chrome with Gemini Nano support.');
        }
        
        const settings = {
            focus: document.getElementById('analysisFocus').value,
            nodeLimit: parseInt(document.getElementById('nodeLimit').value),
            style: document.getElementById('mindmapStyle').value
        };

        console.log('Analysis settings:', settings);
        console.log('Input text length:', text.length);

        try {
            // Create a session with the LanguageModel
            const session = await LanguageModel.create({
                temperature: 0.3, // Lower temperature for more consistent structured output
                topK: 40
            });

            // Create the prompt for mindmap generation
            const prompt = this.createMindmapPrompt(text, settings);
            console.log('Generated prompt:', prompt);

            // Update progress
            this.updateProgress(30, 'Analyzing document with Gemini Nano...');

            // Generate the mindmap structure
            const result = await session.generateContent(prompt);
            const response = await result.response;
            const mindmapText = response.text();
            
            console.log('Raw Gemini response:', mindmapText);

            // Parse the structured mindmap data
            const mindmapData = this.parseMindmapResponse(mindmapText, settings);
            console.log('Parsed mindmap data:', mindmapData);

            return mindmapData;

        } catch (error) {
            console.error('Error in Gemini analysis:', error);
            throw new Error(`Gemini analysis failed: ${error.message}`);
        }
    }

    createMindmapPrompt(text, settings) {
        const focusDescriptions = {
            general: "general overview with main themes and concepts",
            technical: "technical details, implementation specifics, and technical architecture",
            business: "business insights, market analysis, and strategic implications",
            academic: "academic analysis, research methodology, and scholarly insights",
            key_points: "key points and main takeaways only"
        };

        const focusDesc = focusDescriptions[settings.focus] || focusDescriptions.general;

        return `You are an expert document analyst and mindmap creator. Analyze the following document and create a structured mindmap that represents the key concepts, themes, and relationships.

# DOCUMENT CONTENT:
${text.substring(0, 8000)}${text.length > 8000 ? '...' : ''}

# ANALYSIS REQUIREMENTS:
- Focus: ${focusDesc}
- Maximum nodes: ${settings.nodeLimit}
- Create a hierarchical structure with clear parent-child relationships
- Use concise, descriptive node names (2-4 words each)
- Ensure logical grouping and categorization
- Include 3-5 main categories with 3-5 sub-nodes each

# Guidelines:
- Identify the central idea or theme of the document.
- Extract and organize the main sections or arguments as first-level branches.
- Include relevant subpoints, examples, or definitions as deeper branches.
- Use clear and concise phrasing.
- Omit unnecessary filler or repetitive content.

OUTPUT FORMAT:
Return ONLY a valid JSON object with this exact structure:
{
  "name": "Document Analysis",
  "children": [
    {
      "name": "Category Name",
      "children": [
        {"name": "Sub-node 1", "value": 1},
        {"name": "Sub-node 2", "value": 1}
      ]
    }
  ]
}

IMPORTANT:
- Return ONLY the JSON object, no additional text
- Ensure the JSON is valid and properly formatted
- Focus on the most important concepts from the document
- Create meaningful relationships between nodes
- Keep node names clear and descriptive
- Limit the total number of nodes to ${settings.nodeLimit}`;
    }

    parseMindmapResponse(responseText, settings) {
        console.log('Parsing Gemini response:', responseText);
        
        try {
            // Clean the response text to extract JSON
            let jsonText = responseText.trim();
            
            // Remove any markdown code blocks
            if (jsonText.startsWith('```json')) {
                jsonText = jsonText.substring(7);
            }
            if (jsonText.startsWith('```')) {
                jsonText = jsonText.substring(3);
            }
            if (jsonText.endsWith('```')) {
                jsonText = jsonText.substring(0, jsonText.length - 3);
            }
            
            jsonText = jsonText.trim();
            
            // Parse the JSON
            const mindmapData = JSON.parse(jsonText);
            
            // Validate the structure
            if (!mindmapData.name || !mindmapData.children) {
                throw new Error('Invalid mindmap structure');
            }
            
            console.log('Successfully parsed mindmap data:', mindmapData);
            return mindmapData;
            
        } catch (error) {
            console.error('Error parsing mindmap response:', error);
            console.log('Raw response that failed to parse:', responseText);
            
            // Return a minimal fallback structure if parsing fails
            console.log('Using minimal fallback structure');
            return {
                name: "Document Analysis",
                children: [
                    {
                        name: "Analysis Failed",
                        children: [
                            { name: "Please try again", value: 1 }
                        ]
                    }
                ]
            };
        }
    }

    updateProgress(percentage, message) {
        const progressBar = document.getElementById('analysisProgress');
        const progressText = document.getElementById('progressText');
        
        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
            progressBar.setAttribute('aria-valuenow', percentage);
        }
        
        if (progressText) {
            progressText.textContent = message;
        }
        
        console.log(`Progress: ${percentage}% - ${message}`);
    }

    getNodeColor(node) {
        // Define a color palette for different node types
        const colorPalette = {
            // Root node - deep blue
            root: '#1e40af',
            // Parent nodes - various blues and purples
            parent: ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#7c3aed'],
            // Child nodes - various colors based on content
            child: ['#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#f97316', '#8b5a2b', '#6b7280', '#ec4899']
        };

        // Root node gets special color
        if (!node.parent) {
            return colorPalette.root;
        }

        // Parent nodes get colors from parent palette
        if (node.children) {
            const index = node.depth % colorPalette.parent.length;
            return colorPalette.parent[index];
        }

        // Child nodes get colors based on their name/content
        const childIndex = (node.data.name.length + node.depth) % colorPalette.child.length;
        return colorPalette.child[childIndex];
    }

    async toggleNodeExpansion(event, node) {
        const nodeId = node.data.name;
        const isExpanded = this.expandedNodes.has(nodeId);
        
        if (isExpanded) {
            // Collapse node
            this.expandedNodes.delete(nodeId);
            this.removeNodeDetails(nodeId);
            this.renderMindmap(this.mindmapData);
        } else {
            // Expand node with loading state
            this.expandedNodes.add(nodeId);
            
            // Show loading indicator
            const expandIndicator = d3.select(event.target);
            expandIndicator.text('⋯').style('font-size', '20px');
            
            try {
                await this.loadNodeDetails(node);
                this.renderMindmap(this.mindmapData);
            } catch (error) {
                console.error('Error expanding node:', error);
                this.expandedNodes.delete(nodeId);
                this.renderMindmap(this.mindmapData);
            }
        }
    }

    async loadNodeDetails(node) {
        const nodeId = node.data.name;
        
        if (this.nodeDetails.has(nodeId)) {
            return; // Already loaded
        }
        
        try {
            console.log(`Loading details for node: ${nodeId}`);
            
            // Use RAG to find relevant content
            const relevantChunks = await this.findRelevantChunks(nodeId, 3);
            
            let details = '';
            if (relevantChunks.length > 0) {
                details = relevantChunks.map((chunk, index) => {
                    return `<div class="chunk-content">
                        <h6>Relevant Content ${index + 1}</h6>
                        <p>${chunk.chunk.content}</p>
                        <small class="similarity-score">Relevance: ${(chunk.similarity * 100).toFixed(1)}%</small>
                    </div>`;
                }).join('');
            } else {
                details = `<div class="no-content">
                    <p>No specific content found for "${nodeId}". This node represents a general concept or category.</p>
                </div>`;
            }
            
            this.nodeDetails.set(nodeId, details);
            console.log(`Details loaded for node: ${nodeId}`);
            
        } catch (error) {
            console.error(`Error loading details for node ${nodeId}:`, error);
            this.nodeDetails.set(nodeId, `<div class="error-content">
                <p>Error loading content for "${nodeId}". Please try again.</p>
            </div>`);
        }
    }

    removeNodeDetails(nodeId) {
        this.nodeDetails.delete(nodeId);
    }

    renderMindmap(data) {
        console.log('=== Starting mindmap rendering ===');
        console.log('Input data:', data);
        
        const viewport = document.getElementById('mindmapViewport');
        console.log('Viewport element:', viewport);
        
        if (!viewport) {
            console.error('Viewport element not found!');
            return;
        }
        
        viewport.innerHTML = '';

        const width = viewport.clientWidth || 800;
        const height = viewport.clientHeight || 600;

        console.log('Viewport dimensions:', width, height);
        console.log('Viewport clientWidth:', viewport.clientWidth);
        console.log('Viewport clientHeight:', viewport.clientHeight);

        // Create SVG
        this.svg = d3.select(viewport)
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', [0, 0, width, height]);

        console.log('SVG created:', this.svg.node());

        // Create zoom behavior
        const zoom = d3.zoom()
            .scaleExtent([0.1, 4])
            .on('zoom', (event) => {
                this.svg.select('g').attr('transform', event.transform);
            });

        this.svg.call(zoom);

        // Create main group
        const g = this.svg.append('g');
        console.log('Main group created');

        // Convert hierarchical data to D3 format
        const root = d3.hierarchy(data);
        console.log('D3 hierarchy created:', root);
        console.log('Root data:', root.data);
        console.log('Root children:', root.children);
        
        // Create layout based on selected style
        const layout = this.createLayout(width, height);
        console.log('Layout created:', layout);
        
        layout(root);
        console.log('Layout applied to root');

        console.log('Root after layout:', root);
        console.log('Root descendants:', root.descendants());
        console.log('Root links:', root.links());

        // Create links
        const links = g.selectAll('.mindmap-link')
            .data(root.links())
            .enter()
            .append('path')
            .attr('class', 'mindmap-link')
            .attr('d', d3.linkHorizontal()
                .x(d => d.y)
                .y(d => d.x))
            .attr('fill', 'none')
            .attr('stroke', '#cbd5e1')
            .attr('stroke-width', 2);

        console.log('Links created:', links.size());

        // Create nodes with expanded content
        const nodes = g.selectAll('.mindmap-node')
            .data(root.descendants())
            .enter()
            .append('g')
            .attr('class', 'mindmap-node')
            .attr('transform', d => {
                // Calculate expanded offset based on node depth and expansion state
                let expandedOffset = 0;
                if (this.expandedNodes.has(d.data.name)) {
                    // Increase offset for deeper nodes to prevent overlap
                    expandedOffset = 80 + (d.depth * 20);
                }
                return `translate(${d.y},${d.x + expandedOffset})`;
            });

        console.log('Nodes created:', nodes.size());

        // Add rectangles to nodes
        nodes.append('rect')
            .attr('width', d => {
                const textLength = d.data.name.length;
                return Math.max(80, textLength * 8);
            })
            .attr('height', d => d.children ? 40 : 32)
            .attr('x', d => {
                const width = Math.max(80, d.data.name.length * 8);
                return -width / 2;
            })
            .attr('y', d => {
                const height = d.children ? 40 : 32;
                return -height / 2;
            })
            .attr('rx', 6)
            .attr('ry', 6)
            .attr('fill', d => this.getNodeColor(d))
            .attr('stroke', '#ffffff')
            .attr('stroke-width', 2)
            .style('cursor', 'pointer')
            .on('click', (event, d) => this.toggleNodeExpansion(event, d));

        // Add text inside the rectangles
        nodes.append('text')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .text(d => d.data.name)
            .style('font-size', d => {
                const baseSize = Math.max(9, Math.min(12, Math.sqrt(width * height) / 100));
                const textLength = d.data.name.length;
                return Math.max(8, baseSize - (textLength > 10 ? 1 : 0));
            })
            .style('font-weight', '500')
            .style('fill', '#ffffff')
            .style('pointer-events', 'none')
            .style('text-shadow', '0 1px 2px rgba(0, 0, 0, 0.3)');

        // Add expand/collapse indicator
        nodes.append('text')
            .attr('class', 'expand-indicator')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('dy', d => (d.children ? 40 : 32) / 2 + 20)
            .text(d => this.expandedNodes.has(d.data.name) ? '−' : '+')
            .style('font-size', '16px')
            .style('font-weight', 'bold')
            .style('fill', '#6366f1')
            .style('cursor', 'pointer')
            .style('pointer-events', 'all')
            .on('click', (event, d) => this.toggleNodeExpansion(event, d));

        // Add expanded content for expanded nodes
        const expandedNodes = nodes.filter(d => this.expandedNodes.has(d.data.name));
        
        expandedNodes.each((d, i, nodes) => {
            const nodeGroup = d3.select(nodes[i]);
            const nodeId = d.data.name;
            const details = this.nodeDetails.get(nodeId) || '';
            
            if (details) {
                // Calculate dynamic positioning based on node depth
                const xOffset = -150;
                const yOffset = 40 + (d.depth * 10);
                const width = 300;
                const height = Math.min(200, 120 + (d.depth * 20));
                
                // Create foreign object for HTML content
                const foreignObject = nodeGroup.append('foreignObject')
                    .attr('x', xOffset)
                    .attr('y', yOffset)
                    .attr('width', width)
                    .attr('height', height);
                
                foreignObject.append('xhtml:div')
                    .attr('class', 'node-details')
                    .style('background', 'white')
                    .style('border', '1px solid #e2e8f0')
                    .style('border-radius', '8px')
                    .style('padding', '12px')
                    .style('box-shadow', '0 4px 12px rgba(0,0,0,0.15)')
                    .style('font-size', '12px')
                    .style('line-height', '1.4')
                    .style('max-height', `${height}px`)
                    .style('overflow-y', 'auto')
                    .html(details);
            }
        });

        // Update stats
        this.updateStats(root.descendants().length, root.links().length);
        
        console.log('=== Mindmap rendering completed ===');
        console.log('Final node count:', root.descendants().length);
        console.log('Final link count:', root.links().length);
    }

    createLayout(width, height) {
        const layoutStyle = document.querySelector('input[name="layout"]:checked').value;
        console.log('Selected layout style:', layoutStyle);
        
        let layout;
        
        switch (layoutStyle) {
            case 'radial':
                layout = d3.tree()
                    .size([height - 100, width - 100])
                    .separation((a, b) => {
                        // Increase separation for expanded nodes
                        const aExpanded = this.expandedNodes.has(a.data.name);
                        const bExpanded = this.expandedNodes.has(b.data.name);
                        const baseSeparation = (a.parent === b.parent ? 1.2 : 1.5);
                        return baseSeparation + (aExpanded || bExpanded ? 0.3 : 0);
                    });
                break;
                
            case 'horizontal':
                layout = d3.tree()
                    .size([height - 100, width - 100])
                    .separation((a, b) => {
                        const aExpanded = this.expandedNodes.has(a.data.name);
                        const bExpanded = this.expandedNodes.has(b.data.name);
                        const baseSeparation = (a.parent === b.parent ? 1.2 : 1.5);
                        return baseSeparation + (aExpanded || bExpanded ? 0.3 : 0);
                    });
                break;
                
            case 'vertical':
                layout = d3.tree()
                    .size([width - 100, height - 100])
                    .separation((a, b) => {
                        const aExpanded = this.expandedNodes.has(a.data.name);
                        const bExpanded = this.expandedNodes.has(b.data.name);
                        const baseSeparation = (a.parent === b.parent ? 1.2 : 1.5);
                        return baseSeparation + (aExpanded || bExpanded ? 0.3 : 0);
                    });
                break;
                
            default:
                layout = d3.tree()
                    .size([height - 100, width - 100])
                    .separation((a, b) => {
                        const aExpanded = this.expandedNodes.has(a.data.name);
                        const bExpanded = this.expandedNodes.has(b.data.name);
                        const baseSeparation = (a.parent === b.parent ? 1.2 : 1.5);
                        return baseSeparation + (aExpanded || bExpanded ? 0.3 : 0);
                    });
        }
        
        console.log('Layout created with style:', layoutStyle);
        return layout;
    }

    updateStats(nodeCount, linkCount) {
        document.getElementById('nodeCount').textContent = nodeCount;
        document.getElementById('linkCount').textContent = linkCount;
    }

    resetView() {
        if (this.svg) {
            this.svg.transition()
                .duration(750)
                .call(d3.zoom().transform, d3.zoomIdentity);
        }
    }

    exportMindmap(format) {
        if (!this.svg) {
            this.showError('No mindmap to export');
            return;
        }

        try {
            if (format === 'svg') {
                // Export as SVG
                const svgData = new XMLSerializer().serializeToString(this.svg.node());
                const blob = new Blob([svgData], { type: 'image/svg+xml' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'mindmap.svg';
                a.click();
                URL.revokeObjectURL(url);
            } else {
                // Export as PNG
                const svgData = new XMLSerializer().serializeToString(this.svg.node());
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const img = new Image();
                
                img.onload = () => {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    
                    canvas.toBlob((blob) => {
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'mindmap.png';
                        a.click();
                        URL.revokeObjectURL(url);
                    });
                };
                
                img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
            }
        } catch (error) {
            console.error('Export error:', error);
            this.showError('Export failed');
        }
    }

    searchNodes() {
        const searchInput = document.getElementById('searchInput');
        const query = searchInput ? searchInput.value.trim() : '';
        
        if (!query || !this.svg) return;
        
        // Highlight matching nodes
        const nodes = this.svg.selectAll('.mindmap-node');
        nodes.select('rect').style('stroke', (d) => {
            const nodeName = d.data.name.toLowerCase();
            return nodeName.includes(query.toLowerCase()) ? '#ff6b6b' : '#ffffff';
        }).style('stroke-width', (d) => {
            const nodeName = d.data.name.toLowerCase();
            return nodeName.includes(query.toLowerCase()) ? 4 : 2;
        });
    }

    expandAll() {
        // Implementation for expanding all nodes
        console.log('Expand all nodes');
    }

    collapseAll() {
        // Implementation for collapsing all nodes
        console.log('Collapse all nodes');
    }

    showLoading() {
        document.getElementById('welcomeMessage').style.display = 'none';
        document.getElementById('mindmapContainer').style.display = 'none';
        document.getElementById('loadingState').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loadingState').style.display = 'none';
    }

    showMindmap() {
        console.log('=== Showing mindmap ===');
        
        // Hide welcome message and loading state
        const welcomeMessage = document.getElementById('welcomeMessage');
        const loadingState = document.getElementById('loadingState');
        const mindmapContainer = document.getElementById('mindmapContainer');
        
        console.log('Welcome message element:', welcomeMessage);
        console.log('Loading state element:', loadingState);
        console.log('Mindmap container element:', mindmapContainer);
        
        if (welcomeMessage) welcomeMessage.style.display = 'none';
        if (loadingState) loadingState.style.display = 'none';
        
        // Show mindmap container
        if (mindmapContainer) {
            mindmapContainer.style.display = 'flex';
            mindmapContainer.style.flexDirection = 'column';
            mindmapContainer.style.height = '100%';
            console.log('Mindmap container displayed');
        } else {
            console.error('Mindmap container not found!');
        }
        
        // Show controls
        const controlsSection = document.getElementById('controlsSection');
        if (controlsSection) {
            controlsSection.style.display = 'block';
            console.log('Controls section displayed');
        }
        
        // Update mindmap title
        const title = document.getElementById('mindmapTitle');
        if (title) {
            title.textContent = this.currentFile ? this.currentFile.name : 'Document Mindmap';
            console.log('Mindmap title updated:', title.textContent);
        }
        
        console.log('=== Mindmap display completed ===');
    }

    updateStatus(status, message = null) {
        // Update status in mindmap header
        const modelStatus = document.getElementById('model-status');
        // Update status in welcome message
        const modelStatusWelcome = document.getElementById('model-status-welcome');
        
        const statusElements = [modelStatus, modelStatusWelcome].filter(Boolean);
        
        statusElements.forEach(statusElement => {
            const modelIcon = statusElement.querySelector('i');
            const modelText = statusElement.querySelector('span');
            
            if (modelIcon && modelText) {
                modelIcon.className = 'fas fa-circle';
                
                switch (status) {
                    case 'initializing':
                        modelIcon.classList.add('text-warning');
                        modelText.textContent = message || 'Initializing...';
                        break;
                    case 'ready':
                        modelIcon.classList.add('text-success');
                        modelText.textContent = message || 'Ready';
                        break;
                    case 'processing':
                        modelIcon.classList.add('text-info');
                        modelText.textContent = message || 'Processing...';
                        break;
                    case 'error':
                        modelIcon.classList.add('text-danger');
                        modelText.textContent = message || 'Error';
                        break;
                    default:
                        modelIcon.classList.add('text-muted');
                        modelText.textContent = message || 'Unknown';
                }
            }
        });
    }

    updateProcessingStatus(status, message) {
        // Update status in mindmap header
        const statusElement = document.getElementById('processing-status');
        // Update status in welcome message
        const statusElementWelcome = document.getElementById('processing-status-welcome');
        
        const statusElements = [statusElement, statusElementWelcome].filter(Boolean);
        
        statusElements.forEach(element => {
            const icon = element.querySelector('i');
            const text = element.querySelector('span');
            
            if (icon && text) {
                icon.className = 'fas';
                switch (status) {
                    case 'initializing':
                        icon.classList.add('fa-spinner', 'fa-spin', 'text-warning');
                        break;
                    case 'ready':
                        icon.classList.add('fa-brain', 'text-success');
                        break;
                    case 'error':
                        icon.classList.add('fa-exclamation-triangle', 'text-danger');
                        break;
                    default:
                        icon.classList.add('fa-brain', 'text-muted');
                }
                text.textContent = message;
            }
        });
    }

    showError(message) {
        // Simple error display - in a real app you'd use a toast or modal
        alert(message);
    }

    saveToHistory() {
        if (!this.currentFile || !this.mindmapData) return;
        
        const historyItem = {
            id: Date.now(),
            fileName: this.currentFile.name,
            timestamp: new Date().toISOString(),
            data: this.mindmapData
        };
        
        this.history.unshift(historyItem);
        if (this.history.length > 10) {
            this.history.pop();
        }
        
        this.saveHistory();
        this.renderHistory();
    }

    renderHistory() {
        const historyList = document.getElementById('mindmapHistory');
        historyList.innerHTML = '';
        
        this.history.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <div>
                    <div class="history-title">${item.fileName}</div>
                    <div class="history-meta">${new Date(item.timestamp).toLocaleString()}</div>
                </div>
            `;
            historyItem.addEventListener('click', () => this.loadFromHistory(item));
            historyList.appendChild(historyItem);
        });
    }

    loadFromHistory(item) {
        this.mindmapData = item.data;
        this.renderMindmap(item.data);
        this.showMindmap();
        
        // Update file info
        const fileInfo = document.getElementById('fileInfo');
        const fileName = document.getElementById('fileName');
        fileName.textContent = item.fileName;
        fileInfo.style.display = 'block';
    }

    loadHistory() {
        const saved = localStorage.getItem('mindmapHistory');
        if (saved) {
            this.history = JSON.parse(saved);
            this.renderHistory();
        }
    }

    saveHistory() {
        localStorage.setItem('mindmapHistory', JSON.stringify(this.history));
    }

    clearHistory() {
        this.history = [];
        this.saveHistory();
        this.renderHistory();
    }

    getNodeDetails(node) {
        // Generate relevant content for each node based on its name and type
        const details = {
            'Machine Learning Applications': 'Applications of ML in real-world scenarios including image recognition, natural language processing, and predictive analytics.',
            'Data Processing Pipeline': 'End-to-end data processing workflow from raw data ingestion to model-ready datasets.',
            'Neural Networks': 'Deep learning architectures including feedforward, convolutional, and recurrent neural networks.',
            'Feature Engineering': 'Process of creating, transforming, and selecting features to improve model performance.',
            'Model Training': 'Supervised and unsupervised learning approaches with optimization techniques.',
            'Validation Metrics': 'Performance evaluation metrics including accuracy, precision, recall, and F1-score.',
            'Architecture Components': 'Neural network layer configurations, activation functions, and connectivity patterns.',
            'Implementation Details': 'Technical implementation specifics including frameworks, libraries, and deployment strategies.',
            'Algorithms & Methods': 'Machine learning algorithms including gradient descent, backpropagation, and regularization.',
            'Performance Analysis': 'Computational complexity, memory usage, and scalability considerations.',
            'Market Analysis': 'Competitive landscape analysis, market trends, and opportunity identification.',
            'ROI & Metrics': 'Return on investment calculations, cost-benefit analysis, and business metrics.',
            'Strategic Implementation': 'Go-to-market strategies, resource allocation, and risk management approaches.',
            'Literature Review': 'Previous research analysis, gap identification, and theoretical framework development.',
            'Research Methodology': 'Experimental design, data collection methods, and statistical analysis approaches.',
            'Findings & Analysis': 'Statistical results, significance testing, and correlation analysis outcomes.',
            'Critical Findings': 'Key discoveries and breakthrough results from the analysis.',
            'Essential Concepts': 'Fundamental principles and core methodologies central to the topic.',
            'Action Items': 'Immediate next steps and priority actions for implementation.'
        };

        return details[node.data.name] || `Detailed information about ${node.data.name}. Click to expand for more details.`;
    }

    toggleNodeDetails(event, node) {
        // Create or update a tooltip with detailed information
        const tooltip = d3.select('body').select('.node-tooltip');
        
        if (tooltip.empty()) {
            // Create new tooltip
            const newTooltip = d3.select('body')
                .append('div')
                .attr('class', 'node-tooltip')
                .style('position', 'absolute')
                .style('background', 'white')
                .style('border', '1px solid #ccc')
                .style('border-radius', '8px')
                .style('padding', '12px')
                .style('box-shadow', '0 4px 12px rgba(0,0,0,0.15)')
                .style('max-width', '300px')
                .style('z-index', '1000')
                .style('font-size', '14px')
                .style('line-height', '1.4');

            newTooltip.html(`
                <h6 style="margin: 0 0 8px 0; color: #374151; font-weight: 600;">${node.data.name}</h6>
                <p style="margin: 0; color: #6b7280;">${this.getNodeDetails(node)}</p>
                <div style="margin-top: 8px; font-size: 12px; color: #9ca3af;">
                    Click anywhere to close
                </div>
            `);

            // Position tooltip
            newTooltip
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 10) + 'px');

            // Close tooltip on click
            d3.select('body').on('click.tooltip', () => {
                newTooltip.remove();
                d3.select('body').on('click.tooltip', null);
            });
        }
    }

    async expandAllNodes() {
        if (!this.mindmapData) return;
        
        console.log('Expanding all nodes...');
        const allNodes = this.getAllNodes(this.mindmapData);
        
        for (const node of allNodes) {
            if (!this.expandedNodes.has(node.name)) {
                this.expandedNodes.add(node.name);
                await this.loadNodeDetails({ data: { name: node.name } });
            }
        }
        
        this.renderMindmap(this.mindmapData);
    }

    collapseAllNodes() {
        console.log('Collapsing all nodes...');
        this.expandedNodes.clear();
        this.nodeDetails.clear();
        this.renderMindmap(this.mindmapData);
    }

    getAllNodes(data) {
        const nodes = [];
        
        function traverse(node) {
            nodes.push({ name: node.name });
            if (node.children) {
                node.children.forEach(traverse);
            }
        }
        
        traverse(data);
        return nodes;
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new GeminiMindmapGenerator();
}); 