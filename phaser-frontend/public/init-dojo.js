// This file lives in public/ so Vite does NOT bundle it.
// It initialises the Dojo WASM module before the main Phaser app starts.
window.__dojoReady = (async () => {
  try {
    const dojoJs = await import('./dojo_wasm_bg.js');
    const wasmResponse = await fetch('./dojo_wasm_bg.wasm');
    const wasmBytes = await wasmResponse.arrayBuffer();
    const importObject = { './dojo_wasm_bg.js': dojoJs };
    const { instance } = await WebAssembly.instantiate(wasmBytes, importObject);
    dojoJs.__wbg_set_wasm(instance.exports);
    if (instance.exports.__wbindgen_start) instance.exports.__wbindgen_start();
    window.wasm_bindgen = dojoJs;
    console.log('[Dojo] WASM ready. ToriiClient:', typeof dojoJs.ToriiClient);
    return true;
  } catch (err) {
    console.warn('[Dojo] WASM init failed, running without on-chain features:', err);
    return false;
  }
})();
