<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verification Code</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b; }
        .card { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { background: #4f46e5; padding: 24px 32px; color: #ffffff; text-align: center; }
        .header h1 { margin: 0; font-size: 20px; font-weight: 700; }
        .body { padding: 32px; }
        .otp-box { text-align: center; margin: 28px 0; padding: 18px; background: #f8fafc; border-radius: 12px; border: 2px dashed #6366f1; }
        .otp-code { font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #4338ca; }
        .footer { padding: 20px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; }
    </style>
</head>
<body>
    <div class="card">
        <div class="header">
            <h1>{{ $brandname }}</h1>
        </div>
        <div class="body">
            <h2 style="font-size: 18px; margin-top: 0; color: #0f172a;">Verify Your Email Address</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #475569;">
                You are submitting a store inquiry on <strong>{{ $brandname }}</strong>. Please use the verification code below to verify your email address.
            </p>
            <div class="otp-box">
                <div class="otp-code">{{ $otp }}</div>
                <div style="font-size: 12px; color: #64748b; margin-top: 6px;">Valid for 10 minutes</div>
            </div>
            <p style="font-size: 13px; line-height: 1.5; color: #64748b;">
                If you did not request this verification code, please ignore this email.
            </p>
        </div>
        <div class="footer">
            &copy; {{ date('Y') }} {{ $brandname }}. All rights reserved.
        </div>
    </div>
</body>
</html>

