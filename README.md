# RecoverFlow - Revenue Recovery Chat for Service Businesses

A WhatsApp/SMS-first automated chat system that recovers lost revenue for high-ticket service businesses (dental clinics, aesthetic clinics, med spas, legal consults, high-end auto services, private tutors, etc.).

## Core Features

### 1. Missed Call Auto-Text
When a call is missed:
"Hi, this is {Business}. Sorry we missed you. What service are you looking for?"

### 2. Instant Website Chat Widget
Embedded on site. Captures:
• Name
• Phone
• Service needed
• Budget range
• Urgency

### 3. Smart Qualification Flows
Branching logic:
• If budget too low → send info
• If urgent → alert staff  
• If qualified → send booking link

### 4. No-Show Recovery
Automated SMS:
"We noticed you missed your appointment. Would you like to reschedule?"

### 5. Deposit Link Integration
Stripe integration. Require 10–30% deposit to reduce no-shows.

### 6. Admin Dashboard
• Conversation view
• Lead status
• Revenue recovered counter
• Basic analytics

## Tech Stack

- **Backend**: Node.js + Express
- **Messaging**: Twilio
- **Payments**: Stripe
- **Frontend**: React
- **Hosting**: Vercel + AWS
- **Database**: Postgres

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- Postgres database
- Twilio account (for SMS/WhatsApp)
- Stripe account (for payments)

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd recoverflow
   ```

2. **Install backend dependencies**:
   ```bash
   npm install
   ```

3. **Install frontend dependencies**:
   ```bash
   cd frontend
   npm install
   cd ..
   ```

4. **Set up environment variables**:
   Create a `.env` file in the root directory:
   ```env
   PORT=3001
   DATABASE_URL=postgresql://localhost:5432/recoverflow
   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   FRONTEND_URL=http://localhost:3000
   ```

5. **Set up the database**:
   ```bash
   createdb recoverflow
   psql -d recoverflow -f database.sql
   ```

6. **Start the backend server**:
   ```bash
   npm run dev
   ```

7. **Start the frontend development server** (in a new terminal):
   ```bash
   cd frontend
   npm start
   ```

## Usage

### Admin Dashboard
Access at `http://localhost:3000/admin`

### Website Chat Widget
Embedded on the landing page at `http://localhost:3000/`

### API Endpoints

- `GET /health` - Health check
- `GET /api/business/:id` - Get business info
- `POST /api/missed-call` - Handle missed call
- `POST /api/website-chat` - Website chat widget
- `POST /api/no-show` - No-show recovery
- `POST /api/create-deposit` - Create deposit link
- `GET /api/business/:id/conversations` - Get conversations
- `GET /api/business/:id/analytics` - Get analytics

## Database Schema

### Tables
- `businesses` - Business information
- `leads` - Lead management
- `conversations` - Chat conversations
- `messages` - Individual messages
- `appointments` - Appointment scheduling
- `payments` - Payment tracking
- `analytics` - Revenue recovery analytics

## Development

### Run Tests
```bash
npm test
```

### Build for Production
```bash
cd frontend
npm run build
cd ..
```

## Deployment

1. **Deploy backend**: Vercel or AWS
2. **Deploy frontend**: Vercel
3. **Set up production environment variables**
4. **Configure domain and SSL**

## Pricing Model

- **$499/month** - Small clinics
- **$799/month** - Multi-location
- **$1,500/month** - High-ticket niches

## GTM Strategy

1. **Phase 1 – Manual Validation**: Cold outreach to 100 clinics in one city
2. **Phase 2 – Case Study Engine**: Publish success stories
3. **Phase 3 – Scale Through Vertical Positioning**: Position as niche-specific solution

## Risk Factors

- Generic positioning
- Trying to build for "all businesses"
- Overbuilding features
- Weak sales execution

## License

MIT