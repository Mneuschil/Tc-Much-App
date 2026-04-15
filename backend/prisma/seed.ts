import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { addWeeks, addDays, subDays, subHours, addHours, setHours, setMinutes } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with demo data...');

  // ─── Cleanup ──────────────────────────────────────────────────────
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
  await prisma.tournamentMatch.deleteMany();
  await prisma.tournamentRegistration.deleteMany();
  await prisma.tournament.deleteMany();
  await prisma.rankingChallenge.deleteMany();
  await prisma.ranking.deleteMany();
  await prisma.formSubmission.deleteMany();
  await prisma.todo.deleteMany();
  await prisma.file.deleteMany();
  await prisma.fileFolder.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.notificationPreference.deleteMany();
  await prisma.event.deleteMany();
  await prisma.team.deleteMany();
  await prisma.pushToken.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.userRoleAssignment.deleteMany();
  await prisma.user.deleteMany();
  await prisma.club.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 12);
  const now = new Date();

  // ═══════════════════════════════════════════════════════════════════
  // CLUB
  // ═══════════════════════════════════════════════════════════════════
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

  // ═══════════════════════════════════════════════════════════════════
  // USERS (15 Mitglieder mit realistischen Namen)
  // ═══════════════════════════════════════════════════════════════════
  const u = async (
    email: string,
    first: string,
    last: string,
    roles: string[],
    phone?: string,
  ) => {
    return prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName: first,
        lastName: last,
        clubId: club.id,
        phone: phone ?? null,
        roles: { create: roles.map((r) => ({ role: r, clubId: club.id })) },
      },
    });
  };

  const admin = await u('admin@tcmuch.de', 'Max', 'Mustermann', ['CLUB_ADMIN', 'MEMBER'], '0151-12345678');
  const sportwart = await u('sportwart@tcmuch.de', 'Thomas', 'Schmidt', ['BOARD_MEMBER', 'MEMBER'], '0152-87654321');
  const trainer = await u('trainer@tcmuch.de', 'Klaus', 'Berger', ['TRAINER', 'MEMBER']);
  const kapitaen = await u('kapitaen@tcmuch.de', 'Jan', 'Mueller', ['TEAM_CAPTAIN', 'MEMBER']);
  const spieler1 = await u('peter@tcmuch.de', 'Peter', 'Weber', ['MEMBER']);
  const spieler2 = await u('lukas@tcmuch.de', 'Lukas', 'Fischer', ['MEMBER']);
  const spieler3 = await u('marco@tcmuch.de', 'Marco', 'Becker', ['MEMBER']);
  const spieler4 = await u('stefan@tcmuch.de', 'Stefan', 'Braun', ['MEMBER']);
  const spieler5 = await u('daniel@tcmuch.de', 'Daniel', 'Koch', ['MEMBER']);
  const spielerin1 = await u('anna@tcmuch.de', 'Anna', 'Wagner', ['MEMBER']);
  const spielerin2 = await u('lisa@tcmuch.de', 'Lisa', 'Hoffmann', ['MEMBER']);
  const spielerin3 = await u('julia@tcmuch.de', 'Julia', 'Schulz', ['MEMBER']);
  const spielerin4 = await u('sandra@tcmuch.de', 'Sandra', 'Richter', ['MEMBER']);
  const spielerin5 = await u('kathrin@tcmuch.de', 'Kathrin', 'Wolf', ['MEMBER']);
  const elternteil = await u('sabine@tcmuch.de', 'Sabine', 'Mueller', ['PARENT']);

  const herren1Players = [kapitaen, spieler1, spieler2, spieler3, spieler4, spieler5];
  const herren2Players = [spieler1, spieler2, spieler3, spieler4, spieler5, sportwart];
  const damen1Players = [spielerin1, spielerin2, spielerin3, spielerin4, spielerin5, spieler3];

  // ═══════════════════════════════════════════════════════════════════
  // TEAMS (5 Teams)
  // ═══════════════════════════════════════════════════════════════════
  const herren1 = await prisma.team.create({
    data: { name: 'Herren 1', type: 'MATCH_TEAM', league: 'Bezirksliga', season: '2026', clubId: club.id },
  });
  const herren2 = await prisma.team.create({
    data: { name: 'Herren 2', type: 'MATCH_TEAM', league: 'Kreisliga', season: '2026', clubId: club.id },
  });
  const damen1 = await prisma.team.create({
    data: { name: 'Damen 1', type: 'MATCH_TEAM', league: 'Bezirksklasse', season: '2026', clubId: club.id },
  });
  const trainingGroup = await prisma.team.create({
    data: { name: 'Erwachsenen-Training', type: 'TRAINING_GROUP', clubId: club.id },
  });
  const boardGroup = await prisma.team.create({
    data: { name: 'Vorstand', type: 'BOARD_GROUP', clubId: club.id },
  });

  // Team Members
  for (const [i, p] of herren1Players.entries()) {
    await prisma.teamMember.create({ data: { teamId: herren1.id, userId: p.id, position: i + 1 } });
  }
  for (const [i, p] of herren2Players.entries()) {
    await prisma.teamMember.create({ data: { teamId: herren2.id, userId: p.id, position: i + 1 } });
  }
  for (const [i, p] of damen1Players.entries()) {
    await prisma.teamMember.create({ data: { teamId: damen1.id, userId: p.id, position: i + 1 } });
  }
  for (const p of [admin, sportwart, trainer, kapitaen, spieler1, spieler2, spieler3, spieler4, spieler5, spielerin1, spielerin2]) {
    await prisma.teamMember.create({ data: { teamId: trainingGroup.id, userId: p.id } });
  }
  await prisma.teamMember.create({ data: { teamId: boardGroup.id, userId: admin.id } });
  await prisma.teamMember.create({ data: { teamId: boardGroup.id, userId: sportwart.id } });

  // ═══════════════════════════════════════════════════════════════════
  // CHANNELS (10 Channels mit vielen Nachrichten)
  // ═══════════════════════════════════════════════════════════════════
  const chGeneral = await prisma.channel.create({
    data: { name: 'Allgemein', description: 'Allgemeine Vereinsnachrichten', visibility: 'PUBLIC', isDefault: true, clubId: club.id, createdById: admin.id },
  });
  const chTurniere = await prisma.channel.create({
    data: { name: 'Turniere', description: 'Infos zu Turnieren und Meisterschaften', visibility: 'PUBLIC', isDefault: true, clubId: club.id, createdById: admin.id },
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
  const chHerren1 = await prisma.channel.create({
    data: { name: 'Herren 1', description: 'Interner Chat Herren 1', visibility: 'RESTRICTED', parentChannelId: chMannschaft.id, teamId: herren1.id, clubId: club.id, createdById: kapitaen.id },
  });
  const chHerren2 = await prisma.channel.create({
    data: { name: 'Herren 2', description: 'Interner Chat Herren 2', visibility: 'RESTRICTED', parentChannelId: chMannschaft.id, teamId: herren2.id, clubId: club.id, createdById: sportwart.id },
  });
  const chDamen1 = await prisma.channel.create({
    data: { name: 'Damen 1', description: 'Interner Chat Damen 1', visibility: 'RESTRICTED', parentChannelId: chMannschaft.id, teamId: damen1.id, clubId: club.id, createdById: spielerin1.id },
  });
  const chVorstandTeam = await prisma.channel.create({
    data: { name: 'Vorstand Chat', description: 'Interner Vorstand-Chat', visibility: 'RESTRICTED', teamId: boardGroup.id, clubId: club.id, createdById: admin.id },
  });

  // Channel Members
  const allRestricted = [chJugend, chTraining, chMannschaft, chVorstand, chHerren1, chHerren2, chVorstandTeam, chDamen1];
  for (const ch of allRestricted) {
    await prisma.channelMember.create({ data: { channelId: ch.id, userId: admin.id } });
    await prisma.channelMember.create({ data: { channelId: ch.id, userId: sportwart.id } });
  }
  for (const p of [trainer, kapitaen, spieler1, spieler2, spieler3]) {
    await prisma.channelMember.create({ data: { channelId: chMannschaft.id, userId: p.id } });
    await prisma.channelMember.create({ data: { channelId: chTraining.id, userId: p.id } });
  }
  // Skip admin/sportwart — already added above
  const skipIds = new Set([admin.id, sportwart.id]);
  for (const p of herren1Players) {
    if (!skipIds.has(p.id)) await prisma.channelMember.create({ data: { channelId: chHerren1.id, userId: p.id } });
  }
  for (const p of herren2Players) {
    if (!skipIds.has(p.id)) await prisma.channelMember.create({ data: { channelId: chHerren2.id, userId: p.id } });
  }
  for (const p of damen1Players) {
    if (!skipIds.has(p.id)) await prisma.channelMember.create({ data: { channelId: chDamen1.id, userId: p.id } });
  }
  await prisma.channelMember.create({ data: { channelId: chJugend.id, userId: trainer.id } });
  await prisma.channelMember.create({ data: { channelId: chJugend.id, userId: elternteil.id } });

  // ─── Messages (viele realistische Nachrichten) ────────────────────
  const msg = async (channelId: string, authorId: string, content: string, ago: number, replyToId?: string) => {
    return prisma.message.create({
      data: { content, channelId, authorId, replyToId, createdAt: subHours(now, ago) },
    });
  };

  // Allgemein — News-Feed
  const m1 = await msg(chGeneral.id, admin.id, 'Willkommen in der neuen Vereins-App! Ab sofort laufen alle Infos hier zusammen. Bitte installiert die App und meldet euch an.', 168);
  await msg(chGeneral.id, spieler1.id, 'Super Sache! Endlich alles an einem Ort.', 167, m1.id);
  await msg(chGeneral.id, spielerin1.id, 'Toll, dass es jetzt eine App gibt!', 166, m1.id);
  const m2 = await msg(chGeneral.id, sportwart.id, 'Die Sommersaison startet am 28. April! Alle Plaetze sind frisch gemacht. Bitte denkt an passende Schuhe — keine Stollen auf Sand!', 120);
  await msg(chGeneral.id, spieler3.id, 'Kann es kaum erwarten. Die Plaetze sehen super aus!', 119);
  await msg(chGeneral.id, admin.id, 'Am 1. Mai findet unser traditioneller Saisonstart mit Grillen statt. Familien sind herzlich willkommen! Bitte tragt euch in die Teilnehmerliste ein.', 96);
  await msg(chGeneral.id, trainer.id, 'Die neuen Trainingszeiten fuer die Sommersaison stehen fest. Bitte checkt den Kalender!', 72);
  await msg(chGeneral.id, spieler2.id, 'Wer hat Lust am Wochenende zu spielen? Suche Doppelpartner!', 48);
  await msg(chGeneral.id, spielerin3.id, 'Ich waere dabei! Samstag ab 14 Uhr?', 47);
  await msg(chGeneral.id, spieler2.id, 'Perfekt, ich buche Platz 3!', 46);
  await msg(chGeneral.id, sportwart.id, 'Erinnerung: Mitgliedsbeitraege sind bis Ende April faellig. Bei Fragen meldet euch bei Max.', 24);
  await msg(chGeneral.id, admin.id, 'Die Platzreservierung ist ab sofort ueber die App moeglich (kommt in Phase 2). Bis dahin bitte weiterhin die Tafel nutzen.', 12);
  await msg(chGeneral.id, spieler4.id, 'Hat jemand ein Griffband uebrig? Meins ist durch.', 6);
  await msg(chGeneral.id, spieler5.id, 'Hab noch eins im Spind, kannst du haben!', 5);

  // Turniere
  await msg(chTurniere.id, sportwart.id, 'Die Clubmeisterschaft 2026 ist offiziell gestartet! Anmeldung bis 20. April im Einzel und Doppel moeglich.', 96);
  await msg(chTurniere.id, spieler1.id, 'Bin angemeldet! Wird dieses Jahr mein Jahr.', 95);
  await msg(chTurniere.id, spielerin2.id, 'Im Damen-Einzel bin ich auch dabei.', 94);
  await msg(chTurniere.id, sportwart.id, 'Auslosung erfolgt naechste Woche. Gesetzt sind die Top-4 der Rangliste.', 72);
  await msg(chTurniere.id, admin.id, 'Externes Turnier: Die TV Lohmar Open sind am 15. Juni. Meldefrist laeuft. Wer Interesse hat, bitte bei Thomas melden.', 48);

  // Herren 1
  const h1m1 = await msg(chHerren1.id, kapitaen.id, 'Maenner, naechsten Sonntag ist Bezirksliga gegen TC Eitorf. Bitte ALLE Verfuegbarkeit eintragen!', 48);
  await msg(chHerren1.id, spieler1.id, 'Bin dabei, wie immer.', 47);
  await msg(chHerren1.id, spieler2.id, 'Leider im Urlaub, bin raus.', 46);
  await msg(chHerren1.id, spieler3.id, 'Bin verfuegbar! Auf welcher Position?', 45);
  await msg(chHerren1.id, kapitaen.id, 'Marco, du spielst auf 3. Aufstellung kommt morgen.', 44);
  await msg(chHerren1.id, spieler4.id, 'Bin auch am Start!', 43);
  await msg(chHerren1.id, spieler5.id, 'Dabei! Lasst uns das Ding gewinnen!', 42);
  await msg(chHerren1.id, kapitaen.id, 'Aufstellung steht: 1. Jan, 2. Peter, 3. Marco, 4. Stefan, 5. Daniel. Ersatz: Thomas. Treffpunkt 12:30 Uhr!', 24);
  await msg(chHerren1.id, spieler3.id, 'Alles klar, bin puenktlich!', 23);

  // Training
  await msg(chTraining.id, trainer.id, 'Trainingsplan Sommersaison:\n- Di 18-20 Uhr: Erwachsene\n- Do 18-20 Uhr: Erwachsene\n- Sa 10-12 Uhr: Jugend\n\nBitte puenktlich kommen!', 96);
  await msg(chTraining.id, spieler1.id, 'Dienstag passt bei mir immer.', 95);
  await msg(chTraining.id, trainer.id, 'Morgen Schwerpunkt: Return und Volley. Bringt genuegend Wasser mit — wird heiss!', 24);
  await msg(chTraining.id, spieler3.id, 'Gibts am Donnerstag auch Matchtraining?', 20);
  await msg(chTraining.id, trainer.id, 'Ja, zweite Stunde machen wir Matchpraxis. Gute Idee, Marco!', 19);

  // Vorstand
  await msg(chVorstandTeam.id, admin.id, 'Naechste Vorstandssitzung: Dienstag 20 Uhr im Clubhaus. Tagesordnung:\n1. Finanzbericht Q1\n2. Saisonvorbereitung\n3. Jugendkonzept\n4. Verschiedenes', 72);
  await msg(chVorstandTeam.id, sportwart.id, 'Punkt 2: Wir brauchen neue Netze fuer Platz 3 und 4. Angebot liegt bei 280 EUR.', 71);
  await msg(chVorstandTeam.id, admin.id, 'Genehmigt. Bitte bestellen.', 70);

  // Damen 1
  await msg(chDamen1.id, spielerin1.id, 'Maedels, erstes Saisonspiel ist am 3. Mai gegen TC Troisdorf. Wer ist dabei?', 72);
  await msg(chDamen1.id, spielerin2.id, 'Bin dabei!', 71);
  await msg(chDamen1.id, spielerin3.id, 'Ich auch!', 70);
  await msg(chDamen1.id, spielerin4.id, 'Klar, ist doch Heimspiel!', 69);

  // Reactions
  await prisma.messageReaction.createMany({
    data: [
      { messageId: m1.id, userId: spieler1.id, type: 'THUMBS_UP' },
      { messageId: m1.id, userId: spieler2.id, type: 'HEART' },
      { messageId: m1.id, userId: trainer.id, type: 'CELEBRATE' },
      { messageId: m1.id, userId: spielerin1.id, type: 'THUMBS_UP' },
      { messageId: m1.id, userId: kapitaen.id, type: 'HEART' },
      { messageId: m2.id, userId: spieler3.id, type: 'THUMBS_UP' },
      { messageId: m2.id, userId: spieler4.id, type: 'THUMBS_UP' },
      { messageId: h1m1.id, userId: spieler1.id, type: 'THUMBS_UP' },
      { messageId: h1m1.id, userId: spieler5.id, type: 'THUMBS_UP' },
    ],
  });

  // ═══════════════════════════════════════════════════════════════════
  // EVENTS (15 Events ueber die naechsten Wochen)
  // ═══════════════════════════════════════════════════════════════════
  const at = (daysFromNow: number, hour: number, min = 0) =>
    setMinutes(setHours(addDays(now, daysFromNow), hour), min);

  // Vergangene Events
  const pastMatch = await prisma.event.create({
    data: { title: 'Herren 1 vs TC Overath', type: 'LEAGUE_MATCH', location: 'Tennisanlage Much', court: 'Plaetze 1-4', isHomeGame: true, startDate: subDays(now, 7), teamId: herren1.id, clubId: club.id, createdById: sportwart.id },
  });
  const pastTraining = await prisma.event.create({
    data: { title: 'Erwachsenen-Training', type: 'TRAINING', location: 'Tennisanlage Much', court: 'Platz 1-2', startDate: subDays(now, 3), teamId: trainingGroup.id, clubId: club.id, createdById: trainer.id },
  });

  // Kommende Events
  const training1 = await prisma.event.create({
    data: { title: 'Erwachsenen-Training', type: 'TRAINING', location: 'Tennisanlage Much', court: 'Platz 1-2', startDate: at(2, 18), teamId: trainingGroup.id, clubId: club.id, createdById: trainer.id },
  });
  const training2 = await prisma.event.create({
    data: { title: 'Erwachsenen-Training', type: 'TRAINING', location: 'Tennisanlage Much', court: 'Platz 1-2', startDate: at(4, 18), teamId: trainingGroup.id, clubId: club.id, createdById: trainer.id },
  });
  const rankingMatch1 = await prisma.event.create({
    data: { title: 'Ranglistenspiel: Mueller vs Weber', type: 'RANKING_MATCH', location: 'Tennisanlage Much', court: 'Platz 3', startDate: at(3, 15), clubId: club.id, createdById: sportwart.id },
  });
  const leagueH1 = await prisma.event.create({
    data: { title: 'Herren 1 vs TC Eitorf', description: 'Bezirksliga Spieltag 3 — Heimspiel! Zuschauer willkommen.', type: 'LEAGUE_MATCH', location: 'Tennisanlage Much', court: 'Plaetze 1-4', isHomeGame: true, startDate: at(10, 13), teamId: herren1.id, clubId: club.id, createdById: sportwart.id },
  });
  const leagueH2 = await prisma.event.create({
    data: { title: 'Herren 2 vs TV Lohmar', type: 'LEAGUE_MATCH', location: 'Tennisanlage Lohmar', isHomeGame: false, startDate: at(10, 14), teamId: herren2.id, clubId: club.id, createdById: sportwart.id },
  });
  const leagueD1 = await prisma.event.create({
    data: { title: 'Damen 1 vs TC Troisdorf', type: 'LEAGUE_MATCH', location: 'Tennisanlage Much', court: 'Plaetze 1-3', isHomeGame: true, startDate: at(17, 11), teamId: damen1.id, clubId: club.id, createdById: sportwart.id },
  });
  const clubEvent = await prisma.event.create({
    data: { title: 'Saisoneroeffnung & Grillabend', description: 'Gemeinsamer Start in die Sommersaison mit Grillen, Musik und freiem Spiel. Familien willkommen!', type: 'CLUB_EVENT', location: 'Clubhaus TC Much', startDate: at(21, 15), clubId: club.id, createdById: admin.id },
  });
  const cupMatch = await prisma.event.create({
    data: { title: 'Pokal Runde 1: TC Much vs TC Siegburg', type: 'CUP_MATCH', location: 'Tennisanlage Siegburg', isHomeGame: false, startDate: at(24, 14), teamId: herren1.id, clubId: club.id, createdById: sportwart.id },
  });
  const training3 = await prisma.event.create({
    data: { title: 'Erwachsenen-Training', type: 'TRAINING', location: 'Tennisanlage Much', court: 'Platz 1-2', startDate: at(9, 18), teamId: trainingGroup.id, clubId: club.id, createdById: trainer.id },
  });
  const rankingMatch2 = await prisma.event.create({
    data: { title: 'Ranglistenspiel: Fischer vs Becker', type: 'RANKING_MATCH', location: 'Tennisanlage Much', court: 'Platz 2', startDate: at(5, 16), clubId: club.id, createdById: sportwart.id },
  });
  const jugendTraining = await prisma.event.create({
    data: { title: 'Jugend-Training', type: 'TRAINING', location: 'Tennisanlage Much', court: 'Platz 5', startDate: at(6, 10), clubId: club.id, createdById: trainer.id },
  });

  // ═══════════════════════════════════════════════════════════════════
  // AVAILABILITY (Verfuegbarkeiten fuer Ligaspiele)
  // ═══════════════════════════════════════════════════════════════════
  // Herren 1 vs Eitorf
  await prisma.availability.createMany({
    data: [
      { eventId: leagueH1.id, userId: kapitaen.id, status: 'AVAILABLE', comment: 'Bin dabei!' },
      { eventId: leagueH1.id, userId: spieler1.id, status: 'AVAILABLE' },
      { eventId: leagueH1.id, userId: spieler2.id, status: 'NOT_AVAILABLE', comment: 'Bin im Urlaub' },
      { eventId: leagueH1.id, userId: spieler3.id, status: 'AVAILABLE', comment: 'Klar, Heimspiel!' },
      { eventId: leagueH1.id, userId: spieler4.id, status: 'AVAILABLE' },
      { eventId: leagueH1.id, userId: spieler5.id, status: 'AVAILABLE' },
    ],
  });
  // Damen 1 vs Troisdorf
  await prisma.availability.createMany({
    data: [
      { eventId: leagueD1.id, userId: spielerin1.id, status: 'AVAILABLE' },
      { eventId: leagueD1.id, userId: spielerin2.id, status: 'AVAILABLE' },
      { eventId: leagueD1.id, userId: spielerin3.id, status: 'AVAILABLE' },
      { eventId: leagueD1.id, userId: spielerin4.id, status: 'MAYBE' },
    ],
  });
  // Training
  await prisma.availability.createMany({
    data: [
      { eventId: training1.id, userId: spieler1.id, status: 'AVAILABLE' },
      { eventId: training1.id, userId: spieler3.id, status: 'AVAILABLE' },
      { eventId: training1.id, userId: spieler4.id, status: 'NOT_AVAILABLE' },
    ],
  });

  // Training Attendance (vergangenes Training)
  const deadline = subHours(pastTraining.startDate, 5);
  await prisma.trainingAttendance.createMany({
    data: [
      { eventId: pastTraining.id, userId: spieler1.id, attending: true, deadlineAt: deadline },
      { eventId: pastTraining.id, userId: spieler2.id, attending: false, deadlineAt: deadline },
      { eventId: pastTraining.id, userId: spieler3.id, attending: true, deadlineAt: deadline },
      { eventId: pastTraining.id, userId: spieler4.id, attending: true, deadlineAt: deadline },
      { eventId: pastTraining.id, userId: kapitaen.id, attending: true, deadlineAt: deadline },
    ],
  });

  // ═══════════════════════════════════════════════════════════════════
  // MATCH RESULTS (vergangene Ergebnisse)
  // ═══════════════════════════════════════════════════════════════════
  // Herren 1 vs Overath — CONFIRMED
  await prisma.matchResult.create({
    data: {
      eventId: pastMatch.id, submittedById: kapitaen.id, confirmedById: spieler1.id,
      status: 'CONFIRMED',
      sets: [{ games1: 6, games2: 4, tiebreak1: null, tiebreak2: null }, { games1: 7, games2: 5, tiebreak1: null, tiebreak2: null }],
      winnerId: kapitaen.id,
    },
  });
  // Ranglistenspiel Mueller vs Weber — SUBMITTED (warte auf Bestaetigung)
  await prisma.matchResult.create({
    data: {
      eventId: rankingMatch1.id, submittedById: kapitaen.id, status: 'SUBMITTED',
      sets: [{ games1: 6, games2: 3, tiebreak1: null, tiebreak2: null }, { games1: 7, games2: 6, tiebreak1: 7, tiebreak2: 4 }],
      winnerId: kapitaen.id,
    },
  });

  // ═══════════════════════════════════════════════════════════════════
  // LINEUP (Aufstellung Herren 1 vs Eitorf)
  // ═══════════════════════════════════════════════════════════════════
  await prisma.matchLineup.createMany({
    data: [
      { eventId: leagueH1.id, teamId: herren1.id, userId: kapitaen.id, position: 1 },
      { eventId: leagueH1.id, teamId: herren1.id, userId: spieler1.id, position: 2 },
      { eventId: leagueH1.id, teamId: herren1.id, userId: spieler3.id, position: 3 },
      { eventId: leagueH1.id, teamId: herren1.id, userId: spieler4.id, position: 4 },
      { eventId: leagueH1.id, teamId: herren1.id, userId: spieler5.id, position: 5 },
    ],
  });

  // ═══════════════════════════════════════════════════════════════════
  // RANKING (Herren-Rangliste mit 8 Spielern)
  // ═══════════════════════════════════════════════════════════════════
  const rankedPlayers = [kapitaen, spieler1, spieler3, spieler2, spieler5, spieler4, sportwart, spielerin1];
  for (const [i, p] of rankedPlayers.entries()) {
    await prisma.ranking.create({
      data: { clubId: club.id, userId: p.id, rank: i + 1, points: (8 - i) * 12, wins: Math.max(0, 5 - i), losses: i, isManual: i < 3 },
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // RANKING CHALLENGES (2 aktive Herausforderungen)
  // ═══════════════════════════════════════════════════════════════════
  await prisma.rankingChallenge.create({
    data: { clubId: club.id, challengerId: spieler1.id, challengedId: kapitaen.id, status: 'ACCEPTED', deadline: addDays(now, 7), category: 'HERREN' },
  });
  await prisma.rankingChallenge.create({
    data: { clubId: club.id, challengerId: spieler5.id, challengedId: spieler4.id, status: 'PENDING', deadline: addDays(now, 5), category: 'HERREN' },
  });

  // ═══════════════════════════════════════════════════════════════════
  // TOURNAMENT (Clubmeisterschaft + Registrierungen)
  // ═══════════════════════════════════════════════════════════════════
  const clubmeisterschaft = await prisma.tournament.create({
    data: {
      name: 'Clubmeisterschaft 2026 — Einzel',
      type: 'KNOCKOUT', category: 'SINGLES', status: 'REGISTRATION_OPEN',
      description: 'Die jaehrliche Clubmeisterschaft im Herren-Einzel. Anmeldung bis 20. April!',
      startDate: addDays(now, 30), endDate: addDays(now, 60),
      maxParticipants: 16, clubId: club.id, createdById: sportwart.id,
    },
  });
  await prisma.tournamentRegistration.createMany({
    data: [
      { tournamentId: clubmeisterschaft.id, userId: kapitaen.id, seed: 1 },
      { tournamentId: clubmeisterschaft.id, userId: spieler1.id, seed: 2 },
      { tournamentId: clubmeisterschaft.id, userId: spieler3.id, seed: 3 },
      { tournamentId: clubmeisterschaft.id, userId: spieler2.id },
      { tournamentId: clubmeisterschaft.id, userId: spieler5.id },
      { tournamentId: clubmeisterschaft.id, userId: sportwart.id },
    ],
  });

  const doppelTurnier = await prisma.tournament.create({
    data: {
      name: 'Mixed-Doppel Turnier',
      type: 'KNOCKOUT', category: 'MIXED', status: 'REGISTRATION_OPEN',
      description: 'Fun-Turnier im Mixed-Doppel. Teams werden ausgelost!',
      startDate: addDays(now, 45), maxParticipants: 8, clubId: club.id, createdById: sportwart.id,
    },
  });
  await prisma.tournamentRegistration.createMany({
    data: [
      { tournamentId: doppelTurnier.id, userId: kapitaen.id, partnerId: spielerin1.id },
      { tournamentId: doppelTurnier.id, userId: spieler1.id, partnerId: spielerin2.id },
      { tournamentId: doppelTurnier.id, userId: spieler3.id, partnerId: spielerin3.id },
    ],
  });

  // ═══════════════════════════════════════════════════════════════════
  // TODOS (verschiedene Aufgaben)
  // ═══════════════════════════════════════════════════════════════════
  await prisma.todo.createMany({
    data: [
      { title: 'Mannschaftsmeldung Bezirksliga abgeben', description: 'Deadline: 15. April. Formular auf nuliga.de', assigneeId: sportwart.id, scope: 'BOARD', clubId: club.id, createdById: admin.id, dueDate: addDays(now, 5) },
      { title: 'Neue Baelle fuer Training bestellen', description: '4 Dosen HEAD Tour XT', assigneeId: trainer.id, scope: 'TRAINERS', clubId: club.id, createdById: sportwart.id, dueDate: addDays(now, 7) },
      { title: 'Trikots einsammeln', description: 'Alte Trikots von letzter Saison zurueck ins Clubhaus', assigneeId: kapitaen.id, scope: 'TEAM', teamId: herren1.id, clubId: club.id, createdById: sportwart.id, dueDate: addDays(now, 14) },
      { title: 'Netz Platz 3 reparieren', description: 'Das Netz haengt auf der linken Seite durch', assigneeId: admin.id, scope: 'BOARD', clubId: club.id, createdById: sportwart.id },
      { title: 'Sponsoren-Banner aufhaengen', description: 'Neue Banner von Autohaus Mueller und Baeckerei Schmidt', assigneeId: admin.id, scope: 'BOARD', clubId: club.id, createdById: admin.id, dueDate: addDays(now, 3) },
      { title: 'Jugendtraining Sommerfahrplan erstellen', assigneeId: trainer.id, scope: 'TRAINERS', clubId: club.id, createdById: sportwart.id, dueDate: addDays(now, 10) },
    ],
  });

  // ═══════════════════════════════════════════════════════════════════
  // NOTIFICATIONS (fuer Admin-User)
  // ═══════════════════════════════════════════════════════════════════
  await prisma.notification.createMany({
    data: [
      { type: 'AVAILABILITY_REQUEST', title: 'Verfuegbarkeit melden', body: 'Bitte melde deine Verfuegbarkeit fuer Herren 1 vs TC Eitorf (Sonntag)', userId: admin.id, clubId: club.id, data: { eventId: leagueH1.id } as any },
      { type: 'RESULT_CONFIRMATION', title: 'Ergebnis bestaetigen', body: 'Jan Mueller hat ein Ranglistenergebnis eingereicht: 6:3, 7:6(4). Bitte bestaetigen.', userId: admin.id, clubId: club.id, data: { eventId: rankingMatch1.id } as any },
      { type: 'TODO', title: 'Neues Todo', body: 'Dir wurde zugewiesen: Sponsoren-Banner aufhaengen', userId: admin.id, clubId: club.id },
      { type: 'CHAT_MESSAGE', title: 'Neue Nachricht', body: 'Klaus Berger: Trainingsplan Sommersaison steht!', userId: admin.id, clubId: club.id },
      { type: 'SYSTEM', title: 'Aufstellung veroeffentlicht', body: 'Die Aufstellung fuer Herren 1 vs TC Eitorf wurde veroeffentlicht', userId: admin.id, clubId: club.id, data: { eventId: leagueH1.id } as any },
      // Fuer andere User
      { type: 'AVAILABILITY_REQUEST', title: 'Verfuegbarkeit melden', body: 'Bitte melde deine Verfuegbarkeit fuer Herren 1 vs TC Eitorf', userId: spieler1.id, clubId: club.id },
      { type: 'CHAT_MESSAGE', title: 'Neuer Beitrag', body: 'Max Mustermann: Willkommen in der neuen Vereins-App!', userId: spieler2.id, clubId: club.id },
      { type: 'RESULT_CONFIRMATION', title: 'Ergebnis bestaetigen', body: 'Jan Mueller hat ein Ergebnis eingereicht. Bitte bestaetigen.', userId: spieler1.id, clubId: club.id },
    ],
  });

  // ═══════════════════════════════════════════════════════════════════
  // FORM SUBMISSIONS (Platzmeldung)
  // ═══════════════════════════════════════════════════════════════════
  const damageTodo = await prisma.todo.create({
    data: { title: 'Platzschaden: Platz 3 Grundlinie', description: 'Loch in der Grundlinie hinten rechts', assigneeId: admin.id, scope: 'BOARD', clubId: club.id, createdById: spieler1.id },
  });
  await prisma.formSubmission.create({
    data: {
      type: 'COURT_DAMAGE', clubId: club.id, submittedById: spieler1.id, todoId: damageTodo.id,
      data: { court: 'Platz 3', description: 'Loch in der Grundlinie hinten rechts, ca. 15cm', urgency: 'MEDIUM' },
    },
  });

  console.log('\nSeed completed:');
  console.log('  - 1 Club: TC Much e.V. (Code: TCM026)');
  console.log('  - 15 Users (pw: password123)');
  console.log('  - 5 Teams, 10 Channels');
  console.log('  - ~50 Messages mit Reactions');
  console.log('  - 14 Events (2 vergangen, 12 kommend)');
  console.log('  - 8 Rankings, 2 Challenges');
  console.log('  - 2 Tournaments mit Registrierungen');
  console.log('  - 2 Match Results, 1 Lineup');
  console.log('  - 7 Todos, 8 Notifications');
  console.log('  - 1 Form Submission (Platzschaden)');
  console.log('\nLogin: admin@tcmuch.de / password123 / TCM026');
}

main()
  .catch((e) => { console.error('Seed error:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
