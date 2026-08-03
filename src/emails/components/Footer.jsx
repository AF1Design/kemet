import React from 'react';
import { Text, Link } from '@react-email/components';
import { emailTheme } from '../styles/theme.js';

export const Footer = () => {
  return (
    <table border="0" cellPadding="0" cellSpacing="0" width="100%" style={tableStyle}>
      <tr>
        <td style={tdStyle}>
          <div style={dividerStyle} />
          <Text style={copyrightStyle}>
            &copy; {new Date().getFullYear()} KEMET. جميع الحقوق محفوظة.{' '}
            <Link href="https://kemetmisr.com" target="_blank" style={linkStyle}>
              kemetmisr.com
            </Link>
          </Text>
        </td>
      </tr>
    </table>
  );
};

const tableStyle = {
  marginTop: '32px',
  width: '100%',
};

const tdStyle = {
  padding: '0',
};

const dividerStyle = {
  borderTop: '1px solid #E2E8F0',
  marginBottom: '20px',
  width: '100%',
};

const copyrightStyle = {
  color: emailTheme.colors.textMuted,
  fontFamily: emailTheme.fonts.fontFamily,
  fontSize: '12px',
  lineHeight: '18px',
  margin: 0,
  textAlign: 'center',
};

const linkStyle = {
  color: '#2563EB',
  fontWeight: 'bold',
  textDecoration: 'none',
};
