import { z } from "zod";

const mpRoleEnum = z.enum(["admin", "teacher", "student"]);

export const mpLoginSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string().min(1, "パスワードを入力してください"),
});

export const mpSignupSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string().min(6, "パスワードは6文字以上で入力してください"),
  full_name: z.string().min(1, "氏名を入力してください"),
  role: mpRoleEnum,
});

export type MpLoginInput = z.infer<typeof mpLoginSchema>;
export type MpSignupInput = z.infer<typeof mpSignupSchema>;
