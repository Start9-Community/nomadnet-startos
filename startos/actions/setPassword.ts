import { utils } from '@start9labs/start-sdk'
import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { uiUsername } from '../utils'

export const setPassword = sdk.Action.withoutInput(
  'set-password',

  async ({ effects }) => {
    const alreadySet = !!(await storeJson
      .read((s) => s?.uiPassword)
      .const(effects))
    return {
      name: alreadySet
        ? i18n('Reset Web Terminal Password')
        : i18n('Set Web Terminal Password'),
      description: i18n(
        'Generate the password for the Nomad Network web terminal. The username is always "admin". Running this again replaces the existing password.',
      ),
      warning: alreadySet
        ? i18n('The current password stops working as soon as this runs.')
        : null,
      allowedStatuses: 'any',
      group: null,
      visibility: 'enabled',
    }
  },

  async ({ effects }) => {
    const password = utils.getDefaultString({ charset: 'a-z,A-Z,0-9', len: 32 })
    await storeJson.merge(effects, { uiPassword: password })

    return {
      version: '1',
      title: i18n('Web Terminal Password Set'),
      message: i18n(
        'Your browser asks for these the next time you open the Web Terminal. Save the password now. It is not shown again.',
      ),
      result: {
        type: 'group',
        value: [
          {
            type: 'single',
            name: i18n('Username'),
            description: null,
            value: uiUsername,
            masked: false,
            copyable: true,
            qr: false,
            launchable: false,
          },
          {
            type: 'single',
            name: i18n('Password'),
            description: null,
            value: password,
            masked: true,
            copyable: true,
            qr: false,
            launchable: false,
          },
        ],
      },
    }
  },
)
