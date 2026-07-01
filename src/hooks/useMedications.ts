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
  getMedicationToday,
  moveMedicationPacketTime,
  takeMedication,
  updateMedicationSchedule,
} from "../services/medicationService";
import type {
  CreateMedicationScheduleInput,
  MedicationLog,
  MedicationSchedule,
  TakeMedicationInput,
  TodayMedicationSlot,
  UpdateMedicationScheduleInput,
} from "../types/medication";

// ────────────────────────────────────────────
// Query Keys
// ────────────────────────────────────────────
import { useAuthStore } from "../stores/authStore";
import { toastBridge } from "../utils/toastBridge";

// 어머니 본인 폰이고, DAILY이며 오늘 시각이 이미 지난 schedule을 등록한 경우 안내.
// 시중 표준(다음 회차로 이월) 동작은 그대로, UX만 보완.
function maybeNotifyPastTimeToast(savedSchedule: MedicationSchedule) {
  if (useAuthStore.getState().user?.role !== "elderly") return;
  if (savedSchedule.scheduleType !== "DAILY") return;

  const [hour, minute] = savedSchedule.scheduledTime.split(":").map(Number);
  const target = new Date();
  target.setHours(hour, minute, 0, 0);
  if (target.getTime() <= Date.now()) {
    toastBridge.show("오늘은 시각이 지나서 내일부터 알람이 가요", "info");
  }
}

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
  today: (protegeId: number, date: string) =>
    [...medicationKeys.all, "today", protegeId, date] as const,
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

/** 오늘의 약(4-2) — 시각 슬롯 + 성분별 복용 상태. 서버가 요일/기간/회차 필터링. */
export function useMedicationToday(
  protegeId: number,
  date: string,
  options?: Omit<UseQueryOptions<TodayMedicationSlot[]>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: medicationKeys.today(protegeId, date),
    queryFn: () => getMedicationToday(protegeId, date),
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
        scheduleIds: [],
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
      maybeNotifyPastTimeToast(savedSchedule);
      // 알람 등록은 useMedicationReminderSync가 데이터 변경을 감지해 자동 처리.
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
/** 일정 수정 — Optimistic: 캐시 내 해당 일정 즉시 교체 + OS 알람 재등록. */
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

    onSuccess: (savedSchedule) => {
      if (savedSchedule.active) {
        maybeNotifyPastTimeToast(savedSchedule);
      }
      // 알람 재등록은 useMedicationReminderSync가 자동 처리.
    },

    onSettled: (_data, _err, { scheduleId }) => {
      qc.invalidateQueries({ queryKey: medicationKeys.scheduleLists() });
      qc.invalidateQueries({
        queryKey: medicationKeys.scheduleDetail(scheduleId),
      });
    },
  });
}

/**
 * 봉지 시각 이동(4-3) — (groupId, fromTime)의 모든 성분을 toTime으로 일괄 이동.
 * 편집에서 "시각만 바뀐 슬롯"에 사용해 요일별 row 잔존 버그를 해소.
 */
export function useMoveMedicationPacketTime() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      protegeId,
      groupId,
      fromTime,
      toTime,
    }: {
      protegeId: number;
      groupId: string;
      fromTime: string;
      toTime: string;
    }) => moveMedicationPacketTime(protegeId, groupId, fromTime, toTime),

    onSettled: (_data, _err, { protegeId }) => {
      qc.invalidateQueries({ queryKey: medicationKeys.scheduleList(protegeId) });
      qc.invalidateQueries({ queryKey: [...medicationKeys.all, "today"] });
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
      const logKey = medicationKeys.logsByDate(input.protegeId, date);
      const todayKey = medicationKeys.today(input.protegeId, date);

      await qc.cancelQueries({ queryKey: logKey });
      await qc.cancelQueries({ queryKey: todayKey });
      const previousLogs = qc.getQueryData<MedicationLog[]>(logKey);
      const previousToday = qc.getQueryData<TodayMedicationSlot[]>(todayKey);

      // 로그 캐시 optimistic (다른 화면·요약용)
      const optimistic: MedicationLog = {
        id: -Date.now(),
        protegeId: input.protegeId,
        scheduleId: input.scheduleId,
        medicationName: input.medicationName ?? "",
        takenAt: input.takenAt,
        logSource: input.logSource,
      };
      qc.setQueryData<MedicationLog[]>(logKey, (old = []) => [
        ...old,
        optimistic,
      ]);

      // 오늘의 약 캐시 optimistic — 해당 scheduleId 성분을 즉시 복용 표시
      if (previousToday && input.scheduleId != null) {
        qc.setQueryData<TodayMedicationSlot[]>(
          todayKey,
          previousToday.map((slot) => {
            const items = slot.items.map((it) =>
              it.scheduleId === input.scheduleId
                ? { ...it, taken: true, takenAt: input.takenAt }
                : it,
            );
            return { ...slot, items, allTaken: items.every((i) => i.taken) };
          }),
        );
      }

      return { previousLogs, logKey, previousToday, todayKey };
    },

    onError: (_err, _input, context) => {
      if (context) {
        qc.setQueryData(context.logKey, context.previousLogs);
        qc.setQueryData(context.todayKey, context.previousToday);
      }
    },

    onSettled: (_log, _err, input) => {
      const date = input.takenAt.slice(0, 10);
      qc.invalidateQueries({
        queryKey: medicationKeys.logsByDate(input.protegeId, date),
      });
      qc.invalidateQueries({
        queryKey: medicationKeys.today(input.protegeId, date),
      });
    },
  });
}
