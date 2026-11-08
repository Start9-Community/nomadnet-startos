import { T } from '@start9labs/start-sdk'
import { nomadnetConfig } from '../fileModels/nomadnetConfig'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { getIniValue } from '../utils'

// Addresses are hashes of the primary identity, so they are derived from the
// identity file rather than scraped from the log: this works while stopped.
// Destination names match NomadNetworkApp/Node (lxmf.delivery,
// lxmf.propagation, nomadnetwork.node); the display name lives in the msgpack
// peersettings file (with the .bak NomadNet falls back to).
const readIdentity = [
  'import json, os, RNS',
  'import RNS.vendor.umsgpack as msgpack',
  'base = "/data/.nomadnetwork/storage/"',
  'if not os.path.isfile(base + "identity"):',
  '    print("null"); raise SystemExit',
  'identity = RNS.Identity.from_file(base + "identity")',
  'name = None',
  'for path in (base + "peersettings", base + "peersettings.bak"):',
  '    try:',
  '        with open(path, "rb") as f: name = msgpack.unpackb(f.read()).get("display_name")',
  '        break',
  '    except Exception: pass',
  'h = lambda app, *aspects: RNS.Destination.hash(identity, app, *aspects).hex()',
  'print(json.dumps({"displayName": name, "lxmf": h("lxmf", "delivery"),',
  '    "propagation": h("lxmf", "propagation"), "node": h("nomadnetwork", "node")}))',
].join('\n')

type IdentityInfo = {
  displayName: string | null
  lxmf: string
  propagation: string
  node: string
}

// ConfigObj's as_bool truthy spellings.
const isTrue = (value: string | null) =>
  value !== null && /^(yes|true|on|1)$/i.test(value)

const single = (
  name: string,
  description: string,
  value: string,
): T.ActionResultMember => ({
  type: 'single',
  name,
  description,
  value,
  masked: false,
  copyable: true,
  qr: false,
  launchable: false,
})

export const nodeInfo = sdk.Action.withoutInput(
  'node-info',

  async () => ({
    name: i18n('Node Information'),
    description: i18n(
      "Show your LXMF address, your display name, and your node's name and address, ready to copy.",
    ),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  async ({ effects }) => {
    const info: IdentityInfo | null = await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'nomadnet' },
      sdk.Mounts.of().mountVolume({
        volumeId: 'main',
        subpath: null,
        mountpoint: '/data',
        readonly: true,
      }),
      'node-info',
      async (sub) =>
        JSON.parse(
          (
            await sub.execFail(['python', '-c', readIdentity])
          ).stdout.toString(),
        ),
    )
    if (info === null) {
      throw new Error(
        i18n(
          'Nomad Network has not created its identity yet. Start the service once, then try again.',
        ),
      )
    }

    const config = (await nomadnetConfig.read().once()) ?? ''
    // NomadNetworkApp: enable_node defaults off; disable_propagation defaults on.
    const hosting = isTrue(getIniValue(config, 'node', 'enable_node'))
    const disablePropagation = getIniValue(
      config,
      'node',
      'disable_propagation',
    )
    const propagation =
      disablePropagation !== null && !isTrue(disablePropagation)
    const displayName = info.displayName ?? 'Anonymous Peer'
    // Node.py: a missing or "None" node_name announces "<display name>'s Node".
    const configuredName = getIniValue(config, 'node', 'node_name')
    const nodeName =
      configuredName && configuredName.toLowerCase() !== 'none'
        ? configuredName
        : `${displayName}'s Node`

    const value: T.ActionResultMember[] = [
      single(
        i18n('Display Name'),
        i18n(
          'The name people see next to your messages. Change it in the Network section of the Web Terminal.',
        ),
        displayName,
      ),
      single(
        i18n('LXMF Address'),
        i18n(
          'Your messaging address. Share it so people can message you from Sideband, MeshChat, Columba, or Nomad Network.',
        ),
        info.lxmf,
      ),
    ]
    if (hosting) {
      value.push(
        single(
          i18n('Node Name'),
          i18n('The name your node announces. Change it with Node Settings.'),
          nodeName,
        ),
        single(
          i18n('Node Address'),
          i18n(
            "Open this address in a page browser to visit your node's pages and files.",
          ),
          info.node,
        ),
      )
      if (propagation) {
        value.push(
          single(
            i18n('Propagation Node Address'),
            i18n(
              'Set this as the propagation node on your other devices so they collect messages that arrived while they were offline.',
            ),
            info.propagation,
          ),
        )
      }
    }

    return {
      version: '1',
      title: i18n('Node Information'),
      message: hosting
        ? null
        : i18n(
            'Hosting is off, so your node and propagation node are not running. Turn hosting on with Node Settings.',
          ),
      result: { type: 'group', value },
    }
  },
)
