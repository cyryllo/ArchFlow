const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  listDiagrams: () => ipcRenderer.invoke('storage:list'),
  loadDiagram: (id) => ipcRenderer.invoke('storage:load', id),
  saveDiagram: (id, data) => ipcRenderer.invoke('storage:save', id, data),
  deleteDiagram: (id) => ipcRenderer.invoke('storage:delete', id),
  createDiagram: (data) => ipcRenderer.invoke('storage:create', data),
  setLanguage: (lang) => ipcRenderer.send('language-changed', lang)
});
