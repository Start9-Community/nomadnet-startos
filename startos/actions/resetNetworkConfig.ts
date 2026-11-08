import { rnsConfig } from '../fileModels/rnsConfig'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { defaultRnsConfig } from '../utils'

export const resetNetworkConfig = sdk.Action.withoutInput(
  'reset-network-config',

  async ({ effects }) => ({
    name: i18n('Reset Network Configuration'),
    description: i18n(
      'Replace the Reticulum configuration with the package default: transport enabled, interface discovery on, and the TCP server on port 4242. Use this if an interface change stops Nomad Network from starting.',
    ),
    warning: i18n(
      'Every interface you added is removed and Nomad Network restarts. Your identity, messages, pages, and files are untouched.',
    ),
    // A broken interface definition can stop Nomad Network from starting, and the
    // text UI's Interfaces page goes down with it, exactly when this is needed.
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  async ({ effects }) => {
    await rnsConfig.write(effects, defaultRnsConfig)
    await sdk.restart(effects)
    return {
      version: '1',
      title: i18n('Network Configuration Reset'),
      message: i18n(
        'The default Reticulum configuration is back in place. Add your peers again from the Interfaces page in the web terminal.',
      ),
      result: null,
    }
  },
)
