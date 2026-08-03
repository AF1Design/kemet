import React from 'react';
import { Text } from '@react-email/components';
import { emailTheme } from '../styles/theme.js';

export const OtpBox = ({ otpCode = '00000000' }) => {
  const formattedOtp = String(otpCode || '00000000').trim().padStart(8, '0');

  return (
    <table border="0" cellPadding="0" cellSpacing="0" width="100%" bgcolor="#F8FAFC" style={containerStyle}>
      <tr>
        <td align="center" valign="middle" bgcolor="#F8FAFC" style={tdStyle}>
          <Text style={textStyle}>{formattedOtp}</Text>
        </td>
      </tr>
    </table>
  );
};

const containerStyle = {
  backgroundColor: '#F8FAFC',
  border: `1px solid ${emailTheme.colors.borderOtp}`,
  borderRadius: emailTheme.dimensions.borderRadiusOtp,
  margin: '0 0 24px 0',
  width: '100%',
};

const tdStyle = {
  backgroundColor: '#F8FAFC',
  borderRadius: emailTheme.dimensions.borderRadiusOtp,
  padding: '16px 20px',
  textAlign: 'center',
};

const textStyle = {
  color: emailTheme.colors.textPrimary,
  direction: 'ltr',
  fontFamily: emailTheme.fonts.monospaceFont,
  fontSize: '36px',
  fontWeight: 800,
  letterSpacing: '8px',
  margin: 0,
  textAlign: 'center',
  userSelect: 'all',
};
