import env from "@config/env";

type SessionInfo = {
    id: string;
    userId: string;
    refreshTokenHash: string;
    userAgent: string;
    ip: string;
    device: {
        type: string;
        model: string;
    };
    browser: {
        name: string;
        version: string;
    };
    os: {
        name: string;
        version: string;
    };
    city: string;
    region: string;
    country: string;
    expiresAt: Date;
};

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

    getWelcomeEmail: (firstName: string, lastName: string): string => {
        return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Dokit</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f6f9fc; margin: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); overflow: hidden; }
    .header { padding: 30px 40px; border-bottom: 1px solid #edf2f7; text-align: center; }
    .logo { font-size: 24px; font-weight: 700; color: #1a1a1a; text-decoration: none; }
    .content { padding: 40px; color: #4a5568; line-height: 1.6; }
    .button-container { text-align: center; margin: 30px 0; }
    .btn { background-color: #1a1a1a; color: #ffffff !important; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; display: inline-block; }
    .footer { background: #f7fafc; padding: 20px 40px; text-align: center; font-size: 12px; color: #a0aec0; border-top: 1px solid #edf2f7; }
    h1 { color: #1a202c; font-size: 24px; margin: 0 0 16px; }
    p { margin: 0 0 16px; }
    .highlight { color: #1a1a1a; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <a href="#" class="logo">Dokit</a>
    </div>
    <div class="content">
      <h1>Welcome to the community, <span class="highlight">${firstName}</span>!</h1>
      <p>Hello ${firstName} ${lastName},</p>
      <p>We're thrilled to have you with us. Your account has been successfully created, and you're now ready to explore everything <strong>Dokit</strong> has to offer.</p>
      
      <p>Our goal is to help you streamline your document workflow with ease. To help you get started, jump straight into your dashboard below:</p>
      
      <div class="button-container">
        <a href="https://dokit.com/dashboard" class="btn">Go to Dashboard</a>
      </div>

      <p style="font-size: 14px; color: #718096; margin-top: 30px;">
        If you have any questions or need a hand getting set up, simply reply to this email. Our team is always here to help.
      </p>
      <p>Best regards,<br>The Dokit Team</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Dokit. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
    },

    getPasswordResetEmail: (otp: string): string => {
        return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your password</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f6f9fc; margin: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); overflow: hidden; }
    .header { padding: 30px 40px; border-bottom: 1px solid #edf2f7; text-align: center; }
    .logo { font-size: 24px; font-weight: 700; color: #1a1a1a; text-decoration: none; }
    .content { padding: 40px; color: #4a5568; line-height: 1.6; }
    .otp-box { background: #f7fafc; border: 1px solid #edf2f7; border-radius: 6px; text-align: center; padding: 20px; margin: 30px 0; }
    .otp-code { font-family: monospace; font-size: 32px; font-weight: 700; color: #2d3748; letter-spacing: 4px; }
    .footer { background: #f7fafc; padding: 20px 40px; text-align: center; font-size: 12px; color: #a0aec0; border-top: 1px solid #edf2f7; }
    .warning { color: #e53e3e; font-size: 14px; margin-top: 20px; }
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
      <h1>Reset your password</h1>
      <p>Hello,</p>
      <p>We received a request to reset the password for your Dokit account. Use the code below to proceed:</p>
      
      <div class="otp-box">
        <span class="otp-code">${otp}</span>
      </div>

      <p style="font-size: 14px; color: #718096;">
        This code expires in <strong>10 minutes</strong>.
      </p>

      <p class="warning">
        If you didn't request a password reset, you can safely ignore this email. Your password will not change.
      </p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Dokit. Secure Password Reset.</p>
    </div>
  </div>
</body>
</html>
  `;
    },

    gotAccessRequestEmail: (
        requesterName: string,
        projectName: string,
        projectId: string
    ): string => {
        return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Access Request for ${projectName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f6f9fc; margin: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); overflow: hidden; }
    .header { padding: 30px 40px; border-bottom: 1px solid #edf2f7; text-align: center; }
    .logo { font-size: 24px; font-weight: 700; color: #1a1a1a; text-decoration: none; }
    .content { padding: 40px; color: #4a5568; line-height: 1.6; }
    .button-container { text-align: center; margin: 30px 0; }
    .btn { background-color: #1a1a1a; color: #ffffff !important; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; display: inline-block; }
    .footer { background: #f7fafc; padding: 20px 40px; text-align: center; font-size: 12px; color: #a0aec0; border-top: 1px solid #edf2f7; }
    h1 { color: #1a202c; font-size: 22px; margin: 0 0 16px; }
    p { margin: 0 0 16px; }
    .highlight { color: #1a1a1a; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <a href="#" class="logo">Dokit</a>
    </div>
    <div class="content">
      <h1>New Access Request for <span class="highlight">${projectName}</span></h1>
      <p>Hello,</p>
      <p><strong>${requesterName}</strong> has requested access to your project <strong>${projectName}</strong>.</p>
      
      <p>To review and manage this access request, please visit your project dashboard:</p>
      
      <div class="button-container">
        <a href="${env.FRONTEND_URL}/project/${projectId}" class="btn">Review Access Request</a>
      </div>

      <p style="font-size: 14px; color: #718096; margin-top: 30px;">
        If you have any questions or need assistance, simply reply to this email. Our team is always here to help.
      </p>
      <p>Best regards,<br>The Dokit Team</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Dokit. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
    },
    reviewedAccessRequestEmail: (
        requesterName: string,
        projectName: string,
        status: "APPROVED" | "REJECTED",
        projectId: string
    ): string => {
        const isApproved = status === "APPROVED";
        return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Access Request for ${projectName} has been ${status}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f6f9fc; margin: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); overflow: hidden; }
    .header { padding: 30px 40px; border-bottom: 1px solid #edf2f7; text-align: center; }
    .logo { font-size: 24px; font-weight: 700; color: #1a1a1a; text-decoration: none; }
    .content { padding: 40px; color: #4a5568; line-height: 1.6; }
    .button-container { text-align: center; margin: 30px 0; }
    .btn { background-color: #1a1a1a; color: #ffffff !important; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; display: inline-block; }
    .footer { background: #f7fafc; padding: 20px 40px; text-align: center; font-size: 12px; color: #a0aec0; border-top: 1px solid #edf2f7; }
    h1 { color: #1a202c; font-size: 22px; margin: 0 0 16px; }
    p { margin: 0 0 16px; }
    .highlight { color: #1a1a1a; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <a href="#" class="logo">Dokit</a>
    </div>
    <div class="content">
      <h1>Your Access Request for <span class="highlight">${projectName}</span> has been ${status}</h1>
      <p>Hello ${requesterName},</p>
      <p>Your request to access the project <strong>${projectName}</strong> has been <strong>${status.toLowerCase()}</strong>.</p>
      
      ${
          isApproved
              ? `<p>You can now access the project in your dashboard:</p>
      <div class="button-container">
        <a href="${env.FRONTEND_URL}/project/${projectId.replaceAll(" ", "-")}" class="btn">Go to Project</a>
      </div>`
              : `<p>If you have any questions about this decision, please contact the project owner.</p>`
      }

      <p style="font-size: 14px; color: #718096; margin-top: 30px;">
        If you have any questions or need assistance, simply reply to this email. Our team is always here to help.
      </p>
      <p>Best regards,<br>The Dokit Team</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Dokit. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
    },
    projectInvitationEmail: (
        inviterName: string,
        projectName: string,
        projectId: string
    ): string => {
        return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You've been invited to collaborate on ${projectName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f6f9fc; margin: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); overflow: hidden; }
    .header { padding: 30px 40px; border-bottom: 1px solid #edf2f7; text-align: center; }
    .logo { font-size: 24px; font-weight: 700; color: #1a1a1a; text-decoration: none; }
    .content { padding: 40px; color: #4a5568; line-height: 1.6; }
    .button-container { text-align: center; margin: 30px 0; }
    .btn { background-color: #1a1a1a; color: #ffffff !important; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; display: inline-block; }
    .footer { background: #f7fafc; padding: 20px 40px; text-align: center; font-size: 12px; color: #a0aec0; border-top: 1px solid #edf2f7; }
    h1 { color: #1a202c; font-size: 22px; margin: 0 0 16px; }
    p { margin: 0 0 16px; }
    .highlight { color: #1a1a1a; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <a href="#" class="logo">Dokit</a>
    </div>
    <div class="content">
      <h1>You've been invited to collaborate on <span class="highlight">${projectName}</span></h1>
      <p>Hello,</p>
      <p><strong>${inviterName}</strong> has invited you to collaborate on the project <strong>${projectName}</strong>.</p>
      
      <p>To view the project and start collaborating, please click the button below:</p>
      
      <div class="button-container">
        <a href="${env.FRONTEND_URL}/project/${projectId.replaceAll(" ", "-")}" class="btn">View Project</a>
      </div>

      <p style="font-size: 14px; color: #718096; margin-top: 30px;">
        If you have any questions or need assistance, simply reply to this email. Our team is always here to help.
      </p>
      <p>Best regards,<br>The Dokit Team</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Dokit. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
    },
    signinEmail: (session: SessionInfo, frontEndUrl: string): string => {
        return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Sign-in to Your Account</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f6f9fc; margin: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); overflow: hidden; }
    .header { padding: 30px 40px; border-bottom: 1px solid #edf2f7; text-align: center; }
    .logo { font-size: 24px; font-weight: 700; color: #1a1a1a; text-decoration: none; }
    .content { padding: 40px; color: #4a5568; line-height: 1.6; }
    .footer { background: #f7fafc; padding: 20px 40px; text-align: center; font-size: 12px; color: #a0aec0; border-top: 1px solid #edf2f7; }
    h1 { color: #1a202c; font-size: 22px; margin: 0 0 16px; }
    p { margin: 0 0 16px; }
    .details { background: #f7fafc; border: 1px solid #edf2f7; border-radius: 6px; padding: 20px; margin-bottom: 24px; }
    .detail-item { margin-bottom: 10px; }
    .label { font-weight: 600; color: #1a202c; }
    
    /* Action Section Styles */
    .action-section { text-align: center; margin: 35px 0; padding-top: 25px; border-top: 1px solid #edf2f7; }
    .btn { display: inline-block; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 15px; text-align: center; transition: background-color 0.2s; }
    .btn-danger { background-color: #e53e3e; color: #ffffff; border: 1px solid #c53030; }
    .btn-danger:hover { background-color: #c53030; }
    .warning-text { color: #e53e3e; font-weight: 600; font-size: 16px; margin-bottom: 15px; }
    .next-steps { font-size: 14px; color: #4a5568; margin-top: 20px; background: #fff5f5; padding: 15px; border-radius: 6px; border: 1px solid #fed7d7; text-align: left; }
    .raw-link { font-size: 11px; color: #a0aec0; word-break: break-all; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <a href="#" class="logo">Dokit</a>
    </div>
    <div class="content">
      <h1>New Sign-in to Your Account</h1>
      <p>Hello,</p>
      <p>We noticed a new sign-in to your account. Here are the details of the session:</p>
      
      <div class="details">
        <div class="detail-item"><span class="label">Device:</span> ${session.device.model} (${session.device.type})</div>
        <div class="detail-item"><span class="label">Browser:</span> ${session.browser.name} ${session.browser.version}</div>
        <div class="detail-item"><span class="label">Operating System:</span> ${session.os.name} ${session.os.version}</div>
        <div class="detail-item"><span class="label">Location:</span> ${session.city}, ${session.region}, ${session.country}</div>
        <div class="detail-item"><span class="label">IP Address:</span> ${session.ip}</div>
        <div class="detail-item"><span class="label">Sign-in Time:</span> ${new Date().toLocaleString()}</div>
      </div>

      <p style="font-size: 14px; color: #718096;">
        If this was you, you can safely ignore this email. No further action is needed.
      </p>

      <div class="action-section">
        <p class="warning-text">Don't recognize this activity?</p>
        <a href="${frontEndUrl}"
          style="
            display: inline-block;
            padding: 14px 28px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 600;
            font-size: 15px;
            background-color: #e53e3e;
            color: #ffffff !important;
            border: 1px solid #c53030;
          ">
          Securely Log Out This Session
        </a>
        
        <div class="next-steps">
          <strong>Recommended Actions:</strong><br>
          <ol>
            <li>Log out the unrecognized session immediately</li>
            <li>Change your account password</li>
            <li>Enable Two-Factor Authentication (2FA) if not already active</li>
          </ol>
        </div>
        
        <p class="raw-link">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${frontEndUrl}" style="color: #a0aec0;">${frontEndUrl}</a>
        </p>
      </div>

      <p>Best regards,<br>The Dokit Team</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Dokit. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
    },
};

export default emailTemplates;
