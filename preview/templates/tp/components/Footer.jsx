// React Libraries
import React from 'react';
import PropTypes from 'prop-types';

import styled from 'styled-components';
const Wrapper = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
`;

const Column = styled.div`
  display: flex;
  flex-direction: column;
  flex: auto;
  ${props =>
    props.left &&
    `
    align-items: flex-start;
  `} ${props =>
      props.right &&
      `
    align-items: flex-end;
  `};
`;

// Component
const Footer = function({ t, invoice, profile, configs }) {
  const currentLanguage = configs.language;
  const { tax, recipient } = invoice;
  return (
    <Wrapper>
      <Column left>
        <p>{profile.fullname}</p>
        <p>{profile.address}</p>
        <p>{profile.email}</p>
        <p>{profile.phone}</p>
      </Column>
      <Column right>
        { tax && <p>Tax ID: { tax.tin }</p> }
        { configs.payment && configs.payment.details &&  configs.payment.details.split('\n').map((item, i) => <p key={i}>{item}</p>) }
      </Column>
    </Wrapper>
  );
}

Footer.propTypes = {
  configs: PropTypes.object.isRequired,
  invoice: PropTypes.object.isRequired,
  profile: PropTypes.object.isRequired,
  t: PropTypes.func.isRequired,
};

export default Footer;
