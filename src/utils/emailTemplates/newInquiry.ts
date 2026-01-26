function newInquiryEmail(inquiryData: {
  name: string;
  phone_number: string;
  email: string;
  message: string;
}) {
  return `
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Inquiry</title>

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

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5; padding: 16px;">
    <tr>
      <td align="center">
        <!-- Main Wrapper -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
          style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden; border: 2px solid #000000;">
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
                    New Inquiry Received
                  </td>
                </tr>
                <tr>
                  <td style="color: #374151; padding-bottom: 24px;">
                    You have received a new inquiry from a potential customer. Please review the details below:
                  </td>
                </tr>

                <!-- Inquiry Details -->
                <tr>
                  <td style="padding: 24px 0;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0"
                           style="background-color: #f9fafb; border: 2px solid #000000; border-radius: 8px; padding: 20px; text-align: left;">
                      <tr>
                        <td style="padding-bottom: 16px;">
                          <table width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="width: 120px; font-weight: 600; color: #000000; padding-right: 16px;">
                                Name:
                              </td>
                              <td style="color: #111827;">
                                ${inquiryData.name}
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 16px;">
                          <table width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="width: 120px; font-weight: 600; color: #000000; padding-right: 16px;">
                                Phone:
                              </td>
                              <td style="color: #111827;">
                                ${inquiryData.phone_number}
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 16px;">
                          <table width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="width: 120px; font-weight: 600; color: #000000; padding-right: 16px;">
                                Email:
                              </td>
                              <td style="color: #111827;">
                                ${inquiryData.email}
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <table width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="width: 120px; font-weight: 600; color: #000000; padding-right: 16px; vertical-align: top;">
                                Message:
                              </td>
                              <td style="color: #111827;">
                                ${inquiryData.message}
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Action Notice -->
                <tr>
                  <td style="background-color: #f97316; border: 1px solid #000000; border-radius: 8px; padding: 16px; margin-top: 24px;">
                    <p style="color: #ffffff; font-size: 0.875rem; margin: 0;">
                      Please respond to this inquiry promptly to provide excellent customer service.
                    </p>
                  </td>
                </tr>

                <!-- Additional Info -->
                <tr>
                  <td style="padding-top: 24px; color: #4b5563; font-size: 0.875rem;">
                    <p style="margin: 0; text-align: center;">
                      This inquiry was submitted through your website contact form.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
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

export default newInquiryEmail;
