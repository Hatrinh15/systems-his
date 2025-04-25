// src/app/home/page.tsx

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Banner */}
      <section className="relative h-[70vh] bg-blue-100 flex items-center justify-center text-center">
        <Image
          src="/public/download.jpg"
          alt="Bệnh viện Tai Mũi Họng"
          layout="fill"
          objectFit="cover"
          className="opacity-50"
        />
        <div className="relative z-10">
          <h1 className="text-4xl md:text-6xl font-bold text-blue-900 mb-4">
            Chăm sóc sức khỏe toàn diện
          </h1>
          <p className="text-xl md:text-2xl text-blue-800 mb-8">Bệnh viện Tai-Mũi-Họng Thái Bình</p>
          <Link href="/dat-lich">
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
              Đặt lịch khám
            </button>
          </Link>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-blue-900 mb-12">Dịch vụ nổi bật</h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[
              { title: 'Khám Tai Mũi Họng', icon: '🩺' },
              { title: 'Nội soi Tai Mũi Họng', icon: '🔬' },
              { title: 'Phẫu thuật nội soi', icon: '🏥' },
              { title: 'Tư vấn sức khỏe', icon: '💬' },
            ].map((service, index) => (
              <div
                key={index}
                className="flex flex-col items-center p-6 bg-blue-50 rounded-xl shadow hover:shadow-lg transition"
              >
                <div className="text-5xl mb-4">{service.icon}</div>
                <h3 className="text-xl font-semibold text-blue-800 text-center">{service.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* News Section */}
      <section className="py-16 bg-blue-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-blue-900 mb-12">Tin tức mới nhất</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
                <h3 className="text-2xl font-semibold text-blue-800 mb-4">Tin bài số {item}</h3>
                <p className="text-gray-600 mb-4">
                  Nội dung ngắn gọn về tin tức nổi bật, thông báo sự kiện hoặc chương trình mới.
                </p>
                <Link href="/tin-tuc">
                  <span className="text-blue-600 font-semibold hover:underline">Xem thêm</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-blue-900 text-white py-8">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h3 className="text-xl font-bold">Hospital Thai Binh</h3>
            <p>© 2025 All rights reserved.</p>
          </div>
          <div className="flex gap-6">
            <Link href="https://facebook.com" target="_blank">
              Facebook
            </Link>
            <Link href="https://zalo.me" target="_blank">
              Zalo
            </Link>
            <Link href="/lien-he">Liên hệ</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
