// React Libraries
import React from 'react';
import PropTypes from 'prop-types';

// Styles
import styled from 'styled-components';
const InvoiceLogo = styled.div`
  flex: 1;
  max-height: 6em;
  img {
    width: auto;
    max-height: 4em;
  }
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  margin-bottom: 2em;
`;

const Header = styled.div`
  font-size: 1.63em;
  ${props =>
    props.customAccentColor &&
    `
    color: ${props.accentColor};
  `};
`;

const SubHeader = styled.div`
  font-size: 1.50em;
  font-style: italic;
`;

// Component
const Logo = function({ profile, configs }) {
  const { showLogo, logoSize, accentColor, customAccentColor } = configs;
  return showLogo ? (
    <Wrapper>
      <Header 
        accentColor={accentColor}
        customAccentColor={customAccentColor}>{profile.company}</Header>
      <SubHeader>{profile.fullname}</SubHeader>
    </Wrapper>
  ) : null;
}

Logo.propTypes = {
  configs: PropTypes.object.isRequired,
  profile: PropTypes.object.isRequired,
};


export default Logo;
