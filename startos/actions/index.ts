import { sdk } from '../sdk'
import { nodeInfo } from './nodeInfo'
import { nodeSettings } from './nodeSettings'
import { resetNetworkConfig } from './resetNetworkConfig'
import { setPassword } from './setPassword'
import { websiteSource } from './websiteSource'

export const actions = sdk.Actions.of()
  .addAction(nodeInfo)
  .addAction(setPassword)
  .addAction(nodeSettings)
  .addAction(websiteSource)
  .addAction(resetNetworkConfig)
