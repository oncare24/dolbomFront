// src/hooks/useMedications.ts

// 복약 react-query 훅 모음.
//
// queryKey 컨벤션:
//   ["medications", "schedules", "list", protegeId]
//   ["medications", "schedules", "detail", scheduleId]
//   ["medications", "logs", "byDate", protegeId, date]
//
// Optimistic Update: Create / Update / Delete / Take 전부 적용.
// Pull-to-refresh는 각 useQuery가 반환하는 refetch()를 화면 ScreenContainer에 연결.

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  createMedicationSchedule,
  deleteMedicationSchedule,
  getMedicationSchedule,
  getMedicationSchedules,
  getMedicationLogsByDate,
  takeMedication,
  updateMedicationSchedule,
} from "../services/medicationService";
import type {
  CreateMedicationScheduleInput,
  MedicationLog,
  MedicationSchedule,
  TakeMedicationInput,
  UpdateMedicationScheduleInput,
} from "../types/medication";
import {
  scheduleLocalRemindersForMedication,
  cancelLocalRemindersForMedication,
} from "../services/medicationReminderService";
// ────────────────────────────────────────────
// Query Keys
// ────────────────────────────────────────────

export const medicationKeys = {
  all: ["medications"] as const,
  schedules: () => [...medicationKeys.all, "schedules"] as const,
  scheduleLists: () => [...medicationKeys.schedules(), "list"] as const,
  scheduleList: (protegeId: number) =>
    [...medicationKeys.scheduleLists(), protegeId] as const,
  scheduleDetails: () => [...medicationKeys.schedules(), "detail"] as const,
  scheduleDetail: (scheduleId: number) =>
    [...medicationKeys.scheduleDetails(), scheduleId] as const,
  logs: () => [...medicationKeys.all, "logs"] as const,
  logsByDate: (protegeId: number, date: string) =>
    [...medicationKeys.logs(), "byDate", protegeId, date] as const,
};

// ────────────────────────────────────────────
// Queries
// ────────────────────────────────────────────

export function useMedicationSchedules(
  protegeId: number,
  options?: Omit<UseQueryOptions<MedicationSchedule[]>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: medicationKeys.scheduleList(protegeId),
    queryFn: () => getMedicationSchedules(protegeId),
    ...options,
  });
}

export function useMedicationSchedule(scheduleId: number, enabled = true) {
  return useQuery({
    queryKey: medicationKeys.scheduleDetail(scheduleId),
    queryFn: () => getMedicationSchedule(scheduleId),
    enabled,
  });
}

export function useMedicationLogsByDate(
  protegeId: number,
  date: string,
  options?: Omit<UseQueryOptions<MedicationLog[]>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: medicationKeys.logsByDate(protegeId, date),
    queryFn: () => getMedicationLogsByDate(protegeId, date),
    ...options,
  });
}

// ────────────────────────────────────────────
// Mutations — 모두 Optimistic
// ────────────────────────────────────────────

/** 일정 생성 — Optimistic: 임시 음수 id로 즉시 목록 추가 → 응답으로 교체. */
export function useCreateMedicationSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMedicationScheduleInput) =>
      createMedicationSchedule(input),

    onMutate: async (input) => {
      const key = medicationKeys.scheduleList(input.protegeId);
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<MedicationSchedule[]>(key);

      const optimistic: MedicationSchedule = {
        id: -Date.now(),
        protegeId: input.protegeId,
        medicationName: input.medicationName,
        scheduledTime: input.scheduledTime,
        scheduleType: input.scheduleType,
        daysOfWeek: input.scheduleType === "WEEKLY" ? input.daysOfWeek : [],
        active: true,
        createdAt: new Date().toISOString(), // ← 추가
      };

      qc.setQueryData<MedicationSchedule[]>(key, (old = []) => [
        ...old,
        optimistic,
      ]);

      return { previous, key };
    },

    onError: (_err, _input, context) => {
      if (context) qc.setQueryData(context.key, context.previous);
    },

    onSuccess: (savedSchedule) => {
      scheduleLocalRemindersForMedication(savedSchedule).catch((e) =>
        console.warn("[MED-LOCAL] create-sync failed:", e),
      );
    },

    onSettled: (_data, _err, input) => {
      qc.invalidateQueries({
        queryKey: medicationKeys.scheduleList(input.protegeId),
      });
    },
  });
}

/** 일정 수정 — Optimistic: 캐시 내 해당 일정 즉시 교체. */
// src/hooks/useMedications.ts — useUpdateMedicationSchedule 함수만 교체

/** 일정 수정 — Optimistic: 캐시 내 해당 일정 즉시 교체. */
export function useUpdateMedicationSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      scheduleId,
      input,
    }: {
      scheduleId: number;
      input: UpdateMedicationScheduleInput;
    }) => updateMedicationSchedule(scheduleId, input),

    onMutate: async ({ scheduleId, input }) => {
      await qc.cancelQueries({ queryKey: medicationKeys.scheduleLists() });

      const snapshots = qc.getQueriesData<MedicationSchedule[]>({
        queryKey: medicationKeys.scheduleLists(),
      });

      snapshots.forEach(([key, data]) => {
        if (!data) return;
        qc.setQueryData<MedicationSchedule[]>(
          key,
          data.map((s) =>
            s.id === scheduleId
              ? {
                  ...s,
                  medicationName: input.medicationName,
                  scheduledTime: input.scheduledTime,
                  scheduleType: input.scheduleType,
                  daysOfWeek:
                    input.scheduleType === "WEEKLY" ? input.daysOfWeek : [],
                  active: input.active,
                }
              : s,
          ),
        );
      });

      const detailKey = medicationKeys.scheduleDetail(scheduleId);
      const previousDetail = qc.getQueryData<MedicationSchedule>(detailKey);
      if (previousDetail) {
        qc.setQueryData<MedicationSchedule>(detailKey, {
          ...previousDetail,
          medicationName: input.medicationName,
          scheduledTime: input.scheduledTime,
          scheduleType: input.scheduleType,
          daysOfWeek: input.scheduleType === "WEEKLY" ? input.daysOfWeek : [],
          active: input.active,
        });
      }

      return { snapshots, previousDetail, detailKey };
    },

    onError: (_err, _vars, context) => {
      context?.snapshots.forEach(([key, data]) => {
        qc.setQueryData(key, data);
      });
      if (context?.previousDetail) {
        qc.setQueryData(context.detailKey, context.previousDetail);
      }
    },

    onSettled: (_data, _err, { scheduleId }) => {
      qc.invalidateQueries({ queryKey: medicationKeys.scheduleLists() });
      qc.invalidateQueries({
        queryKey: medicationKeys.scheduleDetail(scheduleId),
      });
    },
  });
}

/** 일정 삭제 — Optimistic: 목록에서 즉시 제거. */
export function useDeleteMedicationSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ scheduleId }: { scheduleId: number; protegeId: number }) =>
      deleteMedicationSchedule(scheduleId),

    onMutate: async ({ scheduleId, protegeId }) => {
      const key = medicationKeys.scheduleList(protegeId);
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<MedicationSchedule[]>(key);

      qc.setQueryData<MedicationSchedule[]>(key, (old = []) =>
        old.filter((s) => s.id !== scheduleId),
      );

      return { previous, key };
    },

    onError: (_err, _vars, context) => {
      if (context) qc.setQueryData(context.key, context.previous);
    },

    onSuccess: (_data, { scheduleId }) => {
      cancelLocalRemindersForMedication(scheduleId).catch((e) =>
        console.warn("[MED-LOCAL] delete-sync failed:", e),
      );
    },

    onSettled: (_data, _err, { protegeId }) => {
      qc.invalidateQueries({
        queryKey: medicationKeys.scheduleList(protegeId),
      });
    },
  });
}

/** 복약 체크 — Optimistic: 오늘 로그 캐시에 즉시 추가. */
export function useTakeMedication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TakeMedicationInput) => takeMedication(input),

    onMutate: async (input) => {
      const date = input.takenAt.slice(0, 10);
      const key = medicationKeys.logsByDate(input.protegeId, date);

      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<MedicationLog[]>(key);

      const optimistic: MedicationLog = {
        id: -Date.now(),
        protegeId: input.protegeId,
        scheduleId: input.scheduleId,
        medicationName: input.medicationName ?? "",
        takenAt: input.takenAt,
        logSource: input.logSource,
      };
      qc.setQueryData<MedicationLog[]>(key, (old = []) => [...old, optimistic]);

      return { previous, key };
    },

    onError: (_err, _input, context) => {
      if (context) qc.setQueryData(context.key, context.previous);
    },

    onSettled: (_log, _err, input) => {
      const date = input.takenAt.slice(0, 10);
      qc.invalidateQueries({
        queryKey: medicationKeys.logsByDate(input.protegeId, date),
      });
    },
  });
}
