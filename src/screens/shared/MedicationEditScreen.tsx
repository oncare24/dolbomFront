// src/screens/shared/MedicationEditScreen.tsx
// 알림 토글 UI 카드 통째로 제거. active는 폼 외에서 기존 값 그대로 전달.

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

import { TimePickerField } from "../../components/medication/TimePickerField";
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
  const existing = useMemo(
    () => (isEdit ? schedules.find((s) => s.id === scheduleId) : undefined),
    [isEdit, scheduleId, schedules],
  );

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
      scheduledTime: "",
      scheduleType: "DAILY",
      daysOfWeek: [],
    },
  });

  const hasReset = useRef(false);
  useEffect(() => {
    if (!isEdit || hasReset.current || !existing) return;
    hasReset.current = true;
    reset({
      medicationName: existing.medicationName,
      scheduledTime: existing.scheduledTime,
      scheduleType: existing.scheduleType,
      daysOfWeek: existing.daysOfWeek,
    });
  }, [isEdit, existing, reset]);

  const scheduleType = watch("scheduleType");

  const onSubmit = useCallback(
    async (data: MedicationFormValues) => {
      try {
        if (isEdit && scheduleId !== undefined) {
          await updateMutation.mutateAsync({
            scheduleId,
            input: {
              medicationName: data.medicationName,
              scheduledTime: data.scheduledTime,
              scheduleType: data.scheduleType,
              daysOfWeek: data.daysOfWeek,
              // active는 UI에 노출하지 않음. 기존 값 그대로 전송 (없으면 true).
              active: existing?.active ?? true,
            },
          });
          toast.show({ message: "약을 수정했어요", variant: "success" });
        } else {
          await createMutation.mutateAsync({
            protegeId,
            medicationName: data.medicationName,
            scheduledTime: data.scheduledTime,
            scheduleType: data.scheduleType,
            daysOfWeek: data.daysOfWeek,
          });
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
      isEdit,
      scheduleId,
      protegeId,
      existing,
      toast,
      navigation,
    ],
  );

  const handleDelete = useCallback(() => {
    if (!isEdit || scheduleId === undefined) return;

    const medName = existing?.medicationName ?? "이 약";

    Alert.alert("약 삭제", `${medName}을(를) 삭제할까요?`, [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteMutation.mutateAsync({ scheduleId, protegeId });
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
  }, [
    isEdit,
    scheduleId,
    protegeId,
    existing,
    deleteMutation,
    toast,
    navigation,
  ]);

  const headerTitle = isEdit ? "약 수정" : "약 추가";
  const submitLabel = isEdit ? "수정 완료" : "저장";
  const submitLoading = createMutation.isPending || updateMutation.isPending;

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
            name="scheduledTime"
            render={({ field: { value, onChange, onBlur } }) => (
              <TimePickerField
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                error={errors.scheduledTime?.message}
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
