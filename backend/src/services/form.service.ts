import { prisma } from '../config/database';
import { FormSubmissionStatus } from '@tennis-club/shared';
import type { CourtDamageInput, MediaUploadInput } from '@tennis-club/shared';
import * as pushService from './push.service';

// Spec section 14: Court Damage Report → creates todo for groundskeeper → status tracking

const VALID_TRANSITIONS: Record<FormSubmissionStatus, FormSubmissionStatus[]> = {
  [FormSubmissionStatus.SUBMITTED]: [FormSubmissionStatus.IN_PROGRESS],
  [FormSubmissionStatus.IN_PROGRESS]: [FormSubmissionStatus.RESOLVED],
  [FormSubmissionStatus.RESOLVED]: [],
};

export async function submitCourtDamage(
  input: CourtDamageInput,
  clubId: string,
  submittedById: string,
) {
  return prisma.$transaction(async (tx) => {
    const todo = await tx.todo.create({
      data: {
        title: `Platzschaden Platz ${input.courtNumber}`,
        description: input.description,
        assigneeId: submittedById,
        scope: 'BOARD',
        clubId,
        createdById: submittedById,
      },
    });

    return tx.formSubmission.create({
      data: {
        type: 'COURT_DAMAGE',
        data: input as unknown as Parameters<typeof tx.formSubmission.create>[0]['data']['data'],
        clubId,
        submittedById,
        todoId: todo.id,
        status: FormSubmissionStatus.SUBMITTED,
      },
      include: {
        todo: true,
        submittedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  });
}

export async function submitMediaUpload(
  input: MediaUploadInput,
  clubId: string,
  submittedById: string,
) {
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

export async function updateFormStatus(
  formId: string,
  clubId: string,
  newStatus: FormSubmissionStatus,
) {
  const form = await prisma.formSubmission.findFirst({ where: { id: formId, clubId } });
  if (!form) {
    throw Object.assign(new Error('Formular nicht gefunden'), { statusCode: 404 });
  }

  const currentStatus = form.status as FormSubmissionStatus;
  const allowed = VALID_TRANSITIONS[currentStatus];
  if (!allowed || !allowed.includes(newStatus)) {
    throw Object.assign(
      new Error(`Statuswechsel von "${currentStatus}" zu "${newStatus}" nicht erlaubt`),
      { statusCode: 400 },
    );
  }

  await prisma.formSubmission.update({
    where: { id: formId },
    data: { status: newStatus },
  });

  // Push to original submitter
  const statusLabels: Record<string, string> = {
    [FormSubmissionStatus.IN_PROGRESS]: 'In Bearbeitung',
    [FormSubmissionStatus.RESOLVED]: 'Erledigt',
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
