# Endpoints Report — Frontend & Backend

Generated: 2026-05-07

## Summary
- Backend: FastAPI app with routers mounted in `app/main.py`.
- Frontend: React app (Vite/TSX) in `frontend-app/src` using a central `api.ts` wrapper.
- API base default: `http://127.0.0.1:8000` (overridable via `VITE_API_BASE_URL`).

---

## Backend (FastAPI)

All backend routers are included in [app/main.py](app/main.py#L1-L120). CORS is configured to allow localhost ports 3000, 5173, 4173, 5500. A `GET /health` health-check exists.

Below is a concise listing of router groups, endpoints, authentication/authorization requirements, handler files and behavior.

- **Auth** — prefix `/auth` — file: [app/api/routers_auth.py](app/api/routers_auth.py)
  - POST `/auth/register` — public — handler `register()` — request: `UserRegister` — response: `UserResponse`. Creates a new user (default role `user`).
  - POST `/auth/login` — public — handler `login()` — request: `UserLogin` — response: `AccessTokenResponse`. Verifies credentials, returns access token and sets httpOnly refresh cookie; stores refresh token in DB.
  - POST `/auth/refresh` — cookie-based — handler `refresh_token()` — response: `AccessTokenResponse`. Reads `refresh_token` cookie, validates against DB, issues new access token.
  - POST `/auth/logout` — cookie-based — handler `logout()` — clears refresh token cookie and revokes token in DB.
  - POST `/auth/change-password` — auth required — handler `change_password()` — request: `ChangePassword`. Verifies current password and updates it.

- **Users** — prefix `/users` — file: [app/api/routers_users.py](app/api/routers_users.py)
  - GET `/users/me` — auth required — returns current user's `UserResponse`.
  - PUT `/users/me` — auth required — request: `UserUpdate` — updates the current user's profile.
  - GET `/users/` — admin only (role) — returns list of `UserResponse`, supports query params `role` and `is_active`.
  - GET `/users/{user_id}/history` — admin only — response: `UserHistoryResponse` — aggregates bookings/payments for a user.
  - GET `/users/{user_id}` — admin only — returns `UserResponse` for the given id.
  - PUT `/users/{user_id}` — admin only — updates user (admin fields) via `UserUpdateAdmin`.
  - PATCH `/users/{user_id}/role` — admin only — request: `UserRoleUpdate` — assign role.
  - PATCH `/users/{user_id}/activate` — admin only — request: `UserActivate` — toggle `is_active`.

- **Assets** — prefix `/assets` — file: [app/api/routers_assets.py](app/api/routers_assets.py)
  - POST `/assets/` — admin only — request: `AssetCreate` — can create one or bulk assets; generates asset codes.
  - GET `/assets/` — public (optional auth) — list assets with optional filters: `name`, `category_name`, `status`. Non-admins only see active assets.
  - GET `/assets/{asset_id}` — public — returns single asset; non-admins restricted to active assets.
  - PATCH `/assets/{asset_id}` — admin only — `AssetUpdate` — edit fields, status, is_active, dry-cleaning flag.
  - DELETE `/assets/{asset_id}` — admin only — hard delete; cleans up related bookings/allocations.

- **Categories** — prefix `/categories` — file: [app/api/routers_category.py](app/api/routers_category.py)
  - POST `/categories/` — admin only — create category (`CategoryCreate`).
  - GET `/categories/` — public — list categories.
  - GET `/categories/{category_id}` — public — get category by id.
  - PATCH `/categories/{category_id}` — admin only — update (`CategoryUpdate`).
  - DELETE `/categories/{category_id}` — admin only — delete (blocked if assets exist).

- **Rental Plans** — prefix `/rental-plans` — file: [app/api/routers_rental_plans.py](app/api/routers_rental_plans.py)
  - POST `/rental-plans/` — admin only — `RentalPlanCreate` — create plan.
  - GET `/rental-plans/` — public — list active plans.
  - GET `/rental-plans/{plan_id}` — auth required — get plan details.
  - PATCH `/rental-plans/{plan_id}` — admin only — update plan.
  - DELETE `/rental-plans/{plan_id}` — admin only — soft-delete (set `is_active=False`).

- **Bookings** — prefix `/bookings` — file: [app/api/routers_booking.py](app/api/routers_booking.py)
  - POST `/bookings/` — auth required — `BookingCreate` — create a booking (service layer `booking_service.create_booking`).
  - GET `/bookings/` — auth required — list bookings for current user.
  - GET `/bookings/admin/all` — admin only — list all bookings.
  - DELETE `/bookings/{booking_id}` — auth required — cancel booking (service layer).
  - PATCH `/bookings/{booking_id}/request-return` — auth required — request return.
  - GET `/bookings/assets/{asset_id}/blocked-dates` — auth required — returns blocked date ranges (service layer).

- **Payments** — prefix `/payments` — file: [app/api/routers_payment.py](app/api/routers_payment.py)
  - POST `/payments/deposit/{booking_id}` — auth required — `pay_deposit` service.
  - POST `/payments/rent/{booking_id}` — auth required — `pay_rent` service.
  - GET `/payments/breakdown/{booking_id}` — auth required — returns payment breakdown. Non-admins restricted to their own bookings.

- **Admin Allocations & Returns** — prefix `/admin` — files: [app/api/routers_allocation.py](app/api/routers_allocation.py), [app/api/routers_return.py](app/api/routers_return.py)
  - GET `/admin/allocations` — admin only — list allocations.
  - POST `/admin/allocate/{booking_id}` — admin only — allocate asset to booking (`AllocationCreate`).
  - PATCH `/admin/bookings/{booking_id}/reject` — admin only — reject a booking request.
  - POST `/admin/returns/{booking_id}` — admin only — process a return (`ReturnCreate`).

Notes: most handlers depend on `get_current_user` or role-check wrappers `require_roles`. Database access uses `AsyncSession` from `app.db.session.get_db`. Many endpoints delegate business logic to `app.services.*` modules (e.g., booking_service, payment_service, allocation_service, return_service).

---

## Frontend (React)

- Source root: `frontend-app/src`
- Router and pages: [frontend-app/src/App.tsx](frontend-app/src/App.tsx) — routes:
  - Public / user routes: `/`, `/login`, `/register`, `/assets`, `/bookings` (protected), `/profile` (protected), `/terms`, `/about`, `/contact`, `*` (404).
  - Admin routes (under `/admin`): `/admin`, `/admin/assets`, `/admin/categories`, `/admin/plans`, `/admin/users`, `/admin/ops`.

- Central API wrapper: [frontend-app/src/api.ts](frontend-app/src/api.ts)
  - `API_BASE_URL` default: `http://127.0.0.1:8000` (set via `VITE_API_BASE_URL`).
  - Uses `fetch` with `credentials: 'include'` so refresh token cookie (httpOnly) is sent.
  - Auto-refresh logic: on 401 (except auth endpoints) calls `/auth/refresh` to obtain new access token, stores it in `localStorage` under `asset_tracking_access_token` and retries the request.

- Mappings (selected): pages -> `api` calls
  - `AuthContext` ([frontend-app/src/auth-context.tsx](frontend-app/src/auth-context.tsx)) calls `api.login`, `api.register`, `api.refresh`, `api.me`, `api.logout`, `api.changePassword`.
  - `AssetsPage` ([frontend-app/src/pages/AssetsPage.tsx](frontend-app/src/pages/AssetsPage.tsx)) uses `api.listAssets`, `api.listCategories`, `api.listRentalPlans`.
  - `AssetBookingModal` ([frontend-app/src/components/AssetBookingModal.tsx](frontend-app/src/components/AssetBookingModal.tsx)) uses `api.listRentalPlans`, `api.getBlockedDatesForAsset`, `api.createBooking`.
  - `BookingsPage` and `ProfilePage` use `api.listBookings`, `api.payDeposit`, `api.payRent`, `api.cancelBooking`, `api.requestReturn`.
  - Admin pages (`frontend-app/src/pages/admin/*`) use admin endpoints:
    - Admin Assets: `api.listAssets`, `api.createAsset`, `api.updateAsset`, `api.deleteAsset`, `api.listCategories`.
    - Admin Categories: `api.listCategories`, `api.createCategory`, `api.updateCategory`, `api.deleteCategory`.
    - Admin Plans: `api.listRentalPlans`, `api.createRentalPlan`, `api.updateRentalPlan`, `api.deleteRentalPlan`.
    - Admin Users: `api.listUsers`, `api.setUserRole`, `api.setUserActive`, `api.getUserHistory`.
    - Admin Operations: `api.listAdminBookings`, `api.allocateAsset`, `api.rejectBookingByAdmin`, `api.processReturn`.

---

## Notable implementation details
- Authentication: access tokens returned by `/auth/login` are short-lived JWTs used in `Authorization: Bearer <token>` headers; refresh tokens are stored as httpOnly cookies and validated server-side (DB-backed RefreshToken model).
- Authorization: role checks performed server-side using `require_roles` decorator (admin-only endpoints).
- Database: endpoints use SQLAlchemy `AsyncSession` with queries and model objects (models live under `models/`).
- Error handling: `parseResponse` in frontend converts FastAPI `detail` payloads into readable error messages; backend raises `HTTPException` for validation and auth errors.
- Services: business logic is delegated to `app.services.*` modules (booking_service, payment_service, allocation_service, return_service). Inspect these services for deeper flow (not exhaustively listed here).

---

## Where to look next (suggested)
- Inspect `app/services/*` to document complex flows (booking allocation, payments, returns).
- If you want full request/response field-level documentation, I can extract schema definitions from `app/schemas` and include them.

---

File generated by repo inspection. If you want a more exhaustive field-level report (request/response payloads, example requests), reply and I will expand this file.
