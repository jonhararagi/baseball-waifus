export function extractPlayerMetaState(record, { allowDirect = true } = {}) {
  if (!record || typeof record !== "object" || Array.isArray(record)) throw new TypeError("Player Meta record must be an object");
  let state;
  if (Object.prototype.hasOwnProperty.call(record, "state")) {
    if (record.schemaVersion !== 1 || !Number.isSafeInteger(record.revision) || record.revision < 0 || !record.state || typeof record.state !== "object" || Array.isArray(record.state)) throw new TypeError("Invalid Player Meta persistence envelope");
    state = record.state;
  } else if (allowDirect && record.currencies && typeof record.currencies === "object" && record.rewardLedger && typeof record.rewardLedger === "object") {
    state = record;
  } else throw new TypeError("Unsupported Player Meta persistence record");
  if (!state.currencies || typeof state.currencies !== "object" || Array.isArray(state.currencies) || !Number.isSafeInteger(state.currencies.SCRAP) || state.currencies.SCRAP < 0 || !state.rewardLedger || typeof state.rewardLedger !== "object" || Array.isArray(state.rewardLedger)) throw new TypeError("Invalid Player Meta state payload");
  return state;
}
