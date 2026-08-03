import React from 'react';
import { Html, Head, Body, Container, Section, Text, Link, Preview, Img } from '@react-email/components';

/**
 * KEMET Bulletproof Image-Based OTP Template for Password Recovery
 * Uses Reference Design (Reference.png) as the exact visual canvas image (600px width).
 * Positions the dynamic 8-Digit OTP text in the exact gold box location.
 * Impossible for Gmail, Apple Mail, or Outlook to invert colors or modify layout.
 */
export const PasswordResetEmail = ({ otpCode = '00000000' }) => {
  const formattedOtp = String(otpCode || '00000000').trim().padStart(8, '0');

  return (
    <Html lang="ar" dir="rtl">
      <Head>
        <meta name="color-scheme" content="only dark" />
        <meta name="supported-color-schemes" content="only dark" />
        <style dangerouslySetInnerHTML={{
          __html: `
            :root {
              color-scheme: only dark !important;
              supported-color-schemes: only dark !important;
            }
            body, table, td, div {
              background-color: #000000 !important;
              color: #FFFFFF !important;
            }
          `
        }} />
      </Head>
      <Preview>استعادة كلمة المرور - KEMET</Preview>
      <Body style={{ backgroundColor: '#000000', margin: '0 auto', padding: '20px 0', width: '100%' }} bgcolor="#000000">
        <table border="0" cellPadding="0" cellSpacing="0" width="100%" bgcolor="#000000" style={{ backgroundColor: '#000000', margin: '0 auto', width: '100%', tableLayout: 'fixed' }}>
          <tr>
            <td align="center" bgcolor="#000000" style={{ backgroundColor: '#000000', padding: '10px' }}>
              <Container style={{ margin: '0 auto', maxWidth: '600px', width: '100%' }}>
                
                {/* 600px Canvas Table with Reference Image */}
                <table border="0" cellPadding="0" cellSpacing="0" width="600" bgcolor="#000000" style={{ width: '600px', maxWidth: '600px', backgroundColor: '#000000', borderCollapse: 'collapse', margin: '0 auto' }}>
                  
                  {/* Top Canvas Image (Logo + Title + Top Frame) */}
                  <tr>
                    <td align="center" bgcolor="#000000" style={{ padding: 0, margin: 0, backgroundColor: '#000000' }}>
                      <Img
                        src="https://kemetmisr.com/assets/kemet-email-reference.png"
                        alt="KEMET Email Design"
                        width="600"
                        style={{ display: 'block', width: '100%', maxWidth: '600px', height: 'auto', border: 0 }}
                      />
                    </td>
                  </tr>

                  {/* Dynamic OTP Text Container Row */}
                  <tr>
                    <td align="center" bgcolor="#0A0E17" style={{ backgroundColor: '#0A0E17', padding: '15px 20px', borderLeft: '3px solid #D4AF37', borderRight: '3px solid #D4AF37' }}>
                      <Text style={{
                        color: '#FFDF73',
                        direction: 'ltr',
                        fontFamily: "'Courier New', Consolas, Monaco, monospace",
                        fontSize: '38px',
                        fontWeight: 900,
                        letterSpacing: '10px',
                        margin: 0,
                        textAlign: 'center',
                        userSelect: 'all'
                      }}>
                        {formattedOtp}
                      </Text>
                    </td>
                  </tr>

                  {/* Bottom Footer Info Row */}
                  <tr>
                    <td align="center" bgcolor="#000000" style={{ backgroundColor: '#000000', padding: '18px 20px 24px 20px', borderLeft: '3px solid #D4AF37', borderRight: '3px solid #D4AF37', borderBottom: '3px solid #D4AF37' }}>
                      <Text style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: 800, margin: '0 0 6px 0', textAlign: 'center', fontFamily: "Arial, sans-serif" }}>
                        صلاحية الرمز 15 دقيقة
                      </Text>
                      <Text style={{ color: '#94A3B8', fontSize: '12px', margin: '0 0 16px 0', textAlign: 'center', fontFamily: "Arial, sans-serif" }}>
                        إذا لم تطلب إعادة ضبط كلمة المرور، يمكنك تجاهل هذه الرسالة بأمان
                      </Text>
                      <Text style={{ color: '#FFFFFF', fontSize: '13px', fontWeight: 600, margin: 0, textAlign: 'center', fontFamily: "Arial, sans-serif" }}>
                        Copyright &copy; 2026 <Link href="https://kemetmisr.com" target="_blank" style={{ color: '#FFFFFF', fontWeight: 'bold', textDecoration: 'none' }}>kemetmisr.com</Link>
                      </Text>
                    </td>
                  </tr>

                </table>

              </Container>
            </td>
          </tr>
        </table>
      </Body>
    </Html>
  );
};

export default PasswordResetEmail;
