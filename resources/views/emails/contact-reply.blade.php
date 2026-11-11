<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Response to Your Inquiry</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b; }
        .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { background: #4f46e5; padding: 24px 32px; color: #ffffff; text-align: center; }
        .header h1 { margin: 0; font-size: 20px; font-weight: 700; }
        .body { padding: 32px; }
        .reply-box { margin: 24px 0; padding: 20px; background: #eef2ff; border-radius: 12px; border-left: 4px solid #6366f1; font-size: 14px; line-height: 1.6; color: #1e1b4b; white-space: pre-wrap; }
        .inquiry-summary { background: #f8fafc; border-radius: 12px; padding: 16px; border: 1px solid #e2e8f0; margin-top: 24px; }
        .inquiry-summary h3 { margin-top: 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; }
        .inquiry-summary p { font-size: 13px; line-height: 1.5; color: #475569; margin: 4px 0; }
        .footer { padding: 20px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; }
    </style>
</head>
<body>
    <div class="card">
        <div class="header">
            <h1>{{ $brandname }}</h1>
        </div>
        <div class="body">
            <h2 style="font-size: 18px; margin-top: 0; color: #0f172a;">Response from Platform Administration</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #475569;">
                Hello <strong>{{ $inquiry->company_name }}</strong>,
            </p>
            <p style="font-size: 14px; line-height: 1.6; color: #475569;">
                Thank you for reaching out to us regarding <em>"{{ $inquiry->subject }}"</em>. Our Super Admin team has reviewed your inquiry and provided the following reply:
            </p>

            <div class="reply-box">
                {{ $replyMessage }}
            </div>

            <div class="inquiry-summary">
                <h3>Original Inquiry Summary</h3>
                <p><strong>Company:</strong> {{ $inquiry->company_name }}</p>
                <p><strong>Outlets Planned:</strong> {{ $inquiry->total_outlets }} | <strong>Avg. Staff/Outlet:</strong> {{ $inquiry->avg_employees_per_outlet }}</p>
                <p><strong>Phone:</strong> {{ $inquiry->phone }}</p>
                <p><strong>Original Message:</strong></p>
                <p style="font-style: italic; color: #64748b;">"{{ $inquiry->message }}"</p>
            </div>
        </div>
        <div class="footer">
            &copy; {{ date('Y') }} {{ $brandname }}. Platform Administration.
        </div>
    </div>
</body>
</html>

