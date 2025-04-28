import type { CollectionConfig } from 'payload'

export const FormsOverride: Partial<CollectionConfig> = {
  slug: 'forms',
  admin: {
    hidden: ({ user }) => user?.role !== 'admin',
  },
}
