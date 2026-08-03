import React from 'react';
import { Section, Row, Column, Img, Link } from '@react-email/components';

export const Header = ({ logoUrl = 'https://kemetmisr.com/assets/kemet-text-logo.png' }) => {
  return (
    <Section style={headerSection}>
      <Row>
        <Column align="left">
          <Link href="https://kemetmisr.com" target="_blank">
            <Img
              src={logoUrl}
              alt="KEMET"
              width="115"
              height="auto"
              style={logoStyle}
            />
          </Link>
        </Column>
      </Row>
    </Section>
  );
};

const headerSection = {
  marginBottom: '20px',
  width: '100%',
};

const logoStyle = {
  border: 0,
  display: 'block',
  height: 'auto',
  maxWidth: '115px',
  outline: 'none',
  textDecoration: 'none',
  width: '115px',
};
