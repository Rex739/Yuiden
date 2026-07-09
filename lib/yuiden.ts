import type { AgentDecision, HouseMeter } from "@/lib/types";

export const houses: HouseMeter[] = [
  {
    id: "sakura",
    name: "Sakura House",
    zone: "Tokyo-East",
    wallet: "0x1000000000000000000000000000000000002027",
    solarKwh: 18.4,
    consumptionKwh: 6.1,
    batteryKwh: 4.8,
    maxBatteryKwh: 8,
  },
  {
    id: "kumo",
    name: "Kumo Residence",
    zone: "Tokyo-East",
    wallet: "0x20000000000000000000000000000000000088A1",
    solarKwh: 4.2,
    consumptionKwh: 15.6,
    batteryKwh: 1.2,
    maxBatteryKwh: 7,
  },
  {
    id: "hikari",
    name: "Hikari Villa",
    zone: "Tokyo-West",
    wallet: "0x3000000000000000000000000000000000007FD4",
    solarKwh: 13.2,
    consumptionKwh: 8.5,
    batteryKwh: 2.9,
    maxBatteryKwh: 6,
  },
  {
    id: "aoi",
    name: "Aoi Apartment",
    zone: "Tokyo-West",
    wallet: "0x400000000000000000000000000000000000913B",
    solarKwh: 5.8,
    consumptionKwh: 10.7,
    batteryKwh: 0.8,
    maxBatteryKwh: 5,
  },
  {
    id: "midori",
    name: "Midori Home",
    zone: "Tokyo-East",
    wallet: "0x50000000000000000000000000000000000051C9",
    solarKwh: 8.2,
    consumptionKwh: 8.0,
    batteryKwh: 1.4,
    maxBatteryKwh: 6,
  },
];

export function getSurplus(house: HouseMeter) {
  return Math.max(house.solarKwh + house.batteryKwh - house.consumptionKwh, 0);
}

export function getDemand(house: HouseMeter) {
  return Math.max(house.consumptionKwh - house.solarKwh, 0);
}

export function runYuidenAgent(meters: HouseMeter[]): AgentDecision {
  const producers = meters
    .map((house) => ({ house, surplus: getSurplus(house) }))
    .filter((item) => item.surplus > 0)
    .sort((a, b) => b.surplus - a.surplus);

  const buyers = meters
    .map((house) => ({ house, demand: getDemand(house) }))
    .filter((item) => item.demand > 0)
    .sort((a, b) => b.demand - a.demand);

  const sameZoneMatch = producers
    .flatMap((producer) =>
      buyers
        .filter((buyer) => buyer.house.zone === producer.house.zone)
        .map((buyer) => ({ producer, buyer })),
    )
    .sort(
      (a, b) =>
        Math.min(b.producer.surplus, b.buyer.demand) -
        Math.min(a.producer.surplus, a.buyer.demand),
    )[0];

  const fallbackMatch =
    sameZoneMatch ?? (producers[0] && buyers[0] ? { producer: producers[0], buyer: buyers[0] } : null);

  if (!fallbackMatch) {
    throw new Error("YuiDen Agent needs at least one producer and one buyer.");
  }

  const matchedKwh = Number(
    Math.min(fallbackMatch.producer.surplus, fallbackMatch.buyer.demand).toFixed(2),
  );
  const sameZone = fallbackMatch.producer.house.zone === fallbackMatch.buyer.house.zone;
  const scarcityPremium = fallbackMatch.buyer.demand > 8 ? 3.5 : 1.5;
  const pricePerKwhJPY = Number((24 + scarcityPremium + (sameZone ? 0 : 2)).toFixed(1));
  const totalJPY = Math.round(matchedKwh * pricePerKwhJPY);
  const totalUSDT = Number((totalJPY / 156).toFixed(2));
  const co2SavedKg = Number((matchedKwh * 0.44).toFixed(2));

  return {
    producerId: fallbackMatch.producer.house.id,
    buyerId: fallbackMatch.buyer.house.id,
    producerName: fallbackMatch.producer.house.name,
    buyerName: fallbackMatch.buyer.house.name,
    matchedKwh,
    pricePerKwhJPY,
    totalJPY,
    totalUSDT,
    zone: sameZone ? fallbackMatch.producer.house.zone : "Cross-zone",
    co2SavedKg,
    reason: sameZone
      ? "Prioritized same-zone settlement with the highest available surplus and demand."
      : "No same-zone match was available, so the agent selected the strongest cross-zone balance.",
    confidence: sameZone ? 94 : 86,
  };
}
