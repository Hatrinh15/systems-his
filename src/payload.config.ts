// storage-adapter-import-placeholder
import { mongooseAdapter } from '@payloadcms/db-mongodb'

import sharp from 'sharp' // sharp-import
import path from 'path'
import { buildConfig, CollectionConfig, PayloadRequest } from 'payload'
import { fileURLToPath } from 'url'

import { Categories } from './collections/Categories'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { Patients } from './collections/Patients'
import MedicalRecods from './collections/MedicalRecods'
import { Appointments } from './collections/Appointments'
import Rooms from './collections/Rooms'
import Departments from './collections/phongban/Departments'
import { Users } from './collections/Users'
import { Medicalorders } from './collections/Users/Medicalorders'
import { Suppliers } from './collections/Suppliers'
import { Footer } from './Footer/config'
import { Header } from './Header/config'
import { plugins } from './plugins'
import { defaultLexical } from '@/fields/defaultLexical'
import { getServerSideURL } from './utilities/getURL'
import { Medications } from './collections/Medications'
import { medicalSupplies } from './collections/Medicalsupplies'
import { Inventory } from './collections/Inventory'
import Class from './collections/phongban/class'
import { medicalUsages } from './collections/MedicalUsages'
import { Orders } from './collections/Orders'
import { PhieuXuat } from './collections/ExportTransactions'
import { baoGia } from './collections/Baogia'

import { Pharmacies } from './collections/Pharmacies'
import { InventoryTransactions } from './collections/InventoryTransactions'
import { vienPhi } from './collections/VienPhi'

import { FormsOverride } from './plugins/override.ts/formOverride'
import { FormSubmissionsOverride } from './plugins/override.ts/formSubmissionsOverride'
import { RedirectsOverride } from './plugins/override.ts/redirectsOverride'
import { SearchResultsOverride } from './plugins/override.ts/searchResultsOverride'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    components: {
      // The `BeforeLogin` component renders a message that you see while logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below and the import `BeforeLogin` statement on line 15.
      beforeLogin: ['@/components/BeforeLogin'],
      // The `BeforeDashboard` component renders the 'welcome' block that you see after logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below and the import `BeforeDashboard` statement on line 15.
      beforeDashboard: ['@/components/BeforeDashboard'],
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    user: Users.slug,
    livePreview: {
      breakpoints: [
        {
          label: 'Mobile',
          name: 'mobile',
          width: 375,
          height: 667,
        },
        {
          label: 'Tablet',
          name: 'tablet',
          width: 768,
          height: 1024,
        },
        {
          label: 'Desktop',
          name: 'desktop',
          width: 1440,
          height: 900,
        },
      ],
    },
  },
  // This config helps us configure global or default features that the other editors can inherit
  editor: defaultLexical,
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || '',
  }),
  collections: [
    Pages,
    Posts,
    Categories,
    Medicalorders,
    Media,
    Users,
    medicalUsages,
    Orders,
    Patients,
    MedicalRecods,
    Suppliers,
    Medications,
    medicalSupplies,
    Inventory,
    InventoryTransactions,
    Pharmacies,
    Appointments,
    Rooms,
    PhieuXuat,
    Departments,
    Class,
    baoGia,
    vienPhi
  ],

  cors: [getServerSideURL()].filter(Boolean),
  globals: [Header, Footer],
  // plugins: [
  //   ...plugins,
  //   // storage-adapter-placeholder
  // ],
  secret: process.env.PAYLOAD_SECRET,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  jobs: {
    access: {
      run: ({ req }: { req: PayloadRequest }): boolean => {
        // Allow logged in users to execute this endpoint (default)
        if (req.user) return true

        // If there is no logged in user, then check
        // for the Vercel Cron secret to be present as an
        // Authorization header:
        const authHeader = req.headers.get('authorization')
        return authHeader === `Bearer ${process.env.CRON_SECRET}`
      },
    },
    tasks: [],
  },
})
