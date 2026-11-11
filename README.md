# AttendEase Pro - Multi-Store Employee Attendance Management System

A production-ready **Multi-Tenant / Multi-Store Employee Attendance System** built with **Laravel 12 (MVC)**, **Inertia.js**, **React 19**, **TypeScript**, **Tailwind CSS**, **shadcn/ui**, and **SweetAlert2**.

Designed with clean architecture, strict tenant isolation, the **Service Pattern**, and engineered specifically to run seamlessly on standard **Shared Hosting environments** (cPanel, DirectAdmin) without requiring a VPS or complex daemon services.

---

## 🌟 Key Architectural Pillars

### 1. Platform Super Admin Portal (`/super-admin/login`)
* **Dedicated Authentication Guard**: Root administrator portal running on independent session state and security middleware (`super_admin` guard).
* **Store Tenants CRUD**: Register store accounts with system auto-generated unique Store IDs (`store_id`, e.g. `STR-XXXXXX`), update credentials, and set **Maximum Outlets Quotas** (`max_outlets`).
* **Real-time Storage Consumption Tracking**: Calculates exact file storage consumed by each store (employee photos, PDF appointment letters, store logos, and favicons) from physical disk files.
* **Store Employee Oversight**: Super Admin can inspect any store's employee roster, reset device bindings, or remove employees.
* **Store Expansion Inquiries & Email Reply**: Inspect contact inquiries submitted from the website footer contact form, and send official branded email responses directly from the Super Admin panel.
* **Profile Security via Email OTP**: Super Admin can change email and password only after validating a 6-digit verification code dispatched to their current email.

### 2. Store Owner Administration Portal (`/store/login`)
* **Renamed Route Prefix**: Administrative surfaces are cleanly hosted under `/store/` (e.g. `/store/login`, `/store/dashboard`, `/store/employees`, `/store/reports`, `/store/settings`).
* **Strict Tenant Data Isolation**: Each store admin has their own outlets, employees, attendances, and settings. Store A's data never overlaps with Store B.
* **Maximum Outlets Quota Enforcement**: Stores can add branches up to their Super Admin-assigned limit (`max_outlets`). Attempts to exceed quota are safely rejected.
* **Two-Factor Email OTP Authentication**: Store login validates email and password, then dispatches a time-limited 6-digit OTP to the registered store email.
* **Session Inactivity Timeout Middleware**: Automatic logout when an administrator is inactive for longer than their configured `session_time` (default: 30 minutes).
* **Interactive Month Calendar & Day Inspector**: Fast date jump and search to view employee attendance for any selected date and filter by branch outlet.
* **Manual Attendance Overrides**: Add or edit manual attendance records with automated recalculation of Late, Early Leave, and Overtime values (`is_manual = true`).
* **Monthly Attendance Reports & XLSX Export**: Monthly aggregation per employee with styled Microsoft Excel (`.xlsx`) export for all records or filtered by outlet/employee.

### 3. Surface Website Contact Page (`/contact`)
* **Accessible via Website Footer**: Links in public attendance footer allow prospective business owners to reach platform owners.
* **Frontend Security Captcha**: Dynamic, distorted alphanumeric canvas captcha generated in frontend JavaScript with refresh capability.
* **Email Verification with OTP**: User enters email and verifies ownership with a 6-digit verification code before the contact box can be submitted.
* **Structured Inquiry Box**: Submits Company Name, Subject, Email, Phone, Total Outlets Needed, Average Staff per Outlet, and Message.
* **Admin-Reviewed Flow**: Submissions do not send emails automatically; they are saved in the database for the Super Admin to review and reply to via an official email template.

### 4. Employee Verification & Attendance Cache Setup
* **Unique Store Identifier Binding**: Newly registered employees are associated with their store's unique `store_id`.
* **Hardware & Browser Binding**: Opening the single-use `/verify/{token}` link binds:
  * `device_token`: High-entropy cryptographic token in browser `localStorage`.
  * `outlet_uid`: Assigned outlet unique ID in browser `localStorage`.
  * `store_id`: Admin's unique store ID in browser `localStorage`.
* **Dual Header Verification**: Daily attendance calls send `X-Device-Token`, `X-Outlet-Uid`, and `X-Store-Id`. The server checks the store ID and rejects unauthorized or cross-store tokens with HTTP 403 `STORE_MISMATCH`.
* **Office Network Enforcement**: Validates request IP against designated outlet WiFi IPs.
* **Overnight Shifts & Auto-Closing**: Supports cross-midnight shifts and automatically closes missing check-outs with early-leave penalties.

---

## 🔑 Default Credentials

Seeded automatically upon migration:

### 1. Platform Super Admin
* **URL**: `http://localhost:8000/super-admin/login`
* **Email**: `admin@super.com`
* **Password**: `SuperAdmin@1234`

### 2. Store Owner (Admin)
* **URL**: `http://localhost:8000/store/login`
* **Email**: `admin@attendance.com`
* **Password**: `MyPass@2026#`
* **Store ID**: `STR-MAIN01`

### 3. Employee Portal & Contact
* **Employee Portal URL**: `http://localhost:8000/attendance`
* **Store Owner Contact Page**: `http://localhost:8000/contact`

> **Note on OTP Delivery**: In local development (`MAIL_MAILER=log`), 6-digit OTP codes and replies are written to `storage/logs/laravel.log`. In production, configure your SMTP settings in `.env`.

---

## 📖 Comprehensive User Manual

For an in-depth, step-by-step walkthrough covering how stores are created by the platform, how store owners manage outlets and staff, and how employees record attendance, see:

👉 **[USER_MANUAL.md](USER_MANUAL.md)**

---

## 🚀 Installation & Local Setup

### Prerequisites
* PHP 8.2 or higher (`pdo_mysql`, `mbstring`, `fileinfo`, `gd`, `zip` extensions enabled)
* MySQL / MariaDB
* Composer 2.x
* Node.js 18+ and npm

### Steps

1. **Environment Configuration**:
   Verify your `.env` database and mail configuration:
   ```env
   APP_NAME="AttendEase Pro"
   APP_URL=http://127.0.0.1:8000
   APP_TIMEZONE=Asia/Dhaka

   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=attendance_system
   DB_USERNAME=root
   DB_PASSWORD=

   # For local testing, OTP emails are logged to storage/logs/laravel.log
   MAIL_MAILER=log
   ```

2. **Install Dependencies**:
   ```bash
   composer install
   npm install
   ```

3. **Run Migrations & Seed Default Data**:
   ```bash
   php artisan migrate --seed
   ```

4. **Build Frontend Assets**:
   ```bash
   npm run build
   ```

5. **Start Local Development Server**:
   ```bash
   php artisan serve
   ```
   Open `http://localhost:8000` in your browser.

---

## 🧪 Testing

Execute the automated test suite:

```bash
php artisan test tests/Feature/MultiTenantAndSuperAdminTest.php
```

All 6 test cases verify Super Admin login, store creation, max outlets enforcement, tenant isolation, attendance `store_id` cache verification, contact inquiries with OTP, and profile OTP updates.
