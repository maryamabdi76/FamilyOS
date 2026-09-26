// Plan definitions live in config, not UI components (spec §48).
// Prices are MVP hypotheses for testing, not validated market facts (spec §23).

export type PlanId = "FREE" | "PERSONAL" | "FAMILY" | "FAMILY_PLUS";

export interface Plan {
  id: PlanId;
  nameFa: string;
  storageBytes: number;
  priceTomanPerMonth: number;
}

const GB = 1024 * 1024 * 1024;
const MB = 1024 * 1024;

export const PLANS: Record<PlanId, Plan> = {
  FREE: {
    id: "FREE",
    nameFa: "رایگان",
    storageBytes: 500 * MB,
    priceTomanPerMonth: 0,
  },
  PERSONAL: {
    id: "PERSONAL",
    nameFa: "شخصی",
    storageBytes: 5 * GB,
    priceTomanPerMonth: 149_000,
  },
  FAMILY: {
    id: "FAMILY",
    nameFa: "خانواده",
    storageBytes: 20 * GB,
    priceTomanPerMonth: 299_000,
  },
  FAMILY_PLUS: {
    id: "FAMILY_PLUS",
    nameFa: "خانواده پلاس",
    storageBytes: 50 * GB,
    priceTomanPerMonth: 499_000,
  },
};
