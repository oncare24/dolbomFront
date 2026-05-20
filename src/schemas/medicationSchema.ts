// src/schemas/medicationSchema.ts
// active 제거 — UI 폼에서 다루지 않음. 원래 상태로 복원.

import { z } from "zod";

const DAYS_OF_WEEK = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const medicationSchema = z
  .object({
    medicationName: z
      .string()
      .trim()
      .min(1, "약 이름을 입력해주세요")
      .max(50, "약 이름은 50자 이하로 입력해주세요"),
    scheduledTime: z.string().regex(timeRegex, "시간을 선택해주세요"),
    scheduleType: z.enum(["DAILY", "WEEKLY"], {
      message: "매일 또는 요일 지정을 선택해주세요",
    }),
    daysOfWeek: z.array(z.enum(DAYS_OF_WEEK)),
  })
  .refine(
    (data) => data.scheduleType === "DAILY" || data.daysOfWeek.length > 0,
    {
      message: "요일을 1개 이상 선택해주세요",
      path: ["daysOfWeek"],
    },
  );

export type MedicationFormValues = z.infer<typeof medicationSchema>;
