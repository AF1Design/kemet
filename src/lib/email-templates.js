/**
 * KEMET Luxury Sportswear - Branded HTML Email Templates for Resend & Supabase
 * Domain: kemetmisr.com | Sender: noreply@kemetmisr.com
 */

export function getConfirmationEmailHtml({ confirmationUrl, fullName = 'عميل KEMET العزيز' }) {
  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تأكيد حسابك في KEMET</title>
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
      max-width: 600px;
      margin: 40px auto;
      background-color: #0D111A;
      border: 1px solid #D4AF37;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(212, 175, 55, 0.25);
    }
    .header {
      background: linear-gradient(180deg, #111622 0%, #0D111A 100%);
      padding: 35px 20px;
      text-align: center;
      border-bottom: 1px solid rgba(212, 175, 55, 0.3);
    }
    .header img {
      height: 55px;
      margin-bottom: 10px;
    }
    .header h1 {
      color: #D4AF37;
      font-size: 26px;
      margin: 0;
      font-weight: 900;
      letter-spacing: 1px;
    }
    .content {
      padding: 40px 30px;
      line-height: 1.8;
      font-size: 16px;
      color: #E2E8F0;
    }
    .welcome-text {
      font-size: 20px;
      font-weight: 800;
      color: #FFFFFF;
      margin-bottom: 20px;
    }
    .btn-container {
      text-align: center;
      margin: 35px 0;
    }
    .btn-confirm {
      display: inline-block;
      background: linear-gradient(135deg, #D4AF37 0%, #AA771C 100%);
      color: #000000 !important;
      text-decoration: none;
      font-weight: 900;
      font-size: 17px;
      padding: 16px 42px;
      border-radius: 30px;
      box-shadow: 0 6px 20px rgba(212, 175, 55, 0.4);
      transition: all 0.3s ease;
    }
    .footer {
      background-color: #07090E;
      padding: 25px;
      text-align: center;
      font-size: 13px;
      color: #94A3B8;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }
    .footer a {
      color: #D4AF37;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>KEMET</h1>
      <div style="color: #D4AF37; font-size: 13px; font-weight: 700; margin-top: 5px;">البراند المصري الفاخر للملابس الرياضية</div>
    </div>
    
    <div class="content">
      <div class="welcome-text">مرحباً بك في عائلة KEMET 🎉</div>
      <p>شكراً لإنشائك حساباً في متجر كيميت الرسمي. يرجى الضغط على الزر أدناه لتأكيد بريدك الإلكتروني وتفعيل حسابك مباشرة:</p>
      
      <div class="btn-container">
        <a href="${confirmationUrl}" class="btn-confirm" target="_blank">تأكيد وتفعيل الحساب 🚀</a>
      </div>
      
      <p style="font-size: 14px; color: #94A3B8; margin-top: 30px;">
        إذا لم تكن قد قمت بإنشاء هذا الحساب، يمكنك التغاضي عن هذه الرسالة وسيعتبر الطلب لاغياً.
      </p>
      
      <div style="margin-top: 25px; font-size: 13px; color: #64748B; word-break: break-all;">
        إذا لم يعمل الزر أعلاه، يمكنك نسخ الرابط التالي ولصقه في المتصفح:<br>
        <a href="${confirmationUrl}" style="color: #D4AF37;">${confirmationUrl}</a>
      </div>
    </div>
    
    <div class="footer">
      جميع الحقوق محفوظة © ${new Date().getFullYear()} <a href="https://kemetmisr.com">KEMET Sportswear (kemetmisr.com)</a>
    </div>
  </div>
</body>
</html>
  `;
}

export function getPasswordResetEmailHtml({ resetUrl }) {
  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>إعادة تعيين كلمة المرور - KEMET</title>
  <style>
    body { margin: 0; padding: 0; background-color: #05070C; font-family: 'Cairo', sans-serif; color: #FFF; direction: rtl; }
    .container { max-width: 600px; margin: 40px auto; background-color: #0D111A; border: 1px solid #D4AF37; border-radius: 16px; overflow: hidden; }
    .header { background: #111622; padding: 30px; text-align: center; border-bottom: 1px solid rgba(212, 175, 55, 0.3); }
    .header h1 { color: #D4AF37; font-size: 26px; margin: 0; }
    .content { padding: 35px 30px; line-height: 1.8; color: #E2E8F0; }
    .btn-container { text-align: center; margin: 30px 0; }
    .btn-reset { display: inline-block; background: linear-gradient(135deg, #D4AF37 0%, #AA771C 100%); color: #000 !important; font-weight: 900; padding: 14px 36px; border-radius: 30px; text-decoration: none; }
    .footer { background-color: #07090E; padding: 20px; text-align: center; font-size: 13px; color: #94A3B8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>KEMET</h1>
    </div>
    <div class="content">
      <h2 style="color: #FFF; font-size: 20px;">طلب إعادة تعيين كلمة السر 🔑</h2>
      <p>لقد تلقينا طلباً لإعادة تعيين كلمة المرور لحسابك في KEMET. اضغط على الزر أدناه لإعادة تعيين كلمة السر:</p>
      <div class="btn-container">
        <a href="${resetUrl}" class="btn-reset">تغيير كلمة المرور</a>
      </div>
      <p style="font-size: 13px; color: #94A3B8;">إذا لم تطلب تغيير كلمة المرور، يمكنك إهمال هذه الرسالة وأمان حسابك في أمان تام.</p>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} KEMET (kemetmisr.com)
    </div>
  </div>
</body>
</html>
  `;
}
