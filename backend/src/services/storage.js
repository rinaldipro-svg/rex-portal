import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

// Configuration S3 ou Cloudflare R2
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1',
  // Pour Cloudflare R2, décommenter:
  // endpoint: process.env.AWS_ENDPOINT,
  // s3ForcePathStyle: true,
  signatureVersion: 'v4'
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET;

/**
 * Upload un fichier sur S3/R2
 * @param {Buffer} buffer - Contenu du fichier
 * @param {string} filename - Nom du fichier
 * @param {string} contentType - Type MIME
 * @returns {Promise<{url: string, key: string}>}
 */
export async function uploadToS3(buffer, filename, contentType = 'application/pdf') {
  try {
    const key = `rex/${new Date().getFullYear()}/${uuidv4()}-${filename}`;

    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: 'private', // ou 'public-read' si vous voulez des URLs publiques
      Metadata: {
        uploadedAt: new Date().toISOString()
      }
    };

    const result = await s3.upload(params).promise();

    return {
      url: result.Location,
      key: result.Key,
      etag: result.ETag
    };
  } catch (error) {
    console.error('S3 upload error:', error);
    throw new Error('Erreur lors de l\'upload du fichier');
  }
}

/**
 * Récupère une URL signée pour télécharger un fichier
 * @param {string} key - Clé S3 du fichier
 * @param {number} expiresIn - Durée de validité en secondes (défaut: 1h)
 * @returns {Promise<string>}
 */
export async function getSignedUrl(key, expiresIn = 3600) {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
      Expires: expiresIn
    };

    const url = await s3.getSignedUrlPromise('getObject', params);
    return url;
  } catch (error) {
    console.error('Get signed URL error:', error);
    throw new Error('Erreur lors de la génération de l\'URL');
  }
}

/**
 * Supprime un fichier de S3/R2
 * @param {string} key - Clé S3 du fichier
 * @returns {Promise<void>}
 */
export async function deleteFromS3(key) {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Key: key
    };

    await s3.deleteObject(params).promise();
  } catch (error) {
    console.error('S3 delete error:', error);
    throw new Error('Erreur lors de la suppression du fichier');
  }
}

/**
 * Vérifie si un fichier existe
 * @param {string} key - Clé S3 du fichier
 * @returns {Promise<boolean>}
 */
export async function fileExists(key) {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Key: key
    };

    await s3.headObject(params).promise();
    return true;
  } catch (error) {
    if (error.code === 'NotFound') {
      return false;
    }
    throw error;
  }
}
