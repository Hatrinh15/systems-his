// src/app/home/page.tsx

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export default async function HomePage() {
  const payload = await getPayload({ config: configPromise })

  const posts = await payload.find({
    collection: 'posts',
    depth: 1,
    limit: 3,
    sort: '-createdAt',
    overrideAccess: false,
    select: {
      title: true,
      slug: true,
      meta: true,
      heroImage: true,
    },
  })
  return (
    <div className="flex flex-col">
      {/* Hero Banner */}
      <section className="relative h-[70vh] bg-blue-100 flex items-center justify-center text-center">
        <Image
          src="/yta.jpg"
          alt="Bệnh viện Tai Mũi Họng"
          fill
          className="object-cover opacity-50"
        />
        <div className="relative z-10">
          <h1 className="text-4xl md:text-6xl font-bold text-blue-900 mb-4">
            Chăm sóc sức khỏe toàn diện
          </h1>
          <p className="text-xl md:text-2xl text-blue-800 mb-8">
            Y khoa tiên tiến, dịch vụ tận tâm
          </p>
          <Link href="/admin/login">
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
              ĐĂNG NHẬP
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
      {/* News Section */}
      <section className="py-16 bg-blue-50">
        <div className="container mx-auto px-4">
          <Link
            href="/posts"
            className="text-3xl font-bold text-center text-blue-900 mb-12 block hover:underline"
          >
            Tin tức mới nhất
          </Link>

          <div className="grid gap-8 md:grid-cols-3">
            {posts.docs.map((post) => (
              <div
                key={post.slug}
                className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition"
              >
                {/* Hiển thị ảnh nếu có metaImage */}
                {post.heroImage && typeof post.heroImage === 'object' && (
                  <div className="relative w-full h-48 mb-4 rounded-md overflow-hidden">
                    <Image
                      src={post.heroImage.url || '/placeholder-image.jpg'}
                      alt={post.title}
                      fill
                      className="object-cover rounded-md"
                    />
                  </div>
                )}

                <h3 className="text-2xl font-semibold text-blue-800 mb-4">{post.title}</h3>
                <p className="text-gray-600 mb-4">{post.meta?.description || 'Không có mô tả.'}</p>
                <Link href={`/posts/${post.slug}`}>
                  <span className="text-blue-600 font-semibold hover:underline">Xem thêm</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h3 className="text-xl font-bold">Hospital Thai Binh</h3>
            {/* <p>© 2025 All rights reserved.</p> */}
          </div>
          <div className="flex gap-6">
            <Link href="/lien-he">Liên hệ</Link>
            <Link
              href="https://facebook.com"
              target="_blank"
              className="flex items-center gap-2 hover:underline"
            >
              <Image src="/fb.svg" alt="Facebook" width={20} height={20} />
              Facebook
            </Link>
            <Link
              href="https://youtube.com"
              target="_blank"
              className="flex items-center gap-2 hover:underline"
            >
              <Image src="/ytb.svg" alt="Youtube" width={20} height={20} />
              Youtube
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
