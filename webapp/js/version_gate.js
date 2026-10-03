const CLIENT_VERSION = 'v17';
const VERSION_URL = './version.json';
const RECOVERY_KEY = 'basewarriors.version-gate.recovery';
const RETRY_PARAM = 'bw_version_retry';

function getRecoveryMarker() {
  try { return window.sessionStorage?.getItem(RECOVERY_KEY) || ''; } catch { return ''; }
}
function setRecoveryMarker(version) {
  try { window.sessionStorage?.setItem(RECOVERY_KEY, version); } catch {}
}
function clearRecoveryMarker() {
  try { window.sessionStorage?.removeItem(RECOVERY_KEY); } catch {}
}

export async function fetchDeployedVersion(fetchImpl = fetch) {
  const response = await fetchImpl(
    `${VERSION_URL}?v=${encodeURIComponent(CLIENT_VERSION)}&t=${Date.now()}`,
    { cache: 'no-store', headers: { 'cache-control': 'no-cache' } }
  );
  if (!response.ok) throw new Error(`Version endpoint returned ${response.status}`);
  const payload = await response.json();
  const version = String(payload?.version || '').trim();
  if (!version) throw new Error('Version endpoint did not provide a version');
  return version;
}

export async function purgeProductCaches(cacheApi = globalThis.caches) {
  if (!cacheApi?.keys || !cacheApi?.delete) return [];
  const names = await cacheApi.keys();
  const productNames = names.filter((name) =>
    name.startsWith('baseball-waifus-') || name === 'v16_capibara_core'
  );
  await Promise.all(productNames.map((name) => cacheApi.delete(name)));
  return productNames;
}

async function unregisterServiceWorkers() {
  const registrations = await navigator.serviceWorker?.getRegistrations?.() || [];
  await Promise.all(registrations.map((registration) => registration.unregister()));
}

function buildRecoveryUrl(version) {
  const url = new URL(window.location.href);
  url.searchParams.set(RETRY_PARAM, version);
  url.searchParams.set('_bw_cache_buster', `${version}-${Date.now()}`);
  return url.toString();
}

export function showVersionGateFailure(error) {
  const loading = document.querySelector('#loading-state');
  if (loading) {
    loading.hidden = false;
    loading.querySelector('.loading-title')?.replaceChildren(document.createTextNode('ACTUALIZACIÓN REQUERIDA'));
    loading.querySelector('.loading-detail')?.replaceChildren(document.createTextNode(
      'No se pudo actualizar el cliente. Cierra y vuelve a abrir la Mini App o inténtalo nuevamente.'
    ));
    loading.dataset.versionGate = 'failed';
  }
  console.warn('[PWA] Version gate failed:', error);
}

export async function runClientVersionGate({ fetchImpl = fetch, reload = (url) => window.location.assign(url), unregister = unregisterServiceWorkers, purge = purgeProductCaches } = {}) {
  let deployedVersion;
  try {
    deployedVersion = await fetchDeployedVersion(fetchImpl);
  } catch (error) {
    console.warn('[PWA] Version check unavailable; continuing with current client.', error);
    return { status: 'unverified', clientVersion: CLIENT_VERSION };
  }

  if (deployedVersion === CLIENT_VERSION) {
    clearRecoveryMarker();
    return { status: 'match', clientVersion: CLIENT_VERSION, deployedVersion };
  }

  if (getRecoveryMarker() === CLIENT_VERSION || new URL(window.location.href).searchParams.get(RETRY_PARAM) === CLIENT_VERSION) {
    showVersionGateFailure(new Error(`Client ${CLIENT_VERSION} still mismatches deployed ${deployedVersion}`));
    return { status: 'failed', clientVersion: CLIENT_VERSION, deployedVersion };
  }

  setRecoveryMarker(CLIENT_VERSION);
  await unregister();
  await purge();
  reload(buildRecoveryUrl(deployedVersion));
  return { status: 'recovering', clientVersion: CLIENT_VERSION, deployedVersion };
}

export { CLIENT_VERSION, VERSION_URL, RECOVERY_KEY };
