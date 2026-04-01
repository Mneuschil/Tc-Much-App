import { prisma } from '../config/database';
import type { CourtDamageInput, MediaUploadInput } from '@tennis-club/shared';
import * as pushService from './push.service';

// Spec section 14: Court Damage Report → creates todo for groundskeeper → status tracking

const VALID_TRANSITIONS: Record<string, string[]> = {
  submitted: ['in_progress'],
  in_progress: ['resolved'],
  resolved: [],
};

export async function submitCourtDamage(input: CourtDamageInput, clubId: string, submittedById: string) {
  // Create todo for groundskeeper (linked via formSubmission)
  const todo = await prisma.todo.create({
    data: {
      title: `Platzschaden Platz ${input.courtNumber}`,
      description: input.description,
      assigneeId: submittedById, // Will be reassigned by admin to groundskeeper
      scope: 'BOARD',
      clubId,
      createdById: submittedById,
    },
  });

  return prisma.formSubmission.create({
    data: {
      type: 'COURT_DAMAGE',
      data: input as unknown as Parameters<typeof prisma.formSubmission.create>[0]['data']['data'],
      clubId,
      submittedById,
      todoId: todo.id,
      status: 'submitted',
    },
    include: {
      todo: true,
      submittedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}

export async function submitMediaUpload(input: MediaUploadInput, clubId: string, submittedById: string) {
  return prisma.formSubmission.create({
    data: {
      type: 'MEDIA_UPLOAD',
      data: input as unknown as Parameters<typeof prisma.formSubmission.create>[0]['data']['data'],
      clubId,
      submittedById,
    },
    include: {
      submittedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}

export async function getCourtDamageReports(clubId: string) {
  return prisma.formSubmission.findMany({
    where: { clubId, type: 'COURT_DAMAGE' },
    include: {
      todo: true,
      submittedBy: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getFormStatus(formId: string, clubId: string) {
  return prisma.formSubmission.findFirst({
    where: { id: formId, clubId },
    include: {
      todo: true,
      submittedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}

export async function updateFormStatus(formId: string, clubId: string, newStatus: string) {
  const form = await prisma.formSubmission.findFirst({ where: { id: formId, clubId } });
  if (!form) {
    throw Object.assign(new Error('Formular nicht gefunden'), { statusCode: 404 });
  }

  const allowed = VALID_TRANSITIONS[form.status];
  if (!allowed || !allowed.includes(newStatus)) {
    throw Object.assign(
      new Error(`Statuswechsel von "${form.status}" zu "${newStatus}" nicht erlaubt`),
      { statusCode: 400 },
    );
  }

  await prisma.formSubmission.update({
    where: { id: formId },
    data: { status: newStatus },
  });

  // Push to original submitter
  const statusLabels: Record<string, string> = {
    in_progress: 'In Bearbeitung',
    resolved: 'Erledigt',
  };

  await pushService.sendToUsers([form.submittedById], {
    title: 'Platzschaden-Update',
    body: `Deine Meldung ist jetzt: ${statusLabels[newStatus] || newStatus}`,
    data: { formId },
  });

  return prisma.formSubmission.findFirst({
    where: { id: formId },
    include: {
      todo: true,
      submittedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}
