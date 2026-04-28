// 길안내 모드 선택 모달.
// 사용자가 병원 카드의 "길안내" 버튼을 누르면 표시됨.
// 도보 / 대중교통 중 선택.

import React from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TouchableWithoutFeedback,
} from "react-native";

interface Props {
  visible: boolean;
  hospitalName: string;
  onSelect: (mode: "walking" | "transit") => void;
  onClose: () => void;
}

export default function NavigationModeModal({
  visible,
  hospitalName,
  onSelect,
  onClose,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              <Text style={styles.title}>{hospitalName}</Text>
              <Text style={styles.subtitle}>어떻게 가실까요?</Text>

              <TouchableOpacity
                style={[styles.option, styles.walkingOption]}
                onPress={() => onSelect("walking")}
              >
                <Text style={styles.optionEmoji}>🚶</Text>
                <View style={styles.optionTextWrap}>
                  <Text style={styles.optionTitle}>도보로 가요</Text>
                  <Text style={styles.optionDesc}>걸어서 갈 만한 거리예요</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.option, styles.transitOption]}
                onPress={() => onSelect("transit")}
              >
                <Text style={styles.optionEmoji}>🚌</Text>
                <View style={styles.optionTextWrap}>
                  <Text style={styles.optionTitle}>대중교통으로 가요</Text>
                  <Text style={styles.optionDesc}>버스나 지하철로 가요</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelBtnText}>취소</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
  },
  walkingOption: {
    backgroundColor: "#E8F5E9",
    borderColor: "#66BB6A",
  },
  transitOption: {
    backgroundColor: "#E3F2FD",
    borderColor: "#42A5F5",
  },
  optionEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  optionTextWrap: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: 14,
    color: "#666",
  },
  cancelBtn: {
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  cancelBtnText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
  },
});
