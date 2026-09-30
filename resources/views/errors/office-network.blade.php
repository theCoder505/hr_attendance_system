<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Office Network Required</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #0f172a;
            color: #f8fafc;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            padding: 20px;
        }
        .card {
            background-color: #1e293b;
            border: 1px solid #334155;
            border-radius: 16px;
            padding: 40px;
            max-width: 480px;
            text-align: center;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
        }
        .icon-circle {
            width: 72px;
            height: 72px;
            border-radius: 50%;
            background-color: #ef444420;
            color: #ef4444;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 24px;
        }
        h2 { margin: 0 0 12px; font-size: 24px; }
        p { color: #94a3b8; font-size: 15px; line-height: 1.6; margin-bottom: 24px; }
        .badge {
            background-color: #334155;
            padding: 8px 14px;
            border-radius: 8px;
            font-family: monospace;
            font-size: 13px;
            color: #cbd5e1;
            display: inline-block;
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="icon-circle">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <h2>Access Restricted</h2>
        <p>Please come to the office and use your registered device on the designated office network.</p>
        <div>
            <span class="badge">Your IP: {{ $current_ip }}</span>
        </div>
    </div>
</body>
</html>
