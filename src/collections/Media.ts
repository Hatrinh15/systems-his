import { APIError, type CollectionConfig } from 'payload'
import { authenticated } from '../access/authenticated'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const Media: CollectionConfig = {
  slug: 'media',

  access: {
    create: authenticated,
    delete: authenticated,
    read: () => true,
    update: authenticated,
  },

  admin: {
    hidden: ({ user }) => user?.taikhoan !== 'admin',
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
    },
    {
      name: 'caption',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature()]
        },
      }),
    },
    {
      name: 'hash',
      type: 'text',
      admin: {
        hidden: true, // Ẩn trường này trong giao diện admin
      },
    },
  ],
  upload: {
    staticDir: path.resolve(dirname, '../../public/media'),
    adminThumbnail: 'thumbnail',
    focalPoint: true,
    imageSizes: [
      { name: 'thumbnail', width: 300 },
      { name: 'square', width: 500, height: 500 },
      { name: 'small', width: 600 },
      { name: 'medium', width: 900 },
      { name: 'large', width: 1400 },
      { name: 'xlarge', width: 1920 },
      { name: 'og', width: 1200, height: 630, crop: 'center' },
    ],
  },
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        if ((operation === 'create' || operation === 'update') && req?.file?.data) {
          const buffer = req.file.data
          const hash = crypto.createHash('md5').update(buffer).digest('hex')

          const existingMedia = await req.payload.find({
            collection: 'media',
            where: { hash: { equals: hash } },
          })

          if (existingMedia.docs.length > 0) {
            throw new APIError('File đã tồn tại trong hệ thống! Vui lòng chọn một file khác.', 400)
          }

          data.hash = hash
        }

        console.log('✅ Dữ liệu sau khi xử lý hook:', data) // 👈 Log dữ liệu
        return data
      },
    ],
  },
}
