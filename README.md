# 📱 Phone-Auth — OTP Authentication API

A clean, production-ready Phone OTP (One-Time Password) authentication API built with **Node.js + Express**. Supports multiple SMS providers for real SMS delivery and includes a development mode for local testing.

## ✨ Features

- 🔐 **Secure OTP Generation** - Cryptographically secure 6-digit OTPs
- 📱 **Bangladeshi Phone Support** - Automatic normalization for BD phone numbers
- 🚀 **Multiple SMS Providers** - Support for AlphaSMS and SendMySMS
- 🛡️ **Security Features** - Rate limiting, attempt tracking, and token-based auth
- 🧪 **Development Mode** - Test without sending real SMS
- ⚡ **Clean Architecture** - Modular, maintainable, and easy to extend

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd phone-auth
npm install
```

### 2. Configure Environment

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` with your settings (see [Environment Variables](#%EF%B8%8F-environment-variables)):
```bash
# For development (no real SMS)
DEV_MODE=true
BRAND_NAME=YourAppName

# For production (real SMS)
# DEV_MODE=false
# SMS_SERVICE_PROVIDER=ALPHASMS  # or SENTMYSMS
# ALPHASMS_API_KEY=your_api_key
```

### 3. Start the Server

#### Development Mode (Recommended for Testing)
```bash
npm run dev
```

#### Production Mode
```bash
npm start
```

The server will start at `http://localhost:3000`

---

## 📋 API Endpoints

### Health Check
```http
GET /health
```
Returns server status and timestamp.

### Request OTP
```http
POST /api/send-otp
Content-Type: application/json

{
  "phone": "+8801712345678"
}
```

**Response:**
```json
{
  "success": true,
  "isNewUser": false,
  "message": "OTP sent successfully."
}
```

### Verify OTP
```http
POST /api/verify-otp
Content-Type: application/json

{
  "phone": "+8801712345678",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "isNewUser": false,
  "token": "eyJhbGc...",
  "phone": "8801712345678",
  "user": {
    "registeredAt": "2026-04-02T...",
    "lastLogin": "2026-04-02T..."
  },
  "message": "Logged in successfully."
}
```

### Get Current User (Protected)
```http
GET /api/me
Authorization: Bearer <token>
```

### Logout (Protected)
```http
POST /api/logout
Authorization: Bearer <token>
```

### Delete Account (Protected)
```http
DELETE /api/account
Authorization: Bearer <token>
```

### Check User Registration Status
```http
GET /api/users/check?phone=+8801712345678
```

### Get All Users
```http
GET /api/users
```

---

## 📡 SMS Provider Setup

### AlphaSMS (sms.net.bd)

#### Step 1 — Create Account
Visit [https://sms.bd/signup/](https://sms.bd/signup/) and sign up.

#### Step 2 — Get API Key
- Log in to your dashboard
- Navigate to **API** section
- Copy your API key

#### Step 3 — Configure Environment
```bash
SMS_SERVICE_PROVIDER=ALPHASMS
ALPHASMS_API_URL=https://api.sms.net.bd/sendsms
ALPHASMS_API_KEY=your_api_key_here
```

### SendMySMS

#### Step 1 — Create Account
Sign up at SendMySMS platform.

#### Step 2 — Get Credentials
- Obtain your username and API key from dashboard

#### Step 3 — Configure Environment
```bash
SMS_SERVICE_PROVIDER=SENTMYSMS
SENTMYSMS_API_URL=https://sendmysms.net/api.php
SENTMYSMS_USER=your_username
SENTMYSMS_API_KEY=your_api_key
```

---

## 🧪 Development Mode (Mock OTP)

Use this mode for local testing without sending real SMS messages.

### Configuration

In your `.env` file:
```bash
DEV_MODE=true
```

### Behavior

- ❌ No real SMS messages are sent
- ✅ OTP is logged to the server console
- ✅ Full API functionality maintained
- ✅ Perfect for development and testing

---

## 🚀 Production Mode (Real SMS)

When ready to send real OTP messages:

### Configuration

Update your `.env` file:
```bash
DEV_MODE=false
SMS_SERVICE_PROVIDER=ALPHASMS  # or SENTMYSMS

# For AlphaSMS
ALPHASMS_API_KEY=your_actual_api_key

# For SendMySMS
# SENTMYSMS_USER=your_username
# SENTMYSMS_API_KEY=your_api_key

BRAND_NAME=YourCompanyName
```

### Restart Server

Stop the current server:
```bash
Ctrl + C
```

Start in production mode:
```bash
npm start
```

---

## 📋 BTRC Compliant SMS Format

All OTP messages follow Bangladesh Telecommunication Regulatory Commission guidelines:

```
Your [BrandName] verification code is 123456. Valid for 5 minutes. Do not share it.
```

✅ Brand name included  
✅ Clear validity period  
✅ Security warning  
✅ English format (approved for OTP)

---

## ⚙️ Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP server port |
| `DEV_MODE` | `true` | `true` = Console logging, `false` = Real SMS |
| `BRAND_NAME` | `"My App"` | Your app/company name shown in SMS |
| `SMS_SERVICE_PROVIDER` | `"ALPHASMS"` | Provider: `ALPHASMS` or `SENTMYSMS` |
| `ALPHASMS_API_URL` | `https://api.sms.net.bd/sendsms` | AlphaSMS endpoint |
| `ALPHASMS_API_KEY` | `""` | Your AlphaSMS API key |
| `SENTMYSMS_API_URL` | `https://sendmysms.net/api.php` | SendMySMS endpoint |
| `SENTMYSMS_USER` | `""` | Your SendMySMS username |
| `SENTMYSMS_API_KEY` | `""` | Your SendMySMS API key |

### OTP Configuration (Advanced)

These are set in `src/config/env.js` but can be overridden with env vars:

| Setting | Default | Description |
|---------|---------|-------------|
| `OTP_EXPIRY_MS` | `300000` (5 min) | OTP validity duration |
| `OTP_RESEND_COOLDOWN_MS` | `60000` (1 min) | Minimum time before resend |
| `MAX_ATTEMPTS` | `5` | Max verification attempts per OTP |

---

## 🔐 Security Features

- **Cryptographic OTP** - Secure random generation with `crypto.randomInt()`
- **Rate Limiting** - 60-second cooldown between OTP requests
- **Attempt Tracking** - Maximum 5 failed verification attempts
- **Auto-Expiry** - OTPs expire after 5 minutes
- **Phone Normalization** - Validates and normalizes BD phone numbers
- **Token-Based Auth** - Bearer tokens for protected endpoints
- **Token Revocation** - Logout invalidates tokens
- **Input Validation** - Comprehensive phone number validation

---

## 🏗️ Project Structure

```
phone-auth/
├── src/
│   ├── config/
│   │   └── env.js              # Configuration management
│   ├── routes/
│   │   └── auth.js             # API route handlers
│   ├── services/
│   │   ├── otp.js              # OTP storage & logic
│   │   ├── sms.js              # SMS provider abstraction
│   │   └── user.js             # User management
│   ├── utils/
│   │   └── phone.js            # Phone validation utilities
│   └── app.js                  # Express app factory
├── server.js                   # Server entry point
├── .env                        # Environment variables
├── .env.example                # Environment template
└── package.json                # Dependencies
```

---

## 🧪 Testing with curl

### 1. Health Check
```bash
curl -sS http://localhost:3000/health
```

### 2. Request OTP
```bash
curl -sS -X POST http://localhost:3000/api/send-otp \
  -H 'Content-Type: application/json' \
  -d '{"phone":"+8801712345678"}'
```

**Expected Response (DEV_MODE):**
```json
{
  "success": true,
  "isNewUser": false,
  "message": "[DEV] OTP: 123456"
}
```

### 3. Verify OTP
```bash
curl -sS -X POST http://localhost:3000/api/verify-otp \
  -H 'Content-Type: application/json' \
  -d '{"phone":"+8801712345678","otp":"123456"}'
```

**Expected Response:**
```json
{
  "success": true,
  "isNewUser": false,
  "token": "ODcwMTcxMjM0NTY3ODoxNzEyMzQ1Njc4OTAx...",
  "phone": "8801712345678",
  "user": { ... },
  "message": "Logged in successfully."
}
```

### 4. Access Protected Route
```bash
curl -sS -H 'Authorization: Bearer <your_token_here>' \
  http://localhost:3000/api/me
```

### 5. Logout
```bash
curl -sS -X POST http://localhost:3000/api/logout \
  -H 'Authorization: Bearer <your_token_here>'
```

### 6. Check Registration Status
```bash
curl -sS "http://localhost:3000/api/users/check?phone=+8801712345678"
```

---

## 🛠️ Development

### Running Tests
(No automated tests yet - manual testing via curl recommended)

### Code Style
- CommonJS modules
- JSDoc documentation
- Clean code principles
- Modular architecture

### Adding New Features

#### New SMS Provider
1. Add config to `src/config/env.js`
2. Implement sender in `src/services/sms.js`
3. Update provider selection logic

#### New Route
1. Add handler to `src/routes/auth.js`
2. Use `authenticate` middleware for protected routes
3. Follow existing error handling patterns

---

## 📝 Notes

- **In-Memory Storage**: Currently uses in-memory stores for OTP and users. Replace with Redis/database for production.
- **Token Security**: Uses simple Base64 encoding. Upgrade to JWT with signatures for production.
- **Phone Format**: Supports Bangladeshi numbers only (8801XXXXXXXXX format).

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📄 License

MIT License - feel free to use in your projects!

---

## 🆘 Troubleshooting

### Server won't start
- Check if port 3000 is available
- Verify `.env` file exists and is properly formatted
- Run `npm install` to ensure all dependencies are installed

### OTP not received
- In DEV_MODE: Check server console logs
- In production: Verify SMS provider credentials in `.env`
- Ensure phone number is in correct format (8801XXXXXXXXX)

### "Invalid phone number" error
- Must be a valid Bangladeshi mobile number
- Accepts formats: `+8801XXX`, `01XXX`, `1XXX` (10 digits)
- Operator code must be 3-9 (e.g., 8801**7**1234567)