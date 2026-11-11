# Platform User Manual: Multi-Store Attendance Architecture

This manual guides **Platform Owners (Super Admins)**, **Store Owners (Admins)**, and **Employees** through the complete lifecycle of onboarding stores, configuring branch outlets, binding devices, and tracking daily attendance.

---

## 🏛️ Platform Architecture Overview

The system operates on an isolated multi-tenant architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                 PLATFORM SUPER ADMIN                       │
│    (/super-admin/login - admin@super.com)                   │
│  - CRUD Store Admins & Unique Store IDs                     │
│  - Set Maximum Outlet Quota Per Store                       │
│  - Monitor Real-time Storage Consumption (Photos, PDFs)     │
│  - Manage & Reply to Inquiries from Website Contact Page   │
│  - Profile Management with Email OTP Verification          │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
 ┌───────────────────────────┐  ┌───────────────────────────┐
 │   STORE ADMIN A           │  │   STORE ADMIN B           │
 │   (/store/login)          │  │   (/store/login)          │
 │   Store ID: STR-MAIN01    │  │   Store ID: STR-BETA02    │
 │   Max Outlets: 5          │  │   Max Outlets: 3          │
 └─────────────┬─────────────┘  └─────────────┬─────────────┘
               │                              │
    ┌──────────┴──────────┐        ┌──────────┴──────────┐
    ▼                     ▼        ▼                     ▼
┌──────────────┐   ┌────────────┐┌──────────────┐   ┌────────────┐
│ Outlet 1 (HQ)│   │ Outlet 2   ││ Outlet 1     │   │ Outlet 2   │
│ WiFi IP: ... │   │ WiFi IP:...││ WiFi IP: ... │   │ WiFi IP:...│
└───────┬──────┘   └──────┬─────┘└───────┬──────┘   └──────┬─────┘
        │                 │              │                 │
        ▼                 ▼              ▼                 ▼
   [Employees]       [Employees]    [Employees]       [Employees]
   Bound to Store    Bound to Store Bound to Store    Bound to Store
```

### Key Data Isolation Principles
* **Unique Store Identifier (`store_id`)**: Every store is assigned a distinct unique identifier (e.g. `STR-MAIN01`) separate from the database primary key.
* **Complete Tenant Isolation**: Store owners only see their own outlets, employees, attendance logs, and monthly reports. Store A can never view or modify Store B's data.
* **Storage Tracking**: Every uploaded photo, appointment letter, and logo is tracked per store in real-time, displaying exact disk consumption in KB/MB on the Super Admin dashboard.

---

## 👑 Part 1: Platform Super Admin Guide

### 1.1 Super Admin Login
* **URL**: `http://localhost:8000/super-admin/login`
* **Default Email**: `admin@super.com`
* **Default Password**: `SuperAdmin@1234`

### 1.2 Super Admin Dashboard
Upon logging in, the Super Admin dashboard surfaces:
1. **System KPIs**:
   * Total Stores (Tenant Accounts)
   * Total Outlets across all stores
   * Total Registered Staff Profiles
   * Total Platform Disk Storage Consumed (in KB / MB / GB)
   * Live Attendances recorded today
   * Pending store contact inquiries
2. **Store Storage & Quota Breakdown**:
   * Inspect each store's unique Store ID, admin email, active outlets vs. allowed maximum quota, employee count, and live file storage bytes with relative usage bars.
3. **Recent Inquiries Preview**:
   * Quick glance at store expansion leads submitted from the public surface website.

### 1.3 Creating & Managing Stores (CRUD)
Navigate to **"Stores & Admins"** (`/super-admin/stores`):
* **Registering a Store**:
  1. Click **"Register New Store"**.
  2. Enter the **Store / Company Name** (e.g., `Metropolis Retail Ltd.`).
  3. Enter the **Admin Email** and **Initial Password**.
  4. The system automatically assigns a collision-safe, unique **Store ID** (`store_id`, e.g. `STR-XXXXXX`).
  5. Set the **Maximum Allowed Outlets** (e.g. `5`, `10`, `25`).
  6. Choose whether to enforce 2FA Email OTP for store admin logins.
  7. Click **"Register Store"**.
* **Editing Store Quotas**:
  * Click the **Edit (pencil)** icon on any store card.
  * Adjust the **Maximum Allowed Outlets** to scale the store's capacity.
  * Update store name, email, session timeout, or reset the store owner's password.
* **Deleting a Store**:
  * Click the **Delete (trash)** icon.
  * Confirming deletion cascades and permanently removes the store, its outlets, its employees, all attendance logs, and all associated uploaded files from disk.

### 1.4 Inspecting & Managing Store Employees
* Click **"Manage Employees"** on any store card (or navigate to `/super-admin/stores/{id}/employees`).
* Super Admin can view all staff profiles registered under that store, check their assigned outlet and status (*Active Device* vs *Pending Bind*).
* **Reset Verification Link**: If an employee lost their device, Super Admin can click **"Re-verify"** to issue a fresh device binding token.
* **Delete Employee**: Remove individual employees from any store.

### 1.5 Managing Website Contact Inquiries & Sending Replies
Navigate to **"Contact Inquiries"** (`/super-admin/inquiries`):
* Prospective store owners submit inquiries via the public contact form at `/contact`.
* Inquiries are received in **Pending** status (no immediate automated outbound email is sent).
* To reply:
  1. Click **"Reply by Email"**.
  2. Type the response message in the textarea (providing pricing, onboarding steps, or credentials).
  3. Click **"Send Email Response"**.
* **Result**:
  * The response is saved in the database with the Super Admin replier stamp and timestamp.
  * Status updates to **Replied**.
  * An email is dispatched to the inquirer's verified email address using the branded `ContactReplyMail` template.

### 1.6 Super Admin Profile & OTP Credentials Update
Navigate to **"Super Admin Profile"** (`/super-admin/settings`):
* Update root name and session inactivity timeout.
* **Changing Email or Password with OTP**:
  1. Click **"Request Security OTP to Change Credentials"**.
  2. A 6-digit OTP code is sent to your current Super Admin email.
  3. Enter the 6-digit OTP code along with the new email or new password.
  4. Click **"Verify OTP & Apply Changes"**.

---

## 🏪 Part 2: Store Owner (Admin) Guide

### 2.1 Store Admin Login
* **URL**: `http://localhost:8000/store/login`
  *(Note: Visiting the old `/administration-control/login` automatically redirects to `/store/login`).*
* Enter the Store Admin email and password configured by Super Admin.
* If 2FA is enabled, enter the 6-digit OTP dispatched to your registered store email.

### 2.2 Configuring Outlets & WiFi Network IP
Navigate to **"Settings & Security" -> "Outlets & Locations"** (`/store/settings`):
1. **Adding an Outlet**:
   * Click **"Add New Outlet"**.
   * Enter the **Outlet Name** (e.g. `Downtown Branch`, `Airport Kiosk`).
   * Enter the **Outlet WiFi Public IPv4** (auto-detected from your current connection or comma-separated IPs).
   * Click **"Register Outlet"**.
2. **Quota Enforcement**:
   * The platform enforces the `max_outlets` limit set by Super Admin. If you reach your limit, request your Super Admin to upgrade your outlet quota.

### 2.3 Store Branding & Office Hours
In **"Settings & Security" -> "Store Branding & Attendance Rules"**:
* Customize your store's brand name, header logo, and favicon.
* Set default **Office Starting Time** and **Office Closing Time**.
* Configure the **Early Leave Penalty Minutes** for missing check-outs.

### 2.4 Registering Employees & Device Binding
Navigate to **"Employees"** (`/store/employees`):
1. Click **"Add Employee"**.
2. Fill in the employee's Name, Phone, Role, Assigned Outlet, Salary, and Scheduled Shift hours.
3. Upload employee profile photo and PDF appointment letter.
4. Click **"Register Employee"**.
5. The employee is created in **Pending Verification** status (`status = 0`).
6. Click **"Copy Link"** to copy the unique single-use device verification link (`/verify/{token}`) and send it to the employee (via SMS, WhatsApp, or email).

---

## 📱 Part 3: Employee Verification & Daily Attendance

### 3.1 First-Time Device Binding
1. The employee opens the `/verify/{token}` link **on the smartphone or laptop browser** they will use for daily clock-ins.
2. The platform validates the single-use token and permanently binds the hardware:
   * **`device_token`**: High-entropy raw cryptographic token saved in `localStorage`.
   * **`outlet_uid`**: Assigned outlet identifier stored in `localStorage`.
   * **`store_id`**: Admin's unique store identifier stored in `localStorage`.
3. The verification screen confirms success, showing the employee name, role, assigned outlet, and store identifier.

### 3.2 Daily Attendance Flow (`/attendance`)
1. Employee navigates to `http://localhost:8000/attendance`.
2. The browser automatically sends the locally cached credentials:
   * Header `X-Device-Token`: Verified against SHA-256 hash in database.
   * Header `X-Outlet-Uid`: Verified against the employee's assigned outlet.
   * Header `X-Store-Id`: Verified against the employee's store admin unique ID.
3. **Office Network Check**:
   * The server checks if the request originates from the designated outlet WiFi IP.
   * If off-network, attendance actions are locked with: *"Please connect to the designated WiFi for outlet [Outlet Name]"*.
4. **Clock In**:
   * Click **"Clock In Now"**.
   * The system logs arrival time. If clocking in after the scheduled shift start, late minutes are calculated automatically.
   * Successful clock-in automatically extends the device token session by another **1 month**.
5. **Clock Out**:
   * Click **"Clock Out Now"**.
   * The system logs departure time and calculates Early Leave or Overtime minutes based on the scheduled shift end.
6. **Overnight Shifts**:
   * Unclosed shifts from the prior calendar day stay active and checkable-out until the employee's scheduled shift start time on the following day.

---

## 🌐 Part 4: Surface Website Contact & Store Inquiry Flow

1. **Footer Link**:
   * Any prospective business owner visiting the public attendance portal can click **"Contact & Inquiries"** in the footer (`/contact`).
2. **Step 1 - Security Captcha**:
   * The page generates an animated, distorted canvas security captcha in frontend JavaScript.
   * The user types the characters into the verification input.
3. **Step 2 - Email OTP Verification**:
   * User enters their email and clicks **"Send Email OTP"**.
   * A 6-digit verification code is dispatched via `ContactOtpMail`.
   * User types the code and clicks **"Verify OTP"**.
   * Once verified, the badge turns green (*"Email Verified"*).
4. **Step 3 - Form Submission**:
   * User enters Company Name, Subject, Phone, Total Outlets Needed, Average Staff per Outlet, and Message.
   * Submits the inquiry.
   * The inquiry is stored in `contact_inquiries` with `status = 'pending'` for the Super Admin's review.
5. **Super Admin Response**:
   * Super Admin opens `/super-admin/inquiries`, reviews the inquiry, and writes an official reply.
   * Upon submitting, `ContactReplyMail` is dispatched to the inquirer with the full response and inquiry summary.

---

## ❓ Frequently Asked Questions (FAQ)

### Q: What happens if an employee tries clocking in with Store A's device token under Store B?
The `VerifyDeviceToken` middleware checks `X-Store-Id` against the employee's admin's unique ID. If there is a mismatch, the request is immediately rejected with HTTP 403 `STORE_MISMATCH` (*"Device store mismatch. Assigned to store '...' "*).

### Q: What if an employee changes their phone or clears browser cache?
The Store Admin or Super Admin clicks **"Re-verify"** next to the employee's name in the employee table. This invalidates the old device hash, resets status to pending, and generates a fresh `/verify/{token}` link.

### Q: How is storage calculated for each store?
The platform calculates storage dynamically by checking the actual size in bytes of all uploaded files belonging to that store (employee profile pictures, PDF appointment letters, store logos, and favicons) from the `public` storage disk.

### Q: Where do emails go in development?
In development (`MAIL_MAILER=log`), all OTPs and reply emails are written to `storage/logs/laravel.log`. In production, configure standard SMTP in `.env`.

