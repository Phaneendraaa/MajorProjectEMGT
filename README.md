# NBFC Loan Management System

A production-grade full-stack loan management system with AI-powered loan processing, credit scoring, and an intelligent chatbot loan officer.

## 🌟 Features

### Core Functionality
- **KYC Registration**: Complete user registration with document verification
- **Phone + OTP Authentication**: Secure login using phone number and email OTP
- **AI-Powered Loan Processing**: Multi-agent system for credit scoring, document verification, and underwriting
- **Intelligent Chatbot**: AI loan officer that can negotiate terms and process loans end-to-end
- **Banking Dashboard**: Complete financial overview with account balance, loans, transactions, and EMI schedules
- **Real-time Loan Application**: Instant credit decisioning with AI agents
- **EMI Management**: Track and manage EMI payments with reminders
- **Dark/Light Mode**: Modern UI with theme toggle

### AI Agents
1. **Credit Scoring Agent**: Analyzes financial data and computes credit scores (300-850)
2. **Document Verification Agent**: Verifies KYC documents (Aadhar, PAN, face)
3. **EMI Calculation Agent**: Calculates EMI based on risk level and loan terms
4. **Underwriting Agent**: Makes final approval/rejection decisions
5. **Loan Orchestrator**: Coordinates all agents for complete loan processing
6. **Chatbot Agent**: Virtual loan officer for user interactions and negotiations

## 🛠 Tech Stack

### Backend
- **Python 3.11** with FastAPI
- **MongoDB Atlas** for database
- **Mistral AI** (via Emergent LLM integration) for AI agents
- **JWT** authentication with httpOnly cookies
- **aiosmtplib** for email OTP
- **Motor** for async MongoDB operations

### Frontend
- **React 18** with Create React App
- **React Router** for navigation
- **Axios** for API calls
- **Tailwind CSS** for styling
- **Shadcn UI** components
- **Phosphor Icons** for iconography
- **Sonner** for toast notifications

## 📋 Prerequisites

- Python 3.11+
- Node.js 20 LTS
- MongoDB Atlas account
- Mistral API key (or use Emergent LLM key)
- Gmail account with app-specific password (for OTP emails)
- Docker (optional, for containerized deployment)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd nbfc-loan-system
```

### 2. Environment Setup

Create `.env` files in both backend and frontend directories:

#### Backend `.env`
```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your credentials:
- MongoDB Atlas connection string
- Mistral API key
- Gmail SMTP credentials
- JWT secret (generate a secure random string)

#### Frontend `.env`
```bash
cp frontend/.env.example frontend/.env
```

Edit `frontend/.env`:
```
REACT_APP_BACKEND_URL=http://localhost:8001
```

### 3. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Seed database with preloaded users
python seed_data.py

# Run backend server
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

Backend will be available at `http://localhost:8001`

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
yarn install

# Start development server
yarn start
```

Frontend will be available at `http://localhost:3000`

## 🐳 Docker Deployment

### Using Docker Compose

1. Create a `.env` file in the root directory with all required environment variables

2. Build and run with Docker Compose:

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Services will be available at:
- Frontend: `http://localhost:80`
- Backend: `http://localhost:8001`

### Individual Docker Builds

#### Backend
```bash
cd backend
docker build -t nbfc-backend .
docker run -p 8001:8001 --env-file .env nbfc-backend
```

#### Frontend
```bash
cd frontend
docker build -t nbfc-frontend .
docker run -p 80:80 nbfc-frontend
```

## 👥 Test Users

The system comes pre-seeded with 3 test users (all with complete loan history):

### User 1: Vamshi Joshi
- **Phone**: 9121647597
- **Email**: vamshijoshi25@gmail.com
- **Credit Score**: 750
- **Account Balance**: ₹125,000

### User 2: Naga Phaneendra
- **Phone**: 9063454476
- **Email**: nagaphaneendrapuranam@gmail.com
- **Credit Score**: 720
- **Account Balance**: ₹98,000

### User 3: Ram Charan M
- **Phone**: 9398123664
- **Email**: cgoud129@gmail.com
- **Credit Score**: 780
- **Account Balance**: ₹156,000

### How to Login
1. Go to login page
2. Enter any phone number above
3. OTP will be sent to the registered email
4. Check email and enter the 6-digit OTP
5. Access full dashboard with loan history

## 📱 Application Flow

### 1. User Registration (New Users)
- Complete KYC form with personal details
- Upload face image
- Verify email with OTP
- Account created with ₹50,000 initial balance

### 2. Login (Existing Users)
- Enter phone number
- Receive OTP via email
- Verify OTP and login
- Access dashboard

### 3. Apply for Loan
- Fill loan application form
- AI agents process application instantly:
  - Credit score calculation
  - Document verification
  - Risk assessment
  - EMI calculation
  - Underwriting decision
- Get instant approval/rejection with customized terms

### 4. AI Chatbot Interactions
- Ask questions about loans
- Check eligibility
- Negotiate loan terms (amount, tenure, EMI)
- Get financial advice
- Process loans through conversation

### 5. Dashboard Features
- View account balance and credit score
- Track active loans
- Monitor EMI schedule
- View transaction history
- Receive EMI reminders

## 🏗 Project Structure

```
/app
├── backend/
│   ├── server.py              # Main FastAPI application
│   ├── models.py              # Pydantic models
│   ├── auth.py                # Authentication utilities
│   ├── email_service.py       # Email OTP service
│   ├── ai_agents.py           # AI agent implementations
│   ├── seed_data.py           # Database seeding script
│   ├── requirements.txt       # Python dependencies
│   ├── .env                   # Environment variables
│   └── Dockerfile            # Docker configuration
│
├── frontend/
│   ├── src/
│   │   ├── pages/            # Page components
│   │   │   ├── LoginPage.js
│   │   │   ├── DashboardPage.js
│   │   │   ├── LoansPage.js
│   │   │   ├── LoanApplicationPage.js
│   │   │   └── ChatPage.js
│   │   ├── components/       # Reusable components
│   │   │   ├── DashboardLayout.js
│   │   │   ├── ProtectedRoute.js
│   │   │   └── ui/          # Shadcn UI components
│   │   ├── contexts/         # React contexts
│   │   │   ├── AuthContext.js
│   │   │   └── ThemeContext.js
│   │   ├── api/             # API client
│   │   │   └── index.js
│   │   ├── App.js           # Main app component
│   │   └── index.js         # Entry point
│   ├── package.json
│   ├── tailwind.config.js
│   ├── .env
│   ├── Dockerfile
│   └── nginx.conf
│
├── docker-compose.yml         # Docker Compose configuration
├── .env.example              # Environment variables template
└── README.md                 # This file
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with phone (sends OTP)
- `POST /api/auth/send-otp` - Send OTP to email
- `POST /api/auth/verify-otp` - Verify OTP and login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### User Dashboard
- `GET /api/user/dashboard` - Get complete dashboard data
- `GET /api/user/transactions` - Get transaction history
- `GET /api/user/loans` - Get all loans
- `GET /api/user/emi-schedule/:loanId` - Get EMI schedule

### Loan Management
- `POST /api/loan/apply` - Apply for new loan
- `GET /api/loan/status/:loanId` - Get loan status

### AI Chatbot
- `POST /api/chat/message` - Send message to chatbot
- `GET /api/chat/history` - Get chat history
- `POST /api/chat/negotiate` - Negotiate loan terms

### Health Check
- `GET /api/health` - Health check endpoint

## 🎨 UI/UX Features

- **Professional Banking Theme**: Navy blue/corporate design
- **Dark/Light Mode**: Toggle between themes
- **Responsive Design**: Works on all devices
- **Smooth Animations**: Transitions and micro-interactions
- **Glass-morphism Effects**: Modern glassmorphic header
- **High Contrast**: WCAG AA compliant
- **Clean Typography**: Outfit (headings) + Manrope (body)
- **Iconography**: Phosphor Icons for consistent design

## 🧪 Testing

### Backend Testing
```bash
# Test health endpoint
curl http://localhost:8001/api/health

# Test login flow
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"9121647597"}'
```

### Frontend Testing
Open browser and test:
1. Login with test user phone numbers
2. Check OTP in email
3. Verify dashboard loads with data
4. Apply for a new loan
5. Chat with AI assistant
6. Toggle dark/light mode

## 🔒 Security Features

- JWT tokens with httpOnly cookies
- Secure password hashing (not used for this phone+OTP flow)
- Email OTP verification (10 min expiry)
- CORS configuration
- Environment variable protection
- MongoDB injection prevention
- Input validation with Pydantic

## 📈 Future Enhancements

- Payment gateway integration (Stripe/Razorpay)
- SMS OTP (via Twilio)
- Document upload and OCR
- Advanced analytics dashboard
- Loan comparison features
- Credit bureau integration
- Mobile app (React Native)
- Multi-language support
- Real-time notifications (WebSocket)
- Loan calculator widget

## 🐛 Troubleshooting

### Backend Issues

**MongoDB Connection Error**
- Verify MongoDB Atlas connection string
- Check IP whitelist in MongoDB Atlas
- Ensure network access is configured

**Email OTP Not Sending**
- Verify Gmail credentials
- Enable "Less secure app access" or use App Password
- Check EMAIL_HOST and EMAIL_PORT in .env

**AI Agents Not Working**
- Verify MISTRAL_API_KEY is set correctly
- Check API key has sufficient credits
- Review backend logs for errors

### Frontend Issues

**API Connection Failed**
- Verify REACT_APP_BACKEND_URL is correct
- Ensure backend is running on port 8001
- Check CORS configuration

**Login Issues**
- Verify user exists in database
- Check email is receiving OTP
- Ensure cookies are enabled

### Docker Issues

**Container Not Starting**
- Check docker-compose logs: `docker-compose logs`
- Verify .env file exists with all variables
- Ensure ports 80 and 8001 are not in use

## 📄 License

This project is created for demonstration purposes.

## 👨‍💻 Development

### Code Structure
- Clean, modular architecture
- Production-grade error handling
- Comprehensive logging
- Type hints and validation
- Async/await patterns
- RESTful API design

### Best Practices
- Environment-based configuration
- Separation of concerns
- Reusable components
- Consistent naming conventions
- Comprehensive documentation

## 🙏 Acknowledgments

- **FastAPI** for the amazing web framework
- **React** for the frontend library
- **MongoDB Atlas** for database hosting
- **Mistral AI** for AI capabilities
- **Shadcn UI** for beautiful components
- **Tailwind CSS** for utility-first styling

## 📞 Support

For issues and questions:
1. Check this README
2. Review application logs
3. Verify environment variables
4. Check database connectivity

---

**Built with ❤️ using AI-powered development**
