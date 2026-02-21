# AI Content Creator

A comprehensive AI-powered content generation platform with advanced features for creating, analyzing, and optimizing content across multiple formats.

## Features

- **Multi-Content Generation**: Create blogs, social media posts, emails, ads, and more
- **AI-Powered Analysis**: Quality analysis with readability, engagement, and sentiment metrics
- **A/B Testing**: Compare different content variations with AI-powered winner prediction
- **Batch Processing**: Generate multiple pieces of content simultaneously
- **Template Library**: Pre-built templates for various content types
- **Content Enhancement**: Post-generation editing and improvement tools
- **User Authentication**: Secure user accounts with preferences and history
- **Dark/Light Mode**: Responsive design with theme switching

## Tech Stack

### Backend
- **Python 3.11+** with Flask
- **MongoDB Atlas** for data storage
- **OpenAI API** for content generation
- **JWT Authentication** for secure user sessions

### Frontend
- **React 18** with modern hooks
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Chart.js** for data visualization
- **Axios** for API communication

## Installation

### Prerequisites
- Python 3.11 or higher
- Node.js 18 or higher
- MongoDB Atlas account
- OpenAI API key

### Quick Start (Development)

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd ai-content-creator
   ```

2. Set up environment variables:
   ```bash
   # Copy example files
   cp .env.example .env
   cp react-frontend/.env.example react-frontend/.env
   
   # Edit .env files with your actual values
   ```

3. Install and run backend:
   ```bash
   # Create virtual environment
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   
   # Install dependencies
   pip install -r requirements.txt
   
   # Start backend server
   cd backend
   python start_server.py
   ```

4. Install and run frontend (in new terminal):
   ```bash
   cd react-frontend
   npm install
   npm start
   ```

5. Access the application:
   - Local: http://localhost:3000
   - Mobile (same network): http://192.168.1.5:3000

### Production Deployment

**Complete deployment guides available:**

1. **Backend (Render)**: See [RENDER_BACKEND_DEPLOYMENT.md](RENDER_BACKEND_DEPLOYMENT.md)
   - Step-by-step guide with screenshots
   - Environment variables setup
   - Troubleshooting tips

2. **Frontend (Netlify)**: See [DEPLOYMENT.md](DEPLOYMENT.md)
   - Netlify configuration
   - Environment variables
   - Custom domain setup

3. **Quick Reference**: See [BACKEND_DEPLOY_CHECKLIST.md](BACKEND_DEPLOY_CHECKLIST.md)
   - Printable checklist
   - Quick commands
   - Testing steps

**Quick deployment:**
```bash
# 1. Deploy Backend to Render (5 minutes)
#    Follow: RENDER_BACKEND_DEPLOYMENT.md

# 2. Deploy Frontend to Netlify (2 minutes)
#    Follow: DEPLOYMENT.md

# 3. Test everything
#    Follow: BACKEND_DEPLOY_CHECKLIST.md
```

**Deployment options:**
- **Frontend**: Netlify (recommended)
- **Backend**: Render, Railway, or Heroku
- **Database**: MongoDB Atlas

Run cleanup before deployment:
```bash
python cleanup.py
```

## Usage

1. Open your browser and navigate to `http://localhost:3000`
2. Create an account or log in
3. Choose a content template or use advanced generation
4. Configure parameters and generate content
5. Analyze quality metrics and make improvements
6. Save to history or export your content

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/verify` - Token verification

### Content Generation
- `POST /api/generate` - Generate content
- `POST /api/generate/advanced` - Advanced content generation
- `GET /api/templates` - Get available templates

### Content Management
- `GET /api/auth/history` - Get user content history
- `DELETE /api/history/{id}` - Delete content entry
- `GET /api/auth/statistics` - Get user statistics

### A/B Testing
- `POST /api/ab-tests` - Create A/B test
- `GET /api/ab-tests/{id}` - Get A/B test results
- `POST /api/ab-tests/{id}/results` - Submit A/B test results

### Batch Processing
- `POST /api/batch/create` - Create batch job
- `POST /api/batch/upload-csv` - Upload CSV for batch processing
- `GET /api/batch/jobs` - Get user batch jobs

## Project Structure

```
├── backend/                 # Python Flask backend
│   ├── api_server.py       # Main API server
│   ├── auth.py             # Authentication logic
│   ├── database.py         # Database connections
│   ├── llm_client.py       # OpenAI API client
│   ├── template_library.py # Content templates
│   └── ...
├── react-frontend/         # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   ├── pages/          # Page components
│   │   └── services/       # API services
│   └── public/
├── requirements.txt        # Python dependencies
└── README.md              # This file
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.