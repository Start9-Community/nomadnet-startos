import { nomadnetConfig } from '../fileModels/nomadnetConfig'
import { rnsConfig } from '../fileModels/rnsConfig'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { defaultRnsConfig, setIniValues } from '../utils'

// Upstream's default config is a module constant (a list of lines, which is how
// ConfigObj takes it); print it from the installed version rather than carrying
// a copy that drifts on every bump.
const printDefaultConfig =
  'from nomadnet.NomadNetworkApp import __default_nomadnet_config__ as c; print(c if isinstance(c, str) else "\\n".join(c))'

export const seedConfig = sdk.setupOnInit(async (effects, kind, progress) => {
  if (kind !== 'install') return

  if ((await rnsConfig.read().once()) === null) {
    await rnsConfig.write(effects, defaultRnsConfig)
  }

  if ((await nomadnetConfig.read().once()) === null) {
    const phase = progress.addPhase(i18n('Preparing Nomad Network'))
    phase.start()
    const defaults = await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'nomadnet' },
      null,
      'seed-config',
      async (sub) =>
        (
          await sub.execFail(['python', '-c', printDefaultConfig])
        ).stdout.toString(),
    )
    let config = setIniValues(defaults, 'node', {
      enable_node: 'yes',
      disable_propagation: 'no',
    })
    // A browser terminal has no Nerd Font, so nerdfont glyphs render as boxes.
    config = setIniValues(config, 'textui', { glyphs: 'unicode' })
    await nomadnetConfig.write(effects, config)
    phase.complete()
  }
})
