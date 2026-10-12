import { prisma } from "@/lib/prisma";

export async function getMapPlaces(admin = false) {
  const places = await prisma.zone.findMany({
    where: admin ? {} : { status: "ACTIVE", publicVisible: true },
    orderBy: { name: "asc" },
    select: {
      id: true, name: true, description: true, address: true,
      latitude: true, longitude: true, mapColor: true,
      status: true, publicVisible: true,
    },
  });
  return places.map((place, index) => ({ ...place, number: index + 1 }));
}
