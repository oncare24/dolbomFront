// src/screens/shared/MedicationEditScreen.tsx
// 묶음 편집: 탭한 약의 같은 그룹(이름·주기·기간) 전체를 불러와 시간 목록으로 편집.
// 저장 시 새 시간=등록 / 뺀 시간=삭제 / 남은 시간=수정. 약 삭제=그룹 전체 삭제.

import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { Alert, StatusBar, StyleSheet, View } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { AppHeader } from "../../components/common/Header";
import { AppText } from "../../components/common/Text";
import { AppTextInput } from "../../components/common/Input";
import { PrimaryButton, DangerButton } from "../../components/common/Button";
import { useToast } from "../../components/common/Toast";
import { BottomActionBar } from "../../components/common/BottomActionBar";
import { MedicationPeriodPicker } from "../../components/medication/MedicationPeriodPicker";
import { MedicationTimesField } from "../../components/medication/MedicationTimesField";
import { ScheduleTypePicker } from "../../components/medication/ScheduleTypePicker";
import { DayOfWeekPicker } from "../../components/medication/DayOfWeekPicker";

import { useAuthStore } from "../../stores/authStore";
import {
  useCreateMedicationSchedule,
  useDeleteMedicationSchedule,
  useMedicationSchedules,
  useUpdateMedicationSchedule,
} from "../../hooks/useMedications";
import {
  medicationSchema,
  type MedicationFormValues,
} from "../../schemas/medicationSchema";
import { groupSchedules } from "../../utils/medicationGroup";

import { ApiException } from "../../services/api";
import { Colors, Elevation, Radius, ScreenPadding, Spacing } from "../../theme";
import type { RootStackParamList } from "../../types/navigation";

type Route = RouteProp<RootStackParamList, "MedicationEdit">;
type Nav = NativeStackNavigationProp<RootStackParamList, "MedicationEdit">;

export default function MedicationEditScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const toast = useToast();

  const protegeId = route.params.protegeId;
  const scheduleId = route.params.scheduleId;
  const isEdit = scheduleId !== undefined;

  const role = useAuthStore((s) => s.user?.role);
  const audience: "elderly" | "guardian" =
    role === "elderly" ? "elderly" : "guardian";

  const padding = ScreenPadding[audience];

  const { data: schedules = [] } = useMedicationSchedules(protegeId, {
    enabled: protegeId > 0,
  });

  // 탭한 약이 속한 그룹(같은 이름·주기·기간) 전체.
  const group = useMemo(() => {
    if (!isEdit || scheduleId === undefined) return undefined;
    const active = schedules.filter((s) => s.active);
    return groupSchedules(active).find((g) =>
      g.schedules.some((s) => s.id === scheduleId),
    );
  }, [isEdit, scheduleId, schedules]);

  const createMutation = useCreateMedicationSchedule();
  const updateMutation = useUpdateMedicationSchedule();
  const deleteMutation = useDeleteMedicationSchedule();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<MedicationFormValues>({
    resolver: zodResolver(medicationSchema),
    mode: "onChange",
    defaultValues: {
      medicationName: "",
      scheduledTimes: [],
      scheduleType: "DAILY",
      daysOfWeek: [],
      periodType: "CONTINUOUS",
    },
  });

  const hasReset = useRef(false);
  useEffect(() => {
    if (!isEdit || hasReset.current || !group) return;
    hasReset.current = true;
    reset({
      medicationName: group.medicationName,
      scheduledTimes: group.times,
      scheduleType: group.scheduleType,
      daysOfWeek: group.daysOfWeek,
      periodType: group.endDate ? "RANGED" : "CONTINUOUS",
      startDate: group.startDate ?? undefined,
      endDate: group.endDate ?? undefined,
    });
  }, [isEdit, group, reset]);

  const scheduleType = watch("scheduleType");

  const onSubmit = useCallback(
    async (data: MedicationFormValues) => {
      if (isEdit && !group) {
        toast.show({
          message: "약 정보를 불러오는 중이에요",
          variant: "error",
        });
        return;
      }
      try {
        const period =
          data.periodType === "RANGED"
            ? {
                startDate: data.startDate ?? null,
                endDate: data.endDate ?? null,
              }
            : { startDate: null, endDate: null };
        const daysList = data.scheduleType === "WEEKLY" ? data.daysOfWeek : [];
        const newTimes = [...new Set(data.scheduledTimes)];

        if (isEdit && group) {
          // 시간별 기존 행 매핑 (요일 약은 한 시간에 행이 여러 개)
          const existingByTime = new Map<
            string,
            { repId: number; rowIds: number[] }
          >();
          for (const s of group.schedules) {
            const e = existingByTime.get(s.scheduledTime) ?? {
              repId: s.id,
              rowIds: [],
            };
            e.rowIds.push(s.id);
            existingByTime.set(s.scheduledTime, e);
          }

          // 추가(신규) / 유지(수정)
          for (const t of newTimes) {
            const ex = existingByTime.get(t);
            if (ex) {
              await updateMutation.mutateAsync({
                scheduleId: ex.repId,
                input: {
                  medicationName: data.medicationName,
                  scheduledTime: t,
                  scheduleType: data.scheduleType,
                  daysOfWeek: daysList,
                  active: true,
                  ...period,
                },
              });
            } else {
              await createMutation.mutateAsync({
                protegeId,
                medicationName: data.medicationName,
                scheduledTime: t,
                scheduleType: data.scheduleType,
                daysOfWeek: daysList,
                ...period,
              });
            }
          }

          // 빠진 시간 삭제
          for (const [t, ex] of existingByTime) {
            if (!newTimes.includes(t)) {
              for (const rowId of ex.rowIds) {
                await deleteMutation.mutateAsync({
                  scheduleId: rowId,
                  protegeId,
                });
              }
            }
          }

          toast.show({ message: "약을 수정했어요", variant: "success" });
        } else {
          for (const t of newTimes) {
            await createMutation.mutateAsync({
              protegeId,
              medicationName: data.medicationName,
              scheduledTime: t,
              scheduleType: data.scheduleType,
              daysOfWeek: daysList,
              ...period,
            });
          }
          toast.show({ message: "약을 추가했어요", variant: "success" });
        }
        navigation.goBack();
      } catch (e) {
        console.error("[MedicationEdit] 저장 실패:", e);
        if (e instanceof ApiException) {
          toast.show({
            message: e.message || `요청 실패 (${e.status ?? "?"})`,
            variant: "error",
          });
        } else if (e instanceof Error) {
          toast.show({ message: `오류: ${e.message}`, variant: "error" });
        } else {
          toast.show({
            message: isEdit
              ? "수정에 실패했어요. 잠시 후 다시 시도해주세요"
              : "추가에 실패했어요. 잠시 후 다시 시도해주세요",
            variant: "error",
          });
        }
      }
    },
    [
      createMutation,
      updateMutation,
      deleteMutation,
      isEdit,
      group,
      protegeId,
      toast,
      navigation,
    ],
  );

  const handleDelete = useCallback(() => {
    if (!isEdit || !group) return;
    const medName = group.medicationName;

    Alert.alert("약 삭제", `${medName}을(를) 삭제할까요?`, [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          try {
            for (const s of group.schedules) {
              await deleteMutation.mutateAsync({ scheduleId: s.id, protegeId });
            }
            toast.show({ message: "약을 삭제했어요", variant: "success" });
            navigation.goBack();
          } catch (e) {
            console.error("[MedicationEdit] 삭제 실패:", e);
            if (e instanceof ApiException) {
              toast.show({
                message: e.message || `요청 실패 (${e.status ?? "?"})`,
                variant: "error",
              });
            } else if (e instanceof Error) {
              toast.show({ message: `오류: ${e.message}`, variant: "error" });
            } else {
              toast.show({
                message: "삭제에 실패했어요. 잠시 후 다시 시도해주세요",
                variant: "error",
              });
            }
          }
        },
      },
    ]);
  }, [isEdit, group, protegeId, deleteMutation, toast, navigation]);

  const headerTitle = isEdit ? "약 수정" : "약 추가";
  const submitLabel = isEdit ? "수정 완료" : "저장";
  const submitLoading =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={Colors.surface.background}
      />
      <AppHeader title={headerTitle} audience={audience} />

      <KeyboardAwareScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingHorizontal: padding.horizontal },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bottomOffset={Spacing.xl}
      >
        <View style={styles.card}>
          <AppText
            variant="bodyBold"
            audience={audience}
            color="primary"
            style={styles.cardTitle}
          >
            약 이름
          </AppText>
          <Controller
            control={control}
            name="medicationName"
            render={({ field: { value, onChange, onBlur } }) => (
              <AppTextInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="예: 혈압약"
                maxLength={100}
                error={errors.medicationName?.message}
                audience={audience}
              />
            )}
          />
        </View>

        <View style={styles.card}>
          <AppText
            variant="bodyBold"
            audience={audience}
            color="primary"
            style={styles.cardTitle}
          >
            복용 시간
          </AppText>
          <Controller
            control={control}
            name="scheduledTimes"
            render={({ field: { value, onChange } }) => (
              <MedicationTimesField
                value={value ?? []}
                onChange={onChange}
                error={errors.scheduledTimes?.message}
                audience={audience}
              />
            )}
          />
        </View>

        {/* 복용 주기 */}
        <View style={styles.card}>
          <AppText
            variant="bodyBold"
            audience={audience}
            color="primary"
            style={styles.cardTitle}
          >
            복용 주기
          </AppText>
          <Controller
            control={control}
            name="scheduleType"
            render={({ field: { value, onChange } }) => (
              <ScheduleTypePicker
                value={value}
                onChange={(next) => {
                  onChange(next);
                  if (next === "DAILY") {
                    setValue("daysOfWeek", [], { shouldValidate: true });
                  }
                }}
                audience={audience}
              />
            )}
          />

          {scheduleType === "WEEKLY" && (
            <View style={styles.dayPickerWrap}>
              <AppText
                variant="caption"
                audience={audience}
                color="secondary"
                style={styles.subLabel}
              >
                요일 선택
              </AppText>
              <Controller
                control={control}
                name="daysOfWeek"
                render={({ field: { value, onChange } }) => (
                  <DayOfWeekPicker
                    value={value}
                    onChange={onChange}
                    error={errors.daysOfWeek?.message}
                    audience={audience}
                  />
                )}
              />
            </View>
          )}
        </View>

        {/* 복용 기간 — 별도 카드 */}
        <View style={styles.card}>
          <AppText
            variant="bodyBold"
            audience={audience}
            color="primary"
            style={styles.cardTitle}
          >
            복용 기간
          </AppText>
          <Controller
            control={control}
            name="periodType"
            render={({ field: { value, onChange } }) => (
              <MedicationPeriodPicker
                periodType={value}
                startDate={watch("startDate")}
                endDate={watch("endDate")}
                onChangeType={(t) => {
                  onChange(t);
                  if (t === "CONTINUOUS") {
                    setValue("startDate", undefined, { shouldValidate: true });
                    setValue("endDate", undefined, { shouldValidate: true });
                  }
                }}
                onChangeStart={(iso) =>
                  setValue("startDate", iso, { shouldValidate: true })
                }
                onChangeEnd={(iso) =>
                  setValue("endDate", iso, { shouldValidate: true })
                }
                error={errors.endDate?.message}
                audience={audience}
              />
            )}
          />
        </View>

        {isEdit && (
          <View style={styles.deleteSection}>
            <DangerButton
              label="약 삭제"
              onPress={handleDelete}
              loading={deleteMutation.isPending}
              audience={audience}
            />
          </View>
        )}
      </KeyboardAwareScrollView>

      <BottomActionBar audience={audience}>
        <PrimaryButton
          label={submitLabel}
          onPress={handleSubmit(onSubmit)}
          loading={submitLoading}
          audience={audience}
        />
      </BottomActionBar>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: Spacing.lg,
    paddingBottom: 200,
  },
  card: {
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Elevation.sm,
  },
  cardTitle: {
    marginBottom: Spacing.md,
  },
  dayPickerWrap: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.surface.divider,
  },
  subLabel: {
    marginBottom: Spacing.sm,
  },
  deleteSection: {
    marginTop: Spacing.lg,
  },
});
