// services/uploadCloudinary.ts
type UploadOpts = {
  folder: string;                 // ex.: `users/<uid>`
  uploadPreset: string;           // ex.: 'ecocollab_unsigned'
  publicId?: string;              // ex.: 'avatar'
  tags?: string[];                // ex.: ['user','<uid>']
  context?: Record<string, string>;
  contentType?: string;           // 'image/jpeg' | 'image/png'
};

const CLOUD_NAME = 'dotm578o4';        // <- coloca o teu cloud_name
export const CLOUDINARY_UPLOAD_PRESET = 'ecocollab_unsigned'; // <- nome do preset

export async function uploadToCloudinary(localUri: string, opts: UploadOpts) {
  const data = new FormData();
  data.append('file', {
    uri: localUri,
    name: (opts.publicId ?? 'upload') + '.jpg',
    type: opts.contentType ?? 'image/jpeg',
  } as any);
  data.append('upload_preset', opts.uploadPreset);
  data.append('folder', opts.folder);
  if (opts.publicId) data.append('public_id', opts.publicId);
  if (opts.tags?.length) data.append('tags', opts.tags.join(','));
  if (opts.context) {
    const ctx = Object.entries(opts.context).map(([k, v]) => `${k}=${v}`).join('|');
    data.append('context', ctx);
  }

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: data,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message || 'Falha no upload');

  return json as {
    secure_url: string;     // URL final (CDN)
    public_id: string;      // ex.: 'users/<uid>/avatar'
    width: number;
    height: number;
    bytes: number;
    format: string;
    version: number;
  };
}
