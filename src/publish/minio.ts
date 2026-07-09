import { Client } from 'minio';
import { secrets } from '../store/store.js';
import { log } from '../util/log.js';

const bucket = () => secrets().minio.bucket;
const PREFIX = 'reels/'; // all our objects live under this prefix

let _client: Client | null = null;
function client(): Client {
  if (!secrets().minio.endpoint) throw new Error('MINIO_ENDPOINT not set — cannot publish');
  if (!_client) {
    _client = new Client({
      endPoint: secrets().minio.endpoint,
      port: secrets().minio.port,
      useSSL: secrets().minio.useSSL,
      accessKey: secrets().minio.accessKey,
      secretKey: secrets().minio.secretKey,
    });
  }
  return _client;
}

/** Public URL Buffer's servers will fetch the media from. */
function publicUrl(objectName: string): string {
  return `${secrets().minio.publicUrl}/${bucket()}/${objectName}`;
}

/** Ensure the bucket exists and is public-read (so Buffer can fetch the video). */
async function ensureBucketPublic(): Promise<void> {
  const c = client();
  const exists = await c.bucketExists(bucket()).catch(() => false);
  if (!exists) await c.makeBucket(bucket());
  const policy = {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Principal: { AWS: ['*'] },
        Action: ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${bucket()}/*`],
      },
    ],
  };
  await c.setBucketPolicy(bucket(), JSON.stringify(policy)).catch((e) => {
    log.warn(`Could not set public bucket policy: ${e?.message ?? e}`);
  });
}

/** Upload a local file under the reels/ prefix; returns { objectName, url }. */
export async function uploadFile(
  localPath: string,
  objectBase: string,
  mime: string,
): Promise<{ objectName: string; url: string }> {
  await ensureBucketPublic();
  const objectName = `${PREFIX}${objectBase}`;
  await client().fPutObject(bucket(), objectName, localPath, { 'Content-Type': mime });
  return { objectName, url: publicUrl(objectName) };
}

export async function deleteObject(objectName: string): Promise<void> {
  await client().removeObject(bucket(), objectName).catch(() => {});
}

/** List our objects older than `olderThanMs`; used by prune. */
export async function listStaleObjects(olderThanMs: number, nowMs: number): Promise<string[]> {
  const c = client();
  const cutoff = nowMs - olderThanMs;
  const stale: string[] = [];
  await new Promise<void>((resolve, reject) => {
    const stream = c.listObjectsV2(bucket(), PREFIX, true);
    stream.on('data', (obj) => {
      const t = obj.lastModified ? new Date(obj.lastModified).getTime() : 0;
      if (obj.name && t && t < cutoff) stale.push(obj.name);
    });
    stream.on('end', () => resolve());
    stream.on('error', reject);
  });
  return stale;
}
