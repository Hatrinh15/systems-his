import type { CollectionConfig } from 'payload'
export const FormSubmissionsOverride: Partial<CollectionConfig> = {
    slug: 'form-submissions',
    admin: {
      hidden: ({ user }) => user?.role !== 'admin',
    },
  }