import slugify from 'slugify';
import { isSupabaseConfigured, supabase } from './supabase.js';
import { reportError } from './errors.js';

const PRODUCT_BUCKET = 'product-images';
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export async function uploadProductImage(file) {
  try {
    if (!file) return null;
    if (!isSupabaseConfigured) throw new Error('Supabase belum dikonfigurasi.');
    if (!file.type.startsWith('image/')) throw new Error('File harus berupa gambar.');
    if (file.size > MAX_IMAGE_SIZE) throw new Error('Ukuran gambar maksimal 5 MB.');

    const extension = file.name.split('.').pop();
    const safeName = slugify(file.name.replace(/\.[^/.]+$/, ''), { lower: true, strict: true }) || 'product';
    const id = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const path = `${id}-${safeName}.${extension}`;

    const { error } = await supabase.storage
      .from(PRODUCT_BUCKET)
      .upload(path, file, {
        cacheControl: '31536000',
        contentType: file.type,
        upsert: false
      });

    if (error) throw error;

    const { data } = supabase.storage.from(PRODUCT_BUCKET).getPublicUrl(path);
    if (!data?.publicUrl) throw new Error('Public URL gambar tidak tersedia.');
    return data.publicUrl;
  } catch (error) {
    throw new Error(reportError('storage.productImage', error));
  }
}
