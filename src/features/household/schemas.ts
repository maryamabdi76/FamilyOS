import { z } from "zod";

export const createHouseholdSchema = z.object({
  name: z.string().trim().min(1, "نام خانواده را وارد کنید").max(100),
});
