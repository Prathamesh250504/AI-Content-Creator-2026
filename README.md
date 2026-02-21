# AI Content Creator

A comprehensive AI-powered content generation platform with advanced features for creating, analyzing, and optimizing content across multiple formats.

## Features

- **Multi-Content Generation**: Create blogs, social media posts, emails, ads, and more
- **AI-Powered Analysis**: Quality analysis with readability, engagement, and sentiment metrics
- **A/B Testing**: Compare different content variations with AI-powered winner prediction
- **Batch Processing**: Generate multiple pieces of content simultaneously
- **Template Library**: Pre-built templates for various content types
- **Content Enhancement**: Post-generation editing and improvement tools
- **User Authentication**: Secure user accounts with Google OAuth
- **Dark/Light Mode**: Responsive design with theme switching

## Tech Stack

### Backend
- **Python 3.11+** with Flask
- **MongoDB Atlas** for data storage
- **OpenRouter API** for content generation
- **JWT Authentication** for secure user sessions
- **Google OAuth 2.0** for authentication

### Frontend
- **React 18** with modern hooks
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Chart.js** for data visualization
- **Axios** for API communication

## Quick Start

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/Prathamesh250504/AI-Content-Creator-2026.git
   cd AI-Content-Creator-2026
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   python start_server.py
   ```

3. **Frontend Setup** (new terminal)
   ```bash
   cd react-frontend
   npm install
   npm start
   ```

4. **Access the app**
   - Local: http://localhost:3000
   - Mobile: http://192.168.1.5:3000

### Production Deployment

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for complete deployment instructions.

**Quick Deploy:**
1. Backend → Render
2. Frontend → Netlify
3. Database → MongoDB Atlas

## Environment Variables

### Backend (.env)
```bash
OPENROUTER_API_KEY=your_api_key
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_secret
GOOGLE_CLIENT_ID=your_google_client_id
```

### Frontend (.env)
```bash
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
```

## Project Structure

```
├── backend/                 # Flask API
│   ├── api_server.py       # Main server
│   ├── auth.py             # Authentication
│   ├── database.py         # MongoDB
│   └── ...
├── react-frontend/         # React app
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Pages
│   │   └── services/       # API services
│   └── public/
└── DEPLOYMENT_GUIDE.md     # Deployment docs
```

## License

MIT License