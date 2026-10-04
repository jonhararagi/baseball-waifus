import { InMemoryCombatStore } from "./combat_store.mjs";
import { PersistentCombatStore } from "./persistent_combat_store.mjs";
import { validateProductionConfig } from "./config.mjs";

export const PERSISTENCE_PROVIDER_TYPES = Object.freeze({
  MEMORY: "memory",
  FILESYSTEM: "filesystem",
  MANAGED: "managed"
});

export function createPersistenceStore(config) {
  if (config?.production) {
    validateProductionConfig(config);
    throw new Error("Managed production persistence is not configured in this repository; external provider wiring is required before startup");
  }
  if (config?.persistenceProvider === PERSISTENCE_PROVIDER_TYPES.FILESYSTEM) {
    if (!config.persistenceFilePath) throw new Error("Filesystem persistence requires AUTHORITY_PERSISTENCE_FILE");
    return new PersistentCombatStore({ filePath: config.persistenceFilePath });
  }
  return new InMemoryCombatStore();
}

export function persistenceReadiness(config, store = null) {
  if (config?.production) {
    return Boolean(config.persistenceProvider === PERSISTENCE_PROVIDER_TYPES.MANAGED && config.persistenceDsn && store?.isDurable);
  }
  return Boolean(store?.isDurable || (config?.persistenceProvider === PERSISTENCE_PROVIDER_TYPES.FILESYSTEM && Boolean(config.persistenceFilePath)));
}
