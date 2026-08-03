import React from 'react';
import { Html, Head, Body, Container, Preview } from '@react-email/components';
import { emailTheme } from '../styles/theme.js';

export const EmailLayout = ({ previewText = 'KEMET Notification', children }) => {
  return (
    <Html lang="ar" dir="rtl">
      <Head>
        <style dangerouslySetInnerHTML={{
          __html: `
            body, table, td, p, a, span {
              font-family: ${emailTheme.fonts.fontFamily} !important;
            }
          `
        }} />
      </Head>
      <Preview>{previewText}</Preview>
      <Body style={mainStyle} bgcolor="#FFFFFF">
        <table border="0" cellPadding="0" cellSpacing="0" width="100%" bgcolor="#FFFFFF" style={outerTableStyle}>
          <tr>
            <td align="center" bgcolor="#FFFFFF" style={outerTdStyle}>
              <Container style={containerStyle}>
                <table border="0" cellPadding="0" cellSpacing="0" width="100%" bgcolor="#FFFFFF" style={cardStyle}>
                  <tr>
                    <td align="right" bgcolor="#FFFFFF" style={cardTdStyle}>
                      {children}
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

const mainStyle = {
  backgroundColor: '#FFFFFF',
  fontFamily: emailTheme.fonts.fontFamily,
  margin: '0 auto',
  padding: '0',
  width: '100%',
};

const outerTableStyle = {
  backgroundColor: '#FFFFFF',
  margin: '0 auto',
  padding: '24px 0',
  tableLayout: 'fixed',
  width: '100%',
};

const outerTdStyle = {
  backgroundColor: '#FFFFFF',
  padding: '12px',
};

const containerStyle = {
  margin: '0 auto',
  maxWidth: emailTheme.dimensions.maxWidth,
  width: '100%',
};

const cardStyle = {
  backgroundColor: '#FFFFFF',
  width: '100%',
};

const cardTdStyle = {
  backgroundColor: '#FFFFFF',
  padding: '0 12px',
  textAlign: 'right',
  width: '100%',
};
