import type { CollectionConfig } from 'payload'
export const SearchResultsOverride: Partial<CollectionConfig> = {
    slug: 'search-results',
    admin: {
      hidden: ({ user }) => user?.role !== 'admin',
    },
  }
  