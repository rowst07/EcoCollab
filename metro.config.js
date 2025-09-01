// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);

// Ignora frames cujo "ficheiro" é "<anonymous>" para evitar o ENOENT
config.symbolicator = {
  customizeFrame: (frame) => {
    try {
      if (frame && typeof frame.file === 'string' && frame.file.includes('<anonymous>')) {
        return { collapse: true };
      }
    } catch {}
    return frame;
  },
};

module.exports = config;
