import React from 'react';
import { EmailLayout } from '../components/EmailLayout.jsx';
import { Header } from '../components/Header.jsx';
import { Footer } from '../components/Footer.jsx';
import { EmailHeading, EmailSubheading, EmailNotice } from '../components/Typography.jsx';
import { OtpBox } from '../components/OtpBox.jsx';

export const PasswordResetEmail = ({ otpCode = '00000000' }) => {
  return (
    <EmailLayout previewText="استعادة كلمة المرور - KEMET">
      <Header />
      <EmailHeading>استعادة كلمة المرور</EmailHeading>
      <EmailSubheading>استخدم رمز التحقق التالي لإعادة ضبط كلمة المرور الخاصة بحسابك</EmailSubheading>
      
      <OtpBox otpCode={otpCode} />
      
      <EmailNotice bold={true}>صلاحية الرمز 15 دقيقة</EmailNotice>
      <EmailNotice>إذا لم تطلب إعادة ضبط كلمة المرور، يمكنك تجاهل هذه الرسالة بأمان</EmailNotice>
      
      <Footer />
    </EmailLayout>
  );
};

export default PasswordResetEmail;
