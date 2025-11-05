import { z } from "zod";

const envSchema = z.object({
  GOOGLE_EMAIL: z.string().email(),
  GOOGLE_PASSWORD: z.string().min(1),
  GMEET_URL: z.string().url(),
});

export const env = envSchema.parse(process.env);