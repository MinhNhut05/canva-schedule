import "server-only";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

import { getStorageEnv } from "@/lib/env";

let client: S3Client | null = null;

function getClient() {
  if (client) {
    return client;
  }

  const env = getStorageEnv();

  client = new S3Client({
    region: env.S3_REGION,
    endpoint: env.S3_ENDPOINT,
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    },
    forcePathStyle: Boolean(env.S3_ENDPOINT),
  });

  return client;
}

function joinPublicUrl(baseUrl: string, key: string) {
  return `${baseUrl.replace(/\/+$/, "")}/${key.replace(/^\/+/, "")}`;
}

export interface PutImageOptions {
  key: string;
  bytes: Uint8Array;
  contentType: string;
}

export async function putImage({ key, bytes, contentType }: PutImageOptions) {
  const env = getStorageEnv();

  await getClient().send(
    new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
      Body: bytes,
      ContentType: contentType,
    }),
  );

  return joinPublicUrl(env.S3_PUBLIC_URL, key);
}
