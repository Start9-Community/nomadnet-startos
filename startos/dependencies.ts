import { storeJson } from './fileModels/store.json'
import { sdk } from './sdk'

export const dependencies = sdk.Dependencies.of().addDependency(
  sdk.Dependency.optional('nextexplorer', {
    description: {
      en_US:
        'Serves your node’s pages and files from folders you manage in NextExplorer',
      es_ES:
        'Sirve las páginas y archivos de tu nodo desde carpetas que gestionas en NextExplorer',
      de_DE:
        'Liefert die Seiten und Dateien deines Knotens aus Ordnern aus, die du in NextExplorer verwaltest',
      pl_PL:
        'Udostępnia strony i pliki Twojego węzła z folderów zarządzanych w NextExplorer',
      fr_FR:
        'Sert les pages et fichiers de votre nœud depuis des dossiers que vous gérez dans NextExplorer',
    },
    metadata: {
      title: 'NextExplorer',
      icon: 'https://raw.githubusercontent.com/Start9Labs/nextexplorer-startos/04f7ecbfc31ad2205e0222dd7568fb881aa06c79/icon.svg',
    },
    // The same floor Start9 Pages and Audiobookshelf mount NextExplorer's
    // `data` volume against.
    versionRange: '>=2.2.7:0',
    // Only its files are needed, not the running service.
    kind: 'exists',
    enabled: async ({ effects }) =>
      (await storeJson.read((s) => s?.site.selection).const(effects)) ===
      'nextexplorer',
  }),
)
