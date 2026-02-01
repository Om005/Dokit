const emailTemplates = {
    getAccountCreationEmail: (otp: string): string => {
        return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your email</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f6f9fc; margin: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); overflow: hidden; }
    .header { padding: 30px 40px; border-bottom: 1px solid #edf2f7; text-align: center; }
    .logo { font-size: 24px; font-weight: 700; color: #1a1a1a; text-decoration: none; }
    .content { padding: 40px; color: #4a5568; line-height: 1.6; }
    .otp-box { background: #f7fafc; border: 1px solid #edf2f7; border-radius: 6px; text-align: center; padding: 20px; margin: 30px 0; }
    .otp-code { font-family: monospace; font-size: 32px; font-weight: 700; color: #2d3748; letter-spacing: 4px; }
    .footer { background: #f7fafc; padding: 20px 40px; text-align: center; font-size: 12px; color: #a0aec0; border-top: 1px solid #edf2f7; }
    h1 { color: #1a202c; font-size: 22px; margin: 0; }
    p { margin: 0 0 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <a href="#" class="logo">Dokit</a>
    </div>
    <div class="content">
      <h1>Confirm your email address</h1>
      <p>Hello,</p>
      <p>Thank you for signing up for Dokit. To complete your account creation, please use the verification code below:</p>
      
      <div class="otp-box">
        <span class="otp-code">${otp}</span>
      </div>

      <p style="font-size: 14px; color: #718096;">
        This code will expire in <strong>10 minutes</strong>. If you did not request this, you can safely ignore this email.
      </p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Dokit. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
    },
};

export default emailTemplates;
