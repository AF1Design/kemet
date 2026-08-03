import React from 'react';
import { EmailLayout } from '../components/EmailLayout.jsx';
import { Header } from '../components/Header.jsx';
import { Footer } from '../components/Footer.jsx';
import { EmailHeading, EmailSubheading, EmailNotice } from '../components/Typography.jsx';
import { OtpBox } from '../components/OtpBox.jsx';

export const OtpVerificationEmail = ({ otpCode = '00000000' }) => {
  return (
    <EmailLayout previewText="رمز تأكيد البريد الإلكتروني - KEMET">
      <Header />
      <EmailHeading>تأكيد البريد الإلكتروني</EmailHeading>
      <EmailSubheading>استخدم رمز التحقق التالي لإتمام تفعيل حسابك:</EmailSubheading>
      
      <OtpBox otpCode={otpCode} />
      
      <EmailNotice bold={true}>صلاحية الرمز 15 دقيقة</EmailNotice>
      <EmailNotice>إذا لم تطلب إنشاء هذا الحساب، يمكنك تجاهل هذه الرسالة بأمان.</EmailNotice>
      
      <Footer />
    </EmailLayout>
  );
};

export default OtpVerificationEmail;
