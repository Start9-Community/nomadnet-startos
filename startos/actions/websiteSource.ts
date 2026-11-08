import { nomadnetConfig } from '../fileModels/nomadnetConfig'
import { Site, storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import {
  canMountNextexplorer,
  deleteIniKeys,
  normalizeFolder,
  setIniValues,
  siteMountpoints,
} from '../utils'

const { InputSpec, Value, Variants } = sdk

// Start9 Pages' folder pattern: relative path segments, no "." or ".." segment.
const pathPattern = {
  regex:
    '^/?([a-zA-Z0-9_ -][a-zA-Z0-9_ .-]*|([a-zA-Z0-9_ .-][a-zA-Z0-9_ -]+\\.*)+)(/[a-zA-Z0-9_ -][a-zA-Z0-9_ .-]*|/([a-zA-Z0-9_ .-][a-zA-Z0-9_ -]+\\.*)+)*/?$',
  description: i18n('Must be a folder path such as Files/nomadnet/pages'),
}

// The [node] keys this action owns while NextExplorer is the source.
const siteKeys = [
  'pages_path',
  'files_path',
  'page_refresh_interval',
  'file_refresh_interval',
]

const inputSpec = InputSpec.of({
  site: Value.union({
    name: i18n('Source'),
    description: i18n(
      "Where your node's pages and files come from.\n- Built-in: folders inside Nomad Network, edited from My Node in the Web Terminal\n- NextExplorer: folders you manage in NextExplorer, served read-only and never copied",
    ),
    default: 'local',
    variants: Variants.of({
      local: {
        name: i18n('Built-in'),
        spec: InputSpec.of({}),
      },
      nextexplorer: {
        name: i18n('NextExplorer'),
        spec: InputSpec.of({
          pagesFolder: Value.text({
            name: i18n('Pages Folder'),
            description: i18n(
              'The NextExplorer folder holding your pages, starting with the location name (usually Files). Put your home page in it as index.mu.',
            ),
            required: true,
            minLength: 1,
            default: 'Files/nomadnet/pages',
            placeholder: 'Files/nomadnet/pages',
            patterns: [pathPattern],
          }),
          filesFolder: Value.text({
            name: i18n('Files Folder'),
            description: i18n(
              'Optional. A NextExplorer folder whose files your node offers for download. Leave empty to keep the built-in files folder.',
            ),
            required: false,
            default: null,
            placeholder: 'Files/nomadnet/files',
            patterns: [pathPattern],
          }),
          refreshMinutes: Value.number({
            name: i18n('Rescan Interval'),
            description: i18n(
              'How often Nomad Network looks for pages and files you added or removed in NextExplorer. Edits to a page that already exists are read fresh on every request.',
            ),
            required: true,
            default: 5,
            min: 1,
            max: 1440,
            step: 1,
            integer: true,
            units: 'minutes',
            placeholder: null,
          }),
        }),
      },
    }),
  }),
})

export const websiteSource = sdk.Action.withInput(
  'website-source',
  {
    name: i18n('Website Source'),
    description: i18n(
      "Serve your node's pages and files from NextExplorer instead of the built-in folders. Changing it restarts Nomad Network if it is running.",
    ),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  },
  inputSpec,

  async ({ effects }) => {
    const site = await storeJson.read((s) => s?.site).once()
    if (site?.selection !== 'nextexplorer') {
      return { site: { selection: 'local' as const, value: {} } }
    }
    const { pagesFolder, filesFolder, refreshMinutes } = site.value
    return {
      site: {
        selection: 'nextexplorer' as const,
        value: { pagesFolder, filesFolder, refreshMinutes },
      },
    }
  },

  async ({ effects, input }) => {
    const config = await nomadnetConfig.read().once()
    if (config === null) {
      throw new Error(
        i18n(
          'Nomad Network has not created its configuration yet. Start the service once, then try again.',
        ),
      )
    }

    let next = deleteIniKeys(config, 'node', siteKeys)
    let site: Site

    if (input.site.selection === 'nextexplorer') {
      const pagesFolder = normalizeFolder(input.site.value.pagesFolder)
      const filesFolder = input.site.value.filesFolder
        ? normalizeFolder(input.site.value.filesFolder) || null
        : null
      const refreshMinutes = input.site.value.refreshMinutes

      if (!pagesFolder) {
        throw new Error(
          i18n('Must be a folder path such as Files/nomadnet/pages'),
        )
      }
      if (!(await canMountNextexplorer(effects, null))) {
        throw new Error(
          i18n('NextExplorer is not installed. Install it, then try again.'),
        )
      }
      for (const folder of [pagesFolder, filesFolder]) {
        if (folder && !(await canMountNextexplorer(effects, folder))) {
          throw new Error(
            i18n(
              'The folder "${folder}" was not found in NextExplorer. Create it there, or check the path.',
              { folder },
            ),
          )
        }
      }

      next = setIniValues(next, 'node', {
        pages_path: siteMountpoints.pages,
        page_refresh_interval: String(refreshMinutes),
        ...(filesFolder
          ? {
              files_path: siteMountpoints.files,
              file_refresh_interval: String(refreshMinutes),
            }
          : {}),
      })
      site = {
        selection: 'nextexplorer',
        value: { pagesFolder, filesFolder, refreshMinutes },
      }
    } else {
      site = { selection: 'local', value: {} }
    }

    // Config first: main watches `site` in store.json, and the restart that
    // write triggers must find the matching config already on disk.
    await nomadnetConfig.write(effects, next)
    const store = await storeJson.read().once()
    // Written whole, not merged, so switching back to Built-in drops the folders.
    await storeJson.write(effects, { ...store, site })
    return null
  },
)
