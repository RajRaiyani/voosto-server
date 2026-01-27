export default function resetPasswordLink(link: string) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Voostro – Reset Password</title>
</head>

<body style="margin:0; padding:0; background-color:#fdf2f8;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px;">
    <tr>
      <td align="center">

        <!-- Card -->
        <table width="100%" cellpadding="0" cellspacing="0"
          style="max-width:520px; background:#ffffff; border-radius:12px; border:1px solid #f9a8d4; overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="padding:24px; text-align:center;">
              <h1 style="margin:0; font-size:28px; color:#f472b6;">Voostro</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:0 32px 24px; text-align:center;">
              <h2 style="margin:0 0 12px; color:#1f2937;">Reset Your Password</h2>

              <p style="margin:0 0 24px; color:#6b7280; font-size:14px;">
                You requested to reset your password. Click the button below to continue.
              </p>

              <!-- Button -->
              <a href="${link}" target="_blank"
                style="
                  display:inline-block;
                  padding:14px 28px;
                  background:#f472b6;
                  color:#ffffff;
                  text-decoration:none;
                  border-radius:8px;
                  font-weight:bold;
                  font-size:14px;
                ">
                Reset Password
              </a>

              <p style="margin:24px 0 0; font-size:13px; color:#6b7280;">
                This link will expire in <strong>15 minutes</strong>.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px; text-align:center; border-top:1px solid #fce7f3;">
              <p style="margin:0; font-size:12px; color:#6b7280;">
                If you didn’t request a password reset, please ignore this email.
              </p>
            </td>
          </tr>

          <!-- Bottom -->
          <tr>
            <td style="background:#f472b6; padding:12px; text-align:center;">
              <p style="margin:0; font-size:11px; color:#ffffff;">
                This is an automated message from Voostro. Please do not reply.
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
