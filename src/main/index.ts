require('v8-compile-cache');
require('immer').enablePatches();

import {app, protocol, BrowserWindow, ipcMain} from 'electron';
import installExtension, {REACT_DEVELOPER_TOOLS} from 'electron-devtools-installer';
import protocols from 'protocols';
import * as Core from 'core';


let window: BrowserWindow;

function createWindow() {
  window = new BrowserWindow({
    width: 1300,
    height: 800,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      nodeIntegration: true,
    },
  });

  window.webContents.on('new-window', (event, url, frame, disposition, options) => {
    const at = (frame != null && frame != '') ? Number(frame) : undefined;
    const mode = (at != null && disposition === 'foreground-tab') ? 'push' : disposition;
    const visited = Core.visit(url, mode, at);
    if (visited) event.preventDefault();
  });

  window.webContents.on('will-navigate', (event, url) => {
    const visited = Core.visit(url, 'push');
    if (visited) event.preventDefault();
  });

  Core.subscribe((state, patches) => {
    window.webContents.send('state', state, patches);
  });

  ipcMain.on('state', (event) => {
    Core.withState((state) => {
      event.sender.send('state', state);
    });
  });

  ipcMain.on('action', async (event, action: keyof typeof Core, ...args: any[]) => {
    // @ts-ignore
    await Core[action](...args);
  });

  window.loadFile(`build/app.html`);
}

function registerProtocolSchemes() {
  protocol.registerSchemesAsPrivileged(
    protocols.map(p => p.scheme),
  );
}

function registerProtocolHandlers() {
  for (let {scheme, handler} of protocols) {
    protocol.registerStreamProtocol(scheme.scheme, handler);
  }
}

function installDevTools() {
  installExtension(REACT_DEVELOPER_TOOLS)
}

// FIXME MacOS-only
app.on('open-url', (e, url) => {
  Core.createTab('main', url, true);
});

registerProtocolSchemes();

app.whenReady()
  .then(installDevTools)
  .then(registerProtocolHandlers)
  .then(createWindow)
