const { app, BrowserWindow, ipcMain, dialog, shell, Menu, clipboard } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const https = require('https');

let mainWindow;
let pythonProcess = null;

const PROJECT_INFO = {
  name: '万能导 Wandao',
  version: app.getVersion(),
  slogan: '让知识没有壁垒，多平台文档互转',
  author: 'tllovesxs',
  github: 'https://github.com/tllovesxs/wandao',
  docs: 'https://github.com/tllovesxs/wandao/blob/main/docs/%E4%BD%BF%E7%94%A8%E6%95%99%E7%A8%8B.md',
  releases: 'https://github.com/tllovesxs/wandao/releases',
  latestReleaseApi: 'https://api.github.com/repos/tllovesxs/wandao/releases/latest',
  issues: 'https://github.com/tllovesxs/wandao/issues',
  wechat: 'pressure_spring'
};

const APP_ID = 'com.wandao.app';
const SETTINGS_FILE = 'settings.json';
const BROWSER_DOWNLOAD_URL = 'https://www.google.com/chrome/';

function resolveAppAsset(fileName) {
  const candidates = uniquePaths([
    path.join(__dirname, 'assets', fileName),
    path.join(app.getAppPath(), 'assets', fileName),
    path.join(process.resourcesPath || '', 'assets', fileName)
  ]);
  return candidates.find((candidate) => fs.existsSync(candidate)) || candidates[0];
}

function appIconPath() {
  if (process.platform === 'win32') {
    return resolveAppAsset('icon.ico');
  }
  return resolveAppAsset('icon.png');
}

function configureAppIdentity() {
  app.setName(PROJECT_INFO.name);
  if (process.platform === 'win32') {
    app.setAppUserModelId(APP_ID);
  }
  if (process.platform === 'darwin' && app.dock) {
    app.dock.setIcon(resolveAppAsset('icon.png'));
  }
}

function cleanupPythonProcess() {
  if (pythonProcess) {
    try {
      pythonProcess.kill();
    } catch (_error) {
      // Ignore shutdown cleanup errors.
    }
    pythonProcess = null;
  }
}

const ALLOWED_SCRIPTS = new Set([
  'export_zsxq.py',
  'export_yuque.py',
  'export_feishu.py',
  'export_aliyun_thoughts.py',
  'export_yinxiang.py',
  'export_youdao.py',
  'export_onenote.py',
  'export_wiz.py',
  'import_yinxiang.py',
  'import_yuque.py',
  'import_feishu.py',
  'ima_knowledge.py'
]);

function uniquePaths(paths) {
  const seen = new Set();
  const result = [];
  for (const item of paths) {
    if (!item) continue;
    const normalized = path.resolve(item);
    const key = process.platform === 'win32' ? normalized.toLowerCase() : normalized;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(normalized);
  }
  return result;
}

function expandHomePath(value) {
  const raw = String(value || '').trim();
  if (!raw.startsWith('~')) return raw;
  const home = app.getPath('home') || process.env.USERPROFILE || process.env.HOME || '';
  if (!home) return raw;
  if (raw === '~') return home;
  if (raw.startsWith('~/') || raw.startsWith('~\\')) {
    return path.join(home, raw.slice(2));
  }
  return raw;
}

function isPathLike(value) {
  const raw = String(value || '');
  return path.isAbsolute(raw) || raw.startsWith('~') || raw.includes('/') || raw.includes('\\');
}

function isExecutableFile(filePath) {
  try {
    return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
  } catch (_error) {
    return false;
  }
}

function findExecutableOnPath(command) {
  const raw = String(command || '').trim();
  if (!raw) return '';
  if (isPathLike(raw)) {
    const resolved = path.resolve(expandHomePath(raw));
    return isExecutableFile(resolved) ? resolved : '';
  }

  const pathEntries = String(process.env.PATH || '')
    .split(path.delimiter)
    .filter(Boolean);
  const extensions = process.platform === 'win32'
    ? String(process.env.PATHEXT || '.EXE;.CMD;.BAT;.COM')
      .split(';')
      .filter(Boolean)
    : [''];
  const names = process.platform === 'win32' && !path.extname(raw)
    ? [raw, ...extensions.map((extension) => `${raw}${extension}`)]
    : [raw];

  for (const dir of pathEntries) {
    for (const name of names) {
      const candidate = path.join(dir, name);
      if (isExecutableFile(candidate)) {
        return path.resolve(candidate);
      }
    }
  }
  return '';
}

function normalizeBrowserExecutable(browserPath) {
  const raw = String(browserPath || '').trim();
  if (!raw) return '';
  if (!isPathLike(raw)) {
    return findExecutableOnPath(raw);
  }

  const resolved = path.resolve(expandHomePath(raw));
  if (process.platform === 'darwin' && resolved.toLowerCase().endsWith('.app')) {
    const appName = path.basename(resolved, '.app');
    const executableNames = uniquePaths([
      path.join(resolved, 'Contents', 'MacOS', appName),
      path.join(resolved, 'Contents', 'MacOS', appName.replace(/\s+Browser$/i, '')),
      path.join(resolved, 'Contents', 'MacOS', 'Google Chrome'),
      path.join(resolved, 'Contents', 'MacOS', 'Microsoft Edge'),
      path.join(resolved, 'Contents', 'MacOS', 'Chromium'),
      path.join(resolved, 'Contents', 'MacOS', 'Brave Browser')
    ]);
    const match = executableNames.find(isExecutableFile);
    return match || '';
  }

  return isExecutableFile(resolved) ? resolved : '';
}

function browserCandidateSpecs() {
  const home = app.getPath('home') || process.env.USERPROFILE || process.env.HOME || '';
  if (process.platform === 'win32') {
    const programFiles = process.env.PROGRAMFILES || 'C:\\Program Files';
    const programFilesX86 = process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)';
    const localAppData = process.env.LOCALAPPDATA || '';
    return [
      {
        id: 'chrome',
        name: 'Google Chrome',
        paths: [
          path.join(programFiles, 'Google', 'Chrome', 'Application', 'chrome.exe'),
          path.join(programFilesX86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
          localAppData && path.join(localAppData, 'Google', 'Chrome', 'Application', 'chrome.exe')
        ],
        commands: ['chrome', 'chrome.exe', 'google-chrome']
      },
      {
        id: 'edge',
        name: 'Microsoft Edge',
        paths: [
          path.join(programFiles, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
          path.join(programFilesX86, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
          localAppData && path.join(localAppData, 'Microsoft', 'Edge', 'Application', 'msedge.exe')
        ],
        commands: ['msedge', 'msedge.exe']
      },
      {
        id: 'chromium',
        name: 'Chromium',
        paths: [
          path.join(programFiles, 'Chromium', 'Application', 'chrome.exe'),
          path.join(programFilesX86, 'Chromium', 'Application', 'chrome.exe'),
          localAppData && path.join(localAppData, 'Chromium', 'Application', 'chrome.exe')
        ],
        commands: ['chromium', 'chromium.exe']
      },
      {
        id: 'brave',
        name: 'Brave',
        paths: [
          path.join(programFiles, 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe'),
          path.join(programFilesX86, 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe'),
          localAppData && path.join(localAppData, 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe')
        ],
        commands: ['brave', 'brave.exe']
      }
    ];
  }

  if (process.platform === 'darwin') {
    const applicationRoots = uniquePaths([
      '/Applications',
      home && path.join(home, 'Applications')
    ]);
    const appPath = (root, appName, executableName) => (
      root ? path.join(root, appName, 'Contents', 'MacOS', executableName) : ''
    );
    return [
      {
        id: 'chrome',
        name: 'Google Chrome',
        paths: applicationRoots.map((root) => appPath(root, 'Google Chrome.app', 'Google Chrome')),
        commands: []
      },
      {
        id: 'edge',
        name: 'Microsoft Edge',
        paths: applicationRoots.map((root) => appPath(root, 'Microsoft Edge.app', 'Microsoft Edge')),
        commands: []
      },
      {
        id: 'chromium',
        name: 'Chromium',
        paths: applicationRoots.map((root) => appPath(root, 'Chromium.app', 'Chromium')),
        commands: []
      },
      {
        id: 'brave',
        name: 'Brave',
        paths: applicationRoots.map((root) => appPath(root, 'Brave Browser.app', 'Brave Browser')),
        commands: []
      }
    ];
  }

  return [
    {
      id: 'chrome',
      name: 'Google Chrome',
      paths: ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/opt/google/chrome/chrome'],
      commands: ['google-chrome', 'google-chrome-stable', 'chrome']
    },
    {
      id: 'edge',
      name: 'Microsoft Edge',
      paths: ['/usr/bin/microsoft-edge', '/usr/bin/microsoft-edge-stable'],
      commands: ['microsoft-edge', 'microsoft-edge-stable']
    },
    {
      id: 'chromium',
      name: 'Chromium',
      paths: ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/snap/bin/chromium'],
      commands: ['chromium', 'chromium-browser']
    },
    {
      id: 'brave',
      name: 'Brave',
      paths: ['/usr/bin/brave-browser', '/snap/bin/brave'],
      commands: ['brave-browser', 'brave']
    }
  ];
}

function detectBrowsers() {
  const browsers = [];
  const seen = new Set();
  const pushBrowser = (spec, browserPath, source) => {
    const normalized = normalizeBrowserExecutable(browserPath);
    if (!normalized) return;
    const key = process.platform === 'win32' ? normalized.toLowerCase() : normalized;
    if (seen.has(key)) return;
    seen.add(key);
    browsers.push({
      id: spec.id,
      name: spec.name,
      path: normalized,
      source
    });
  };

  for (const spec of browserCandidateSpecs()) {
    for (const candidatePath of spec.paths || []) {
      pushBrowser(spec, candidatePath, '默认安装位置');
    }
    for (const command of spec.commands || []) {
      const executable = findExecutableOnPath(command);
      if (executable) {
        pushBrowser(spec, executable, 'PATH');
      }
    }
  }
  return browsers;
}

function appSettingsPath() {
  return path.join(app.getPath('userData'), SETTINGS_FILE);
}

function readAppSettings() {
  try {
    const filePath = appSettingsPath();
    if (!fs.existsSync(filePath)) return {};
    const settings = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return settings && typeof settings === 'object' ? settings : {};
  } catch (_error) {
    return {};
  }
}

function writeAppSettings(settings) {
  fs.mkdirSync(app.getPath('userData'), { recursive: true });
  fs.writeFileSync(appSettingsPath(), JSON.stringify(settings || {}, null, 2), 'utf-8');
}

function publicAppSettings(settings = readAppSettings()) {
  return {
    browserPath: settings.browserPath || '',
    updatedAt: settings.updatedAt || ''
  };
}

function selectedBrowserPath() {
  const settings = readAppSettings();
  const configured = normalizeBrowserExecutable(settings.browserPath || '');
  return configured || '';
}

function saveAppSettings(update) {
  const next = {
    ...readAppSettings()
  };
  if (Object.prototype.hasOwnProperty.call(update || {}, 'browserPath')) {
    const rawBrowserPath = String(update.browserPath || '').trim();
    if (rawBrowserPath) {
      const browserPath = normalizeBrowserExecutable(rawBrowserPath);
      if (!browserPath) {
        return { success: false, error: '没有找到这个浏览器文件，请选择 Chrome、Edge 或 Chromium 的可执行文件。' };
      }
      next.browserPath = browserPath;
    } else {
      delete next.browserPath;
    }
  }
  next.updatedAt = new Date().toISOString();
  writeAppSettings(next);
  return { success: true, settings: publicAppSettings(next) };
}

function providerRoots() {
  return uniquePaths([
    path.join(__dirname, '..', 'providers'),
    path.join(process.cwd(), 'providers'),
    path.join(app.getAppPath(), '..', 'providers'),
    path.join(process.resourcesPath || '', 'providers'),
    path.join(app.getPath('userData'), 'providers')
  ]);
}

function isInsidePath(root, candidate) {
  const rootPath = path.resolve(root);
  const targetPath = path.resolve(candidate);
  const left = process.platform === 'win32' ? rootPath.toLowerCase() : rootPath;
  const right = process.platform === 'win32' ? targetPath.toLowerCase() : targetPath;
  return right === left || right.startsWith(left + path.sep);
}

function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function readGuideMarkdown(providerRoot, guidePath) {
  if (!guidePath) return '';
  const resolved = path.resolve(providerRoot, guidePath);
  if (!isInsidePath(providerRoot, resolved) || !fs.existsSync(resolved)) return '';
  const stat = fs.statSync(resolved);
  if (!stat.isFile() || stat.size > 512 * 1024) return '';
  return fs.readFileSync(resolved, 'utf-8');
}

function pluginScriptRef(providerId, scriptName, providerRoot) {
  if (!scriptName || ALLOWED_SCRIPTS.has(scriptName) || String(scriptName).startsWith('provider:')) {
    return scriptName || '';
  }
  const resolved = path.resolve(providerRoot, scriptName);
  if (!isInsidePath(providerRoot, resolved) || !fs.existsSync(resolved)) {
    return '';
  }
  if (path.extname(resolved).toLowerCase() !== '.py') {
    return '';
  }
  return `provider:${providerId}:${scriptName.replace(/\\/g, '/')}`;
}

function normalizeProviderManifest(raw, providerRoot, sourceKind) {
  if (!raw || !raw.id) return null;
  const id = String(raw.id).trim();
  if (!/^[a-z0-9][a-z0-9_-]{1,63}$/i.test(id)) return null;
  const provider = {
    ...raw,
    id,
    sourceKind,
    trustLevel: raw.trustLevel || (sourceKind === 'user' ? 'local' : 'community'),
    status: raw.status || 'experimental',
    templateId: raw.templateId || '',
    guideMarkdown: readGuideMarkdown(providerRoot, raw.guide || raw.guidePath || 'README.md')
  };
  provider.script = pluginScriptRef(id, raw.script, providerRoot);
  if (Array.isArray(raw.actions)) {
    provider.actions = raw.actions.map((action) => ({
      ...action,
      script: pluginScriptRef(id, action && action.script, providerRoot) || provider.script
    }));
  }
  return provider;
}

function discoverProviderManifests() {
  const providers = [];
  const seen = new Set();
  for (const root of providerRoots()) {
    if (!fs.existsSync(root)) continue;
    const sourceKind = root.startsWith(app.getPath('userData')) ? 'user' : 'bundled';
    for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name.startsWith('_') || entry.name.startsWith('.')) continue;
      const providerRoot = path.join(root, entry.name);
      const manifestPath = path.join(providerRoot, 'provider.json');
      if (!fs.existsSync(manifestPath)) continue;
      try {
        const manifest = normalizeProviderManifest(readJsonFile(manifestPath), providerRoot, sourceKind);
        if (!manifest || seen.has(manifest.id)) continue;
        seen.add(manifest.id);
        providers.push(manifest);
      } catch (error) {
        console.warn(`Failed to load provider manifest ${manifestPath}:`, error);
      }
    }
  }
  return providers;
}

function findProviderScript(scriptName) {
  const match = String(scriptName || '').match(/^provider:([a-z0-9_-]+):(.+)$/i);
  if (!match) {
    throw new Error(`不允许执行的脚本：${scriptName}`);
  }
  const providerId = match[1];
  const relativeScript = match[2];
  for (const root of providerRoots()) {
    const providerRoot = path.join(root, providerId);
    if (!fs.existsSync(providerRoot)) continue;
    const scriptPath = path.resolve(providerRoot, relativeScript);
    if (!isInsidePath(providerRoot, scriptPath)) {
      throw new Error(`插件脚本路径越界：${relativeScript}`);
    }
    if (fs.existsSync(scriptPath) && path.extname(scriptPath).toLowerCase() === '.py') {
      return scriptPath;
    }
  }
  throw new Error(`无法找到插件脚本：${scriptName}`);
}

function findPythonScript(scriptName = 'import_feishu.py') {
  if (String(scriptName || '').startsWith('provider:')) {
    return findProviderScript(scriptName);
  }
  if (!ALLOWED_SCRIPTS.has(scriptName)) {
    throw new Error(`不允许执行的脚本：${scriptName}`);
  }

  const possiblePaths = [
    path.join(__dirname, '..', scriptName),
    path.join(process.cwd(), scriptName),
    path.join(app.getAppPath(), '..', scriptName),
    path.join(process.resourcesPath || '', 'python', scriptName)
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  throw new Error(`无法找到 ${scriptName} 脚本`);
}

function bundledPythonInfo() {
  const executable = process.platform === 'win32' ? 'python.exe' : path.join('bin', 'python3');
  const possibleRoots = [
    path.join(process.resourcesPath || '', 'python-runtime'),
    path.join(__dirname, 'runtime', 'python-runtime'),
    path.join(app.getAppPath(), 'runtime', 'python-runtime')
  ];

  for (const root of possibleRoots) {
    if (!root) {
      continue;
    }
    const command = path.join(root, executable);
    if (fs.existsSync(command)) {
      return { command, root };
    }
  }

  return null;
}

function pythonCommand() {
  const configuredPython = process.env.WANDAO_PYTHON || process.env.PYTHON;
  if (configuredPython) {
    return configuredPython;
  }
  const bundledPython = bundledPythonInfo();
  if (bundledPython) {
    return bundledPython.command;
  }
  return process.platform === 'win32' ? 'python' : 'python3';
}

function pythonEnv() {
  const env = {
    ...process.env,
    PYTHONIOENCODING: 'utf-8',
    PYTHONUNBUFFERED: '1',
    PYTHONUTF8: '1',
    WANDAO_DATA_DIR: app.getPath('userData')
  };
  const browserPath = selectedBrowserPath();
  if (browserPath) {
    env.WANDAO_BROWSER = browserPath;
  }
  const bundledPython = bundledPythonInfo();
  if (bundledPython) {
    const binDir = process.platform === 'win32' ? bundledPython.root : path.join(bundledPython.root, 'bin');
    const scriptsDir = process.platform === 'win32' ? path.join(bundledPython.root, 'Scripts') : path.join(bundledPython.root, 'bin');
    env.PATH = [binDir, scriptsDir, env.PATH].filter(Boolean).join(path.delimiter);
    env.PYTHONNOUSERSITE = '1';
    env.WANDAO_PYTHON_RUNTIME = bundledPython.root;
  }
  return env;
}

function commandLineLength(args) {
  return (args || []).reduce((total, value) => total + String(value || '').length + 3, 0);
}

function compressDocIdArgs(scriptName, args) {
  const supported = new Set(['export_onenote.py', 'export_wiz.py']);
  if (!supported.has(scriptName)) {
    return args;
  }

  const docIds = [];
  const compactArgs = [];
  for (let index = 0; index < (args || []).length; index += 1) {
    const value = String(args[index]);
    if (value === '--doc-id' && index + 1 < args.length) {
      docIds.push(String(args[index + 1]));
      index += 1;
    } else {
      compactArgs.push(value);
    }
  }

  if (!docIds.length || (docIds.length < 50 && commandLineLength(args) < 12000)) {
    return args;
  }

  const tmpDir = path.join(app.getPath('userData'), 'tmp');
  fs.mkdirSync(tmpDir, { recursive: true });
  const prefix = path.basename(scriptName, '.py').replace(/^export_/, '');
  const fileName = `${prefix}-doc-ids-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.json`;
  const filePath = path.join(tmpDir, fileName);
  fs.writeFileSync(filePath, JSON.stringify({ docIds }, null, 2), 'utf-8');
  return [...compactArgs, '--doc-id-file', filePath];
}

function parseLastJson(stdout) {
  const trimmed = stdout.trim();
  if (!trimmed) {
    return {};
  }
  try {
    return JSON.parse(trimmed);
  } catch (_error) {
    const start = Math.max(trimmed.lastIndexOf('\n{'), trimmed.lastIndexOf('\n['));
    if (start >= 0) {
      const jsonText = trimmed.slice(start + 1);
      try {
        return JSON.parse(jsonText);
      } catch (_ignored) {
        return { output: stdout };
      }
    }
    return { output: stdout };
  }
}

function createWindow() {
  const icon = appIconPath();
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    icon,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    backgroundColor: '#f7f5f1',
    show: false
  });

  mainWindow.loadFile('renderer/index.html');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    cleanupPythonProcess();
  });
}

function showAboutDialog() {
  const detail = [
    PROJECT_INFO.slogan,
    '',
    `版本：${PROJECT_INFO.version}`,
    `作者：${PROJECT_INFO.author}`,
    `GitHub：${PROJECT_INFO.github}`,
    `微信：${PROJECT_INFO.wechat}`,
    '',
    '请只处理自己有权限访问的内容，并遵守目标平台服务条款。'
  ].join('\n');

  dialog.showMessageBox(mainWindow || undefined, {
    type: 'info',
    title: `关于 ${PROJECT_INFO.name}`,
    message: PROJECT_INFO.name,
    detail,
    buttons: ['知道了'],
    noLink: true
  });
}

function openProjectUrl(url) {
  shell.openExternal(url).catch((error) => {
    dialog.showErrorBox('打开链接失败', error.message || String(error));
  });
}

function parseVersion(version) {
  return String(version || '')
    .replace(/^v/i, '')
    .split('.')
    .map((part) => Number.parseInt(part, 10))
    .map((part) => (Number.isFinite(part) ? part : 0));
}

function compareVersions(a, b) {
  const left = parseVersion(a);
  const right = parseVersion(b);
  const length = Math.max(left.length, right.length);
  for (let i = 0; i < length; i += 1) {
    const diff = (left[i] || 0) - (right[i] || 0);
    if (diff > 0) return 1;
    if (diff < 0) return -1;
  }
  return 0;
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'wandao-update-checker'
      },
      timeout: 12000
    }, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => {
        body += chunk;
      });
      response.on('end', () => {
        if (response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error(`GitHub 返回 HTTP ${response.statusCode}`));
          return;
        }
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(new Error(`解析更新信息失败：${error.message}`));
        }
      });
    });
    request.on('timeout', () => {
      request.destroy(new Error('检查更新超时'));
    });
    request.on('error', reject);
  });
}

function isAllowedRemoteTextUrl(value) {
  try {
    const parsed = new URL(String(value || ''));
    if (parsed.protocol !== 'https:') return false;
    if (parsed.hostname === 'raw.githubusercontent.com') {
      return parsed.pathname.startsWith('/tllovesxs/wandao/');
    }
    if (parsed.hostname === 'github.com') {
      return parsed.pathname.startsWith('/tllovesxs/wandao/');
    }
    return false;
  } catch (_error) {
    return false;
  }
}

function fetchText(url) {
  if (!isAllowedRemoteTextUrl(url)) {
    return Promise.reject(new Error('只允许读取万能导 GitHub 仓库中的公告和教程文档'));
  }
  return new Promise((resolve, reject) => {
    const request = https.get(url, {
      headers: {
        Accept: 'text/plain, application/json, text/markdown, */*',
        'User-Agent': 'wandao-docs-center'
      },
      timeout: 12000
    }, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => {
        body += chunk;
        if (body.length > 1024 * 1024) {
          request.destroy(new Error('公告文档超过 1MB，已停止读取'));
        }
      });
      response.on('end', () => {
        if (response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error(`GitHub 返回 HTTP ${response.statusCode}`));
          return;
        }
        resolve(body);
      });
    });
    request.on('timeout', () => {
      request.destroy(new Error('读取 GitHub 文档超时'));
    });
    request.on('error', reject);
  });
}

async function checkForUpdates() {
  const release = await fetchJson(PROJECT_INFO.latestReleaseApi);
  const latestVersion = String(release.tag_name || '').replace(/^v/i, '') || '0.0.0';
  const currentVersion = PROJECT_INFO.version;
  return {
    currentVersion,
    latestVersion,
    latestTag: release.tag_name || `v${latestVersion}`,
    releaseUrl: release.html_url || PROJECT_INFO.releases,
    releaseName: release.name || release.tag_name || latestVersion,
    publishedAt: release.published_at || '',
    hasUpdate: compareVersions(latestVersion, currentVersion) > 0
  };
}

function buildApplicationMenu() {
  const template = [
    {
      label: '文件',
      submenu: [
        {
          label: '停止当前任务',
          click: cleanupPythonProcess
        },
        { type: 'separator' },
        process.platform === 'darwin'
          ? { role: 'close', label: '关闭窗口' }
          : { role: 'quit', label: '退出' }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo', label: '撤销' },
        { role: 'redo', label: '重做' },
        { type: 'separator' },
        { role: 'cut', label: '剪切' },
        { role: 'copy', label: '复制' },
        { role: 'paste', label: '粘贴' },
        { role: 'selectAll', label: '全选' }
      ]
    },
    {
      label: '视图',
      submenu: [
        { role: 'reload', label: '刷新' },
        { role: 'toggleDevTools', label: '开发者工具' },
        { type: 'separator' },
        { role: 'resetZoom', label: '实际大小' },
        { role: 'zoomIn', label: '放大' },
        { role: 'zoomOut', label: '缩小' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '全屏' }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '新手模式 / 使用教程',
          click: () => openProjectUrl(PROJECT_INFO.docs)
        },
        { type: 'separator' },
        {
          label: '项目主页 GitHub',
          click: () => openProjectUrl(PROJECT_INFO.github)
        },
        {
          label: '下载发行版',
          click: () => openProjectUrl(PROJECT_INFO.releases)
        },
        {
          label: '检查更新',
          click: async () => {
            try {
              const result = await checkForUpdates();
              if (mainWindow) {
                mainWindow.webContents.send('app-info', result.hasUpdate
                  ? `发现新版本：v${result.latestVersion}`
                  : `当前已是最新版本：v${result.currentVersion}`);
              }
            } catch (error) {
              if (mainWindow) {
                mainWindow.webContents.send('app-info', `检查更新失败：${error.message || String(error)}`);
              }
            }
          }
        },
        {
          label: '问题反馈',
          click: () => openProjectUrl(PROJECT_INFO.issues)
        },
        { type: 'separator' },
        {
          label: '复制微信号',
          click: () => {
            clipboard.writeText(PROJECT_INFO.wechat);
            if (mainWindow) {
              mainWindow.webContents.send('app-info', `已复制微信号：${PROJECT_INFO.wechat}`);
            }
          }
        },
        {
          label: `关于 ${PROJECT_INFO.name}`,
          click: showAboutDialog
        }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(() => {
  configureAppIdentity();
  buildApplicationMenu();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', cleanupPythonProcess);

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers
ipcMain.handle('select-directory', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: options?.title || '选择目录',
    defaultPath: options?.defaultPath || ''
  });

  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('select-file', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    title: options?.title || '选择文件',
    defaultPath: options?.defaultPath || '',
    filters: options?.filters || []
  });

  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('select-browser-file', async () => {
  const properties = process.platform === 'darwin'
    ? ['openFile', 'openDirectory', 'treatPackageAsDirectory']
    : ['openFile'];
  const result = await dialog.showOpenDialog(mainWindow, {
    properties,
    title: '选择浏览器',
    filters: process.platform === 'win32'
      ? [
        { name: '浏览器可执行文件', extensions: ['exe'] },
        { name: '所有文件', extensions: ['*'] }
      ]
      : []
  });

  if (result.canceled || !result.filePaths[0]) {
    return { success: false, canceled: true };
  }
  const browserPath = normalizeBrowserExecutable(result.filePaths[0]);
  if (!browserPath) {
    return { success: false, error: '请选择 Chrome、Edge 或 Chromium 的可执行文件。' };
  }
  return { success: true, path: browserPath };
});

ipcMain.handle('save-file', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: options?.title || '保存文件',
    defaultPath: options?.defaultPath || '',
    filters: options?.filters || []
  });

  return result.canceled ? null : result.filePath;
});

ipcMain.handle('fetch-remote-text', async (event, url) => {
  try {
    const content = await fetchText(url);
    return { success: true, content };
  } catch (error) {
    return { success: false, error: error.message || String(error) };
  }
});

ipcMain.handle('run-python-command', async (event, scriptName, args, options = {}) => {
  return new Promise((resolve, reject) => {
    let scriptPath;
    let commandArgs;
    try {
      scriptPath = findPythonScript(scriptName);
      commandArgs = compressDocIdArgs(scriptName, args || []);
    } catch (error) {
      resolve({ success: false, error: error.message || String(error) });
      return;
    }
    const pythonArgs = [scriptPath, ...commandArgs];

    const proc = spawn(pythonCommand(), pythonArgs, {
      cwd: path.dirname(scriptPath),
      stdio: ['pipe', 'pipe', 'pipe'],
      env: pythonEnv()
    });

    if (options?.stdinText) {
      proc.stdin.write(String(options.stdinText));
      proc.stdin.end();
    }

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      const text = data.toString();
      stdout += text;
      // 实时发送日志到渲染进程
      if (mainWindow) {
        mainWindow.webContents.send('python-log', text);
      }
    });

    proc.stderr.on('data', (data) => {
      const text = data.toString();
      stderr += text;
      if (mainWindow) {
        mainWindow.webContents.send('python-log', text);
      }
    });

    proc.on('close', (code) => {
      pythonProcess = null;
      if (code === 0) {
        resolve({ success: true, data: parseLastJson(stdout) });
      } else {
        resolve({ success: false, error: stderr || stdout || `Python exited with code ${code}`, code });
      }
    });

    proc.on('error', (error) => {
      pythonProcess = null;
      resolve({ success: false, error: error.message || String(error) });
    });

    // 保存进程引用以便停止
    pythonProcess = proc;
  });
});

ipcMain.handle('stop-python-process', async () => {
  if (pythonProcess) {
    pythonProcess.kill('SIGTERM');
    pythonProcess = null;
    return { success: true };
  }
  return { success: false, error: '没有正在运行的任务' };
});

ipcMain.handle('send-python-input', async (event, text) => {
  if (!pythonProcess || !pythonProcess.stdin || pythonProcess.stdin.destroyed) {
    return { success: false, error: '没有正在等待输入的任务' };
  }
  try {
    pythonProcess.stdin.write(text || '\n');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message || String(error) };
  }
});

ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return { success: true, content };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('write-file', async (event, filePath, content) => {
  try {
    fs.writeFileSync(filePath, content, 'utf-8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('file-exists', async (event, filePath) => {
  return fs.existsSync(filePath);
});

ipcMain.handle('open-path', async (event, targetPath) => {
  const error = await shell.openPath(targetPath);
  return error ? { success: false, error } : { success: true };
});

ipcMain.handle('open-external', async (event, url) => {
  try {
    await shell.openExternal(url);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('show-about', async () => {
  showAboutDialog();
  return { success: true };
});

ipcMain.handle('check-for-updates', async () => {
  try {
    const result = await checkForUpdates();
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message || String(error) };
  }
});

ipcMain.handle('get-app-settings', async () => {
  return { success: true, settings: publicAppSettings() };
});

ipcMain.handle('save-app-settings', async (event, update) => {
  const result = saveAppSettings(update || {});
  if (!result.success) return result;
  return {
    ...result,
    browsers: detectBrowsers(),
    downloadUrl: BROWSER_DOWNLOAD_URL
  };
});

ipcMain.handle('detect-browsers', async () => {
  return {
    success: true,
    browsers: detectBrowsers(),
    selectedBrowserPath: selectedBrowserPath(),
    downloadUrl: BROWSER_DOWNLOAD_URL
  };
});

ipcMain.handle('get-provider-manifests', async () => {
  try {
    return { success: true, providers: discoverProviderManifests() };
  } catch (error) {
    return { success: false, error: error.message || String(error), providers: [] };
  }
});

ipcMain.handle('copy-text', async (event, text) => {
  clipboard.writeText(String(text || ''));
  return { success: true };
});

ipcMain.handle('get-app-path', async () => {
  const userData = app.getPath('userData');
  return {
    appPath: app.getAppPath(),
    userData,
    dataRoot: userData,
    projectRoot: path.dirname(findPythonScript('import_feishu.py'))
  };
});
