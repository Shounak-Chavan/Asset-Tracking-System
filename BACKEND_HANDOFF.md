# Asset Tracking System Backend Handoff

## 1) Purpose of this document

This document is a complete backend handoff for:
- frontend integration work
- project documentation work
- demo and deployment preparation

It explains what has been built, how each module behaves, endpoint contracts, role rules, state transitions, and integration notes.

---

## 2) Tech stack and architecture

Backend stack:
- FastAPI (API framework)
- SQLAlchemy Async ORM
- PostgreSQL (via asyncpg)
- Alembic (migrations)
- JWT auth with access token + refresh token
- Pydantic schemas for request and response contracts

Main architecture layers:
- API routers: endpoint definitions and access control
- Services: business logic and status transitions
- Models: DB tables and enums
- Schemas: API request and response shapes
- Core: auth, RBAC, config, dependencies, exception handling

Main app entry:
- app/main.py

---

## 3) Project structure summary

Key backend folders:
- app/api: all route handlers
- app/services: booking, payment, allocation, return business workflows
- app/models: SQLAlchemy entities and enums
- app/schemas: pydantic contracts
- app/core: config, security, RBAC, dependency injection
- app/db: session and table init
- alembic: migration environment and versioned migrations

---

## 4) Core backend behavior

### 4.1 Authentication model

Implemented flow:
1. User registers with email and password
2. User logs in and receives access token in response body
3. Login also sets refresh token as HttpOnly cookie
4. Access token is sent by frontend in Authorization header
5. Refresh endpoint issues new access token using cookie token
6. Logout revokes refresh token in DB and clears cookie

Security implementation details:
- Password hashing: bcrypt via passlib
- Access token signed with ACCESS_TOKEN_SECRET_KEY
- Refresh token signed with REFRESH_TOKEN_SECRET_KEY
- Access token payload includes sub (email) and role
- Refresh token stored in refresh_tokens table and checked for revoked or expired

### 4.2 Role based access control

Roles:
- admin
- user

RBAC helper:
- require_roles in app/core/rbac.py

Rule examples:
- admin-only: create assets, create categories, create rental plans, allocate asset, process return, user management endpoints
- user and admin: profile read/update, browse categories/rental plans/assets, bookings, payments

### 4.3 CORS and frontend connectivity

Configured origins currently:
- http://localhost:3000
- http://127.0.0.1:3000
- http://localhost:5500
- http://127.0.0.1:5500

This is good for local development. For production, replace with actual frontend domain(s).

---

## 5) Data model summary

### 5.1 Users

Table: users

Important fields:
- id
- full_name
- email (unique)
- password_hash
- role (admin or user)
- phone
- is_active
- created_at
- updated_at

### 5.2 Refresh tokens

Table: refresh_tokens

Used for session refresh lifecycle and logout revocation.

### 5.3 Categories

Table: categories

Simple classification for assets. Cannot be deleted if assets exist in that category.

### 5.4 Assets

Table: assets

Important fields:
- asset_code (unique, generated)
- name
- description
- category_id
- status
- is_active (soft delete flag)

Asset statuses:
- available
- booked
- allocated
- ready_for_pickup
- picked_up
- returned
- overdue

Current workflow mainly uses available and allocated statuses.

### 5.5 Rental plans

Table: rental_plans

Defines commercial terms:
- duration_days
- daily_rate
- deposit_amount
- daily_fine_rate
- is_active

### 5.6 Bookings

Table: bookings

Booking statuses:
- pending
- booked
- allocated
- ready_for_pickup
- picked_up
- returned
- overdue
- cancelled

Current workflow uses:
- pending -> booked -> allocated -> picked_up -> returned
and pending -> cancelled

### 5.7 Payments

Table: payments

Payment types:
- deposit
- rent
- fine
- deposit_refund

Payment status:
- pending
- paid
- failed

Current mock flow marks created payments as paid directly.

### 5.8 Allocations

Table: allocations

Maps booking to a physical asset with allocated_by admin and allocated_at timestamp.

### 5.9 Returns

Table: returns

Captures return event:
- returned_at
- days_late
- fine_amount
- deposit_refunded
- processed_by

---

## 6) Business workflows and state transitions

### 6.1 Booking creation

Service: app/services/booking_service.py

Rules:
- rental plan must exist and be active
- pickup date cannot be in the past
- due_date = pickup_date + duration_days
- rent_amount = daily_rate * duration_days
- new booking status = pending

### 6.2 Deposit payment

Service: app/services/payment_service.py

Rules:
- booking must exist
- booking must belong to logged-in user
- booking must be pending
- no existing paid deposit for that booking
- creates payment(type=deposit)
- updates booking status to booked

### 6.3 Admin allocation

Service: app/services/allocation_service.py

Rules:
- booking must exist
- booking status must be booked
- allocation must not already exist for booking
- asset must exist and be available
- creates allocation record
- updates asset status to allocated
- updates booking status to allocated

### 6.4 Rent payment

Service: app/services/payment_service.py

Rules:
- booking must exist and belong to user
- booking status must be allocated
- no existing paid rent payment
- creates payment(type=rent)
- updates booking status to picked_up

### 6.5 Admin return processing

Service: app/services/return_service.py

Rules:
- booking must exist
- booking status must be picked_up
- return must not already exist
- rental plan must exist
- days_late = max(0, returned_at - due_date)
- fine_amount = days_late * daily_fine_rate
- allocation must exist to locate asset
- creates return record
- updates booking status to returned
- updates asset status to available
- creates payment:
  - fine payment if fine_amount > 0
  - deposit_refund payment if fine_amount == 0

---

## 7) API endpoint catalog

Base URL local default:
- http://127.0.0.1:8000

Health:
- GET /health

Auth:
- POST /auth/register
- POST /auth/login
- POST /auth/refresh
- POST /auth/logout
- POST /auth/change-password

Users:
- GET /users/me
- PUT /users/me
- GET /users/ (admin)
- GET /users/{user_id} (admin)
- PUT /users/{user_id} (admin)
- PATCH /users/{user_id}/role (admin)
- PATCH /users/{user_id}/activate (admin)

Rental plans:
- POST /rental-plans/ (admin)
- GET /rental-plans/
- GET /rental-plans/{plan_id}
- PATCH /rental-plans/{plan_id} (admin)
- DELETE /rental-plans/{plan_id} (admin, soft delete)

Categories:
- POST /categories/ (admin)
- GET /categories/
- GET /categories/{category_id}
- PATCH /categories/{category_id} (admin)
- DELETE /categories/{category_id} (admin, hard delete with guard)

Assets:
- POST /assets/ (admin, supports quantity for bulk creation)
- GET /assets/
- GET /assets/{asset_id}
- PATCH /assets/{asset_id} (admin)
- DELETE /assets/{asset_id} (admin, soft delete)

Bookings:
- POST /bookings/
- GET /bookings/
- DELETE /bookings/{booking_id}

Payments:
- POST /payments/deposit/{booking_id}
- POST /payments/rent/{booking_id}

Admin allocation and return:
- POST /admin/allocate/{booking_id}
- POST /admin/returns/{booking_id}

---

## 8) Request and response contracts for frontend

### 8.1 Auth

Register request body:
- full_name: string
- email: valid email
- password: string

Login request body:
- email: valid email
- password: string

Login response:
- access_token: string
- token_type: bearer

Refresh behavior:
- frontend sends POST /auth/refresh
- refresh token comes from HttpOnly cookie
- response returns new access_token

Change password request:
- current_password: string
- new_password: string

### 8.2 Booking

Create booking request:
- rental_plan_id: integer
- pickup_date: YYYY-MM-DD

Booking response includes:
- id, user_id, rental_plan_id
- status
- pickup_date, due_date
- deposit_amount, rent_amount
- created_at
- rental_plan object embedded

Money fields are serialized as float in response.

### 8.3 Payment

Payment response includes:
- id
- booking_id
- type
- amount
- status
- razorpay_order_id
- razorpay_payment_id
- created_at

Money fields are serialized as float in response.

### 8.4 Allocation

Allocation create request:
- asset_id: integer

Allocation response:
- id
- booking_id
- asset_id
- allocated_by
- allocated_at

### 8.5 Return

Return create request:
- returned_at: YYYY-MM-DD

Return response:
- id
- booking_id
- returned_at
- days_late
- fine_amount
- deposit_refunded
- processed_by
- created_at

fine_amount is serialized as float in response.

---

## 9) Frontend integration instructions

### 9.1 Access token handling

For protected APIs (most endpoints), send:
- Authorization header: Bearer access_token

Recommended frontend flow:
1. On login, store access token in memory or storage
2. Attach token to all protected requests
3. On 401 due to expired token, call /auth/refresh
4. If refresh succeeds, retry original request
5. If refresh fails, redirect to login

### 9.2 Refresh token handling

Refresh token is cookie-based and HttpOnly, so frontend JS cannot read it directly.
Frontend only needs to call /auth/refresh.

### 9.3 Role-based UI rendering

After login, decode role from access token payload or fetch user profile.
Use role to show/hide admin UI actions:
- admin screens: create category/plan/assets, user admin actions, allocation, returns
- user screens: browse, booking, payment, own profile

### 9.4 Common API failure responses to handle

Typical status codes:
- 400 business rule violation
- 401 invalid/expired token, missing refresh token
- 403 access denied or deactivated user
- 404 not found

Frontend should display server detail message from response detail field.

---

## 10) Important backend fixes completed

The following issues were fixed and validated:
- payment router is mounted in main app
- payment service calls now use correct user_id argument
- category delete async session call fixed
- update uniqueness checks avoid self-collision on category and rental plan updates
- decimal serialization added for payment and returns schemas
- model loading in app/db/init_db.py includes all models
- alembic env imports all models for complete metadata
- booking and rental plan relationship made consistent with back_populates
- allocation response includes allocated_by for API consistency

---

## 11) Migration and environment notes

Required environment variables:
- ACCESS_TOKEN_SECRET_KEY
- REFRESH_TOKEN_SECRET_KEY
- DATABASE_URL
- ADMIN_EMAIL
- ADMIN_PASSWORD
- ADMIN_FULL_NAME

Without these, startup fails by design in config validation.

Alembic uses sync driver conversion in env.py for migration execution.

---

## 12) Deployment readiness checklist

Before production deploy:
1. Set production CORS origins
2. Change login cookie secure to true on HTTPS
3. Apply latest alembic migrations
4. Verify production admin credentials are configured securely
5. Enable structured logging and monitoring
6. Add rate limiting and brute-force protection on auth endpoints
7. Use managed secrets store for environment variables

---

## 13) Suggested future improvements

Short-term:
- add endpoint-level automated tests for critical flow
- add stronger password policy validation
- add pagination for list endpoints
- normalize error format for all exceptions

Payment roadmap:
- complete Razorpay order and signature verification flow
- move from mock direct-paid flow to real payment states

Operational:
- add CI checks for lint, tests, migration checks
- add OpenAPI export and publish docs page for frontend team

---

## 14) Quick frontend flow sequence

User flow sequence:
1. Register user
2. Login user
3. List rental plans and assets
4. Create booking
5. Pay deposit
6. Admin allocates asset
7. User pays rent
8. Admin processes return

Status sequence in booking:
- pending -> booked -> allocated -> picked_up -> returned

Alternative branch:
- pending -> cancelled

---

## 15) Final note for teammate

Backend is organized around strict business state transitions and role-guarded actions.
For frontend, the most important part is to follow status-driven UI behavior and token refresh handling.
For project documentation, focus on the lifecycle flows (auth, booking, payment, allocation, return) because that is the core system story.
