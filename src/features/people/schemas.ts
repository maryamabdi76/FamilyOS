import { z } from "zod";

export const addPersonSchema = z.object({
  name: z.string().trim().min(1, "نام را وارد کنید").max(100),
  relationship: z.string().trim().max(100).optional(),
});
