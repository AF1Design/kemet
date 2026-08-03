import React from 'react';
import { Html, Head, Body, Container, Section, Preview } from '@react-email/components';
import { emailTheme } from '../styles/theme.js';

export const EmailLayout = ({ previewText = 'KEMET Notification', children }) => {
  return (
    <Html lang="ar" dir="rtl">
      <Head>
        <meta name="color-scheme" content="only dark" />
        <meta name="supported-color-schemes" content="only dark" />
      </Head>
      <Preview>{previewText}</Preview>
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          <Section style={cardStyle}>
            {children}
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const mainStyle = {
  backgroundColor: emailTheme.colors.bgMain,
  fontFamily: emailTheme.fonts.fontFamily,
  margin: '0 auto',
  padding: '20px 0',
  width: '100%',
};

const containerStyle = {
  margin: '0 auto',
  maxWidth: emailTheme.dimensions.maxWidth,
  width: '100%',
};

const cardStyle = {
  backgroundColor: emailTheme.colors.bgCard,
  border: `3px solid ${emailTheme.colors.borderGold}`,
  boxSizing: 'border-box',
  padding: '24px 28px',
  width: '100%',
};
