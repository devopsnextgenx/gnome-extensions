import React from 'react'
import PropTypes from 'prop-types'
import './Body.css';
import { Outlet } from "react-router-dom";

const Body = (props:any) => {
  return (
    <div className='Body'>
        <div className='section'>
          <Outlet />
        </div>
    </div>
  )
}

Body.propTypes = {}

export default Body