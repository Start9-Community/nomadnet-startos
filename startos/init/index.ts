import { sdk } from '../sdk'
import { dependencies } from '../dependencies'
import { setInterfaces } from '../interfaces'
import { versionGraph } from '../versions'
import { actions } from '../actions'
import { restoreInit } from '../backups'
import { seedConfig } from './seedConfig'
import { watchPassword } from './watchPassword'

export const init = sdk.setupInit(
  restoreInit,
  versionGraph,
  seedConfig,
  setInterfaces,
  actions,
  dependencies,
  watchPassword,
)

export const uninit = sdk.setupUninit(versionGraph)
