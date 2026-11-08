import { sdk } from './sdk'

export const { createBackup, restoreInit } = sdk.setupBackups(async () =>
  sdk.Backups.ofVolumes('main').setOptions({
    exclude: [
      // Messages relayed for other peers by the propagation node.
      '/.nomadnetwork/storage/lxmf/messagestore/',
      // Page and announce caches, rebuilt from the network.
      '/.nomadnetwork/storage/cache/',
      '/.reticulum/storage/cache/',
    ],
  }),
)
