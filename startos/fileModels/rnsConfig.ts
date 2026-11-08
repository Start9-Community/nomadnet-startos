import { FileHelper } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

// Reticulum's config, with nested [[interface]] sections. Seeded at install and
// owned afterwards by Nomad Network's Interfaces page, so the package only ever
// writes it whole (install, or the reset action).
export const rnsConfig = FileHelper.string({
  base: sdk.volumes.main,
  subpath: './.reticulum/config',
})
