// plugins/with-android-maps-key.ts
import {
    AndroidConfig,
    ConfigPlugin,
    withAndroidManifest,
} from '@expo/config-plugins';

type PluginProps = { apiKey?: string };

const withAndroidMapsKey: ConfigPlugin<PluginProps> = (config, props = {}) => {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults;
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);

    // Remove meta-data existente (evita duplicados)
    application['meta-data'] = (application['meta-data'] || []).filter(
      (m: any) => m.$?.['android:name'] !== 'com.google.android.geo.API_KEY'
    );

    // Descobre a key (via props ou env)
    const apiKey = props.apiKey || process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      // Não falha o build, só avisa
      console.warn(
        '[with-android-maps-key] GOOGLE_MAPS_API_KEY não definida. ' +
        'Define nos props do plugin ou em env var.'
      );
      return cfg;
    }

    // Adiciona nova meta-data
    application['meta-data'].push({
      $: {
        'android:name': 'com.google.android.geo.API_KEY',
        'android:value': apiKey,
      },
    });

    return cfg;
  });
};

export default withAndroidMapsKey;
