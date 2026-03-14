type PrimitiveValue = string | number | boolean | null | undefined;

type DataEmailPayload = Record<string, PrimitiveValue>;

function formatKeyLabel(key: string): string {
  const withSpaces = key
    .replace(/_/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2');

  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
}

function formatValue(value: PrimitiveValue): string {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

export default function dataEmailTemplate(data: DataEmailPayload) {
  const rows = Object.entries(data)
    .map(
      ([key, value]) => `
            <tr>
              <td style="
                padding: 10px 14px;
                border-bottom: 1px solid #e5e7eb;
                font-size: 13px;
                color: #4b5563;
                font-weight: 600;
                background-color:#f9fafb;
                width: 40%;
              ">
                ${formatKeyLabel(key)}
              </td>
              <td style="
                padding: 10px 14px;
                border-bottom: 1px solid #e5e7eb;
                font-size: 13px;
                color: #111827;
              ">
                ${formatValue(value)}
              </td>
            </tr>`
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Voosto – Data Summary</title>
</head>

<body style="margin:0; padding:0; background-color:#f0f1ff; font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr>
      <td align="center">

        <!-- Card -->
        <table width="100%" cellpadding="0" cellspacing="0"
          style="max-width:560px; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 32px rgba(64,80,255,0.10);">

          <!-- Header Band -->
          <tr>
            <td style="background:#4050ff; padding:24px 32px; text-align:center;">
              <img
                src="https://voosto.com/assets/logos/favicon.svg"
                alt="Voosto"
                width="120"
                style="display:block; margin:0 auto; max-width:120px;"
                onerror="this.style.display='none'; document.getElementById('voosto-wordmark').style.display='block';"
              />
              <span id="voosto-wordmark"
                style="display:none; font-size:24px; font-weight:800; color:#ffffff; letter-spacing:-0.5px;">
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
            <td style="padding:28px 32px 24px;">
              <h2 style="margin:0 0 8px; font-size:20px; font-weight:700; color:#0d0f1a; letter-spacing:-0.3px; text-align:left;">
                Data Summary
              </h2>
              <p style="margin:0 0 20px; color:#6b7280; font-size:13px; line-height:1.6; text-align:left;">
                Here is the summary of the information in a structured table format.
              </p>

              <!-- Data Table -->
              <table width="100%" cellpadding="0" cellspacing="0" style="
                border-radius:12px;
                overflow:hidden;
                border:1px solid #e5e7eb;
                background-color:#ffffff;
              ">
                <thead>
                  <tr>
                    <th align="left" style="
                      padding:10px 14px;
                      font-size:12px;
                      color:#6b7280;
                      background-color:#f3f4ff;
                      border-bottom:1px solid #e5e7eb;
                      text-transform:uppercase;
                      letter-spacing:0.03em;
                    ">
                      Field
                    </th>
                    <th align="left" style="
                      padding:10px 14px;
                      font-size:12px;
                      color:#6b7280;
                      background-color:#f3f4ff;
                      border-bottom:1px solid #e5e7eb;
                      text-transform:uppercase;
                      letter-spacing:0.03em;
                    ">
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody>
                  ${rows || `
                  <tr>
                    <td colspan="2" style="
                      padding:14px;
                      font-size:13px;
                      color:#9ca3af;
                      text-align:center;
                    ">
                      No data available.
                    </td>
                  </tr>`}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 32px;">
              <div style="height:1px; background:#e5e7ff;"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:18px 32px; text-align:center;">
              <p style="margin:0; font-size:11px; color:#9ca3af;">
                This is an automated message from Voosto. Please do not reply to this email.
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
