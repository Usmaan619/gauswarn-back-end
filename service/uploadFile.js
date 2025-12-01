const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const { v4: uuid } = require("uuid");
require("dotenv").config();

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

exports.deleteFromS3 = async (fileUrl) => {
  try {
    if (!fileUrl) return;

    // Extract S3 Key from URL
    const key = fileUrl.split(".amazonaws.com/")[1];

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    };

    await s3.send(new DeleteObjectCommand(params));
    console.log("Old image deleted:", key);
  } catch (err) {
    console.log("Delete error:", err.message);
  }
};

/**
 * Upload file buffer to S3 inside product folder
 * @param {Buffer} buffer
 * @param {string} mimetype
 * @param {string} product_id
 * @returns public image URL
 */

exports.uploadProductImage = async (buffer, mimetype, product_id) => {
  const ext = mimetype.split("/")[1];
  const fileName = `${uuid()}.${ext}`;

  // FOLDER FORMAT: products/<product_id>/<uuid>.<ext>
  const Key = `products/${product_id}/${fileName}`;

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key,
    Body: buffer,
    ContentType: mimetype,
    // ACL: "public-read"
  };

  await s3.send(new PutObjectCommand(params));

  return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${Key}`;
};

// -------------------- FILE / BUFFER UPLOAD --------------------
exports.uploadBufferToS3 = async (buffer, mimetype) => {
  const Key = `uploads/${uuid()}.${mimetype.split("/")[1]}`;

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key,
    Body: buffer,
    ContentType: mimetype,
    // ACL: "public-read",
  };

  await s3.send(new PutObjectCommand(params));

  return `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${Key}`;
};

// -------------------- BASE64 UPLOAD --------------------
exports.uploadBase64ToS3 = async (base64String) => {
  const matches = base64String.match(/^data:(.+);base64,(.+)$/);

  if (!matches) throw new Error("Invalid base64 format");

  const mimetype = matches[1];
  const buffer = Buffer.from(matches[2], "base64");

  return this.uploadBufferToS3(buffer, mimetype);
};

exports.uploadMultipleBuffersToS3 = async (files) => {
  // files = [{ buffer, mimetype }, { buffer, mimetype }, ... ]

  const uploadPromises = files.map(async (file) => {
    const Key = `uploads/${uuid()}.${file.mimetype.split("/")[1]}`;

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    await s3.send(new PutObjectCommand(params));
    return {
      url: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${Key}`,
      key: Key,
    };
  });

  return await Promise.all(uploadPromises);
};
