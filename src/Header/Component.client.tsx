'use client'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import type { Header } from '@/payload-types'

import { Logo } from '@/components/Logo/Logo'
import { HeaderNav } from './Nav'

interface HeaderClientProps {
  data: Header
}

export const HeaderClient: React.FC<HeaderClientProps> = ({ data }) => {
  /* Storing the value in a useState to avoid hydration errors */
  const [theme, setTheme] = useState<string | null>(null)
  const { headerTheme, setHeaderTheme } = useHeaderTheme()
  const pathname = usePathname()

  useEffect(() => {
    setHeaderTheme(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  useEffect(() => {
    if (headerTheme && headerTheme !== theme) setTheme(headerTheme)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headerTheme])

  return (
    <header
      className="relative z-20 top-0 left-0 w-full bg-white z-50"
      {...(theme ? { 'data-theme': theme } : {})}
    >
      {' '}
      <div className="container max-w-screen-xl mx-auto px-4">
        {/* Dòng chữ chính giữa */}
        <div className="absolute inset-0 flex flex-col justify-center items-center pointer-events-none z-0">
          <div className="text-blue-900 font-bold text-[18px] sm:text-[24px] md:text-[28px] lg:text-[32px] text-center hidden sm:block">
            Bệnh viện Tai-Mũi-Họng Thái Bình
          </div>

          {/* Dòng chữ chất lượng đã được khẳng định */}
          <div className="text-blue-400 font-cursive text-[18px] mt-1 text-center">
            Chất lượng đã được khẳng định
          </div>
        </div>

        {/* Flex container cho Logo và Nav */}

        <div className="py-2 sm:py-4 md:py-6 flex justify-between items-center">
          <Link href="/">
            <Logo loading="eager" priority="high" className="h-10 w-auto" />
          </Link>

          {/* Nav (ẩn trên mobile nếu muốn) */}
          <div className="hidden sm:block">
            <HeaderNav data={data} />
          </div>
        </div>
      </div>
    </header>
  )
}
