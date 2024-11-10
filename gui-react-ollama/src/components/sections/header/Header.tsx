import React from 'react'
import PropTypes from 'prop-types'
import './Header.css';
import Navbarx from '../../common/navbarx/Navbarx';

const Header = (props:any) => {
  return (
    <div className='Header'>
      <Navbarx />
    </div>

  )
}

Header.propTypes = {}

export default Header