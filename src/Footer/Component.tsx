import { getCachedGlobal } from '@/utilities/getGlobals'
import Link from 'next/link'
import React from 'react'

import type { Footer } from '@/payload-types'

import { ThemeSelector } from '@/providers/Theme/ThemeSelector'
import { CMSLink } from '@/components/Link'
import { Logo } from '@/components/Logo/Logo'

export async function Footer() {
  const footerData: Footer = await getCachedGlobal('footer', 1)()

  const navItems = footerData?.navItems || []

  return (
    <footer className="mt-auto border-t border-border bg-blue-100 dark:bg-card text-black">
      <div className="container py-8 gap-8 flex flex-col md:flex-row md:justify-between">
        <Link className="flex items-center" href="/">
          <Logo />
        </Link>
        <div>
          <p>
            <strong>Bệnh viện ABC</strong>
          </p>
          <p>Địa chỉ: 123 Đường Sức Khỏe, Quận 1, TP.HCM</p>
          <p>Điện thoại: (028) 1234 5678</p>
          <p>Email: lienhe@benhvienabc.vn</p>
        </div>
      </div>

      {/* <div className="flex flex-col-reverse items-start md:flex-row gap-4 md:items-center">
        <ThemeSelector />
        <nav className="flex flex-col md:flex-row gap-4">
          {navItems.map(({ link }, i) => {
            return <CMSLink className="text-white" key={i} {...link} />
          })}
        </nav>
      </div> */}
    </footer>
  )
}
