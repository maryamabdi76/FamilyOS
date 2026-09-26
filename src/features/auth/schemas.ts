import { z } from "zod";

export const signUpSchema = z.object({
  email: z.string().email("ایمیل معتبر نیست"),
  password: z.string().min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد"),
});

export const signInSchema = z.object({
  email: z.string().email("ایمیل معتبر نیست"),
  password: z.string().min(1, "رمز عبور را وارد کنید"),
});

export const requestPasswordResetSchema = z.object({
  email: z.string().email("ایمیل معتبر نیست"),
});

export const updatePasswordSchema = z.object({
  password: z.string().min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد"),
});
