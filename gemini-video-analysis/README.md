# Gemini Video Analysis

An AI-powered video and audio analysis application that allows users to upload media files and ask questions about their content. Built with modern web technologies and integrated with Google's Gemini Nano multimodal AI.

## 🎬 Features

### Core Functionality
- **Video Analysis**: Upload video files (MP4, WebM, MOV) for AI-powered content analysis
- **Audio Analysis**: Process audio files (MP3, WAV, M4A) for speech and sound analysis
- **Intelligent Q&A**: Ask natural language questions about uploaded media content
- **Real-time Processing**: Live analysis with progress indicators and status updates
- **Drag & Drop**: Easy file upload with drag and drop support

### User Interface
- **Modern Design**: Clean, responsive interface with gradient backgrounds and smooth animations
- **Media Player**: Built-in video and audio player for uploaded content
- **Chat Interface**: Interactive Q&A with message history and timestamps
- **Suggested Questions**: Quick-access question buttons for common queries
- **Progress Tracking**: Visual progress bars and status updates during analysis

### Technical Features
- **Frame Extraction**: Automatic extraction of key video frames for analysis
- **Audio Processing**: Audio feature extraction and waveform analysis
- **Multimodal AI**: Integration with Gemini Nano for image, audio, and text processing
- **Error Handling**: Comprehensive error handling and user feedback
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome 138+ recommended for full Gemini functionality)
- Local web server for development
- Video or audio files for testing

### Installation

1. **Clone or Download**
   ```bash
   # If using git
   git clone <repository-url>
   cd gemini-video-analysis
   
   # Or download and extract the files
   ```

2. **Start Local Server**
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Using Node.js (if you have http-server installed)
   npx http-server
   
   # Using PHP
   php -S localhost:8000
   ```

3. **Open in Browser**
   ```
   http://localhost:8000
   ```

### Usage

1. **Upload Media**
   - Drag and drop a video or audio file onto the upload area
   - Or click "Choose File" to browse and select a file
   - Supported formats: MP4, WebM, MOV, MP3, WAV, M4A

2. **Wait for Analysis**
   - The system will automatically analyze your media content
   - Progress bar shows analysis status
   - Analysis typically takes 10-30 seconds depending on file size

3. **Ask Questions**
   - Once analysis is complete, the question interface appears
   - Type your questions about the content
   - Use suggested questions for quick access
   - Get detailed, contextual answers from the AI

## 🔧 Technical Implementation

### Architecture
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **UI Framework**: Bootstrap 5 with custom styling
- **AI Integration**: Google Gemini Nano via Chrome's LanguageModel API
- **Media Processing**: Web APIs for video/audio manipulation
- **File Handling**: HTML5 File API with drag and drop support

### Key Components

#### VideoAnalysisApp Class
The main application class that handles:
- File upload and validation
- Media processing and frame extraction
- Gemini AI integration
- User interface management
- Chat functionality

#### Media Processing
- **Video**: Extracts key frames at regular intervals for analysis
- **Audio**: Processes audio data and extracts features
- **Validation**: File type and size validation
- **Optimization**: Automatic compression and format handling

#### AI Integration
- **Session Management**: Creates and manages Gemini sessions
- **Multimodal Input**: Handles text, image, and audio inputs
- **Response Processing**: Formats and displays AI responses
- **Error Handling**: Graceful fallback to mock responses

### File Structure
```
gemini-video-analysis/
├── index.html          # Main application page
├── styles.css          # Custom CSS styles
├── app.js             # Main JavaScript application
└── README.md          # This file
```

## 🎯 Use Cases

### Educational Content
- Analyze educational videos and ask specific questions
- Get explanations of complex concepts shown in videos
- Extract key points and summaries from lectures

### Business Presentations
- Review presentation content and identify main topics
- Ask questions about specific slides or segments
- Get feedback on presentation structure and content

### Entertainment Media
- Analyze movie scenes, music videos, or TV shows
- Ask about visual elements, characters, or plot points
- Get insights about artistic and technical aspects

### Training Videos
- Review training content and ask clarifying questions
- Get step-by-step explanations of procedures
- Identify key learning points and takeaways

## 🔮 Future Enhancements

### Planned Features
- **YouTube Integration**: Direct analysis of YouTube URLs
- **Real-time Recording**: Live video/audio capture and analysis
- **Advanced Analytics**: Detailed content insights and metrics
- **Export Functionality**: Save analysis results and Q&A sessions
- **Multi-language Support**: Analysis in multiple languages
- **Custom Models**: Integration with custom AI models

### Technical Improvements
- **Performance Optimization**: Faster processing and analysis
- **Enhanced Security**: Better file handling and privacy protection
- **API Integration**: RESTful API for external applications
- **Mobile App**: Native mobile applications
- **Cloud Storage**: Integration with cloud storage services

## 🛠️ Development

### Local Development
1. Set up a local web server
2. Open the application in Chrome 138+
3. Use browser developer tools for debugging
4. Test with various media file types

### Customization
- Modify `styles.css` for visual changes
- Update `app.js` for functionality changes
- Customize prompts in the `createAnalysisPrompt()` method
- Add new file types in `isValidFileType()` method

### Browser Compatibility
- **Chrome 138+**: Full functionality with Gemini integration
- **Other Modern Browsers**: Basic functionality with mock responses
- **Mobile Browsers**: Responsive design with touch support

## 📝 API Reference

### VideoAnalysisApp Methods

#### Core Methods
- `initializeGeminiSession()`: Sets up AI session
- `processFile(file)`: Handles file upload and processing
- `analyzeMedia(file)`: Performs media analysis
- `askQuestion()`: Processes user questions
- `getAnswer(question)`: Gets AI responses

#### UI Methods
- `showAnalysisStatus()`: Displays progress indicators
- `addUserMessage(message)`: Adds user messages to chat
- `addAIMessage(message)`: Adds AI responses to chat
- `showError(message)`: Displays error notifications

#### Media Processing
- `extractVideoFrames(file, resolve)`: Extracts video frames
- `extractAudioData(file, resolve)`: Processes audio data
- `createAnalysisPrompt(mediaData)`: Generates AI prompts

## 🤝 Contributing

### How to Contribute
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Development Guidelines
- Follow existing code style and structure
- Add comments for complex functionality
- Test with various file types and sizes
- Ensure responsive design compatibility
- Update documentation for new features

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- **Google Gemini**: For providing the multimodal AI capabilities
- **Bootstrap**: For the responsive UI framework
- **Font Awesome**: For the icon library
- **Web APIs**: For media processing capabilities

## 📞 Support

For questions, issues, or contributions:
- Create an issue in the repository
- Check the browser console for error messages
- Ensure you're using a compatible browser version
- Verify file formats and sizes are supported

---

**Note**: This application requires Chrome 138+ for full Gemini AI functionality. In other browsers, it will use mock responses for demonstration purposes. 