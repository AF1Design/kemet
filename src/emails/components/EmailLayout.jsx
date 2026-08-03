import React from 'react';
import { Html, Head, Body, Container, Section, Preview } from '@react-email/components';
import { emailTheme } from '../styles/theme.js';

export const EmailLayout = ({ previewText = 'KEMET Notification', children }) => {
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
            .email-outer-table {
              background-color: #000000 !important;
              width: 100% !important;
            }
            .email-card-section {
              background-color: #05070C !important;
              background-image: url('https://kemetmisr.com/assets/kemet-email-back.png') !important;
              background-repeat: no-repeat !important;
              background-position: center center !important;
              background-size: cover !important;
            }
          `
        }} />
      </Head>
      <Preview>{previewText}</Preview>
      <Body style={mainStyle} bgcolor="#000000">
        <table border="0" cellPadding="0" cellSpacing="0" width="100%" bgcolor="#000000" style={outerTableStyle}>
          <tr>
            <td align="center" bgcolor="#000000" style={outerTdStyle}>
              <Container style={containerStyle}>
                <Section style={cardStyle} className="email-card-section">
                  {children}
                </Section>
              </Container>
            </td>
          </tr>
        </table>
      </Body>
    </Html>
  );
};

const mainStyle = {
  backgroundColor: '#000000',
  fontFamily: emailTheme.fonts.fontFamily,
  margin: '0 auto',
  padding: '0',
  width: '100%',
};

const outerTableStyle = {
  backgroundColor: '#000000',
  margin: '0 auto',
  padding: '20px 0',
  tableLayout: 'fixed',
  width: '100%',
};

const outerTdStyle = {
  backgroundColor: '#000000',
  padding: '10px',
};

const containerStyle = {
  margin: '0 auto',
  maxWidth: emailTheme.dimensions.maxWidth,
  width: '100%',
};

const cardStyle = {
  backgroundColor: '#05070C',
  backgroundImage: "url('https://kemetmisr.com/assets/kemet-email-back.png')",
  backgroundPosition: 'center center',
  backgroundRepeat: 'no-repeat',
  backgroundSize: 'cover',
  border: `3px solid ${emailTheme.colors.borderGold}`,
  boxSizing: 'border-box',
  padding: '24px 28px',
  width: '100%',
};
