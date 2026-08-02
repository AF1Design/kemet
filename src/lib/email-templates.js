/**
 * KEMET Digital Brand - Luxury HTML Email Templates for Resend & Supabase OTP
 * 100% Pixel-Perfect Match with KEMET Official Master Design (JPEG + CSS Spec)
 * Domain: kemetmisr.com | Sender: KEMET Sportswear <noreply@kemetmisr.com>
 * Rules: Zero Emojis, Zero Third-Party Branding, Real Working Domain Link
 */

export function getConfirmationEmailHtml({ otpCode }) {
  // Format OTP code digits with clean letter spacing
  const formattedOtp = String(otpCode || '00000000').trim();

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
      background-color: #000000;
      font-family: 'Cairo', 'GE Snd Book', 'Adobe Arabic', Tahoma, sans-serif;
      color: #FFFFFF;
      direction: rtl;
      text-align: center;
      -webkit-font-smoothing: antialiased;
    }
    .email-wrapper {
      width: 100%;
      background-color: #000000;
      padding: 30px 10px;
      box-sizing: border-box;
    }
    .email-card {
      max-width: 580px;
      margin: 0 auto;
      background-color: #000000;
      border: 3px solid #D4AF37;
      padding: 35px 25px 30px;
      box-shadow: 0 0 30px rgba(212, 175, 55, 0.25);
      position: relative;
      box-sizing: border-box;
      background-image: radial-gradient(circle at center, rgba(30, 30, 30, 0.4) 0%, rgba(0, 0, 0, 0.95) 75%);
    }
    .top-bar {
      text-align: right;
      margin-bottom: 20px;
    }
    .brand-logo-text {
      font-family: 'Eras Demi ITC', 'Montserrat', 'Arial Black', sans-serif;
      font-size: 26px;
      font-weight: 900;
      font-style: italic;
      color: #FFFFFF;
      letter-spacing: 3px;
      text-transform: uppercase;
      display: inline-block;
      text-decoration: none;
    }
    .main-title {
      font-family: 'GE Snd Book', 'Cairo', sans-serif;
      font-size: 32px;
      font-weight: 900;
      color: #FFFFFF;
      margin: 15px 0 8px;
      letter-spacing: 1px;
    }
    .subtitle {
      font-family: 'Adobe Arabic', 'Cairo', sans-serif;
      font-size: 15px;
      color: #CCCCCC;
      margin-bottom: 30px;
    }
    .otp-box-container {
      margin: 10px auto 30px;
      display: inline-block;
      width: 90%;
      max-width: 440px;
    }
    .otp-pill-box {
      background: #0D0D0D;
      border: 1.5px solid #C59B27;
      border-radius: 20px;
      padding: 20px 15px;
      box-shadow: inset 0 0 15px rgba(0,0,0,0.8), 0 0 20px rgba(197, 155, 39, 0.2);
    }
    .otp-code {
      font-family: 'GE Snd Book', 'Courier New', Courier, monospace;
      font-size: 48px;
      font-weight: 900;
      color: #E5C158;
      letter-spacing: 14px;
      margin-right: 14px;
      display: inline-block;
      line-height: 1.2;
    }
    .expiry-info {
      font-family: 'GE Snd Book', 'Cairo', sans-serif;
      font-size: 14px;
      font-weight: 700;
      color: #FFFFFF;
      margin-bottom: 8px;
    }
    .ignore-notice {
      font-family: 'GE Snd Book', 'Cairo', sans-serif;
      font-size: 13px;
      color: #CCCCCC;
      margin-bottom: 35px;
    }
    .footer-line {
      border-top: 1px solid rgba(255, 255, 255, 0.15);
      padding-top: 20px;
      font-family: 'Eras Demi ITC', 'Segoe UI', sans-serif;
      font-size: 13px;
      color: #FFFFFF;
      font-weight: 600;
    }
    .footer-link {
      color: #FFFFFF;
      text-decoration: none;
      font-weight: 800;
      transition: color 0.2s ease;
    }
    .footer-link:hover {
      color: #E5C158;
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-card">
      
      <!-- Top Left Brand Logo -->
      <div class="top-bar">
        <a href="https://kemetmisr.com" target="_blank" class="brand-logo-text">KEMET</a>
      </div>

      <!-- Main Heading -->
      <div class="main-title">تأكيد البريد الإلكتروني</div>
      
      <!-- Subtitle -->
      <div class="subtitle">استخدم رمز التحقق التالي لإتمام تفعيل حسابك</div>

      <!-- Pill OTP Box -->
      <div class="otp-box-container">
        <div class="otp-pill-box">
          <span class="otp-code">${formattedOtp}</span>
        </div>
      </div>

      <!-- Expiry & Ignore Notice -->
      <div class="expiry-info">صلاحية الرمز 15 دقيقة</div>
      <div class="ignore-notice">إذا لم تطلب إنشاء هذا الحساب، يمكنك تجاهل هذه الرسالة</div>

      <!-- Footer Copyright with Active Domain Link -->
      <div class="footer-line">
        Copyright &copy; 2026 <a href="https://kemetmisr.com" target="_blank" class="footer-link">kemetmisr.com</a>
      </div>

    </div>
  </div>
</body>
</html>
  `;
}

export function getPasswordResetEmailHtml({ otpCode }) {
  const formattedOtp = String(otpCode || '00000000').trim();

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
      background-color: #000000;
      font-family: 'Cairo', 'GE Snd Book', 'Adobe Arabic', Tahoma, sans-serif;
      color: #FFFFFF;
      direction: rtl;
      text-align: center;
      -webkit-font-smoothing: antialiased;
    }
    .email-wrapper {
      width: 100%;
      background-color: #000000;
      padding: 30px 10px;
      box-sizing: border-box;
    }
    .email-card {
      max-width: 580px;
      margin: 0 auto;
      background-color: #000000;
      border: 3px solid #D4AF37;
      padding: 35px 25px 30px;
      box-shadow: 0 0 30px rgba(212, 175, 55, 0.25);
      position: relative;
      box-sizing: border-box;
      background-image: radial-gradient(circle at center, rgba(30, 30, 30, 0.4) 0%, rgba(0, 0, 0, 0.95) 75%);
    }
    .top-bar {
      text-align: right;
      margin-bottom: 20px;
    }
    .brand-logo-text {
      font-family: 'Eras Demi ITC', 'Montserrat', 'Arial Black', sans-serif;
      font-size: 26px;
      font-weight: 900;
      font-style: italic;
      color: #FFFFFF;
      letter-spacing: 3px;
      text-transform: uppercase;
      display: inline-block;
      text-decoration: none;
    }
    .main-title {
      font-family: 'GE Snd Book', 'Cairo', sans-serif;
      font-size: 32px;
      font-weight: 900;
      color: #FFFFFF;
      margin: 15px 0 8px;
      letter-spacing: 1px;
    }
    .subtitle {
      font-family: 'Adobe Arabic', 'Cairo', sans-serif;
      font-size: 15px;
      color: #CCCCCC;
      margin-bottom: 30px;
    }
    .otp-box-container {
      margin: 10px auto 30px;
      display: inline-block;
      width: 90%;
      max-width: 440px;
    }
    .otp-pill-box {
      background: #0D0D0D;
      border: 1.5px solid #C59B27;
      border-radius: 20px;
      padding: 20px 15px;
      box-shadow: inset 0 0 15px rgba(0,0,0,0.8), 0 0 20px rgba(197, 155, 39, 0.2);
    }
    .otp-code {
      font-family: 'GE Snd Book', 'Courier New', Courier, monospace;
      font-size: 48px;
      font-weight: 900;
      color: #E5C158;
      letter-spacing: 14px;
      margin-right: 14px;
      display: inline-block;
      line-height: 1.2;
    }
    .expiry-info {
      font-family: 'GE Snd Book', 'Cairo', sans-serif;
      font-size: 14px;
      font-weight: 700;
      color: #FFFFFF;
      margin-bottom: 8px;
    }
    .ignore-notice {
      font-family: 'GE Snd Book', 'Cairo', sans-serif;
      font-size: 13px;
      color: #CCCCCC;
      margin-bottom: 35px;
    }
    .footer-line {
      border-top: 1px solid rgba(255, 255, 255, 0.15);
      padding-top: 20px;
      font-family: 'Eras Demi ITC', 'Segoe UI', sans-serif;
      font-size: 13px;
      color: #FFFFFF;
      font-weight: 600;
    }
    .footer-link {
      color: #FFFFFF;
      text-decoration: none;
      font-weight: 800;
      transition: color 0.2s ease;
    }
    .footer-link:hover {
      color: #E5C158;
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-card">
      
      <!-- Top Left Brand Logo -->
      <div class="top-bar">
        <a href="https://kemetmisr.com" target="_blank" class="brand-logo-text">KEMET</a>
      </div>

      <!-- Main Heading -->
      <div class="main-title">إعادة ضبط كلمة المرور</div>
      
      <!-- Subtitle -->
      <div class="subtitle">استخدم رمز التحقق التالي لإعادة ضبط كلمة المرور الخاصة بحسابك</div>

      <!-- Pill OTP Box -->
      <div class="otp-box-container">
        <div class="otp-pill-box">
          <span class="otp-code">${formattedOtp}</span>
        </div>
      </div>

      <!-- Expiry & Ignore Notice -->
      <div class="expiry-info">صلاحية الرمز 15 دقيقة</div>
      <div class="ignore-notice">إذا لم تطلب إعادة ضبط كلمة المرور، يمكنك تجاهل هذه الرسالة بأمان</div>

      <!-- Footer Copyright with Active Domain Link -->
      <div class="footer-line">
        Copyright &copy; 2026 <a href="https://kemetmisr.com" target="_blank" class="footer-link">kemetmisr.com</a>
      </div>

    </div>
  </div>
</body>
</html>
  `;
}
