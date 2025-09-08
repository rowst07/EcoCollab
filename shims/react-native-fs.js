// shims/react-native-fs.js
// Shim minimalista para satisfazer o Metro. Não usamos RNFS na nossa integração.
module.exports = {
  // paths
  DocumentDirectoryPath: '',
  TemporaryDirectoryPath: '',
  CachesDirectoryPath: '',
  ExternalDirectoryPath: '',
  // no-ops
  exists: async () => false,
  mkdir: async () => {},
  readFile: async () => '',
  writeFile: async () => {},
  unlink: async () => {},
  // streams (não usados)
  downloadFile: () => ({ promise: Promise.resolve({ statusCode: 200 }) }),
};
