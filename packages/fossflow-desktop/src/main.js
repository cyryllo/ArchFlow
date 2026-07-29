const path = require('path');
const fs = require('fs');
const fsPromises = require('fs/promises');
const { pathToFileURL } = require('url');
const { app, BrowserWindow, dialog, protocol, net, Menu, ipcMain } = require('electron');

Menu.setApplicationMenu(null);

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

function registerStorageHandlers() {
  const storageDir = path.join(app.getPath('documents'), 'ArchFlow');
  fs.mkdirSync(storageDir, { recursive: true });

  const diagramPath = (id) => path.join(storageDir, `${id}.json`);

  ipcMain.handle('storage:list', async () => {
    const files = await fsPromises.readdir(storageDir);
    const diagrams = [];

    for (const file of files) {
      if (!file.endsWith('.json')) continue;

      try {
        const filePath = path.join(storageDir, file);
        const stats = await fsPromises.stat(filePath);
        const content = await fsPromises.readFile(filePath, 'utf-8');
        const data = JSON.parse(content);

        diagrams.push({
          id: file.replace(/\.json$/, ''),
          name: data.name || data.title || 'Untitled Diagram',
          lastModified: stats.mtime,
          size: stats.size
        });
      } catch (error) {
        console.error(`Error reading diagram file ${file}:`, error.message);
      }
    }

    return diagrams;
  });

  ipcMain.handle('storage:load', async (event, id) => {
    const content = await fsPromises.readFile(diagramPath(id), 'utf-8');
    return JSON.parse(content);
  });

  ipcMain.handle('storage:save', async (event, id, data) => {
    const payload = { ...data, id, lastModified: new Date().toISOString() };
    await fsPromises.writeFile(diagramPath(id), JSON.stringify(payload, null, 2));
    return { success: true, id };
  });

  ipcMain.handle('storage:delete', async (event, id) => {
    await fsPromises.unlink(diagramPath(id));
    return { success: true };
  });

  ipcMain.handle('storage:create', async (event, data) => {
    const id = data.id || `diagram_${Date.now()}`;
    const payload = {
      ...data,
      id,
      created: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };
    await fsPromises.writeFile(diagramPath(id), JSON.stringify(payload, null, 2));
    return id;
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

  win.webContents.on('will-prevent-unload', (event) => {
    const choice = dialog.showMessageBoxSync(win, {
      type: 'question',
      buttons: ['Close', 'Cancel'],
      defaultId: 1,
      cancelId: 1,
      title: 'Unsaved changes',
      message: 'You have unsaved changes. Close anyway?'
    });

    if (choice === 0) {
      event.preventDefault();
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
  registerStorageHandlers();
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
