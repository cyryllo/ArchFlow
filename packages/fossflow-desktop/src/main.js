const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { app, BrowserWindow, dialog, protocol, net } = require('electron');

const APP_BUILD_DIR = path.join(__dirname, '../resources/app-build');
const APP_SCHEME = 'app';

protocol.registerSchemesAsPrivileged([
  {
    scheme: APP_SCHEME,
    privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true }
  }
]);

function serveAppBundle() {
  protocol.handle(APP_SCHEME, (request) => {
    const url = new URL(request.url);
    let relativePath = decodeURIComponent(url.pathname);

    let filePath = path.join(APP_BUILD_DIR, relativePath);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(APP_BUILD_DIR, 'index.html');
    }

    return net.fetch(pathToFileURL(filePath).toString());
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'ArchFlow',
    icon: path.join(__dirname, '../build/icon.png'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.webContents.session.on('will-download', (event, item) => {
    const savePath = dialog.showSaveDialogSync(win, {
      defaultPath: path.join(app.getPath('documents'), item.getFilename())
    });

    if (savePath) {
      item.setSavePath(savePath);
    } else {
      item.cancel();
    }
  });

  win.loadURL(`${APP_SCHEME}://bundle/`);

  return win;
}

app.whenReady().then(() => {
  serveAppBundle();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
