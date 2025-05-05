import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'
import RichText from '@/components/RichText'
import Image from 'next/image'
import Link from 'next/link'

type Props = {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const payload = await getPayload({ config: configPromise })
  const posts = await payload.find({
    collection: 'posts',
    where: {
      slug: {
        equals: params.slug,
      },
    },
    limit: 1,
  })

  const post = posts.docs[0]

  if (!post) return { title: 'Bài viết không tồn tại' }

  return {
    title: post.title || 'Chi tiết bài viết',
    description: post.meta?.description,
  }
}

export default async function PostPage({ params }: Props) {
  const payload = await getPayload({ config: configPromise })

  const posts = await payload.find({
    collection: 'posts',
    where: {
      slug: {
        equals: params.slug,
      },
    },
    limit: 1,
  })

  const post = posts.docs[0]

  if (!post) return notFound()

  return (
    //custom hình ảnh hiện lên trên màn detail sau header
    <div className="pb-24">
      {typeof post.heroImage === 'object' && post.heroImage?.url && (
        <div className="relative w-full h-[500px]">
          <Image src={post.heroImage.url} alt={post.title} fill className="object-cover" />
          <div className="absolute inset-0 bg-black/50 flex flex-col justify-end p-8 text-white">
            <h1 className="text-4xl font-bold mb-2">{post.title}</h1>
            {post.publishedAt && (
              <p className="text-sm text-white/70">
                Ngày đăng: {new Date(post.publishedAt).toLocaleDateString('vi-VN')}
              </p>
            )}
          </div>
        </div>
      )}
      {/* ✅ Breadcrumb, custom nút ấn cho một màn detail về tin tức */}
      <div className="max-w-6xl mx-auto px-4 mt-4 text-[25px] font-bold  text-gray-500">
        <Link href="/" className="text-blue-600 hover:underline">
          Trang chủ
        </Link>{' '}
        &nbsp;&rsaquo;&nbsp;{' '}
        <Link href="/posts" className="text-blue-600 hover:underline font-bold">
          Tin tức
        </Link>{' '}
      </div>
      <div className="prose dark:prose-invert max-w-3xl mx-auto mt-12 px-4">
        {post.content && <RichText data={post.content} />}
      </div>
    </div>
  )
}
