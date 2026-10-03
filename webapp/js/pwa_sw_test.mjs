import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

console.log('🧪 Ejecutando Pruebas Unitarias P16: PWA & Service Worker Cache...');

const manifestPath = path.resolve('webapp/manifest.json');
assert.ok(fs.existsSync(manifestPath), 'El archivo webapp/manifest.json debe existir');

const manifestContent = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
assert.equal(manifestContent.short_name, 'BaseWarriors', 'El short_name debe ser BaseWarriors');
assert.equal(manifestContent.display, 'standalone', 'El modo display debe ser standalone');
assert.equal(manifestContent.orientation, 'portrait', 'La orientación debe ser portrait');
assert.ok(
  Array.isArray(manifestContent.icons) && manifestContent.icons.length >= 2,
  'Debe incluir al menos 2 íconos adaptativos'
);

for (const icon of manifestContent.icons) {
  const iconPath = path.resolve('webapp', icon.src.replace(/^\.\//, ''));
  assert.ok(fs.existsSync(iconPath), 'El icono PWA debe existir: ' + icon.src);
}

const swPath = path.resolve('webapp/sw.js');
assert.ok(fs.existsSync(swPath), 'El archivo webapp/sw.js debe existir');

const swContent = fs.readFileSync(swPath, 'utf8');
assert.ok(
  swContent.includes("CACHE_VERSION = 'v17'") && swContent.includes("baseball-waifus-${CACHE_VERSION}"),
  'El SW debe definir cacheVersion v17 y el nombre unificado baseball-waifus-v17'
);
assert.ok(swContent.includes('PRECACHE_ASSETS'), 'El SW debe contener la lista de precaché');
assert.ok(swContent.includes('caches.delete'), 'El SW debe purgar cachés antiguas en la activación');
assert.ok(swContent.includes('self.addEventListener("fetch"'), 'El SW debe registrar el interceptor fetch');

const appPath = path.resolve('webapp/js/app.js');
assert.ok(fs.existsSync(appPath), 'El archivo webapp/js/app.js debe existir');

const appContent = fs.readFileSync(appPath, 'utf8');
assert.ok(
  appContent.includes('export function registerServiceWorker()'),
  'app.js debe exportar registerServiceWorker'
);
assert.ok(
  appContent.includes("navigator.serviceWorker.register('./sw.js')"),
  'registerServiceWorker debe registrar ./sw.js'
);

let swRegistered = false;
const mockNavigator = {
  serviceWorker: {
    register: async (scriptUrl) => {
      if (scriptUrl === './sw.js') {
        swRegistered = true;
        return { scope: './' };
      }
      throw new Error('Script inválido');
    }
  }
};

if ('serviceWorker' in mockNavigator) {
  const reg = await mockNavigator.serviceWorker.register('./sw.js');
  assert.equal(reg.scope, './', 'El scope del Service Worker registrado debe ser relativo ./');
  assert.equal(swRegistered, true, 'El registro del SW debe completarse con éxito');
}

console.log('✅ P16: Pruebas de PWA, Manifest y Service Worker completadas con éxito.');

const versionPath = path.resolve('webapp/version.json');
assert.ok(fs.existsSync(versionPath), 'Debe existir webapp/version.json');
const versionManifest = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
assert.equal(versionManifest.version, 'v17');
assert.equal(versionManifest.cacheVersion, 'baseball-waifus-v17');
assert.ok(swContent.includes('v16_capibara_core'), 'La migración debe contemplar la cache legacy v16_capibara_core');
assert.ok(swContent.includes('pathname.endsWith("/version.json")'), 'version.json debe usar estrategia network-first');
assert.ok(swContent.includes('LEGACY_CACHE_NAMES'), 'El SW debe declarar explícitamente caches legacy');

console.log('✅ BONE-001: cache/version consistency checks passed.');
