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
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadHistory();
        this.initializeModel();
    }

    async initializeModel() {
        // Simulate model initialization
        const modelStatus = document.getElementById('model-status');
        const modelIcon = modelStatus.querySelector('i');
        const modelText = modelStatus.querySelector('span');
        
        // Show initializing state
        modelIcon.className = 'fas fa-circle text-warning';
        modelText.textContent = 'Initializing...';
        
        // Simulate initialization delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Update to ready state
        modelIcon.className = 'fas fa-circle text-success';
        modelText.textContent = 'Ready';
        
        // Update processing status to ready
        this.updateStatus('ready');
    }

    setupEventListeners() {
        // File upload
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const removeFileBtn = document.getElementById('removeFile');

        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        uploadArea.addEventListener('drop', this.handleDrop.bind(this));
        fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        removeFileBtn.addEventListener('click', this.removeFile.bind(this));

        // Settings
        const nodeLimitSlider = document.getElementById('nodeLimit');
        const nodeLimitValue = document.getElementById('nodeLimitValue');
        nodeLimitSlider.addEventListener('input', (e) => {
            nodeLimitValue.textContent = e.target.value;
        });

        // Generate button
        const generateBtn = document.getElementById('generateBtn');
        generateBtn.addEventListener('click', this.generateMindmap.bind(this));

        // Mindmap controls
        document.getElementById('resetViewBtn').addEventListener('click', this.resetView.bind(this));
        document.getElementById('expandAllBtn').addEventListener('click', this.expandAll.bind(this));
        document.getElementById('collapseAllBtn').addEventListener('click', this.collapseAll.bind(this));
        document.getElementById('exportBtn').addEventListener('click', this.exportPNG.bind(this));
        document.getElementById('exportSVGBtn').addEventListener('click', this.exportSVG.bind(this));

        // Search
        const searchBtn = document.getElementById('searchBtn');
        const searchInput = document.getElementById('searchInput');
        searchBtn.addEventListener('click', () => this.searchNodes(searchInput.value));
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchNodes(searchInput.value);
        });

        // History
        document.getElementById('clearHistory').addEventListener('click', this.clearHistory.bind(this));
    }

    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const files = e.target.files;
        if (files.length > 0) {
            this.processFile(files[0]);
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
            const text = await this.extractText(this.currentFile);
            console.log('Text extracted, length:', text.length);
            console.log('Text preview:', text.substring(0, 200) + '...');

            console.log('Step 2: Analyzing with Gemini...');
            const mindmapData = await this.analyzeWithGemini(text);
            console.log('Mindmap data received:', mindmapData);

            this.mindmapData = mindmapData;
            
            console.log('Step 3: Rendering mindmap...');
            this.renderMindmap(mindmapData);
            
            console.log('Step 4: Saving to history...');
            this.saveToHistory();
            
            console.log('Step 5: Showing mindmap...');
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
        // Simulate Gemini Nano API call with structured output
        // In a real implementation, you'd call the actual Gemini API
        
        const settings = {
            focus: document.getElementById('analysisFocus').value,
            nodeLimit: parseInt(document.getElementById('nodeLimit').value),
            style: document.getElementById('mindmapStyle').value
        };

        console.log('Analysis settings:', settings);
        console.log('Input text length:', text.length);

        // Simulate API delay
        console.log('Simulating progress...');
        await this.simulateProgress();

        // Generate structured mindmap data based on analysis focus
        console.log('Generating structured mindmap data...');
        const result = this.generateStructuredMindmap(text, settings);
        console.log('Generated mindmap data:', result);
        
        return result;
    }

    generateStructuredMindmap(text, settings) {
        console.log('=== Generating structured mindmap ===');
        console.log('Settings:', settings);
        console.log('Text preview:', text.substring(0, 100) + '...');
        
        // This is a demo implementation that generates structured mindmap data
        // In a real implementation, this would come from Gemini Nano's structured output
        
        const sampleData = {
            general: {
                name: "Document Overview",
                children: [
                    {
                        name: "Main Topics",
                        children: [
                            { name: "Introduction", value: 1 },
                            { name: "Key Concepts", value: 1 },
                            { name: "Methodology", value: 1 },
                            { name: "Results", value: 1 },
                            { name: "Conclusion", value: 1 }
                        ]
                    },
                    {
                        name: "Supporting Elements",
                        children: [
                            { name: "Background", value: 1 },
                            { name: "Literature Review", value: 1 },
                            { name: "Data Analysis", value: 1 },
                            { name: "Discussion", value: 1 }
                        ]
                    }
                ]
            },
            technical: {
                name: "Technical Analysis",
                children: [
                    {
                        name: "Technical Components",
                        children: [
                            { name: "Architecture", value: 1 },
                            { name: "Implementation", value: 1 },
                            { name: "Algorithms", value: 1 },
                            { name: "Data Structures", value: 1 },
                            { name: "Performance", value: 1 }
                        ]
                    },
                    {
                        name: "Technical Details",
                        children: [
                            { name: "Code Examples", value: 1 },
                            { name: "System Design", value: 1 },
                            { name: "Optimization", value: 1 },
                            { name: "Testing", value: 1 }
                        ]
                    }
                ]
            },
            business: {
                name: "Business Insights",
                children: [
                    {
                        name: "Business Value",
                        children: [
                            { name: "ROI Analysis", value: 1 },
                            { name: "Market Impact", value: 1 },
                            { name: "Competitive Advantage", value: 1 },
                            { name: "Risk Assessment", value: 1 }
                        ]
                    },
                    {
                        name: "Strategic Elements",
                        children: [
                            { name: "Business Model", value: 1 },
                            { name: "Customer Value", value: 1 },
                            { name: "Growth Potential", value: 1 },
                            { name: "Implementation Plan", value: 1 }
                        ]
                    }
                ]
            }
        };

        const result = sampleData[settings.focus] || sampleData.general;
        console.log('Generated mindmap structure:', result);
        console.log('Number of root children:', result.children ? result.children.length : 0);
        
        return result;
    }

    async simulateProgress() {
        const progressBar = document.getElementById('analysisProgress');
        const progressText = document.getElementById('progressText');
        const steps = [
            { progress: 20, text: 'Extracting text from document...' },
            { progress: 40, text: 'Analyzing content structure...' },
            { progress: 60, text: 'Identifying key concepts...' },
            { progress: 80, text: 'Creating mindmap hierarchy...' },
            { progress: 100, text: 'Finalizing mindmap...' }
        ];

        for (const step of steps) {
            progressBar.style.width = step.progress + '%';
            progressText.textContent = step.text;
            await new Promise(resolve => setTimeout(resolve, 800));
        }
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

        // Create nodes
        const nodes = g.selectAll('.mindmap-node')
            .data(root.descendants())
            .enter()
            .append('g')
            .attr('class', 'mindmap-node')
            .attr('transform', d => `translate(${d.y},${d.x})`);

        console.log('Nodes created:', nodes.size());

        // Add circles to nodes
        nodes.append('circle')
            .attr('r', d => d.children ? 8 : 6)
            .attr('fill', d => d.children ? '#6366f1' : '#8b5cf6')
            .attr('stroke', '#ffffff')
            .attr('stroke-width', 2);

        // Add text to nodes
        nodes.append('text')
            .attr('dy', d => d.children ? -12 : 12)
            .attr('text-anchor', d => d.children ? 'middle' : 'middle')
            .text(d => d.data.name)
            .style('font-size', '12px')
            .style('font-weight', '500')
            .style('fill', '#374151')
            .style('pointer-events', 'none');

        // Update stats
        this.updateStats(root.descendants().length, root.links().length);
        
        console.log('=== Mindmap rendering completed ===');
        console.log('Final node count:', root.descendants().length);
        console.log('Final link count:', root.links().length);
    }

    createLayout(width, height) {
        const style = document.getElementById('mindmapStyle').value;
        
        switch (style) {
            case 'hierarchical':
                return d3.tree().size([height, width - 160]);
            case 'force':
                return d3.tree().size([height, width - 160]);
            case 'radial':
            default:
                return d3.tree().size([360, Math.min(width, height) / 2 - 120])
                    .separation((a, b) => (a.parent == b.parent ? 1 : 2) / a.depth);
        }
    }

    updateStats(nodeCount, linkCount) {
        document.getElementById('nodeCount').textContent = nodeCount;
        document.getElementById('linkCount').textContent = linkCount;
    }

    resetView() {
        if (this.svg) {
            this.svg.transition().duration(750).call(
                d3.zoom().transform,
                d3.zoomIdentity
            );
        }
    }

    expandAll() {
        // Implementation for expanding all nodes
        console.log('Expand all nodes');
    }

    collapseAll() {
        // Implementation for collapsing all nodes
        console.log('Collapse all nodes');
    }

    searchNodes(query) {
        if (!query.trim()) return;
        
        // Implementation for searching nodes
        console.log('Searching for:', query);
    }

    exportPNG() {
        if (!this.svg) return;
        
        const svgData = new XMLSerializer().serializeToString(this.svg.node());
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        
        img.onload = () => {
            canvas.width = this.svg.node().clientWidth;
            canvas.height = this.svg.node().clientHeight;
            ctx.drawImage(img, 0, 0);
            
            const link = document.createElement('a');
            link.download = 'mindmap.png';
            link.href = canvas.toDataURL();
            link.click();
            
            URL.revokeObjectURL(url);
        };
        
        img.src = url;
    }

    exportSVG() {
        if (!this.svg) return;
        
        const svgData = new XMLSerializer().serializeToString(this.svg.node());
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        
        const link = document.createElement('a');
        link.download = 'mindmap.svg';
        link.href = url;
        link.click();
        
        URL.revokeObjectURL(url);
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

    updateStatus(status) {
        const statusElement = document.getElementById('processing-status');
        const icon = statusElement.querySelector('i');
        const text = statusElement.querySelector('span');
        
        switch (status) {
            case 'ready':
                icon.className = 'fas fa-brain text-success';
                text.textContent = 'Ready';
                break;
            case 'processing':
                icon.className = 'fas fa-cog fa-spin text-warning';
                text.textContent = 'Processing...';
                break;
            case 'error':
                icon.className = 'fas fa-exclamation-triangle text-danger';
                text.textContent = 'Error';
                break;
        }
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
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new GeminiMindmapGenerator();
}); 