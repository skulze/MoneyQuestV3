# MoneyQuestV3 Backend API Design
## Phase 6: Backend API & Services

### Architecture Overview
- **Platform**: AWS Lambda + API Gateway
- **Database**: PostgreSQL via Prisma
- **Authentication**: AWS Cognito + JWT
- **Payments**: Stripe
- **Storage**: S3 (encrypted backups)

### API Endpoints Structure

## 1. Authentication & User Management

### POST /auth/register
```json
{
  "email": "user@example.com",
  "password": "securePassword",
  "name": "John Doe"
}
```
**Response**: User profile + JWT tokens

### POST /auth/confirm
```json
{
  "email": "user@example.com",
  "confirmationCode": "123456"
}
```

### GET /users/profile
**Headers**: `Authorization: Bearer {token}`
**Response**: Complete user profile with subscription info

### PUT /users/profile
**Body**: Updated profile information
**Response**: Updated user profile

### DELETE /users/account
**Response**: Account deletion confirmation

## 2. Subscription & Payment Management

### GET /subscriptions/current
**Response**: Current subscription details, limits, features

### POST /subscriptions/upgrade
```json
{
  "tier": "plus" | "premium",
  "priceId": "stripe_price_id"
}
```
**Response**: Stripe checkout session URL

### POST /subscriptions/cancel
**Response**: Cancellation confirmation

### POST /webhooks/stripe
**Body**: Stripe webhook events
**Purpose**: Handle payment events, subscription changes

## 3. Cloud Backup & Sync

### POST /backup/create
```json
{
  "data": "encrypted_data_blob",
  "version": 1,
  "checksum": "hash"
}
```
**Response**: Backup ID and timestamp

### GET /backup/latest
**Response**: Latest backup metadata + download URL

### GET /backup/{backupId}
**Response**: Specific backup data (encrypted)

### DELETE /backup/{backupId}
**Response**: Deletion confirmation

## 4. Financial Data APIs

### Accounts
- `GET /accounts` - List user accounts
- `POST /accounts` - Create new account
- `PUT /accounts/{id}` - Update account
- `DELETE /accounts/{id}` - Delete account

### Transactions
- `GET /transactions` - List transactions (✅ Implemented)
- `POST /transactions` - Create transaction
- `PUT /transactions/{id}` - Update transaction
- `DELETE /transactions/{id}` - Delete transaction
- `POST /transactions/{id}/split` - Add transaction split

### Categories
- `GET /categories` - List categories
- `POST /categories` - Create category
- `PUT /categories/{id}` - Update category
- `DELETE /categories/{id}` - Delete category

### Budgets
- `GET /budgets` - List budgets
- `POST /budgets` - Create budget
- `PUT /budgets/{id}` - Update budget
- `DELETE /budgets/{id}` - Delete budget

## 5. Analytics & Reporting

### GET /analytics/spending-trends
**Query**: `?timeframe=30d&accountId=123`
**Response**: Spending trend data

### GET /analytics/category-breakdown
**Query**: `?timeframe=30d`
**Response**: Category spending breakdown

### GET /analytics/budget-progress
**Response**: Budget vs actual progress

## 6. Premium Features (Feature-Gated)

### POST /plaid/link-token
**Tier**: Premium only
**Response**: Plaid link token for bank connection

### POST /plaid/exchange-token
**Body**: Plaid public token
**Response**: Account connection confirmation

### POST /ocr/process-receipt
**Tier**: Plus/Premium
**Body**: Base64 image data
**Response**: Extracted transaction data

### Error Handling
All endpoints return standardized error responses:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": {...}
  },
  "timestamp": "2025-09-24T13:00:00Z"
}
```

### Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden (subscription limit)
- `404` - Not Found
- `429` - Rate Limited
- `500` - Internal Server Error

### Rate Limiting
- Free Tier: 100 requests/hour
- Plus Tier: 1000 requests/hour
- Premium Tier: 5000 requests/hour

### Security
- All endpoints require JWT authentication (except registration)
- Data encryption at rest (S3)
- TLS 1.3 in transit
- Input validation via Zod schemas
- CORS properly configured
- Rate limiting by subscription tier