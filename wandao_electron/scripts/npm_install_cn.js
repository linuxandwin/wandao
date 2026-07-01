const { spawnSync } = require('child_process');

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const env = {
  ...process.env,
  ELECTRON_MIRROR: 'https://npmmirror.com/mirrors/electron/',
  npm_config_electron_mirror: 'https://npmmirror.com/mirrors/electron/',
  ELECTRON_BUILDER_BINARIES_MIRROR: 'https://npmmirror.com/mirrors/electron-builder-binaries/',
  npm_config_electron_builder_binaries_mirror: 'https://npmmirror.com/mirrors/electron-builder-binaries/'
};

const result = spawnSync(npmCommand, [
  'install',
  '--registry=https://registry.npmmirror.com/',
  '--verbose'
], {
  stdio: 'inherit',
  env
});

process.exit(result.status ?? 1);
