import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

const localSite = { selection: 'local' as const, value: {} }

const siteShape = z
  .union([
    z.looseObject({
      selection: z.literal('local'),
      value: z.looseObject({}),
    }),
    z.looseObject({
      selection: z.literal('nextexplorer'),
      value: z.looseObject({
        pagesFolder: z.string(),
        filesFolder: z.string().nullable().catch(null),
        refreshMinutes: z.number().int().min(1).catch(5),
      }),
    }),
  ])
  .catch(localSite)

const shape = z.looseObject({
  // Credential for the reverse-proxy auth gate on the web terminal (interfaces.ts).
  uiPassword: z.string().optional().catch(undefined),
  // Where the node's pages and files come from (actions/websiteSource.ts).
  site: siteShape,
})

export type Site = z.infer<typeof siteShape>

export const storeJson = FileHelper.json(
  { base: sdk.volumes.main, subpath: './store.json' },
  shape,
)
