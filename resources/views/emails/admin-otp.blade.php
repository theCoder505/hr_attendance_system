<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $brandname }} - One-Time Password</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f4f6f9;
            margin: 0;
            padding: 40px 15px;
            color: #1e293b;
        }
        .container {
            max-width: 520px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
            border: 1px solid #e2e8f0;
        }
        .header {
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            color: #ffffff;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 22px;
            letter-spacing: -0.5px;
            font-weight: 700;
        }
        .header p {
            margin: 6px 0 0;
            font-size: 13px;
            color: #94a3b8;
        }
        .body-content {
            padding: 32px 30px;
        }
        .purpose-badge {
            display: inline-block;
            background-color: #e0e7ff;
            color: #4338ca;
            font-size: 12px;
            font-weight: 600;
            padding: 4px 10px;
            border-radius: 9999px;
            margin-bottom: 16px;
        }
        .otp-box {
            background-color: #f8fafc;
            border: 2px dashed #cbd5e1;
            border-radius: 10px;
            padding: 20px;
            text-align: center;
            margin: 24px 0;
        }
        .otp-code {
            font-family: 'Courier New', Courier, monospace;
            font-size: 38px;
            letter-spacing: 8px;
            font-weight: 800;
            color: #0f172a;
            margin: 0;
        }
        .otp-expiry {
            margin-top: 8px;
            font-size: 12px;
            color: #64748b;
        }
        .footer {
            background-color: #f8fafc;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
            font-size: 12px;
            color: #94a3b8;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{ $brandname }}</h1>
            <p>Administrative Security & Verification</p>
        </div>
        <div class="body-content">
            <span class="purpose-badge">{{ $purpose }}</span>
            <p style="font-size: 15px; line-height: 1.6; margin-top: 0;">
                Hello,
            </p>
            <p style="font-size: 14px; line-height: 1.6; color: #475569;">
                You have requested a secure verification code for administrative access or credentials modification. Please use the One-Time Password (OTP) below to proceed:
            </p>

            <div class="otp-box">
                <div class="otp-code">{{ $otp }}</div>
                <div class="otp-expiry">Valid for 10 minutes only</div>
            </div>

            <p style="font-size: 13px; line-height: 1.5; color: #64748b; margin-bottom: 0;">
                <strong>Security Alert:</strong> If you did not initiate this action, please ensure your account credentials are safe and contact your system administrator immediately.
            </p>
        </div>
        <div class="footer">
            &copy; {{ date('Y') }} {{ $brandname }}. All rights reserved. Shared Hosting Optimized.
        </div>
    </div>
</body>
</html>
