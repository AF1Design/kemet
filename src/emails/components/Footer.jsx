import React from 'react';
import { Section, Text, Link, Hr } from '@react-email/components';
import { emailTheme } from '../styles/theme.js';

export const Footer = () => {
  return (
    <Section style={footerSection}>
      <Hr style={hrStyle} />
      <Text style={footerText}>
        Copyright &copy; 2026{' '}
        <Link href="https://kemetmisr.com" target="_blank" style={linkStyle}>
          kemetmisr.com
        </Link>
      </Text>
    </Section>
  );
};

const footerSection = {
  marginTop: '25px',
  textAlign: 'center',
  width: '100%',
};

const hrStyle = {
  borderColor: 'rgba(212, 175, 55, 0.25)',
  margin: '0 0 16px 0',
};

const footerText = {
  color: emailTheme.colors.textPrimary,
  fontSize: '13px',
  fontWeight: 600,
  margin: 0,
};

const linkStyle = {
  color: emailTheme.colors.textPrimary,
  fontWeight: 'bold',
  textDecoration: 'none',
};
