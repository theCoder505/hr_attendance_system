<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Super Admin Verification</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 24px; color: #f8fafc; }
        .card { max-width: 540px; margin: 0 auto; background: #1e293b; border-radius: 16px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5); }
        .header { background: #4338ca; padding: 24px 32px; color: #ffffff; text-align: center; }
        .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px; }
        .body { padding: 32px; color: #cbd5e1; }
        .otp-box { text-align: center; margin: 28px 0; padding: 20px; background: #0f172a; border-radius: 12px; border: 2px dashed #6366f1; }
        .otp-code { font-family: monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #818cf8; }
        .footer { padding: 20px 32px; background: #0f172a; border-top: 1px solid #334155; font-size: 12px; color: #94a3b8; text-align: center; }
    </style>
</head>
<body>
    <div class="card">
        <div class="header">
            <h1>{{ $brandname }} &bull; Super Admin</h1>
        </div>
        <div class="body">
            <h2 style="font-size: 18px; margin-top: 0; color: #ffffff;">{{ $purpose }}</h2>
            <p style="font-size: 14px; line-height: 1.6;">
                A sensitive operation was requested on the Super Admin account (email or password change). Use the verification code below to authorize this change:
            </p>
            <div class="otp-box">
                <div class="otp-code">{{ $otp }}</div>
                <div style="font-size: 12px; color: #94a3b8; margin-top: 8px;">Valid for 10 minutes</div>
            </div>
            <p style="font-size: 13px; line-height: 1.5; color: #94a3b8;">
                ⚠️ If you did not initiate this request, someone may be attempting to access your super admin account. Please inspect system logs immediately.
            </p>
        </div>
        <div class="footer">
            &copy; {{ date('Y') }} {{ $brandname }}. Platform Root Security.
        </div>
    </div>
</body>
</html>

