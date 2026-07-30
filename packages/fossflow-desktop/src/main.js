const path = require('path');
const fs = require('fs');
const fsPromises = require('fs/promises');
const { pathToFileURL } = require('url');
const { app, BrowserWindow, dialog, protocol, net, Menu, ipcMain } = require('electron');

Menu.setApplicationMenu(null);

const APP_BUILD_DIR = path.join(__dirname, '../resources/app-build');
const APP_SCHEME = 'app';

// Native dialogs (main process) have no access to the renderer's i18next -
// the renderer tells us which language it's in via IPC, and we keep a small
// string table here for the couple of dialogs the main process shows.
const DIALOG_STRINGS = {
  'en-US': {
    unsavedTitle: 'Unsaved changes',
    unsavedMessage: 'You have unsaved changes. Close anyway?',
    close: 'Close',
    cancel: 'Cancel'
  },
  'pl-PL': {
    unsavedTitle: 'Niezapisane zmiany',
    unsavedMessage: 'Masz niezapisane zmiany. Czy na pewno chcesz zamknąć?',
    close: 'Zamknij',
    cancel: 'Anuluj'
  }
};
let currentLanguage = 'en-US';

ipcMain.on('language-changed', (event, lang) => {
  if (DIALOG_STRINGS[lang]) {
    currentLanguage = lang;
  }
});

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

// Turn a diagram name into a filesystem-safe filename stem: strips characters
// invalid on Windows/Linux/macOS, collapses whitespace, and caps the length.
function sanitizeFilename(name) {
  const cleaned = (name || 'Untitled Diagram')
    .replace(/[\\/?%*:|"<>\x00-\x1f]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 150);
  return cleaned || 'Untitled Diagram';
}

async function fileExists(filePath) {
  try {
    await fsPromises.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function registerStorageHandlers() {
  const storageDir = path.join(app.getPath('documents'), 'ArchFlow');
  fs.mkdirSync(storageDir, { recursive: true });

  const diagramPath = (id) => path.join(storageDir, `${id}.json`);

  // Picks a filename stem for `name`, appending " (2)", " (3)", ... if it
  // collides with a different diagram. `keepId`, if given, is treated as
  // "this is the diagram being saved" - reusing its own current name is not
  // a collision.
  const uniqueDiagramId = async (name, keepId) => {
    const base = sanitizeFilename(name);
    if (base === keepId) return base;

    let candidate = base;
    let n = 2;
    while (candidate !== keepId && (await fileExists(diagramPath(candidate)))) {
      candidate = `${base} (${n})`;
      n += 1;
    }
    return candidate;
  };

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
    const newId = await uniqueDiagramId(data.name || data.title, id);
    const payload = { ...data, id: newId, lastModified: new Date().toISOString() };
    await fsPromises.writeFile(diagramPath(newId), JSON.stringify(payload, null, 2));

    if (newId !== id) {
      await fsPromises.unlink(diagramPath(id)).catch(() => {});
    }

    return { success: true, id: newId };
  });

  ipcMain.handle('storage:delete', async (event, id) => {
    await fsPromises.unlink(diagramPath(id));
    return { success: true };
  });

  ipcMain.handle('storage:create', async (event, data) => {
    const id = await uniqueDiagramId(data.name || data.title);
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
    const strings = DIALOG_STRINGS[currentLanguage] || DIALOG_STRINGS['en-US'];
    const choice = dialog.showMessageBoxSync(win, {
      type: 'question',
      buttons: [strings.close, strings.cancel],
      defaultId: 1,
      cancelId: 1,
      title: strings.unsavedTitle,
      message: strings.unsavedMessage
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
