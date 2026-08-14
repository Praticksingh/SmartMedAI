import { z } from "zod";

export const healthQuerySchema = z.object({
  check: z.string().optional(),
});
