# Gemini Token Confidence Explorer

A modern web application that demonstrates AI text generation with real-time confidence analysis using Chrome's built-in Gemini Nano model.

## 🚀 Features

### Core Functionality
- **Real-time Token Generation**: Generate text token by token with live confidence visualization
- **Confidence Analysis**: Each token displays its confidence score with color-coded visualization
- **Alternative Predictions**: View the top 2 alternative tokens for each generated token
- **Interactive Analysis**: Click on any token to see detailed analysis in a modal
- **Parameter Control**: Adjust temperature, top-K, and max tokens in real-time
- **Statistics Dashboard**: View comprehensive statistics including average, min/max confidence
- **Data Export**: Export analysis data as JSON for further research

### Visual Features
- **Color-coded Tokens**: Green (high confidence), Yellow (medium), Red (low confidence)
- **Confidence Bars**: Visual progress bars showing confidence levels
- **Interactive Tooltips**: Hover over tokens to see confidence scores
- **Real-time Updates**: Live statistics and progress indicators
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile

## 🛠️ Technical Implementation

### Architecture
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **UI Framework**: Bootstrap 5
- **AI Model**: Chrome's Gemini Nano (LanguageModel API)
- **Styling**: Custom CSS with CSS Grid and Flexbox
- **Icons**: Font Awesome 6

### Key Components
1. **TokenConfidenceExplorer Class**: Main application controller
2. **Session Management**: Handles Gemini Nano model sessions
3. **Confidence Simulation**: Simulates confidence scores (since API doesn't provide them)
4. **Real-time Visualization**: Updates UI as tokens are generated
5. **Data Export**: JSON export functionality

## 📋 System Requirements

- **Browser**: Google Chrome 126+ with Gemini Nano support
- **Internet**: Required for initial model download (one-time)
- **Memory**: 4GB+ RAM recommended
- **Processor**: Multi-core processor for optimal performance

## 🚀 Getting Started

1. **Clone or Download**: Get the project files
2. **Open in Chrome**: Navigate to the project folder
3. **Launch**: Open `demo.html` to see the landing page or `index.html` to start using the app
4. **Generate Text**: Enter your prompt and click "Generate Text"

## 📖 Usage Guide

### Basic Usage
1. Enter your text prompt in the input area
2. Adjust generation parameters (temperature, top-K, max tokens)
3. Click "Generate Text" to start generation
4. Watch tokens appear with confidence visualization
5. Click on tokens to see detailed analysis
6. Export data for further analysis

### Understanding Confidence Scores
- **High Confidence (70%+)**: Green tokens - AI is very certain
- **Medium Confidence (40-70%)**: Yellow tokens - AI is moderately certain
- **Low Confidence (<40%)**: Red tokens - AI is uncertain

### Parameter Tuning
- **Temperature**: Higher = more creative, Lower = more focused
- **Top-K**: Number of top tokens to consider (1-8)
- **Max Tokens**: Number of tokens to generate (5-50)

## 🔧 Technical Details

### Confidence Simulation
Since the LanguageModel API doesn't provide actual confidence scores, the application simulates them based on:
- Word characteristics (length, capitalization, punctuation)
- Position in the generated text
- Random variation for realism

### Performance Optimizations
- Efficient DOM updates with minimal reflows
- Debounced UI updates during generation
- Lazy loading of modal content
- Optimized CSS animations

### Browser Compatibility
- **Primary**: Chrome 126+ with Gemini Nano
- **Fallback**: Other browsers (with limited functionality)
- **Mobile**: Responsive design for mobile devices

## 📁 Project Structure

```
gemini-token-confidence-explorer/
├── index.html          # Main application
├── demo.html           # Landing page
├── styles.css          # Custom styling
├── app.js             # Main JavaScript application
└── README.md          # This file
```

## 🎯 Use Cases

### Educational
- Understanding AI text generation uncertainty
- Learning about token-level confidence analysis
- Exploring alternative predictions

### Research
- Analyzing confidence patterns in different text types
- Studying the relationship between parameters and confidence
- Exporting data for further analysis

### Development
- Testing different generation parameters
- Understanding model behavior
- Prototyping confidence-based features

## 🔮 Future Enhancements

### Planned Features
- **Real Confidence Scores**: Integration with models that provide actual confidence
- **Batch Analysis**: Analyze multiple prompts simultaneously
- **Confidence Trends**: Visualize confidence patterns over time
- **Custom Models**: Support for different AI models
- **Advanced Statistics**: More detailed analysis and metrics

### Technical Improvements
- **Web Workers**: Offload heavy computations
- **Caching**: Cache model sessions for faster startup
- **Progressive Web App**: Add PWA capabilities
- **Accessibility**: Enhanced accessibility features

## 🤝 Contributing

This is a demonstration project, but contributions are welcome:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- **Google**: For Chrome's Gemini Nano model
- **Bootstrap**: For the UI framework
- **Font Awesome**: For the icons
- **Inter Font**: For the typography

## 📞 Support

For questions or issues:
1. Check the browser console for error messages
2. Ensure you're using Chrome 126+ with Gemini Nano support
3. Verify your system meets the requirements
4. Try refreshing the page and clearing browser cache

---

**Built with ❤️ using Gemini Nano and modern web technologies**
