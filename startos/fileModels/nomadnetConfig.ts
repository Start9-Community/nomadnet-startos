import { FileHelper } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

// Nomad Network's own config. Seeded from upstream's defaults at install; the
// node-settings action edits single keys with the helpers in utils.ts, and the
// user may edit the rest from the text UI's Config page. Handled as raw text so
// comments and unmodelled keys survive every write.
export const nomadnetConfig = FileHelper.string({
  base: sdk.volumes.main,
  subpath: './.nomadnetwork/config',
})
