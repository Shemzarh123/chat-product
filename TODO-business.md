# Million Rand Business Transformation TODO
Status: In Progress ⏳

Breakdown of approved plan into logical steps. Update as completed.

## Phase 1: Business Model & Payments [ ]
### 1.1 [x] Create BUSINESS-PLAN.md with full model details
### 1.2 [x] Create backend/routes/payments.js (PayFast/Stripe integration)
### 1.3 [x] Edit backend/server.js: Add payments routes/middleware
### 1.4 [x] Update backend/package.json: Add payfast, stripe-node, security, infra deps
### 1.5 [x] Edit backend/models/User.js: +payment/2FA fields, methods
### 1.5 [x] Edit frontend/src/components/SubscriptionPlans.js: Real PayFast/Stripe checkout
**Next: Phase 2**
### 1.6 Test mock->real payments (sandbox)

## Phase 2: High-End Security [ ]
### 2.1 Create backend/models/AuditLog.js
### 2.2 Create backend/middleware/audit.js & 2fa.js
### 2.3 Edit backend/models/User.js: +2faSecret, payment fields
### 2.4 Edit backend/server.js: Global 2FA/audit/validators
### 2.5 [x] Create SECURITY-AUDIT.md with measures
### 2.6 backend/package.json: +speakeasy, winston

## Phase 3: Production Infrastructure [ ]
### 3.1 [x] Create Dockerfile (backend/frontend), docker-compose.yml, nginx.conf
### 3.2 [x] Create infra/terraform (AWS VPC/RDS/Redis/ALB/S3)
### 3.3 backend: Redis integration, BullMQ queues
### 3.4 backend/package.json: +redis, bullmq, aws-sdk
### 3.5 Create .github/workflows/deploy.yml (CI/CD)
### 3.6 Update server.js: Prod env vars, HTTPS redirect

## Phase 4: Marketing & Analytics [ ]
### 4.1 Create frontend/public/landing.html (SEO landing)
### 4.2 Integrate PostHog analytics
### 4.3 Update App.js: Marketing routes

## Phase 5: Deploy & Test [ ]
### 5.1 npm i all new deps
### 5.2 docker-compose up test
### 5.3 terraform init/apply (user provides AWS keys)
### 5.4 Live test payments/security/scaling
### 5.5 MRR dashboard verification

**Next: Phase 1.1**
