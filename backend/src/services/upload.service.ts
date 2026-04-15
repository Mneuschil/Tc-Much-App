import path from 'path';
import fs from 'fs/promises';
import multer from 'multer';
import sharp from 'sharp';
import { env } from '../config/env';
import { prisma } from '../config/database';
import { AppError } from '../utils/AppError';

const MAX_IMAGE_WIDTH = 1920;
const IMAGE_MIMETYPES = ['image/jpeg', 'image/png', 'image/webp'];

function getUploadDir(clubId: string): string {
  return path.join(env.UPLOAD_DIR, clubId);
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

// Multer config: memory storage for sharp processing
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: env.MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('Dateityp nicht erlaubt', 400) as unknown as null, false);
    }
  },
});

export async function processAndSave(
  file: Express.Multer.File,
  clubId: string,
  uploadedById: string,
  channelId?: string,
  folderId?: string,
): Promise<{ id: string; name: string; url: string; mimeType: string; size: number }> {
  const uploadDir = getUploadDir(clubId);
  await ensureDir(uploadDir);

  const ext = path.extname(file.originalname).toLowerCase();
  const baseName = path.basename(file.originalname, ext);
  const uniqueName = `${baseName}-${Date.now()}${ext}`;
  const filePath = path.join(uploadDir, uniqueName);

  let finalBuffer = file.buffer;
  let finalSize = file.size;
  let finalMimeType = file.mimetype;

  // Compress images with sharp (AC-06: max 1920px)
  if (IMAGE_MIMETYPES.includes(file.mimetype)) {
    finalBuffer = await sharp(file.buffer)
      .resize(MAX_IMAGE_WIDTH, MAX_IMAGE_WIDTH, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();
    finalSize = finalBuffer.length;
    finalMimeType = 'image/jpeg';
  }

  await fs.writeFile(filePath, finalBuffer);

  const url = `/uploads/${clubId}/${uniqueName}`;

  const record = await prisma.file.create({
    data: {
      name: file.originalname,
      url,
      mimeType: finalMimeType,
      size: finalSize,
      clubId,
      uploadedById,
      channelId: channelId || null,
      folderId: folderId || null,
    },
    include: {
      uploadedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  return {
    id: record.id,
    name: record.name,
    url: record.url,
    mimeType: record.mimeType,
    size: record.size,
  };
}

export async function deleteFileWithAuth(
  fileId: string,
  userId: string,
  clubId: string,
  isAdmin: boolean,
) {
  const file = await prisma.file.findFirst({ where: { id: fileId, clubId } });
  if (!file) {
    throw AppError.notFound('Datei nicht gefunden');
  }

  if (file.uploadedById !== userId && !isAdmin) {
    throw AppError.forbidden('Nur der Uploader oder ein Admin kann diese Datei loeschen');
  }

  // Delete physical file (best effort)
  const filePath = path.join(env.UPLOAD_DIR, file.url.replace('/uploads/', ''));
  try {
    await fs.unlink(filePath);
  } catch {
    // File may not exist on disk in test env
  }

  await prisma.file.delete({ where: { id: fileId } });
  return { deleted: true };
}
