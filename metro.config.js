// metro.config.js
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  // Mantém a tua customização do symbolicator
  config.symbolicator = {
    customizeFrame: (frame) => {
      try {
        if (frame && typeof frame.file === 'string' && frame.file.includes('<anonymous>')) {
          // colapsa frames "anónimos" no stacktrace
          return { ...frame, collapse: true };
        }
      } catch {}
      return frame;
    },
  };

  // Shim para satisfazer @tensorflow/tfjs-react-native quando tenta requerer 'react-native-fs'
  config.resolver = {
    ...config.resolver,
    extraNodeModules: {
      ...(config.resolver?.extraNodeModules || {}),
      'react-native-fs': path.resolve(__dirname, 'shims/react-native-fs.js'),
    },
  };

  return config;
})();
