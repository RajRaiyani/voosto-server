export default function emailVerifyOtp(otp: string) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Voosto – Email Verification</title>
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
              <!-- Logo -->
              <img
                src="https://voosto.com/assets/logos/favicon.svg"
                alt="Voosto"
                width="120"
                style="display:block; margin:0 auto 0; max-width:120px;"
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
                display:flex; align-items:center; justify-content:center;
                font-size:26px;
                line-height:56px;
                text-align:center;
              ">&#9993;</div>

              <h2 style="margin:0 0 10px; font-size:22px; font-weight:700; color:#0d0f1a; letter-spacing:-0.3px;">
                Verify your email address
              </h2>
              <p style="margin:0 0 32px; color:#6b7280; font-size:14px; line-height:1.6;">
                Enter the code below to confirm your email.<br/>It expires in <strong style="color:#0d0f1a;">10 minutes</strong>.
              </p>

              <!-- OTP Box -->
              <div style="
                display:inline-block;
                background:#f0f1ff;
                border:2px solid #c7cbff;
                border-radius:12px;
                padding:20px 40px;
                margin-bottom:32px;
              ">
                <span style="
                  font-size:40px;
                  font-weight:800;
                  letter-spacing:10px;
                  color:#4050ff;
                  font-family:'Courier New', monospace;
                ">${otp}</span>
              </div>

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
                    &#x26A0;&#xFE0F;&nbsp; <strong>Never share this code with anyone.</strong> Voosto will never ask for your OTP.
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

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px; text-align:center;">
              <p style="margin:0 0 6px; font-size:12px; color:#9ca3af;">
                If you didn't request this, you can safely ignore this email.
              </p>
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