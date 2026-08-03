import React from 'react';
import { Section, Text } from '@react-email/components';
import { emailTheme } from '../styles/theme.js';

export const OtpBox = ({ otpCode = '00000000' }) => {
  const formattedOtp = String(otpCode || '00000000').trim().padStart(8, '0');

  return (
    <Section style={containerStyle}>
      <Text style={textStyle}>{formattedOtp}</Text>
    </Section>
  );
};

const containerStyle = {
  backgroundColor: emailTheme.colors.bgOtp,
  border: `1.5px solid ${emailTheme.colors.borderGold}`,
  borderRadius: emailTheme.dimensions.borderRadiusOtp,
  margin: '0 auto 22px auto',
  maxWidth: '460px',
  padding: '18px 20px',
  textAlign: 'center',
  width: '100%',
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
