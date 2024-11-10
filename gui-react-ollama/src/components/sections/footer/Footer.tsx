import React from 'react'
import PropTypes from 'prop-types'
import './Footer.css';

const Footer = (props: any) => {
  return (
    <div className='Footer'>
      <footer className="bg-gray-800 text-black py-4">
        <div className="container mx-auto text-center">
          <p>&copy; {new Date().getFullYear()} Your Company Name. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

Footer.propTypes = {}

export default Footer