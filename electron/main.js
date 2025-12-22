
const { app, BrowserWindow } = require('electron');
const path = require('path');

// Gestion du rechargement à chaud en développement
const isDev = !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    title: "SecuScan Pro",
    backgroundColor: '#0f172a', // Slate 900 pour correspondre au thème
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // Simplification pour ce projet (attention en prod réelle)
      webSecurity: false // Permet de contourner certaines restrictions CORS locales pour les outils de scan
    },
    autoHideMenuBar: true // Cache la barre de menu native (Fichier, Édition...)
  });

  if (isDev) {
    // En mode dev, on charge l'URL de Vite
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    // En production (exe), on charge le fichier html compilé
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
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
