/**
 * KEMET Digital Brand - Pixel-Perfect HTML Email Templates matching Reference.png
 * Built strictly with HTML Tables (table, tr, td) and Inline CSS
 * Zero Flexbox / Grid / Position / External CSS
 * Compatible with Gmail (Web & Mobile), Outlook, Apple Mail
 * Domain: kemetmisr.com | Assets: https://kemetmisr.com/assets/
 */

export function getConfirmationEmailHtml({ otpCode }) {
  const formattedOtp = String(otpCode || '00000000').trim();
  // Ensure exactly 8 digits padded if needed
  const displayOtp = formattedOtp.padStart(8, '0');

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
    :root {
      color-scheme: only dark;
    }
    body, table, td, p, a, span {
      font-family: 'Cairo', 'GE Snd Book', 'Segoe UI', Tahoma, Geneva, sans-serif !important;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    body {
      margin: 0 !important;
      padding: 0 !important;
      background-color: #000000 !important;
      width: 100% !important;
    }
    @media only screen and (max-width: 620px) {
      .email-container {
        width: 100% !important;
        max-width: 100% !important;
      }
      .otp-box-td {
        padding: 12px 10px !important;
      }
      .otp-text {
        font-size: 32px !important;
        letter-spacing: 8px !important;
      }
    }
  </style>
</head>
<body bgcolor="#000000" style="margin: 0; padding: 20px 0; background-color: #000000 !important;">
  
  <!-- Outer Wrapper Table -->
  <table border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#000000" style="background-color: #000000 !important; table-layout: fixed;">
    <tr>
      <td align="center" style="background-color: #000000 !important; padding: 10px;">
        
        <!-- Master 600px Gold Bordered Container -->
        <table class="email-container" border="0" cellpadding="0" cellspacing="0" width="600" bgcolor="#05070C" style="width: 600px !important; max-width: 600px !important; background-color: #05070C !important; border: 3px solid #D4AF37 !important; border-collapse: collapse;">
          
          <!-- Top Header Row with Logo.png -->
          <tr>
            <td align="left" valign="top" style="padding: 24px 28px 10px 28px; background-color: #05070C !important;">
              <a href="https://kemetmisr.com" target="_blank" style="text-decoration: none; display: inline-block;">
                <img src="https://kemetmisr.com/assets/kemet-text-logo.png" alt="KEMET" width="115" style="display: block; border: 0; outline: none; text-decoration: none; width: 115px; max-width: 115px; height: auto;" />
              </a>
            </td>
          </tr>

          <!-- Main Content Area with Watermark background -->
          <tr>
            <td align="center" valign="middle" background="https://kemetmisr.com/assets/kemet-watermark-pharaoh.png" style="padding: 10px 28px 25px 28px; background-color: #05070C !important; background-image: url('https://kemetmisr.com/assets/kemet-watermark-pharaoh.png'); background-repeat: no-repeat; background-position: center center; background-size: 380px auto;">
              
              <!-- Title: تأكيد البريد الإلكتروني -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom: 6px;">
                    <span style="font-family: 'Cairo', 'GE Snd Book', Tahoma, sans-serif; font-size: 28px; font-weight: 900; color: #FFFFFF; line-height: 1.2; display: block;">
                      تأكيد البريد الإلكتروني
                    </span>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom: 22px;">
                    <span style="font-family: 'Cairo', 'GE Snd Book', Tahoma, sans-serif; font-size: 15px; color: #CBD5E1; display: block;">
                      استخدم رمز التحقق التالي لإتمام تفعيل حسابك
                    </span>
                  </td>
                </tr>
              </table>

              <!-- OTP Pill Container Box Table -->
              <table border="0" cellpadding="0" cellspacing="0" width="460" align="center" bgcolor="#0A0E17" style="width: 460px !important; max-width: 92% !important; background-color: #0A0E17 !important; border: 1.5px solid #D4AF37 !important; border-radius: 20px !important; margin: 0 auto 22px auto !important; border-collapse: separate;">
                <tr>
                  <td class="otp-box-td" align="center" valign="middle" style="padding: 18px 20px !important; background-color: #0A0E17 !important; border-radius: 20px !important;">
                    <span class="otp-text" style="font-family: 'Courier New', Consolas, Monaco, monospace !important; font-size: 42px !important; font-weight: 900 !important; color: #FFDF73 !important; letter-spacing: 12px !important; text-align: center !important; display: inline-block !important; direction: ltr !important;">
                      ${displayOtp}
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Expiry & Disclaimer Notices -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom: 6px;">
                    <span style="font-family: 'Cairo', 'GE Snd Book', sans-serif; font-size: 15px; font-weight: 800; color: #FFFFFF; display: block;">
                      صلاحية الرمز 15 دقيقة
                    </span>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom: 10px;">
                    <span style="font-family: 'Cairo', 'GE Snd Book', sans-serif; font-size: 13px; color: #94A3B8; display: block;">
                      إذا لم تطلب إنشاء هذا الحساب، يمكنك تجاهل هذه الرسالة
                    </span>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer Copyright Row -->
          <tr>
            <td align="center" valign="bottom" style="padding: 16px 28px 22px 28px; background-color: #05070C !important; border-top: 1px solid rgba(212, 175, 55, 0.25) !important;">
              <span style="font-family: Arial, 'Segoe UI', sans-serif; font-size: 13px; color: #FFFFFF; font-weight: 600; display: block;">
                Copyright &copy; 2026 <a href="https://kemetmisr.com" target="_blank" style="color: #FFFFFF !important; text-decoration: none !important; font-weight: bold !important;">kemetmisr.com</a>
              </span>
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
  const displayOtp = formattedOtp.padStart(8, '0');

  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="ar" dir="rtl">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="only dark" />
  <meta name="supported-color-schemes" content="only dark" />
  <title>استعادة كلمة المرور - KEMET</title>
  <style type="text/css">
    :root {
      color-scheme: only dark;
    }
    body, table, td, p, a, span {
      font-family: 'Cairo', 'GE Snd Book', 'Segoe UI', Tahoma, Geneva, sans-serif !important;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    body {
      margin: 0 !important;
      padding: 0 !important;
      background-color: #000000 !important;
      width: 100% !important;
    }
    @media only screen and (max-width: 620px) {
      .email-container {
        width: 100% !important;
        max-width: 100% !important;
      }
      .otp-box-td {
        padding: 12px 10px !important;
      }
      .otp-text {
        font-size: 32px !important;
        letter-spacing: 8px !important;
      }
    }
  </style>
</head>
<body bgcolor="#000000" style="margin: 0; padding: 20px 0; background-color: #000000 !important;">
  
  <!-- Outer Wrapper Table -->
  <table border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#000000" style="background-color: #000000 !important; table-layout: fixed;">
    <tr>
      <td align="center" style="background-color: #000000 !important; padding: 10px;">
        
        <!-- Master 600px Gold Bordered Container -->
        <table class="email-container" border="0" cellpadding="0" cellspacing="0" width="600" bgcolor="#05070C" style="width: 600px !important; max-width: 600px !important; background-color: #05070C !important; border: 3px solid #D4AF37 !important; border-collapse: collapse;">
          
          <!-- Top Header Row with Logo.png -->
          <tr>
            <td align="left" valign="top" style="padding: 24px 28px 10px 28px; background-color: #05070C !important;">
              <a href="https://kemetmisr.com" target="_blank" style="text-decoration: none; display: inline-block;">
                <img src="https://kemetmisr.com/assets/kemet-text-logo.png" alt="KEMET" width="115" style="display: block; border: 0; outline: none; text-decoration: none; width: 115px; max-width: 115px; height: auto;" />
              </a>
            </td>
          </tr>

          <!-- Main Content Area with Watermark background -->
          <tr>
            <td align="center" valign="middle" background="https://kemetmisr.com/assets/kemet-watermark-pharaoh.png" style="padding: 10px 28px 25px 28px; background-color: #05070C !important; background-image: url('https://kemetmisr.com/assets/kemet-watermark-pharaoh.png'); background-repeat: no-repeat; background-position: center center; background-size: 380px auto;">
              
              <!-- Title: استعادة كلمة المرور -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom: 6px;">
                    <span style="font-family: 'Cairo', 'GE Snd Book', Tahoma, sans-serif; font-size: 28px; font-weight: 900; color: #FFFFFF; line-height: 1.2; display: block;">
                      استعادة كلمة المرور
                    </span>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom: 22px;">
                    <span style="font-family: 'Cairo', 'GE Snd Book', Tahoma, sans-serif; font-size: 15px; color: #CBD5E1; display: block;">
                      استخدم رمز التحقق التالي لإعادة ضبط كلمة المرور الخاصة بحسابك
                    </span>
                  </td>
                </tr>
              </table>

              <!-- OTP Pill Container Box Table -->
              <table border="0" cellpadding="0" cellspacing="0" width="460" align="center" bgcolor="#0A0E17" style="width: 460px !important; max-width: 92% !important; background-color: #0A0E17 !important; border: 1.5px solid #D4AF37 !important; border-radius: 20px !important; margin: 0 auto 22px auto !important; border-collapse: separate;">
                <tr>
                  <td class="otp-box-td" align="center" valign="middle" style="padding: 18px 20px !important; background-color: #0A0E17 !important; border-radius: 20px !important;">
                    <span class="otp-text" style="font-family: 'Courier New', Consolas, Monaco, monospace !important; font-size: 42px !important; font-weight: 900 !important; color: #FFDF73 !important; letter-spacing: 12px !important; text-align: center !important; display: inline-block !important; direction: ltr !important;">
                      ${displayOtp}
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Expiry & Disclaimer Notices -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom: 6px;">
                    <span style="font-family: 'Cairo', 'GE Snd Book', sans-serif; font-size: 15px; font-weight: 800; color: #FFFFFF; display: block;">
                      صلاحية الرمز 15 دقيقة
                    </span>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom: 10px;">
                    <span style="font-family: 'Cairo', 'GE Snd Book', sans-serif; font-size: 13px; color: #94A3B8; display: block;">
                      إذا لم تطلب إعادة ضبط كلمة المرور، يمكنك تجاهل هذه الرسالة بأمان
                    </span>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer Copyright Row -->
          <tr>
            <td align="center" valign="bottom" style="padding: 16px 28px 22px 28px; background-color: #05070C !important; border-top: 1px solid rgba(212, 175, 55, 0.25) !important;">
              <span style="font-family: Arial, 'Segoe UI', sans-serif; font-size: 13px; color: #FFFFFF; font-weight: 600; display: block;">
                Copyright &copy; 2026 <a href="https://kemetmisr.com" target="_blank" style="color: #FFFFFF !important; text-decoration: none !important; font-weight: bold !important;">kemetmisr.com</a>
              </span>
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
