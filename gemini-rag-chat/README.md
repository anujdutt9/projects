# Gemini RAG Chat - Document-Based AI Assistant

A modern, polished document-based RAG (Retrieval-Augmented Generation) AI chat application built with the Gemini Nano API integrated into Chrome. This application allows users to upload documents and have intelligent conversations about their content.

## 🌟 Features

### Core Functionality
- **Document Upload**: Support for PDF, TXT, DOC, and DOCX files
- **Drag & Drop Interface**: Intuitive file upload with visual feedback
- **AI-Powered Chat**: Intelligent responses based on document content
- **Real-time Processing**: Live document analysis and context generation

### User Interface
- **Modern Design**: Beautiful, responsive UI with gradient backgrounds
- **Chat Interface**: Clean, modern chat layout with user/assistant avatars
- **File Management**: Visual file list with processing status indicators
- **Chat History**: Persistent conversation history with easy navigation
- **Typing Indicators**: Real-time feedback during AI processing

### Technical Features
- **Gemini Nano Integration**: Built-in Chrome AI model for fast, local processing
- **RAG Implementation**: Context-aware responses based on uploaded documents
- **Progressive Loading**: Model download progress with visual indicators
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Local Storage**: Chat history persistence across sessions

## 🚀 Getting Started

### Prerequisites
- **Google Chrome**: Version with Gemini Nano support (latest stable version recommended)
- **Modern Browser**: Chrome with the LanguageModel API enabled
- **Internet Connection**: Required for initial model download

### Installation
1. Clone or download this repository
2. Navigate to the `gemini-rag-chat` directory
3. Open `index.html` in Google Chrome
4. Allow the application to initialize the Gemini model

### Usage

#### 1. Upload Documents
- **Drag & Drop**: Simply drag files onto the upload area
- **Click to Browse**: Click the upload area to select files from your computer
- **Supported Formats**: PDF, TXT, DOC, DOCX
- **Multiple Files**: Upload multiple documents at once

#### 2. Start Chatting
- Once documents are uploaded, the send button will become active
- Type your question in the input field
- Press Enter or click the send button
- The AI will analyze your documents and provide relevant answers

#### 3. Manage Conversations
- **Chat History**: View and restore previous conversations
- **Clear History**: Remove all chat history with one click
- **Document Management**: Remove individual documents as needed

## 🛠️ Technical Implementation

### Architecture
```
├── index.html          # Main application interface
├── styles.css          # Modern CSS styling with CSS variables
├── app.js             # Core application logic
└── README.md          # Documentation
```

### Key Components

#### 1. Gemini Nano Integration
```javascript
const session = await LanguageModel.create({
    monitor(m) {
        m.addEventListener("downloadprogress", e =>
            console.log(`Downloaded ${(e.loaded/e.total*100).toFixed(1)}%`)
        );
    }
});
```

#### 2. Document Processing
- File validation and type checking
- Content extraction for different file formats
- Context preparation for RAG implementation

#### 3. RAG Implementation
- Document context preparation
- Intelligent prompt engineering
- Context-aware response generation

#### 4. UI Components
- Responsive design with CSS Grid and Flexbox
- Modern animations and transitions
- Accessibility features
- Mobile-responsive layout

## 🎨 Design Features

### Visual Design
- **Color Scheme**: Modern purple/blue gradient theme
- **Typography**: Inter font family for clean readability
- **Icons**: Font Awesome icons throughout the interface
- **Animations**: Smooth transitions and micro-interactions

### User Experience
- **Intuitive Navigation**: Clear visual hierarchy
- **Real-time Feedback**: Loading states and progress indicators
- **Error Handling**: User-friendly error messages
- **Accessibility**: Keyboard navigation and screen reader support

## 🔧 Customization

### Styling
The application uses CSS custom properties for easy theming:

```css
:root {
    --primary-color: #6366f1;
    --secondary-color: #8b5cf6;
    --accent-color: #06b6d4;
    /* ... more variables */
}
```

### Configuration
Modify the application behavior by editing `app.js`:

- **File Types**: Update supported file formats
- **Model Settings**: Adjust Gemini model parameters
- **UI Behavior**: Customize animations and interactions

## 🐛 Troubleshooting

### Common Issues

#### Model Not Loading
- Ensure you're using the latest version of Chrome
- Check that the LanguageModel API is available
- Verify internet connection for model download

#### File Upload Issues
- Check file format compatibility
- Ensure files are not corrupted
- Verify file size limits

#### Performance Issues
- Close unnecessary browser tabs
- Clear browser cache if needed
- Ensure sufficient system resources

### Error Messages
- **"LanguageModel API not available"**: Update Chrome or check API support
- **"Failed to process file"**: Check file format and try again
- **"Model Error"**: Refresh the page and try again

## 📱 Browser Compatibility

- **Chrome**: Full support (recommended)
- **Edge**: Full support (Chromium-based)
- **Firefox**: Limited support (no Gemini Nano)
- **Safari**: Limited support (no Gemini Nano)

## 🔒 Privacy & Security

- **Local Processing**: All AI processing happens locally in your browser
- **No Data Upload**: Documents are processed locally, not sent to external servers
- **Local Storage**: Chat history is stored locally in your browser
- **No Tracking**: No analytics or tracking code included

## 🚀 Future Enhancements

### Planned Features
- **Advanced Document Processing**: Better PDF text extraction
- **Image Analysis**: Support for image-based documents
- **Export Functionality**: Save conversations and analysis
- **Collaboration**: Share documents and conversations
- **Advanced RAG**: Vector embeddings and semantic search

### Technical Improvements
- **Performance Optimization**: Faster model loading
- **Offline Support**: Complete offline functionality
- **API Integration**: Support for external AI services
- **Plugin System**: Extensible architecture

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

## 📞 Support

For support or questions:
1. Check the troubleshooting section above
2. Review the browser compatibility requirements
3. Ensure you're using the latest Chrome version
4. Open an issue on the project repository

---

**Built with ❤️ using Gemini Nano and modern web technologies** 