import type { CollectionConfig } from 'payload'

import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'
import { slugField } from '@/fields/slug'
import { isAdmin } from '@/hooks/AccessAdmin'
import { authenticatedOrPublished } from '@/access/authenticatedOrPublished'

export const Categories: CollectionConfig = {
  slug: 'categories',
  access: {
       create: isAdmin,
       delete: isAdmin,
       read: authenticatedOrPublished,
       update:  isAdmin,
     },
  admin: {
    hidden: ({ user }) => user?.taikhoan !== 'admin',
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    ...slugField(),
  ],
}
