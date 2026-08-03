import React from 'react';
import { Text } from '@react-email/components';
import { emailTheme } from '../styles/theme.js';

export const OtpBox = ({ otpCode = '00000000' }) => {
  const formattedOtp = String(otpCode || '00000000').trim().padStart(8, '0');

  return (
    <table border="0" cellPadding="0" cellSpacing="0" width="100%" bgcolor="#0A0E17" style={containerStyle} className="otp-box-card">
      <tr>
        <td align="center" valign="middle" bgcolor="#0A0E17" style={tdStyle}>
          <Text style={textStyle} className="otp-text-color">{formattedOtp}</Text>
        </td>
      </tr>
    </table>
  );
};

const containerStyle = {
  backgroundColor: '#0A0E17',
  border: `1.5px solid ${emailTheme.colors.borderGold}`,
  borderRadius: emailTheme.dimensions.borderRadiusOtp,
  margin: '0 auto 22px auto',
  maxWidth: '460px',
  width: '100%',
};

const tdStyle = {
  backgroundColor: '#0A0E17',
  borderRadius: emailTheme.dimensions.borderRadiusOtp,
  padding: '18px 20px',
  textAlign: 'center',
};

const textStyle = {
  color: emailTheme.colors.textGold,
  direction: 'ltr',
  fontFamily: emailTheme.fonts.monospaceFont,
  fontSize: '42px',
  fontWeight: 900,
  letterSpacing: '12px',
  margin: 0,
  textAlign: 'center',
  userSelect: 'all',
};
