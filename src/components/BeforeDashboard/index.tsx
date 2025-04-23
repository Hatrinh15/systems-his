import { Banner } from '@payloadcms/ui/elements/Banner'
import React from 'react'

import { SeedButton } from './SeedButton'
import './index.scss'

const baseClass = 'before-dashboard'

const BeforeDashboard: React.FC = () => {
  return (
    <div className={baseClass}>
      <Banner className={`${baseClass}__banner`} type="success">
        <h1>Chào mừng bạn đến với hệ thống!</h1>
      </Banner>
      <ul className={`${baseClass}__instructions`}>
        <li>
          <SeedButton />
          {' Muốn quay trở lại trang chính,'}
          <a href="/" target="_blank">
            🏠nhấn vào đây!!!
          </a>
        </li>
      </ul>
    </div>
  )
}

export default BeforeDashboard
