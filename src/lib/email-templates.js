/**
 * KEMET Digital Brand - Luxury HTML Email Templates for Resend & Supabase OTP
 * Domain: kemetmisr.com | Sender: KEMET Sportswear <noreply@kemetmisr.com>
 * Rules: Zero Emojis, Zero External Links, Premium Design & Typography
 */

export function getConfirmationEmailHtml({ otpCode }) {
  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>رمز تفعيل حساب KEMET</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #05070C;
      font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #FFFFFF;
      direction: rtl;
      text-align: right;
    }
    .container {
      max-width: 560px;
      margin: 40px auto;
      background-color: #0D111A;
      border: 1px solid rgba(212, 175, 55, 0.4);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    }
    .header {
      background: #111622;
      padding: 30px 20px;
      text-align: center;
      border-bottom: 1px solid rgba(212, 175, 55, 0.2);
    }
    .brand-title {
      color: #D4AF37;
      font-size: 28px;
      margin: 0;
      font-weight: 900;
      letter-spacing: 4px;
      text-transform: uppercase;
    }
    .brand-subtitle {
      color: #94A3B8;
      font-size: 12px;
      font-weight: 700;
      margin-top: 6px;
      letter-spacing: 1px;
    }
    .content {
      padding: 40px 30px;
      line-height: 1.8;
      font-size: 15px;
      color: #E2E8F0;
      text-align: center;
    }
    .title-text {
      font-size: 20px;
      font-weight: 800;
      color: #FFFFFF;
      margin-bottom: 12px;
    }
    .info-text {
      color: #94A3B8;
      font-size: 14px;
      margin-bottom: 30px;
    }
    .otp-box {
      background: #05070C;
      border: 1px solid #D4AF37;
      border-radius: 10px;
      padding: 20px;
      display: inline-block;
      margin: 10px 0 25px 0;
    }
    .otp-code {
      font-family: 'Courier New', Courier, monospace;
      font-size: 36px;
      font-weight: 900;
      color: #D4AF37;
      letter-spacing: 12px;
      margin-right: 12px;
    }
    .expiry-text {
      font-size: 13px;
      color: #64748B;
      margin-top: 15px;
    }
    .divider {
      height: 1px;
      background: rgba(255, 255, 255, 0.08);
      margin: 30px 0;
    }
    .footer {
      background-color: #07090E;
      padding: 24px;
      text-align: center;
      font-size: 12px;
      color: #64748B;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }
    .footer p {
      margin: 4px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand-title">KEMET</div>
      <div class="brand-subtitle">PREMIUM ATHLETICWEAR</div>
    </div>
    
    <div class="content">
      <div class="title-text">تأكيد البريد الإلكتروني</div>
      <div class="info-text">استخدم رمز التحقق التالي لإتمام تفعيل حسابك بمتجر KEMET:</div>
      
      <div class="otp-box">
        <div class="otp-code">${otpCode}</div>
      </div>
      
      <div class="expiry-text">صلاحية الرمز: 15 دقيقة</div>
      
      <div class="divider"></div>
      
      <div style="font-size: 13px; color: #64748B;">
        إذا لم تطلب إنشاء هذا الحساب، يمكنك تجاهل هذه الرسالة وأمان حسابك في أمان تام.
      </div>
    </div>
    
    <div class="footer">
      <p>خدمة العملاء والاستفسارات: support@kemetmisr.com</p>
      <p>© ${new Date().getFullYear()} KEMET Sportswear. All rights reserved.</p>
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
  <title>استعادة كلمة المرور - KEMET</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #05070C;
      font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #FFFFFF;
      direction: rtl;
      text-align: right;
    }
    .container {
      max-width: 560px;
      margin: 40px auto;
      background-color: #0D111A;
      border: 1px solid rgba(212, 175, 55, 0.4);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    }
    .header {
      background: #111622;
      padding: 30px 20px;
      text-align: center;
      border-bottom: 1px solid rgba(212, 175, 55, 0.2);
    }
    .brand-title {
      color: #D4AF37;
      font-size: 28px;
      margin: 0;
      font-weight: 900;
      letter-spacing: 4px;
      text-transform: uppercase;
    }
    .brand-subtitle {
      color: #94A3B8;
      font-size: 12px;
      font-weight: 700;
      margin-top: 6px;
      letter-spacing: 1px;
    }
    .content {
      padding: 40px 30px;
      line-height: 1.8;
      font-size: 15px;
      color: #E2E8F0;
      text-align: center;
    }
    .title-text {
      font-size: 20px;
      font-weight: 800;
      color: #FFFFFF;
      margin-bottom: 12px;
    }
    .info-text {
      color: #94A3B8;
      font-size: 14px;
      margin-bottom: 30px;
    }
    .otp-box {
      background: #05070C;
      border: 1px solid #D4AF37;
      border-radius: 10px;
      padding: 20px;
      display: inline-block;
      margin: 10px 0 25px 0;
    }
    .otp-code {
      font-family: 'Courier New', Courier, monospace;
      font-size: 36px;
      font-weight: 900;
      color: #D4AF37;
      letter-spacing: 12px;
      margin-right: 12px;
    }
    .expiry-text {
      font-size: 13px;
      color: #64748B;
      margin-top: 15px;
    }
    .divider {
      height: 1px;
      background: rgba(255, 255, 255, 0.08);
      margin: 30px 0;
    }
    .footer {
      background-color: #07090E;
      padding: 24px;
      text-align: center;
      font-size: 12px;
      color: #64748B;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }
    .footer p {
      margin: 4px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand-title">KEMET</div>
      <div class="brand-subtitle">PREMIUM ATHLETICWEAR</div>
    </div>
    
    <div class="content">
      <div class="title-text">استعادة كلمة المرور</div>
      <div class="info-text">استخدم رمز التحقق التالي لإعادة تعيين كلمة المرور لحسابك:</div>
      
      <div class="otp-box">
        <div class="otp-code">${otpCode}</div>
      </div>
      
      <div class="expiry-text">صلاحية الرمز: 15 دقيقة</div>
      
      <div class="divider"></div>
      
      <div style="font-size: 13px; color: #64748B;">
        إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذه الرسالة وأمان حسابك في أمان تام.
      </div>
    </div>
    
    <div class="footer">
      <p>خدمة العملاء والاستفسارات: support@kemetmisr.com</p>
      <p>© ${new Date().getFullYear()} KEMET Sportswear. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}
