import { InMemoryPurchaseStore, PersistentPurchaseStore } from "./purchase_store.mjs";
import { validateProductionConfig } from "./config.mjs";

export function createPurchaseStore(config) {
  if (config?.production) {
    validateProductionConfig(config);
    throw new Error("Managed production purchase persistence is not configured in this repository; external provider wiring is required before startup");
  }
  if (config?.persistenceProvider === "filesystem") {
    if (!config.persistenceFilePath) throw new Error("Filesystem purchase persistence requires AUTHORITY_PERSISTENCE_FILE");
    return new PersistentPurchaseStore({ filePath: `${config.persistenceFilePath}.purchases` });
  }
  return new InMemoryPurchaseStore();
}

export function purchasePersistenceReadiness(config, store = null) {
  if (config?.production) return Boolean(config.persistenceProvider === "managed" && config.persistenceDsn && store?.isDurable);
  return Boolean(store?.isDurable || (config?.persistenceProvider === "filesystem" && Boolean(config.persistenceFilePath)));
}
