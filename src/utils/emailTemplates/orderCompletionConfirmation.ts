function orderCompletionConfirmation(otp: string) {
  return `
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Completion OTP</title>

  <style>
    .flex {
      display: flex;
    }

    .justify-center {
      justify-content: center;
    }
  </style>
</head>

<body>

  <table cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5; padding: 16px; width: 100%;">
    <tr>
      <td align="center">
        <!-- Main Wrapper -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
          style="max-width: 500px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); border: 2px solid #000000;">
          <tr>
            <td style="padding: 24px;">
              <!-- Logo -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="margin-bottom: 32px; font-size: 2rem; font-weight: bold; color: #000000;">
                    Firelynk
                  </td>
                </tr>
              </table>
              <br />

              <!-- Content -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="text-align: center;">
                <tr>
                  <td style="font-size: 1.5rem; font-weight: 600; color: #000000; margin-bottom: 16px;">
                    Order Completion Verification
                  </td>
                </tr>
                <tr>
                  <td style="color: #374151; padding-bottom: 16px;">
                    Your order is ready to be completed! Please use the following One Time Password (OTP) to verify and complete your order:
                  </td>
                </tr>

                <!-- OTP Display -->
                <tr>
                  <td
                    style="font-size: 2.5rem; font-family: monospace; font-weight: bold; color: #000000; padding: 32px 0;">
                    ${otp}
                  </td>
                </tr>

                <!-- Warning Message -->
                <tr>
                  <td style="background-color: #f97316; border: 1px solid #000000; border-radius: 8px; padding: 16px;">
                    <p style="color: #ffffff; font-size: 0.875rem; margin: 0;">
                      Please do not share this code with anyone. This code will expire in 10 minutes.
                    </p>
                  </td>
                </tr>

                <!-- Additional Info -->
                <tr>
                  <td style="padding-top: 24px; font-size: 0.875rem; color: #4b5563; border-top: 1px solid #000000;">
                    <p style="margin: 0;">
                      Use this OTP to complete your order. If you didn't request this code, please contact our support team immediately.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td
              style="padding: 16px; background-color: #000000; font-size: 0.75rem; color: #ffffff; text-align: center;">
              <p style="margin: 0;">
                This is an automated message, please do not reply to this email.
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

export default orderCompletionConfirmation;
