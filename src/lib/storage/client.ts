import {
  S3Client,
  CreateBucketCommand,
  HeadBucketCommand,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

const BUCKET = process.env.MINIO_BUCKET ?? "mitsumorukun";
const ENDPOINT =
  process.env.MINIO_ENDPOINT ?? `http://localhost:${process.env.MINIO_PORT ?? "9000"}`;

const globalForS3 = globalThis as unknown as {
  s3: S3Client | undefined;
  bucketReady: Promise<void> | undefined;
};

function createClient(): S3Client {
  const accessKeyId = process.env.MINIO_ROOT_USER;
  const secretAccessKey = process.env.MINIO_ROOT_PASSWORD;
  if (!accessKeyId || !secretAccessKey) {
    throw new Error("MINIO_ROOT_USER / MINIO_ROOT_PASSWORD が .env に設定されていません");
  }
  return new S3Client({
    endpoint: ENDPOINT,
    region: process.env.MINIO_REGION ?? "us-east-1",
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });
}

export const s3: S3Client = globalForS3.s3 ?? createClient();
if (process.env.NODE_ENV !== "production") globalForS3.s3 = s3;

async function ensureBucket(): Promise<void> {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: BUCKET }));
  } catch {
    await s3.send(new CreateBucketCommand({ Bucket: BUCKET }));
  }
}

function bucketReady(): Promise<void> {
  if (!globalForS3.bucketReady) {
    globalForS3.bucketReady = ensureBucket().catch((err) => {
      globalForS3.bucketReady = undefined;
      throw err;
    });
  }
  return globalForS3.bucketReady;
}

export async function putObject(input: {
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
}): Promise<void> {
  await bucketReady();
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType,
    }),
  );
}

export async function getObject(key: string): Promise<{
  body: Uint8Array;
  contentType: string | undefined;
}> {
  await bucketReady();
  const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  const body = await res.Body!.transformToByteArray();
  return { body, contentType: res.ContentType };
}

export async function deleteObject(key: string): Promise<void> {
  await bucketReady();
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}
