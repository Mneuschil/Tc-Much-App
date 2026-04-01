import { prisma } from '../config/database';

// Spec section 13: channel-based storage, folder creation (board/admin only)

export async function getFilesForChannel(channelId: string, folderId?: string) {
  return prisma.file.findMany({
    where: {
      channelId,
      ...(folderId ? { folderId } : { folderId: null }),
    },
    include: {
      uploadedBy: { select: { id: true, firstName: true, lastName: true } },
      folder: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getFoldersForChannel(channelId: string) {
  return prisma.fileFolder.findMany({
    where: { channelId },
    include: {
      _count: { select: { files: true } },
      createdBy: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { name: 'asc' },
  });
}

export async function createFolder(name: string, clubId: string, createdById: string, channelId?: string) {
  return prisma.fileFolder.create({
    data: { name, channelId, clubId, createdById },
  });
}

export async function createFileRecord(
  name: string,
  url: string,
  mimeType: string,
  size: number,
  clubId: string,
  uploadedById: string,
  channelId?: string,
  folderId?: string,
) {
  return prisma.file.create({
    data: { name, url, mimeType, size, channelId, folderId, clubId, uploadedById },
  });
}

export async function deleteFile(fileId: string, clubId: string) {
  return prisma.file.deleteMany({ where: { id: fileId, clubId } });
}
