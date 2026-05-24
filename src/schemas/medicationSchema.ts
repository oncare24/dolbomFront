// src/schemas/medicationSchema.ts

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
    scheduledTimes: z.array(z.string()).min(1, "시간을 1개 이상 추가해주세요"),
    scheduleType: z.enum(["DAILY", "WEEKLY"], {
      message: "매일 또는 요일 지정을 선택해주세요",
    }),
    daysOfWeek: z.array(z.enum(DAYS_OF_WEEK)),
    periodType: z.enum(["CONTINUOUS", "RANGED"]),
    startDate: z.string().optional(), // "YYYY-MM-DD"
    endDate: z.string().optional(),
  })
  .refine((data) => data.scheduledTimes.every((t) => timeRegex.test(t)), {
    message: "시간을 모두 선택해주세요",
    path: ["scheduledTimes"],
  })
  .refine(
    (data) => new Set(data.scheduledTimes).size === data.scheduledTimes.length,
    { message: "같은 시간이 중복됐어요", path: ["scheduledTimes"] },
  )
  .refine(
    (data) => data.scheduleType === "DAILY" || data.daysOfWeek.length > 0,
    { message: "요일을 1개 이상 선택해주세요", path: ["daysOfWeek"] },
  )
  .refine(
    (data) =>
      data.periodType === "CONTINUOUS" || (!!data.startDate && !!data.endDate),
    { message: "시작일과 종료일을 선택해주세요", path: ["endDate"] },
  )
  .refine(
    (data) =>
      data.periodType === "CONTINUOUS" ||
      !data.startDate ||
      !data.endDate ||
      data.endDate >= data.startDate,
    { message: "종료일은 시작일 이후여야 해요", path: ["endDate"] },
  );

export type MedicationFormValues = z.infer<typeof medicationSchema>;
