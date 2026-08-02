/**
 * KEMET Digital Brand - Luxury HTML Email Templates for Resend & Supabase OTP
 * Design based 100% on KEMET Official Illustrator Master Template
 * Domain: kemetmisr.com | Sender: KEMET Sportswear <noreply@kemetmisr.com>
 * Rules: Zero Emojis, Zero External Links, Premium Luxury Dark Theme & Gold Accents
 */

export function getConfirmationEmailHtml({ otpCode }) {
  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تأكيد البريد الإلكتروني - KEMET</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0A0D14;
      font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #FFFFFF;
      direction: rtl;
      text-align: center;
      -webkit-font-smoothing: antialiased;
    }
    .email-wrapper {
      width: 100%;
      background-color: #0A0D14;
      padding: 40px 10px;
    }
    .email-card {
      max-width: 580px;
      margin: 0 auto;
      background-color: #000000;
      border: 3px solid #D4AF37;
      border-radius: 4px;
      padding: 40px 30px 30px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.9), inset 0 0 20px rgba(212, 175, 55, 0.15);
      position: relative;
      box-sizing: border-box;
    }
    .top-bar {
      text-align: right;
      margin-bottom: 25px;
    }
    .brand-logo-text {
      font-family: 'Montserrat', 'Arial Black', sans-serif;
      font-size: 26px;
      font-weight: 900;
      font-style: italic;
      color: #FFFFFF;
      letter-spacing: 3px;
      text-transform: uppercase;
      display: inline-block;
    }
    .main-title {
      font-size: 32px;
      font-weight: 900;
      color: #FFFFFF;
      margin: 20px 0 10px;
      letter-spacing: 1px;
    }
    .subtitle {
      font-size: 14px;
      color: #94A3B8;
      margin-bottom: 35px;
      font-weight: 600;
    }
    .otp-pill-box {
      background: #05070C;
      border: 2px solid #D4AF37;
      border-radius: 50px;
      padding: 16px 30px;
      display: inline-block;
      margin: 10px auto 35px;
      box-shadow: 0 0 25px rgba(212, 175, 55, 0.2);
    }
    .otp-code {
      font-family: 'Courier New', Courier, monospace;
      font-size: 40px;
      font-weight: 900;
      color: #D4AF37;
      letter-spacing: 14px;
      margin-right: 14px;
      line-height: 1.2;
    }
    .expiry-info {
      font-size: 15px;
      font-weight: 800;
      color: #E2E8F0;
      margin-bottom: 8px;
    }
    .ignore-notice {
      font-size: 12px;
      color: #64748B;
      margin-bottom: 45px;
      font-weight: 500;
    }
    .footer-line {
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding-top: 20px;
      font-size: 12px;
      color: #94A3B8;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-card">
      
      <!-- Top Brand Logo -->
      <div class="top-bar">
        <span class="brand-logo-text">KEMET</span>
      </div>

      <!-- Main Heading -->
      <div class="main-title">تأكيد البريد الإلكتروني</div>
      
      <!-- Subtitle -->
      <div class="subtitle">استخدم رمز التحقق التالي لإتمام تفعيل حسابك</div>

      <!-- Pill OTP Box -->
      <div class="otp-pill-box">
        <span class="otp-code">${otpCode}</span>
      </div>

      <!-- Expiry & Ignore Notice -->
      <div class="expiry-info">صلاحية الرمز 15 دقيقة</div>
      <div class="ignore-notice">إذا لم تطلب إنشاء هذا الحساب، يمكنك تجاهل هذه الرسالة</div>

      <!-- Footer Copyright -->
      <div class="footer-line">
        Copyright &copy; 2026 kemetmisr.com
      </div>

    </div>
  </div>
</body>
</html>
  `;
}

export function getPasswordResetEmailHtml({ otpCode }) {
  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>إعادة ضبط كلمة المرور - KEMET</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0A0D14;
      font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #FFFFFF;
      direction: rtl;
      text-align: center;
      -webkit-font-smoothing: antialiased;
    }
    .email-wrapper {
      width: 100%;
      background-color: #0A0D14;
      padding: 40px 10px;
    }
    .email-card {
      max-width: 580px;
      margin: 0 auto;
      background-color: #000000;
      border: 3px solid #D4AF37;
      border-radius: 4px;
      padding: 40px 30px 30px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.9), inset 0 0 20px rgba(212, 175, 55, 0.15);
      position: relative;
      box-sizing: border-box;
    }
    .top-bar {
      text-align: right;
      margin-bottom: 25px;
    }
    .brand-logo-text {
      font-family: 'Montserrat', 'Arial Black', sans-serif;
      font-size: 26px;
      font-weight: 900;
      font-style: italic;
      color: #FFFFFF;
      letter-spacing: 3px;
      text-transform: uppercase;
      display: inline-block;
    }
    .main-title {
      font-size: 32px;
      font-weight: 900;
      color: #FFFFFF;
      margin: 20px 0 10px;
      letter-spacing: 1px;
    }
    .subtitle {
      font-size: 14px;
      color: #94A3B8;
      margin-bottom: 35px;
      font-weight: 600;
    }
    .otp-pill-box {
      background: #05070C;
      border: 2px solid #D4AF37;
      border-radius: 50px;
      padding: 16px 30px;
      display: inline-block;
      margin: 10px auto 35px;
      box-shadow: 0 0 25px rgba(212, 175, 55, 0.2);
    }
    .otp-code {
      font-family: 'Courier New', Courier, monospace;
      font-size: 40px;
      font-weight: 900;
      color: #D4AF37;
      letter-spacing: 14px;
      margin-right: 14px;
      line-height: 1.2;
    }
    .expiry-info {
      font-size: 15px;
      font-weight: 800;
      color: #E2E8F0;
      margin-bottom: 8px;
    }
    .ignore-notice {
      font-size: 12px;
      color: #64748B;
      margin-bottom: 45px;
      font-weight: 500;
    }
    .footer-line {
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding-top: 20px;
      font-size: 12px;
      color: #94A3B8;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-card">
      
      <!-- Top Brand Logo -->
      <div class="top-bar">
        <span class="brand-logo-text">KEMET</span>
      </div>

      <!-- Main Heading -->
      <div class="main-title">إعادة ضبط كلمة المرور</div>
      
      <!-- Subtitle -->
      <div class="subtitle">استخدم رمز التحقق التالي لإعادة ضبط كلمة المرور الخاصة بحسابك</div>

      <!-- Pill OTP Box -->
      <div class="otp-pill-box">
        <span class="otp-code">${otpCode}</span>
      </div>

      <!-- Expiry & Ignore Notice -->
      <div class="expiry-info">صلاحية الرمز 15 دقيقة</div>
      <div class="ignore-notice">إذا لم تطلب إعادة ضبط كلمة المرور، يمكنك تجاهل هذه الرسالة بأمان</div>

      <!-- Footer Copyright -->
      <div class="footer-line">
        Copyright &copy; 2026 kemetmisr.com
      </div>

    </div>
  </div>
</body>
</html>
  `;
}
