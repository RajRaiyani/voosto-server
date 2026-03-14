function emailResetPassword(url: string) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Voosto – Reset Your Password</title>
</head>

<body style="margin:0; padding:0; background-color:#f0f1ff; font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr>
      <td align="center">

        <!-- Card -->
        <table width="100%" cellpadding="0" cellspacing="0"
          style="max-width:500px; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 32px rgba(64,80,255,0.10);">

          <!-- Header Band -->
          <tr>
            <td style="background:#4050ff; padding:32px 40px; text-align:center;">
              <img
                src="https://voosto.com/assets/logos/favicon.svg"
                alt="Voosto"
                width="120"
                style="display:block; margin:0 auto; max-width:120px;"
                onerror="this.style.display='none'; document.getElementById('voosto-wordmark').style.display='block';"
              />
              <span id="voosto-wordmark"
                style="display:none; font-size:26px; font-weight:800; color:#ffffff; letter-spacing:-0.5px;">
                Voosto
              </span>
            </td>
          </tr>

          <!-- Accent Line -->
          <tr>
            <td style="height:4px; background:linear-gradient(90deg, #4050ff 0%, #a0aaff 50%, #4050ff 100%);"></td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:40px 40px 32px; text-align:center;">

              <!-- Icon Circle -->
              <div style="
                width:56px; height:56px;
                background:#eef0ff;
                border-radius:50%;
                margin:0 auto 24px;
                font-size:26px;
                line-height:56px;
                text-align:center;
              ">&#128274;</div>

              <h2 style="margin:0 0 10px; font-size:22px; font-weight:700; color:#0d0f1a; letter-spacing:-0.3px;">
                Reset Your Password
              </h2>
              <p style="margin:0 0 32px; color:#6b7280; font-size:14px; line-height:1.6;">
                We received a request to reset your password.<br/>
                Click the button below to create a new one.
              </p>

              <!-- CTA Button -->
              <a href="${url}"
                style="
                  display:inline-block;
                  background:#4050ff;
                  color:#ffffff;
                  padding:14px 36px;
                  font-size:15px;
                  font-weight:700;
                  border-radius:10px;
                  text-decoration:none;
                  letter-spacing:0.2px;
                  margin-bottom:32px;
                ">
                Reset Password
              </a>

              <!-- Warning -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="
                    background:#fff7ed;
                    border:1px solid #fed7aa;
                    border-radius:8px;
                    padding:14px 18px;
                    font-size:13px;
                    color:#92400e;
                    text-align:left;
                    line-height:1.5;
                  ">
                    &#x26A0;&#xFE0F;&nbsp; <strong>This link expires in 10 minutes.</strong> If you didn't request a reset, you can safely ignore this email.
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px; background:#e5e7ff;"></div>
            </td>
          </tr>

          <!-- Fallback URL -->
          <tr>
            <td style="padding:24px 40px; text-align:center;">
              <p style="margin:0 0 8px; font-size:12px; color:#9ca3af;">
                Button not working? Copy and paste this link into your browser:
              </p>
              <p style="margin:0; font-size:12px; color:#4050ff; word-break:break-all; line-height:1.6;">
                ${url}
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px; background:#e5e7ff;"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px; text-align:center;">
              <p style="margin:0; font-size:11px; color:#c4c9f0;">
                © 2025 Voosto. This is an automated message — please do not reply.
              </p>
            </td>
          </tr>

          <!-- Bottom Accent -->
          <tr>
            <td style="background:#4050ff; padding:10px; text-align:center;">
              <p style="margin:0; font-size:11px; color:rgba(255,255,255,0.7); letter-spacing:0.5px;">
                voosto.com
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`;
}

export default emailResetPassword;