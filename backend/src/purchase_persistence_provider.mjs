import { InMemoryPurchaseStore, PersistentPurchaseStore } from "./purchase_store.mjs";
import { ManagedPurchaseStore } from "./managed_purchase_store.mjs";
import { validateProductionConfig } from "./config.mjs";

export function createPurchaseStore(config) {
  if (config?.production) {
    validateProductionConfig(config);
    return new ManagedPurchaseStore({ dsn: config.persistenceDsn });
  }
  if (config?.persistenceProvider === "filesystem") {
    if (!config.persistenceFilePath) throw new Error("Filesystem purchase persistence requires AUTHORITY_PERSISTENCE_FILE");
    return new PersistentPurchaseStore({ filePath: `${config.persistenceFilePath}.purchases` });
  }
  return new InMemoryPurchaseStore();
}

export function purchasePersistenceReadiness(config, store = null) {
  if (config?.production) {
    return Boolean(
      config.persistenceProvider === "managed"
      && config.persistenceDsn
      && store?.isDurable
      && store?.isOperational
    );
  }
  return Boolean(
    store?.isDurable
    || (config?.persistenceProvider === "filesystem" && Boolean(config.persistenceFilePath))
  );
}
