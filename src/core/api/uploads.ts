import { api } from './client';

export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append('files', file);
  const { data } = await api.post('/uploads', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  const url = data?.data?.urls?.[0];
  if (!url) throw new Error('Upload succeeded but no URL returned');
  return url;
}
