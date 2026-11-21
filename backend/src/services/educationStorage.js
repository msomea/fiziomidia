import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import config from "../config/index.js";

// Cloudflare R2 storage adapter for Education Resources.
// R2 is S3-compatible; region must be "auto" and endpoint is the
// account-specific R2 S3 endpoint.

const { r2, education } = config;

const s3 = new S3Client({
  region: r2.region || "auto",
  endpoint: r2.endpoint,
  credentials: {
    accessKeyId: r2.accessKeyId,
    secretAccessKey: r2.secretAccessKey,
  },
});

const bucket = () => r2.bucketName;

// Upload a file buffer to R2. Returns { bucket, key }.
export const uploadEducationFile = async ({ key, body, contentType }) => {
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
  return { bucket: bucket(), key };
};

// Generate a short-lived presigned GET URL for an object.
export const getSignedDownloadUrl = async ({ key, expiresIn }) => {
  const ttl =
    expiresIn || education.downloadUrlTtlSeconds || 300;
  return getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: bucket(), Key: key }),
    { expiresIn: ttl },
  );
};

// Check whether an object exists. Returns true/false.
export const educationFileExists = async ({ key }) => {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: bucket(), Key: key }));
    return true;
  } catch (err) {
    if (err.name === "NotFound" || err.$metadata?.httpStatusCode === 404) {
      return false;
    }
    throw err;
  }
};

// Delete an object. Returns { deleted: boolean }.
export const deleteEducationFile = async ({ key }) => {
  if (!key) return { deleted: false, reason: "No key provided" };
  try {
    await s3.send(
      new DeleteObjectCommand({ Bucket: bucket(), Key: key }),
    );
    return { deleted: true };
  } catch (error) {
    console.error("R2 deletion failed:", error);
    throw error;
  }
};

export default { uploadEducationFile, getSignedDownloadUrl, educationFileExists, deleteEducationFile };
