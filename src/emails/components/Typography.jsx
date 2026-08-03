import React from 'react';
import { Text } from '@react-email/components';
import { emailTheme } from '../styles/theme.js';

export const EmailHeading = ({ children }) => (
  <Text style={headingStyle}>{children}</Text>
);

export const EmailSubheading = ({ children }) => (
  <Text style={subheadingStyle}>{children}</Text>
);

export const EmailNotice = ({ children, bold = false }) => (
  <Text style={bold ? noticeBoldStyle : noticeStyle}>{children}</Text>
);

const headingStyle = {
  color: emailTheme.colors.textPrimary,
  fontSize: '28px',
  fontWeight: 900,
  lineHeight: '1.2',
  margin: '0 0 8px 0',
  textAlign: 'center',
};

const subheadingStyle = {
  color: emailTheme.colors.textSecondary,
  fontSize: '15px',
  margin: '0 0 22px 0',
  textAlign: 'center',
};

const noticeBoldStyle = {
  color: emailTheme.colors.textPrimary,
  fontSize: '15px',
  fontWeight: 800,
  margin: '0 0 6px 0',
  textAlign: 'center',
};

const noticeStyle = {
  color: emailTheme.colors.textMuted,
  fontSize: '13px',
  margin: '0 0 10px 0',
  textAlign: 'center',
};
