import { prisma } from '../config/database';
import type { CreateClubInput, UpdateClubInput } from '@tennis-club/shared';
import { seedDefaultChannels } from './channel.service';

export class ClubError extends Error {
  code: string;
  statusCode: number;
  constructor(message: string, code: string, statusCode: number) {
    super(message);
    this.name = 'ClubError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export async function createClub(input: CreateClubInput, createdById: string) {
  const existing = await prisma.club.findUnique({ where: { clubCode: input.clubCode } });
  if (existing) {
    throw new ClubError('Club-Code existiert bereits', 'CLUB_CODE_EXISTS', 409);
  }

  const club = await prisma.club.create({
    data: {
      name: input.name,
      clubCode: input.clubCode,
      primaryColor: input.primaryColor ?? '#023320',
      secondaryColor: input.secondaryColor ?? '#0EA65A',
      address: input.address,
      website: input.website,
      logo: input.logo,
    },
  });

  await seedDefaultChannels(club.id, createdById);
  return club;
}

export async function getClubById(clubId: string) {
  const club = await prisma.club.findUnique({ where: { id: clubId } });
  if (!club) {
    throw new ClubError('Club nicht gefunden', 'CLUB_NOT_FOUND', 404);
  }
  return club;
}

export async function updateClub(clubId: string, input: UpdateClubInput) {
  const club = await prisma.club.findUnique({ where: { id: clubId } });
  if (!club) {
    throw new ClubError('Club nicht gefunden', 'CLUB_NOT_FOUND', 404);
  }

  return prisma.club.update({
    where: { id: clubId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.primaryColor !== undefined ? { primaryColor: input.primaryColor } : {}),
      ...(input.secondaryColor !== undefined ? { secondaryColor: input.secondaryColor } : {}),
      ...(input.address !== undefined ? { address: input.address } : {}),
      ...(input.website !== undefined ? { website: input.website } : {}),
      ...(input.logo !== undefined ? { logo: input.logo } : {}),
    },
  });
}

export async function verifyClubCode(clubCode: string) {
  const club = await prisma.club.findUnique({
    where: { clubCode },
    select: { id: true, name: true, primaryColor: true, secondaryColor: true, logo: true },
  });
  if (!club) {
    throw new ClubError('Ungueltiger Club-Code', 'INVALID_CLUB_CODE', 404);
  }
  return club;
}
