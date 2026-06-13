import { PrismaClient } from "@prisma/client";
import { randomUUID, scryptSync } from "node:crypto";

const prisma = new PrismaClient();

function hashPin(pin) {
  const salt = "carrito-demo-salt";
  const hash = scryptSync(pin, salt, 64).toString("hex");

  return `scrypt:${salt}:${hash}`;
}

function dateAt(daysFromBase, hours, minutes = 0) {
  const base = new Date("2026-06-16T00:00:00.000Z");
  const value = new Date(base);
  value.setUTCDate(value.getUTCDate() + daysFromBase);
  value.setUTCHours(hours, minutes, 0, 0);
  return value;
}

function timeAt(hours, minutes = 0) {
  return new Date(Date.UTC(1970, 0, 1, hours, minutes, 0, 0));
}

async function main() {
  const adminIds = {
    superadmin: randomUUID(),
    admin: randomUUID(),
  };

  const personIds = {
    juan: randomUUID(),
    pedro: randomUUID(),
    carlos: randomUUID(),
    miguel: randomUUID(),
    ana: randomUUID(),
    maria: randomUUID(),
    sofia: randomUUID(),
    lucas: randomUUID(),
    elena: randomUUID(),
    paula: randomUUID(),
  };

  const zoneIds = {
    centro: randomUUID(),
    norte: randomUUID(),
    sur: randomUUID(),
  };

  const templateIds = {
    centroSabado: randomUUID(),
    norteMartes: randomUUID(),
    surJueves: randomUUID(),
  };

  const shiftIds = {
    centroPast: randomUUID(),
    centroFutureOpen: randomUUID(),
    centroFutureFull: randomUUID(),
    norteBlocked: randomUUID(),
    surPending: randomUUID(),
  };

  const assignmentIds = {
    pastConfirmed: randomUUID(),
    futureConfirmed: randomUUID(),
    futureReplaced: randomUUID(),
  };

  const systemConfigId = randomUUID();

  await prisma.auditLog.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.shiftRequest.deleteMany();
  await prisma.shiftBlock.deleteMany();
  await prisma.availabilityException.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.shiftTemplate.deleteMany();
  await prisma.relationship.deleteMany();
  await prisma.systemConfig.deleteMany();
  await prisma.zone.deleteMany();
  await prisma.person.deleteMany();
  await prisma.adminUser.deleteMany();

  await prisma.adminUser.createMany({
    data: [
      {
        id: adminIds.superadmin,
        authProviderId: "neon-auth-superadmin-demo",
        role: "SUPERADMIN",
        status: "ACTIVE",
        displayName: "Super Admin Demo",
        email: "superadmin@carrito.demo",
      },
      {
        id: adminIds.admin,
        authProviderId: "neon-auth-admin-demo",
        role: "ADMIN",
        status: "ACTIVE",
        displayName: "Admin Demo",
        email: "admin@carrito.demo",
      },
    ],
  });

  await prisma.person.createMany({
    data: [
      {
        id: personIds.juan,
        firstName: "Juan",
        lastName: "Perez",
        gender: "MALE",
        status: "ACTIVE",
        phone: "+56 9 1111 1111",
        email: "juan@example.com",
        pinHash: hashPin("1111"),
        lastParticipationAt: dateAt(-20, 10),
      },
      {
        id: personIds.pedro,
        firstName: "Pedro",
        lastName: "Soto",
        gender: "MALE",
        status: "ACTIVE",
        phone: "+56 9 2222 2222",
        email: "pedro@example.com",
        pinHash: hashPin("2222"),
        lastParticipationAt: dateAt(-12, 10),
      },
      {
        id: personIds.carlos,
        firstName: "Carlos",
        lastName: "Rojas",
        gender: "MALE",
        status: "ACTIVE",
        pinHash: hashPin("3333"),
        lastParticipationAt: dateAt(-45, 10),
      },
      {
        id: personIds.miguel,
        firstName: "Miguel",
        lastName: "Diaz",
        gender: "MALE",
        status: "ACTIVE",
        pinHash: hashPin("4444"),
      },
      {
        id: personIds.ana,
        firstName: "Ana",
        lastName: "Lopez",
        gender: "FEMALE",
        status: "ACTIVE",
        pinHash: hashPin("5555"),
        lastParticipationAt: dateAt(-7, 9),
      },
      {
        id: personIds.maria,
        firstName: "Maria",
        lastName: "Lopez",
        gender: "FEMALE",
        status: "ACTIVE",
        pinHash: hashPin("6666"),
        lastParticipationAt: dateAt(-5, 9),
      },
      {
        id: personIds.sofia,
        firstName: "Sofia",
        lastName: "Morales",
        gender: "FEMALE",
        status: "ACTIVE",
        pinHash: hashPin("7777"),
      },
      {
        id: personIds.lucas,
        firstName: "Lucas",
        lastName: "Morales",
        gender: "MALE",
        status: "ACTIVE",
        pinHash: hashPin("8888"),
      },
      {
        id: personIds.elena,
        firstName: "Elena",
        lastName: "Vargas",
        gender: "FEMALE",
        status: "ACTIVE",
        pinHash: hashPin("9999"),
      },
      {
        id: personIds.paula,
        firstName: "Paula",
        lastName: "Nunez",
        gender: "FEMALE",
        status: "INACTIVE",
        notes: "Publicadora inactiva para pruebas.",
        pinHash: hashPin("1234"),
      },
    ],
  });

  await prisma.relationship.createMany({
    data: [
      {
        id: randomUUID(),
        personAId: personIds.ana,
        personBId: personIds.maria,
        type: "MARRIAGE",
        direction: "BIDIRECTIONAL",
        notes: "Matrimonio demo",
        createdByAdminId: adminIds.superadmin,
      },
      {
        id: randomUUID(),
        personAId: personIds.ana,
        personBId: personIds.sofia,
        type: "PARENT_CHILD",
        direction: "PARENT_TO_CHILD",
        notes: "Madre e hija",
        createdByAdminId: adminIds.admin,
      },
      {
        id: randomUUID(),
        personAId: personIds.miguel,
        personBId: personIds.carlos,
        type: "ADMIN_EXCEPTION",
        direction: "BIDIRECTIONAL",
        notes: "Excepcion aprobada para cubrir zona norte",
        createdByAdminId: adminIds.superadmin,
      },
    ],
  });

  await prisma.zone.createMany({
    data: [
      {
        id: zoneIds.centro,
        name: "Zona Centro",
        description: "Sector central de la ciudad",
        status: "ACTIVE",
        publicVisible: true,
      },
      {
        id: zoneIds.norte,
        name: "Zona Norte",
        description: "Sector norte y terminal",
        status: "ACTIVE",
        publicVisible: true,
      },
      {
        id: zoneIds.sur,
        name: "Zona Sur",
        description: "Sector sur residencial",
        status: "ACTIVE",
        publicVisible: true,
      },
    ],
  });

  await prisma.systemConfig.create({
    data: {
      id: systemConfigId,
      congregationName: "Congregacion Demo Centro",
      city: "Santiago",
      systemName: "Carrito",
      visibleWeeks: 6,
      generateFutureWeeks: 8,
      pinMinLength: 4,
      pinMaxLength: 8,
      pinMaxAttempts: 5,
      pinLockMinutes: 15,
      maxRequestsPerWeek: 4,
      maxConfirmedPerWeek: 2,
      maxConfirmedPerMonth: 6,
      allowConsecutiveDays: false,
      allowMultiplePerDay: false,
      allowOverlapping: false,
      allowSameSexPairing: true,
      historyVisibility: "ONE_YEAR",
      showParticipantsPublicly: false,
      showPendingRequestsPublicly: false,
      showFullShiftsPublicly: true,
      showOpenShiftsPublicly: true,
      showHistoryPublicly: false,
      maintenanceModeEnabled: false,
      updatedByAdminId: adminIds.superadmin,
    },
  });

  await prisma.shiftTemplate.createMany({
    data: [
      {
        id: templateIds.centroSabado,
        zoneId: zoneIds.centro,
        dayOfWeek: 6,
        startTime: timeAt(10, 0),
        endTime: timeAt(12, 0),
        status: "ACTIVE",
      },
      {
        id: templateIds.norteMartes,
        zoneId: zoneIds.norte,
        dayOfWeek: 2,
        startTime: timeAt(15, 0),
        endTime: timeAt(17, 0),
        status: "ACTIVE",
      },
      {
        id: templateIds.surJueves,
        zoneId: zoneIds.sur,
        dayOfWeek: 4,
        startTime: timeAt(11, 0),
        endTime: timeAt(13, 0),
        status: "ACTIVE",
      },
    ],
  });

  await prisma.shift.createMany({
    data: [
      {
        id: shiftIds.centroPast,
        zoneId: zoneIds.centro,
        templateId: templateIds.centroSabado,
        shiftDate: dateAt(-14, 0),
        startTime: timeAt(10, 0),
        endTime: timeAt(12, 0),
        status: "CLOSED",
        generated: true,
      },
      {
        id: shiftIds.centroFutureOpen,
        zoneId: zoneIds.centro,
        templateId: templateIds.centroSabado,
        shiftDate: dateAt(4, 0),
        startTime: timeAt(10, 0),
        endTime: timeAt(12, 0),
        status: "OPEN",
        generated: true,
      },
      {
        id: shiftIds.centroFutureFull,
        zoneId: zoneIds.centro,
        templateId: templateIds.centroSabado,
        shiftDate: dateAt(11, 0),
        startTime: timeAt(10, 0),
        endTime: timeAt(12, 0),
        status: "FULL",
        generated: true,
      },
      {
        id: shiftIds.norteBlocked,
        zoneId: zoneIds.norte,
        templateId: templateIds.norteMartes,
        shiftDate: dateAt(6, 0),
        startTime: timeAt(15, 0),
        endTime: timeAt(17, 0),
        status: "BLOCKED",
        generated: true,
      },
      {
        id: shiftIds.surPending,
        zoneId: zoneIds.sur,
        templateId: templateIds.surJueves,
        shiftDate: dateAt(8, 0),
        startTime: timeAt(11, 0),
        endTime: timeAt(13, 0),
        status: "OPEN",
        generated: true,
      },
    ],
  });

  await prisma.shiftBlock.createMany({
    data: [
      {
        id: randomUUID(),
        zoneId: zoneIds.norte,
        shiftId: shiftIds.norteBlocked,
        startDate: dateAt(6, 0),
        endDate: dateAt(6, 0),
        blockType: "SPECIFIC_SHIFT",
        reason: "Actividad especial de congregacion",
        createdByAdminId: adminIds.admin,
      },
      {
        id: randomUUID(),
        zoneId: zoneIds.sur,
        startDate: dateAt(20, 0),
        endDate: dateAt(24, 0),
        blockType: "DATE_RANGE",
        reason: "Mantenimiento municipal de la plaza",
        createdByAdminId: adminIds.superadmin,
      },
    ],
  });

  await prisma.availabilityException.createMany({
    data: [
      {
        id: randomUUID(),
        personId: personIds.juan,
        startDate: dateAt(18, 0),
        endDate: dateAt(25, 0),
        reason: "Vacaciones",
        notes: "No disponible durante viaje familiar.",
        createdByAdminId: adminIds.admin,
      },
      {
        id: randomUUID(),
        personId: personIds.elena,
        startDate: dateAt(7, 0),
        endDate: dateAt(10, 0),
        reason: "Licencia medica",
        createdByAdminId: adminIds.admin,
      },
    ],
  });

  await prisma.shiftRequest.createMany({
    data: [
      {
        id: randomUUID(),
        shiftId: shiftIds.centroFutureOpen,
        personId: personIds.juan,
        suggestedPartnerId: personIds.pedro,
        status: "PENDING",
        comments: "Disponible solo si termina puntualmente.",
      },
      {
        id: randomUUID(),
        shiftId: shiftIds.centroFutureOpen,
        personId: personIds.pedro,
        status: "PENDING",
      },
      {
        id: randomUUID(),
        shiftId: shiftIds.surPending,
        personId: personIds.ana,
        suggestedPartnerId: personIds.maria,
        status: "PENDING",
        comments: "Preferencia de companera habitual.",
      },
      {
        id: randomUUID(),
        shiftId: shiftIds.surPending,
        personId: personIds.maria,
        status: "PENDING",
      },
      {
        id: randomUUID(),
        shiftId: shiftIds.centroFutureFull,
        personId: personIds.carlos,
        status: "REJECTED",
        comments: "Supera el maximo semanal configurado.",
        resolvedAt: dateAt(2, 13),
      },
      {
        id: randomUUID(),
        shiftId: shiftIds.centroFutureFull,
        personId: personIds.miguel,
        status: "CANCELLED",
        comments: "Cancelada por el propio usuario.",
        cancelledAt: dateAt(1, 9),
        resolvedAt: dateAt(1, 9),
      },
      {
        id: randomUUID(),
        shiftId: shiftIds.centroFutureFull,
        personId: personIds.ana,
        suggestedPartnerId: personIds.maria,
        status: "CONFIRMED",
        resolvedAt: dateAt(2, 13),
      },
      {
        id: randomUUID(),
        shiftId: shiftIds.centroFutureFull,
        personId: personIds.maria,
        status: "CONFIRMED",
        resolvedAt: dateAt(2, 13),
      },
    ],
  });

  await prisma.assignment.createMany({
    data: [
      {
        id: assignmentIds.pastConfirmed,
        shiftId: shiftIds.centroPast,
        person1Id: personIds.juan,
        person2Id: personIds.pedro,
        status: "CONFIRMED",
        ruleExceptionUsed: false,
        decidedByAdminId: adminIds.admin,
        confirmedAt: dateAt(-15, 13),
      },
      {
        id: assignmentIds.futureReplaced,
        shiftId: shiftIds.centroFutureFull,
        person1Id: personIds.carlos,
        person2Id: personIds.miguel,
        status: "REPLACED",
        ruleExceptionUsed: true,
        exceptionReason: "Se reemplazo por mejor disponibilidad y equidad.",
        decidedByAdminId: adminIds.superadmin,
        confirmedAt: dateAt(1, 12),
        cancelledAt: dateAt(2, 12),
      },
      {
        id: assignmentIds.futureConfirmed,
        shiftId: shiftIds.centroFutureFull,
        person1Id: personIds.ana,
        person2Id: personIds.maria,
        status: "CONFIRMED",
        ruleExceptionUsed: false,
        decidedByAdminId: adminIds.superadmin,
        confirmedAt: dateAt(2, 13),
      },
    ],
  });

  await prisma.auditLog.createMany({
    data: [
      {
        id: randomUUID(),
        actorType: "ADMIN",
        actorAdminId: adminIds.admin,
        entityType: "SHIFT_BLOCK",
        entityId: shiftIds.norteBlocked,
        action: "SHIFT_BLOCK_CREATED",
        meta: {
          reason: "Actividad especial de congregacion",
        },
      },
      {
        id: randomUUID(),
        actorType: "ADMIN",
        actorAdminId: adminIds.superadmin,
        entityType: "ASSIGNMENT",
        entityId: assignmentIds.futureConfirmed,
        action: "ASSIGNMENT_CONFIRMED",
        meta: {
          shiftId: shiftIds.centroFutureFull,
          personIds: [personIds.ana, personIds.maria],
        },
      },
      {
        id: randomUUID(),
        actorType: "PUBLIC_PERSON",
        actorPersonId: personIds.juan,
        entityType: "SHIFT_REQUEST",
        entityId: shiftIds.centroFutureOpen,
        action: "REQUEST_CREATED",
        meta: {
          suggestedPartnerId: personIds.pedro,
        },
      },
      {
        id: randomUUID(),
        actorType: "ADMIN",
        actorAdminId: adminIds.superadmin,
        entityType: "SYSTEM_CONFIG",
        entityId: systemConfigId,
        action: "CONFIG_UPDATED",
        meta: {
          showParticipantsPublicly: false,
          allowSameSexPairing: true,
        },
      },
    ],
  });

  console.log("Demo seed completed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
