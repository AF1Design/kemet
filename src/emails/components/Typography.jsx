import React from 'react';
import { Heading, Text } from '@react-email/components';
import { emailTheme } from '../styles/theme.js';

export const EmailHeading = ({ children }) => (
  <Heading as="h1" style={headingStyle}>
    {children}
  </Heading>
);

export const EmailSubheading = ({ children }) => (
  <Text style={subheadingStyle}>
    {children}
  </Text>
);

export const EmailNotice = ({ bold = false, children }) => (
  <Text style={{ ...noticeStyle, fontWeight: bold ? '700' : '400' }}>
    {children}
  </Text>
);

const headingStyle = {
  color: emailTheme.colors.textPrimary,
  fontFamily: emailTheme.fonts.fontFamily,
  fontSize: '22px',
  fontWeight: '700',
  lineHeight: '30px',
  margin: '0 0 8px 0',
  textAlign: 'right',
};

const subheadingStyle = {
  color: emailTheme.colors.textSecondary,
  fontFamily: emailTheme.fonts.fontFamily,
  fontSize: '15px',
  lineHeight: '22px',
  margin: '0 0 24px 0',
  textAlign: 'right',
};

const noticeStyle = {
  color: emailTheme.colors.textSecondary,
  fontFamily: emailTheme.fonts.fontFamily,
  fontSize: '13px',
  lineHeight: '20px',
  margin: '0 0 6px 0',
  textAlign: 'right',
};
