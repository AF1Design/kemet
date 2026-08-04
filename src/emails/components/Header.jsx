import React from 'react';
import { Img } from '@react-email/components';

export const Header = () => {
  return (
    <table border="0" cellPadding="0" cellSpacing="0" width="100%" dir="ltr" style={tableStyle}>
      <tr>
        <td align="left" style={tdStyle}>
          <Img
            src="https://kemetmisr.com/assets/kemet-text-logo.png"
            alt="KEMET"
            width="130"
            style={imageStyle}
          />
        </td>
      </tr>
    </table>
  );
};

const tableStyle = {
  marginBottom: '28px',
  width: '100%',
};

const tdStyle = {
  padding: '0',
  textAlign: 'left',
};

const imageStyle = {
  border: 0,
  display: 'block',
  height: 'auto',
  maxWidth: '140px',
  width: '100%',
};
