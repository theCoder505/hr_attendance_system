# Employee Attendance Management System

A production-ready **Employee Attendance Management System** built with **Laravel 12 (MVC)**, **Inertia.js**, **React 19**, **TypeScript**, **Tailwind CSS**, **shadcn/ui**, and **SweetAlert2**.

Designed with clean architecture, strict MVC boundaries, the **Service Pattern**, and engineered specifically to run seamlessly on standard **Shared Hosting environments** (cPanel, DirectAdmin) without requiring a VPS or complex daemon services.

---

## 🌟 Key Features

### 1. Administration Control (`/administration-control/`)
* **Custom Route Prefix**: All administrative surfaces are securely hosted under `/administration-control/`.
* **Two-Factor Email OTP Authentication**: Admin login validates email and password, then dispatches a time-limited 6-digit OTP to the registered administrative email address.
* **Session Inactivity Timeout Middleware**: Automatic logout when an administrator is inactive for longer than their configured `session_time` (default: 30 minutes).
* **Interactive Month Calendar & Day Inspector**:
  * Visual calendar grid highlighting days of the month with daily metrics (present, late, early leave, overtime).
  * Fast date jump and search to view employee attendance for any selected date.
* **Manual Attendance Overrides**:
  * Ability to add a manual attendance record for any employee on a selected date.
  * Inline editing of Check-In and Check-Out times with automated recalculation of Late, Early Leave, and Overtime values (`is_manual = true`).
* **Employee Management (CRUD)**:
  * Full employee profiles: Name, Phone, Role, Work Description, Salary, Working Hours, Scheduled Shift Times, Joining Date, Photo upload, and PDF Appointment Letter upload.
  * Cascade deletion: Removing an employee cleanly purges their files from storage and removes all associated attendance logs.
  * Status badges: *Pending Verification* vs. *Active / Verified*.
* **Monthly Attendance Reports & XLSX Export**:
  * Monthly aggregation per employee: Days present, late occurrences & total minutes, early leave occurrences & minutes, and overtime occurrences & minutes.
  * Styled Microsoft Excel (`.xlsx`) export for all records or filtered by an individual employee using PhpSpreadsheet.
* **Settings & Security**:
  * General branding: Custom brand name, header logo, and favicon upload.
  * Office rules: Configurable office starting time, closing time, office IPv4 whitelist, and missing check-out early leave penalty minutes.
  * Admin profile update: Change name and session timeout duration.
  * **2FA Protected Credentials Change**: Updating the administrator's email or password strictly requires generating and verifying an OTP sent to the current email before alterations take effect.

---

### 2. Employee Verification & Device Binding
1. **Pending Status**: Newly registered employees start with status `0` (Pending) and an auto-generated high-entropy verification token valid for 7 days.
2. **Single-Use Verification Link**: Admin copies the link format `/verify/{token}` and provides it to the employee.
3. **Hardware Binding**: When the employee opens the link on their device browser:
   * The server generates a cryptographic raw device token and saves only its SHA-256 hash in `device_token_hash`.
   * Sets `device_token_expires_at = now() + 1 month`.
   * Updates employee status to `1` (Active/Verified) and voids the single-use verification token.
   * The raw token is stored in the browser's `localStorage` (`device_token`).
4. **Device Re-verification / Change Device**:
   * Admin can click **"Re-verify / change device"** on the employee row.
   * This immediately clears the existing device hash, sets status back to `0` (voiding the previous device), and generates a new verification link.
5. **Rolling Session Renewal**:
   * Every successful daily check-in automatically extends `device_token_expires_at` by another 1 month.

---

### 3. Employee Portal (`/attendance`)
* **Device Authentication**: Requests carry the `X-Device-Token` header read from `localStorage`. The server verifies the SHA-256 hash against active employees.
* **Office Network Enforcement**: Checks `request()->ip()` against `office_ipv4_addr` from settings (supports multiple comma-separated IPs or wildcard `*`). If off-network, displays: *"Please come to the office and use your registered device"*.
* **State-Aware Actions**:
  * **Clock In**: State-aware button available when no open shift exists for today. Calculates late minutes if clocking in after scheduled start time.
  * **Clock Out**: State-aware button available when a shift is active. Automatically computes Early Leave or Overtime minutes based on the employee's shift end time.
* **Overnight Shifts**:
  * An unclosed attendance record from the previous calendar day stays active and checkable-out until the employee's scheduled shift start time on the following day (e.g., checking out at 2:00 AM counts toward the original shift date).
* **Missing Check-Out Handling**:
  * Once the next check-in window begins without a recorded check-out, the system automatically closes the open shift as an early leave using the configured `missing_checkout_early_leave_minutes` penalty.
  * Implemented both through an automated console command and real-time on-the-fly resolution in `AttendanceService` (eliminating VPS dependency).

---

## 🏗️ Architecture & Design Patterns

* **Strict MVC Separation**:
  * **Models**: `Admin`, `Employee`, `Attendance`, `WebsiteSetting` with explicit relationship bindings, casts, and boot lifecycle events (e.g. file deletion cascades).
  * **Controllers**: Thin controllers strictly handling HTTP request orchestration.
  * **Form Requests**: Dedicated validation classes under `App\Http\Requests\Admin\*`.
  * **Service Pattern**:
    * `App\Services\AttendanceService`: Encapsulates check-in, check-out, overnight shift boundaries, missing checkout auto-closing, and late/early/overtime calculations.
    * `App\Services\AttendanceExportService`: Encapsulates formatted XLSX workbook generation.
* **Custom Middlewares**:
  * `AdminSessionTimeout`: Monitors admin activity timestamp and forces logout when idle.
  * `VerifyDeviceToken`: Validates SHA-256 device token hash and binds the verified employee to the request attributes.
  * `OfficeNetworkMiddleware`: Validates client IP against authorized office network addresses.
* **UI & UX**:
  * Built using Tailwind CSS, React 19, Lucide icons, and SweetAlert2 (`swalCustom`).

---

## 🔑 Default Administrator Credentials

Seeded automatically upon migration:

* **Admin Portal URL**: `http://localhost:8000/administration-control/login`
* **Email**: `admin@attendance.com`
* **Password**: `MyPass@2026#`
* **Employee Portal URL**: `http://localhost:8000/attendance`

> **Note on OTP Delivery**: In local development (`MAIL_MAILER=log`), the 6-digit OTP code is written to `storage/logs/laravel.log`. In production, configure your SMTP settings in `.env` to send real emails to your inbox.

---

## 🚀 Installation & Local Setup

### Prerequisites
* PHP 8.2 or higher (with `pdo_mysql`, `mbstring`, `fileinfo`, `gd`, `zip` extensions enabled)
* MySQL or MariaDB
* Composer 2.x
* Node.js 18+ and npm

### Steps

1. **Clone & Enter Workspace**:
   ```bash
   cd c:/xampp/htdocs/laravelwebsites/products/attendance_system
   ```

2. **Environment Configuration**:
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

3. **Install Dependencies**:
   ```bash
   composer install
   npm install
   ```

4. **Run Migrations & Seed Default Data**:
   ```bash
   php artisan migrate --seed
   ```

5. **Create Storage Symbolic Link**:
   ```bash
   php artisan storage:link
   ```

6. **Build Frontend Assets**:
   ```bash
   npm run build
   ```

7. **Start Application Server**:
   ```bash
   php artisan serve
   ```
   Navigate to:
   - Admin Login: `http://127.0.0.1:8000/administration-control/login`
   - Employee Portal: `http://127.0.0.1:8000/attendance`

---

## 🌐 Shared Hosting Deployment Guide (cPanel / DirectAdmin)

This system is engineered so that **no VPS or continuous node/queue background processes are required**.

### 1. Document Root Configuration
* On shared hosting, upload the files to your domain's folder.
* Set the domain's **DocumentRoot** to point to the `public/` directory (e.g. `/home/user/public_html/public` or `/home/user/attendance_system/public`).
* If your host forces `public_html` as the root, move the contents of `public/` into `public_html` and adjust `index.php` to reference `../vendor/autoload.php` and `../bootstrap/app.php`.

### 2. File Permissions
Ensure the following directories are writable by the web server (chmod `775` or `755`):
* `storage/`
* `bootstrap/cache/`

### 3. Database & Mail Setup
1. Create a MySQL database and user in cPanel.
2. Update `.env` with the database credentials.
3. Configure your hosting SMTP credentials:
   ```env
   MAIL_MAILER=smtp
   MAIL_HOST=mail.yourdomain.com
   MAIL_PORT=465
   MAIL_USERNAME=noreply@yourdomain.com
   MAIL_PASSWORD=your_email_password
   MAIL_ENCRYPTION=ssl
   MAIL_FROM_ADDRESS="noreply@yourdomain.com"
   MAIL_FROM_NAME="AttendEase Pro"
   ```
4. Run migrations via cPanel Terminal or phpMyAdmin import:
   ```bash
   php artisan migrate --seed --force
   php artisan storage:link
   ```

### 4. Cron Job (Automated Missing Check-outs)
To run the automated checkout closer hourly, add this single cron entry in cPanel Cron Jobs:
```bash
* * * * * cd /home/username/public_html && php artisan schedule:run >> /dev/null 2>&1
```
*Even if cron is not set up on shared hosting, `AttendanceService` automatically detects and closes unclosed past shifts whenever employees access the portal or check in.*

---

## 🛠️ Console Commands Reference

* **Close Missing Checkouts Manually**:
  ```bash
  php artisan attendance:close-missing-checkouts
  ```
* **Optimize Cache for Production**:
  ```bash
  php artisan config:cache
  php artisan route:cache
  php artisan view:cache
  ```

---

## 📄 License
This application is proprietary software. All rights reserved.
