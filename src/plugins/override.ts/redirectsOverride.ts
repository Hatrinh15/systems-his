import type { CollectionConfig } from 'payload'
export const RedirectsOverride: Partial<CollectionConfig> = {
    slug: 'redirects',
    admin: {
      hidden: ({ user }) => user?.role !== 'admin',
    },
  }