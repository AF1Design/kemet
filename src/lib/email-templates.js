/**
 * KEMET Digital Brand - Ultra-Resilient Table-Based HTML Email Template
 * 100% Canvas Dimensions: 600px Width x 400px Height
 * Compatible with Gmail Mobile App, Outlook, Apple Mail, Dark & Light Mode Enforcement
 * Domain: kemetmisr.com | Sender: KEMET Sportswear <noreply@kemetmisr.com>
 */

export function getConfirmationEmailHtml({ otpCode }) {
  const formattedOtp = String(otpCode || '00000000').trim();

  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="ar" dir="rtl">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="only dark" />
  <meta name="supported-color-schemes" content="only dark" />
  <title>تأكيد البريد الإلكتروني - KEMET</title>
  <style type="text/css">
    /* Force Email Clients to Honor Colors & Prevent Forced White Inversion */
    :root {
      color-scheme: only dark;
    }
    body, table, td, p, a, span, div {
      font-family: 'Cairo', 'GE Snd Book', 'Adobe Arabic', Tahoma, Geneva, sans-serif !important;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    body {
      margin: 0 !important;
      padding: 0 !important;
      background-color: #000000 !important;
      width: 100% !important;
      height: 100% !important;
    }
    .email-container {
      width: 600px !important;
      max-width: 600px !important;
      height: 400px !important;
      margin: 0 auto !important;
    }
    .footer-link:hover {
      color: #E5C158 !important;
      text-decoration: underline !important;
    }
    @media only screen and (max-width: 620px) {
      .email-container {
        width: 100% !important;
        max-width: 100% !important;
        height: auto !important;
      }
      .otp-text {
        font-size: 36px !important;
        letter-spacing: 8px !important;
      }
    }
  </style>
</head>
<body bgcolor="#000000" style="margin: 0; padding: 20px 0; background-color: #000000 !important;">
  
  <!-- Main 600x400 Container Table -->
  <table border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#000000" style="background-color: #000000 !important; table-layout: fixed;">
    <tr>
      <td align="center" style="background-color: #000000 !important; padding: 10px;">
        
        <!-- 600px x 400px Gold Bordered Master Table -->
        <table class="email-container" border="0" cellpadding="0" cellspacing="0" width="600" height="400" bgcolor="#000000" style="width: 600px !important; max-width: 600px !important; height: 400px !important; background-color: #000000 !important; border: 3px solid #D4AF37 !important; border-collapse: collapse; box-sizing: border-box;">
          
          <!-- Header Logo Row -->
          <tr>
            <td align="right" valign="top" style="padding: 20px 25px 0 25px; background-color: #000000 !important;">
              <a href="https://kemetmisr.com" target="_blank" style="font-family: 'Eras Demi ITC', 'Montserrat', Arial, sans-serif !important; font-size: 24px !important; font-weight: 900 !important; font-style: italic !important; color: #FFFFFF !important; text-decoration: none !important; display: inline-block;">
                KEMET
              </a>
            </td>
          </tr>

          <!-- Main Content Area -->
          <tr>
            <td align="center" valign="middle" style="padding: 0 25px; background-color: #000000 !important;">
              
              <!-- Main Title -->
              <div style="font-family: 'GE Snd Book', 'Cairo', Tahoma, sans-serif !important; font-size: 28px !important; font-weight: 900 !important; color: #FFFFFF !important; margin: 0 0 6px 0 !important; line-height: 1.2;">
                تأكيد البريد الإلكتروني
              </div>

              <!-- Subtitle -->
              <div style="font-family: 'Adobe Arabic', 'Cairo', Tahoma, sans-serif !important; font-size: 15px !important; color: #CCCCCC !important; margin: 0 0 18px 0 !important;">
                استخدم رمز التحقق التالي لإتمام تفعيل حسابك
              </div>

              <!-- Pill OTP Inner Box Table (400px width) -->
              <table border="0" cellpadding="0" cellspacing="0" width="420" align="center" bgcolor="#0D0D0D" style="width: 420px !important; max-width: 90% !important; background-color: #0D0D0D !important; border: 1.5px solid #C59B27 !important; border-radius: 18px !important; margin: 0 auto 18px auto !important; border-collapse: separate;">
                <tr>
                  <td align="center" valign="middle" style="padding: 14px 15px !important; background-color: #0D0D0D !important; border-radius: 18px !important;">
                    <span class="otp-text" style="font-family: 'GE Snd Book', 'Courier New', monospace !important; font-size: 44px !important; font-weight: 900 !important; color: #E5C158 !important; letter-spacing: 12px !important; margin-right: 12px !important; display: inline-block !important;">
                      ${formattedOtp}
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Expiry Notice -->
              <div style="font-family: 'GE Snd Book', 'Cairo', sans-serif !important; font-size: 14px !important; font-weight: 700 !important; color: #FFFFFF !important; margin: 0 0 4px 0 !important;">
                صلاحية الرمز 15 دقيقة
              </div>

              <!-- Disclaimer Notice -->
              <div style="font-family: 'GE Snd Book', 'Cairo', sans-serif !important; font-size: 12px !important; color: #CCCCCC !important; margin: 0 0 15px 0 !important;">
                إذا لم تطلب إنشاء هذا الحساب، يمكنك تجاهل هذه الرسالة
              </div>

            </td>
          </tr>

          <!-- Footer Copyright Row -->
          <tr>
            <td align="center" valign="bottom" style="padding: 12px 25px 18px 25px; border-top: 1px solid rgba(255, 255, 255, 0.15) !important; background-color: #000000 !important;">
              <div style="font-family: 'Eras Demi ITC', 'Segoe UI', Arial, sans-serif !important; font-size: 13px !important; color: #FFFFFF !important; font-weight: 600 !important;">
                Copyright &copy; 2026 <a href="https://kemetmisr.com" target="_blank" class="footer-link" style="color: #FFFFFF !important; text-decoration: none !important; font-weight: bold !important;">kemetmisr.com</a>
              </div>
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

export function getPasswordResetEmailHtml({ otpCode }) {
  const formattedOtp = String(otpCode || '00000000').trim();

  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="ar" dir="rtl">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="only dark" />
  <meta name="supported-color-schemes" content="only dark" />
  <title>إعادة ضبط كلمة المرور - KEMET</title>
  <style type="text/css">
    :root {
      color-scheme: only dark;
    }
    body, table, td, p, a, span, div {
      font-family: 'Cairo', 'GE Snd Book', 'Adobe Arabic', Tahoma, Geneva, sans-serif !important;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    body {
      margin: 0 !important;
      padding: 0 !important;
      background-color: #000000 !important;
      width: 100% !important;
      height: 100% !important;
    }
    .email-container {
      width: 600px !important;
      max-width: 600px !important;
      height: 400px !important;
      margin: 0 auto !important;
    }
    .footer-link:hover {
      color: #E5C158 !important;
      text-decoration: underline !important;
    }
    @media only screen and (max-width: 620px) {
      .email-container {
        width: 100% !important;
        max-width: 100% !important;
        height: auto !important;
      }
      .otp-text {
        font-size: 36px !important;
        letter-spacing: 8px !important;
      }
    }
  </style>
</head>
<body bgcolor="#000000" style="margin: 0; padding: 20px 0; background-color: #000000 !important;">
  
  <table border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#000000" style="background-color: #000000 !important; table-layout: fixed;">
    <tr>
      <td align="center" style="background-color: #000000 !important; padding: 10px;">
        
        <table class="email-container" border="0" cellpadding="0" cellspacing="0" width="600" height="400" bgcolor="#000000" style="width: 600px !important; max-width: 600px !important; height: 400px !important; background-color: #000000 !important; border: 3px solid #D4AF37 !important; border-collapse: collapse; box-sizing: border-box;">
          
          <!-- Header Logo Row -->
          <tr>
            <td align="right" valign="top" style="padding: 20px 25px 0 25px; background-color: #000000 !important;">
              <a href="https://kemetmisr.com" target="_blank" style="font-family: 'Eras Demi ITC', 'Montserrat', Arial, sans-serif !important; font-size: 24px !important; font-weight: 900 !important; font-style: italic !important; color: #FFFFFF !important; text-decoration: none !important; display: inline-block;">
                KEMET
              </a>
            </td>
          </tr>

          <!-- Main Content Area -->
          <tr>
            <td align="center" valign="middle" style="padding: 0 25px; background-color: #000000 !important;">
              
              <div style="font-family: 'GE Snd Book', 'Cairo', Tahoma, sans-serif !important; font-size: 28px !important; font-weight: 900 !important; color: #FFFFFF !important; margin: 0 0 6px 0 !important; line-height: 1.2;">
                إعادة ضبط كلمة المرور
              </div>

              <div style="font-family: 'Adobe Arabic', 'Cairo', Tahoma, sans-serif !important; font-size: 15px !important; color: #CCCCCC !important; margin: 0 0 18px 0 !important;">
                استخدم رمز التحقق التالي لإعادة ضبط كلمة المرور الخاصة بحسابك
              </div>

              <table border="0" cellpadding="0" cellspacing="0" width="420" align="center" bgcolor="#0D0D0D" style="width: 420px !important; max-width: 90% !important; background-color: #0D0D0D !important; border: 1.5px solid #C59B27 !important; border-radius: 18px !important; margin: 0 auto 18px auto !important; border-collapse: separate;">
                <tr>
                  <td align="center" valign="middle" style="padding: 14px 15px !important; background-color: #0D0D0D !important; border-radius: 18px !important;">
                    <span class="otp-text" style="font-family: 'GE Snd Book', 'Courier New', monospace !important; font-size: 44px !important; font-weight: 900 !important; color: #E5C158 !important; letter-spacing: 12px !important; margin-right: 12px !important; display: inline-block !important;">
                      ${formattedOtp}
                    </span>
                  </td>
                </tr>
              </table>

              <div style="font-family: 'GE Snd Book', 'Cairo', sans-serif !important; font-size: 14px !important; font-weight: 700 !important; color: #FFFFFF !important; margin: 0 0 4px 0 !important;">
                صلاحية الرمز 15 دقيقة
              </div>

              <div style="font-family: 'GE Snd Book', 'Cairo', sans-serif !important; font-size: 12px !important; color: #CCCCCC !important; margin: 0 0 15px 0 !important;">
                إذا لم تطلب إعادة ضبط كلمة المرور، يمكنك تجاهل هذه الرسالة بأمان
              </div>

            </td>
          </tr>

          <!-- Footer Copyright Row -->
          <tr>
            <td align="center" valign="bottom" style="padding: 12px 25px 18px 25px; border-top: 1px solid rgba(255, 255, 255, 0.15) !important; background-color: #000000 !important;">
              <div style="font-family: 'Eras Demi ITC', 'Segoe UI', Arial, sans-serif !important; font-size: 13px !important; color: #FFFFFF !important; font-weight: 600 !important;">
                Copyright &copy; 2026 <a href="https://kemetmisr.com" target="_blank" class="footer-link" style="color: #FFFFFF !important; text-decoration: none !important; font-weight: bold !important;">kemetmisr.com</a>
              </div>
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
