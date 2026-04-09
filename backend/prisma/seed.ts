import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { addWeeks, addDays, subHours } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Cleanup
  await prisma.messageReaction.deleteMany();
  await prisma.message.deleteMany();
  await prisma.channelMember.deleteMany();
  await prisma.channelMute.deleteMany();
  await prisma.channel.deleteMany();
  await prisma.matchLineup.deleteMany();
  await prisma.matchResult.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.trainingAttendance.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.tournamentMatch.deleteMany();
  await prisma.tournamentRegistration.deleteMany();
  await prisma.tournament.deleteMany();
  await prisma.ranking.deleteMany();
  await prisma.formSubmission.deleteMany();
  await prisma.todo.deleteMany();
  await prisma.file.deleteMany();
  await prisma.fileFolder.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.notificationPreference.deleteMany();
  await prisma.event.deleteMany();
  await prisma.pushToken.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.userRoleAssignment.deleteMany();
  await prisma.user.deleteMany();
  await prisma.club.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 12);

  // ─── Club ─────────────────────────────────────────────────────────
  const club = await prisma.club.create({
    data: {
      name: 'TC Much e.V.',
      clubCode: 'TCM026',
      primaryColor: '#023320',
      secondaryColor: '#0EA65A',
      address: 'Tennisweg 1, 53804 Much',
      website: 'https://tc-much.de',
      nuligaClubId: '35656',
    },
  });

  // ─── Users ────────────────────────────────────────────────────────
  const admin = await prisma.user.create({
    data: { email: 'admin@tcmuch.de', passwordHash, firstName: 'Max', lastName: 'Mustermann', clubId: club.id,
      roles: { create: [{ role: 'CLUB_ADMIN', clubId: club.id }, { role: 'MEMBER', clubId: club.id }] } },
  });
  const sportwart = await prisma.user.create({
    data: { email: 'sportwart@tcmuch.de', passwordHash, firstName: 'Thomas', lastName: 'Schmidt', clubId: club.id,
      roles: { create: [{ role: 'BOARD_MEMBER', clubId: club.id }, { role: 'MEMBER', clubId: club.id }] } },
  });
  const trainer = await prisma.user.create({
    data: { email: 'trainer@tcmuch.de', passwordHash, firstName: 'Klaus', lastName: 'Trainer', clubId: club.id,
      roles: { create: [{ role: 'TRAINER', clubId: club.id }, { role: 'MEMBER', clubId: club.id }] } },
  });
  const kapitaen = await prisma.user.create({
    data: { email: 'kapitaen@tcmuch.de', passwordHash, firstName: 'Jan', lastName: 'Mueller', clubId: club.id,
      roles: { create: [{ role: 'TEAM_CAPTAIN', clubId: club.id }, { role: 'MEMBER', clubId: club.id }] } },
  });
  const spieler1 = await prisma.user.create({
    data: { email: 'spieler1@tcmuch.de', passwordHash, firstName: 'Peter', lastName: 'Weber', clubId: club.id,
      roles: { create: [{ role: 'MEMBER', clubId: club.id }] } },
  });
  const spieler2 = await prisma.user.create({
    data: { email: 'spieler2@tcmuch.de', passwordHash, firstName: 'Lukas', lastName: 'Fischer', clubId: club.id,
      roles: { create: [{ role: 'MEMBER', clubId: club.id }] } },
  });
  const spieler3 = await prisma.user.create({
    data: { email: 'spieler3@tcmuch.de', passwordHash, firstName: 'Marco', lastName: 'Becker', clubId: club.id,
      roles: { create: [{ role: 'MEMBER', clubId: club.id }] } },
  });
  const spieler4 = await prisma.user.create({
    data: { email: 'spieler4@tcmuch.de', passwordHash, firstName: 'Stefan', lastName: 'Braun', clubId: club.id,
      roles: { create: [{ role: 'MEMBER', clubId: club.id }] } },
  });
  const spieler5 = await prisma.user.create({
    data: { email: 'spieler5@tcmuch.de', passwordHash, firstName: 'Daniel', lastName: 'Koch', clubId: club.id,
      roles: { create: [{ role: 'MEMBER', clubId: club.id }] } },
  });
  const elternteil = await prisma.user.create({
    data: { email: 'eltern@tcmuch.de', passwordHash, firstName: 'Sabine', lastName: 'Mueller', clubId: club.id,
      roles: { create: [{ role: 'PARENT', clubId: club.id }] } },
  });
  const spielerin1 = await prisma.user.create({
    data: { email: 'spielerin1@tcmuch.de', passwordHash, firstName: 'Anna', lastName: 'Wagner', clubId: club.id,
      roles: { create: [{ role: 'MEMBER', clubId: club.id }] } },
  });
  const spielerin2 = await prisma.user.create({
    data: { email: 'spielerin2@tcmuch.de', passwordHash, firstName: 'Lisa', lastName: 'Hoffmann', clubId: club.id,
      roles: { create: [{ role: 'MEMBER', clubId: club.id }] } },
  });
  const spielerin3 = await prisma.user.create({
    data: { email: 'spielerin3@tcmuch.de', passwordHash, firstName: 'Julia', lastName: 'Schulz', clubId: club.id,
      roles: { create: [{ role: 'MEMBER', clubId: club.id }] } },
  });
  const spielerin4 = await prisma.user.create({
    data: { email: 'spielerin4@tcmuch.de', passwordHash, firstName: 'Sandra', lastName: 'Richter', clubId: club.id,
      roles: { create: [{ role: 'MEMBER', clubId: club.id }] } },
  });
  const spielerin5 = await prisma.user.create({
    data: { email: 'spielerin5@tcmuch.de', passwordHash, firstName: 'Kathrin', lastName: 'Wolf', clubId: club.id,
      roles: { create: [{ role: 'MEMBER', clubId: club.id }] } },
  });

  const allPlayers = [admin, sportwart, trainer, kapitaen, spieler1, spieler2, spieler3, spieler4, spieler5];
  const herren1Players = [kapitaen, spieler1, spieler2, spieler3, spieler4, spieler5];

  // ─── Teams FIRST (needed for channel teamId) ─────────────────────
  const herren1 = await prisma.team.create({
    data: { name: 'Herren 1', type: 'MATCH_TEAM', league: 'Bezirksliga', season: '2026', clubId: club.id },
  });
  const herren2 = await prisma.team.create({
    data: { name: 'Herren 2', type: 'MATCH_TEAM', league: 'Kreisliga', season: '2026', clubId: club.id },
  });
  const trainingGroupAdults = await prisma.team.create({
    data: { name: 'Erwachsenen-Training', type: 'TRAINING_GROUP', clubId: club.id },
  });
  const boardGroup = await prisma.team.create({
    data: { name: 'Vorstand', type: 'BOARD_GROUP', clubId: club.id },
  });
  const damen1 = await prisma.team.create({
    data: { name: 'Damen 1', type: 'MATCH_TEAM', league: 'Bezirksklasse', season: '2026', clubId: club.id },
  });

  // Team Members
  for (const [i, p] of herren1Players.entries()) {
    await prisma.teamMember.create({ data: { teamId: herren1.id, userId: p.id, position: i + 1 } });
  }
  for (const [i, p] of [spieler1, spieler2, spieler3, spieler4, spieler5, sportwart].entries()) {
    await prisma.teamMember.create({ data: { teamId: herren2.id, userId: p.id, position: i + 1 } });
  }
  for (const p of allPlayers) {
    await prisma.teamMember.create({ data: { teamId: trainingGroupAdults.id, userId: p.id } });
  }
  await prisma.teamMember.create({ data: { teamId: boardGroup.id, userId: admin.id } });
  await prisma.teamMember.create({ data: { teamId: boardGroup.id, userId: sportwart.id } });
  const damen1Players = [spielerin1, spielerin2, spielerin3, spielerin4, spielerin5, spieler3];
  for (const [i, p] of damen1Players.entries()) {
    await prisma.teamMember.create({ data: { teamId: damen1.id, userId: p.id, position: i + 1 } });
  }

  // ─── Channels (with teamId links) ────────────────────────────────
  const chGeneral = await prisma.channel.create({
    data: { name: 'Allgemein', description: 'Allgemeine Vereinsnachrichten', visibility: 'PUBLIC', isDefault: true, clubId: club.id, createdById: admin.id },
  });
  const chTurniere = await prisma.channel.create({
    data: { name: 'Turniere', description: 'Infos zu Turnieren', visibility: 'PUBLIC', isDefault: true, clubId: club.id, createdById: admin.id },
  });
  const chJugend = await prisma.channel.create({
    data: { name: 'Jugend', description: 'Jugendarbeit und Nachwuchs', visibility: 'RESTRICTED', isDefault: true, clubId: club.id, createdById: admin.id },
  });
  const chTraining = await prisma.channel.create({
    data: { name: 'Training', description: 'Trainingsplaene und -infos', visibility: 'RESTRICTED', isDefault: true, clubId: club.id, createdById: admin.id },
  });
  const chMannschaft = await prisma.channel.create({
    data: { name: 'Mannschaft', description: 'Mannschaftsinterne Kommunikation', visibility: 'RESTRICTED', isDefault: true, clubId: club.id, createdById: admin.id },
  });
  const chVorstand = await prisma.channel.create({
    data: { name: 'Vorstand', description: 'Vorstandsinterne Themen', visibility: 'RESTRICTED', isDefault: true, clubId: club.id, createdById: admin.id },
  });

  // Team-specific channels (linked via teamId!)
  const chHerren1 = await prisma.channel.create({
    data: { name: 'Herren 1 Chat', description: 'Interner Chat Herren 1', visibility: 'RESTRICTED', parentChannelId: chMannschaft.id, teamId: herren1.id, clubId: club.id, createdById: kapitaen.id },
  });
  const chHerren2 = await prisma.channel.create({
    data: { name: 'Herren 2 Chat', description: 'Interner Chat Herren 2', visibility: 'RESTRICTED', parentChannelId: chMannschaft.id, teamId: herren2.id, clubId: club.id, createdById: sportwart.id },
  });
  const chVorstandTeam = await prisma.channel.create({
    data: { name: 'Vorstand Chat', description: 'Interner Vorstand-Chat', visibility: 'RESTRICTED', teamId: boardGroup.id, clubId: club.id, createdById: admin.id },
  });
  const chDamen1 = await prisma.channel.create({
    data: { name: 'Damen 1 Chat', description: 'Interner Chat Damen 1', visibility: 'RESTRICTED', parentChannelId: chMannschaft.id, teamId: damen1.id, clubId: club.id, createdById: admin.id },
  });

  // ─── Channel Members ──────────────────────────────────────────────
  // Admin + Sportwart in ALLE restricted channels
  for (const ch of [chJugend, chTraining, chMannschaft, chVorstand, chHerren1, chHerren2, chVorstandTeam, chDamen1]) {
    await prisma.channelMember.create({ data: { channelId: ch.id, userId: admin.id } });
    await prisma.channelMember.create({ data: { channelId: ch.id, userId: sportwart.id } });
  }

  // Mannschaft + Training: alle Spieler
  for (const p of [trainer, kapitaen, spieler1, spieler2, spieler3]) {
    await prisma.channelMember.create({ data: { channelId: chMannschaft.id, userId: p.id } });
    await prisma.channelMember.create({ data: { channelId: chTraining.id, userId: p.id } });
  }

  // Herren 1 Chat: nur Herren 1 Spieler
  for (const p of herren1Players) {
    await prisma.channelMember.create({ data: { channelId: chHerren1.id, userId: p.id } });
  }

  // Herren 2 Chat: nur Herren 2 Spieler
  for (const p of [spieler1, spieler2, spieler3, spieler4, spieler5]) {
    await prisma.channelMember.create({ data: { channelId: chHerren2.id, userId: p.id } });
  }

  // Damen 1 Chat: Damen 1 Spielerinnen
  for (const p of damen1Players) {
    await prisma.channelMember.create({ data: { channelId: chDamen1.id, userId: p.id } });
  }

  // Jugend: Trainer + Elternteil
  await prisma.channelMember.create({ data: { channelId: chJugend.id, userId: trainer.id } });
  await prisma.channelMember.create({ data: { channelId: chJugend.id, userId: elternteil.id } });

  // ─── Messages ─────────────────────────────────────────────────────
  const msg1 = await prisma.message.create({
    data: { content: 'Willkommen im neuen Vereins-Chat! Hier werden ab sofort alle wichtigen Infos geteilt.', channelId: chGeneral.id, authorId: admin.id },
  });
  await prisma.message.create({
    data: { content: 'Super, endlich eine zentrale Plattform!', channelId: chGeneral.id, authorId: spieler1.id, replyToId: msg1.id },
  });
  await prisma.message.create({
    data: { content: 'Neuer Trainingsplan ist ab naechster Woche online. Bitte Zeiten checken!', channelId: chTraining.id, authorId: trainer.id },
  });
  await prisma.message.create({
    data: { content: 'Aufstellung fuer Sonntag steht. Bitte alle bis Freitag Verfuegbarkeit melden!', channelId: chHerren1.id, authorId: kapitaen.id },
  });
  await prisma.message.create({
    data: { content: 'Wer kann am Samstag beim Platzdienst helfen?', channelId: chGeneral.id, authorId: sportwart.id },
  });

  await prisma.messageReaction.create({ data: { messageId: msg1.id, userId: spieler1.id, type: 'THUMBS_UP' } });
  await prisma.messageReaction.create({ data: { messageId: msg1.id, userId: spieler2.id, type: 'HEART' } });
  await prisma.messageReaction.create({ data: { messageId: msg1.id, userId: trainer.id, type: 'CELEBRATE' } });

  // ─── Events ───────────────────────────────────────────────────────
  const matchDate = addWeeks(new Date(), 2);
  const trainingDate = addDays(new Date(), 3);

  const leagueMatch = await prisma.event.create({
    data: { title: 'Herren 1 vs TC Eitorf', description: 'Bezirksliga Spieltag 3', type: 'LEAGUE_MATCH', location: 'Tennisanlage Much', court: 'Plaetze 1-4', isHomeGame: true, startDate: matchDate, teamId: herren1.id, clubId: club.id, createdById: sportwart.id },
  });
  await prisma.event.create({
    data: { title: 'Herren 2 vs TV Lohmar', type: 'LEAGUE_MATCH', location: 'Tennisanlage Lohmar', isHomeGame: false, startDate: matchDate, teamId: herren2.id, clubId: club.id, createdById: sportwart.id },
  });
  const trainingEvent = await prisma.event.create({
    data: { title: 'Erwachsenen-Training', type: 'TRAINING', location: 'Tennisanlage Much', court: 'Platz 1-2', startDate: trainingDate, teamId: trainingGroupAdults.id, clubId: club.id, createdById: trainer.id },
  });
  await prisma.event.create({
    data: { title: 'Damen 1 vs TC Troisdorf', type: 'LEAGUE_MATCH', location: 'Tennisanlage Much', court: 'Plaetze 1-3', isHomeGame: true, startDate: addWeeks(new Date(), 3), teamId: damen1.id, clubId: club.id, createdById: sportwart.id },
  });
  await prisma.event.create({
    data: { title: 'Saiseroeffnung & Grillabend', description: 'Gemeinsamer Start in die Sommersaison', type: 'CLUB_EVENT', location: 'Clubhaus TC Much', startDate: addWeeks(new Date(), 4), clubId: club.id, createdById: admin.id },
  });
  const rankingMatch = await prisma.event.create({
    data: { title: 'Ranglistenspiel: Mueller vs Weber', type: 'RANKING_MATCH', location: 'Tennisanlage Much', court: 'Platz 3', startDate: addDays(new Date(), 5), clubId: club.id, createdById: sportwart.id },
  });

  // ─── Availability ─────────────────────────────────────────────────
  await prisma.availability.create({ data: { eventId: leagueMatch.id, userId: kapitaen.id, status: 'AVAILABLE', comment: 'Bin dabei!' } });
  await prisma.availability.create({ data: { eventId: leagueMatch.id, userId: spieler1.id, status: 'AVAILABLE' } });
  await prisma.availability.create({ data: { eventId: leagueMatch.id, userId: spieler2.id, status: 'NOT_AVAILABLE', comment: 'Im Urlaub' } });

  // ─── Training Attendance ──────────────────────────────────────────
  const deadline = subHours(trainingDate, 5);
  await prisma.trainingAttendance.create({ data: { eventId: trainingEvent.id, userId: spieler1.id, attending: true, deadlineAt: deadline } });
  await prisma.trainingAttendance.create({ data: { eventId: trainingEvent.id, userId: spieler2.id, attending: false, deadlineAt: deadline } });
  await prisma.trainingAttendance.create({ data: { eventId: trainingEvent.id, userId: spieler3.id, attending: null, deadlineAt: deadline } });

  // ─── Ranking ──────────────────────────────────────────────────────
  for (const [i, p] of [kapitaen, spieler1, spieler2, spieler3, sportwart].entries()) {
    await prisma.ranking.create({ data: { clubId: club.id, userId: p.id, rank: i + 1, points: (5 - i) * 10, isManual: true } });
  }

  // ─── Match Result ─────────────────────────────────────────────────
  await prisma.matchResult.create({
    data: { eventId: rankingMatch.id, submittedById: kapitaen.id, status: 'SUBMITTED',
      sets: [{ games1: 6, games2: 3, tiebreak1: null, tiebreak2: null }, { games1: 7, games2: 6, tiebreak1: 7, tiebreak2: 4 }],
      winnerId: kapitaen.id },
  });

  // ─── Lineup ───────────────────────────────────────────────────────
  await prisma.matchLineup.create({ data: { eventId: leagueMatch.id, teamId: herren1.id, userId: kapitaen.id, position: 1 } });
  await prisma.matchLineup.create({ data: { eventId: leagueMatch.id, teamId: herren1.id, userId: spieler1.id, position: 2 } });

  // ─── Todos ────────────────────────────────────────────────────────
  await prisma.todo.create({ data: { title: 'Mannschaftsmeldung Bezirksliga abgeben', description: 'Deadline: 15. April', assigneeId: sportwart.id, scope: 'BOARD', clubId: club.id, createdById: admin.id, dueDate: addDays(new Date(), 14) } });
  await prisma.todo.create({ data: { title: 'Baelle fuer Training bestellen', assigneeId: trainer.id, scope: 'TRAINERS', clubId: club.id, createdById: sportwart.id } });
  await prisma.todo.create({ data: { title: 'Trikots einsammeln', assigneeId: kapitaen.id, scope: 'TEAM', teamId: herren1.id, clubId: club.id, createdById: sportwart.id } });

  // ─── Notifications ────────────────────────────────────────────────
  await prisma.notification.create({ data: { type: 'AVAILABILITY_REQUEST', title: 'Verfuegbarkeit melden', body: 'Bitte melde deine Verfuegbarkeit fuer Herren 1 vs TC Eitorf', userId: admin.id, clubId: club.id, data: { eventId: leagueMatch.id } as any } });
  await prisma.notification.create({ data: { type: 'RESULT_CONFIRMATION', title: 'Ergebnis bestaetigen', body: 'Jan Mueller hat ein Ranglistenergebnis eingereicht (6:3, 7:6). Bitte bestaetigen.', userId: admin.id, clubId: club.id, data: { eventId: rankingMatch.id } as any } });
  await prisma.notification.create({ data: { type: 'TODO', title: 'Neues Todo zugewiesen', body: 'Dir wurde ein Todo zugewiesen: Mannschaftsmeldung abgeben', userId: admin.id, clubId: club.id } });
  await prisma.notification.create({ data: { type: 'CHAT_MESSAGE', title: 'Neue Nachricht', body: 'Klaus Trainer: Neuer Trainingsplan ist ab naechster Woche online', userId: admin.id, clubId: club.id } });

  console.log('Seed completed:');
  console.log('  - 1 Club: TC Much e.V.');
  console.log('  - 15 Users (Admin, Sportwart, Trainer, Kapitaen, 5 Spieler, 5 Spielerinnen, 1 Elternteil)');
  console.log('  - 10 Channels (6 Default + 4 Team-Channels mit teamId)');
  console.log('  - 5 Teams (3 Match, 1 Training, 1 Board) - verknuepft mit Channels');
  console.log('  - 6 Events, 5 Rankings, 1 Match Result, 3 Todos, 4 Notifications');
}

main()
  .catch((e) => { console.error('Seed error:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
