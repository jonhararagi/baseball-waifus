import assert from 'node:assert/strict';
import { SuperSwingCutin } from './super_swing_cutin.js';

console.log('🧪 Ejecutando pruebas unitarias de SuperSwingCutin...');

const cutin = new SuperSwingCutin();

// Test 1: Estado inicial
assert.equal(cutin.active, false, 'CutIn debe iniciar inactivo');
assert.equal(cutin.isFreezingTime(), false, 'No debe congelar tiempo en IDLE');

// Test 2: Activación y transición de fases
cutin.trigger({
  name: 'Roxie Vane',
  archetype: 'POWER',
  quote_super: '¡IGNITION BUSTER!'
});

assert.equal(cutin.active, true, 'CutIn debe estar activo tras trigger()');
assert.equal(cutin.phase, 'ENTER', 'Fase inicial debe ser ENTER');
assert.equal(cutin.isFreezingTime(), true, 'Debe congelar tiempo en fase ENTER');

// Test 3: Avanzar tiempo hacia HOLD
cutin.update(160); // Pasa la duración de ENTER (150ms)
assert.equal(cutin.phase, 'HOLD', 'Debe pasar a fase HOLD');
assert.equal(cutin.isFreezingTime(), true, 'Debe seguir congelando tiempo en HOLD');

// Test 4: Avanzar tiempo hacia EXIT e IDLE
cutin.update(710); // Pasa la duración de HOLD (700ms)
assert.equal(cutin.phase, 'EXIT', 'Debe pasar a fase EXIT');
assert.equal(cutin.isFreezingTime(), false, 'EXIT no debe congelar el tiempo de juego');

cutin.update(210); // Pasa la duración de EXIT (200ms)
assert.equal(cutin.active, false, 'CutIn debe desactivarse tras completar las fases');
assert.equal(cutin.phase, 'IDLE', 'Debe regresar a IDLE');

console.log('✅ Todas las pruebas de SuperSwingCutin pasaron correctamente.');
