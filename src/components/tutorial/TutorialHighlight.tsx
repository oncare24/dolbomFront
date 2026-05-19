// 튜토리얼 타겟 강조 래퍼.
// 자식 위에 정확히 동일한 크기로 빨간 테두리 오버레이를 덮음.
// inset 0이라 자식과 정렬 어긋날 일 없음. 자식의 borderRadius만 prop으로 받아 매칭.
//
// 사용:
//   <TutorialHighlight style={{ flex: 1 }}>
//     <HomeActionCard ... />
//   </TutorialHighlight>

import React from "react";
import { StyleSheet, View, ViewStyle, StyleProp } from "react-native";

import { Colors, Radius } from "../../theme";

interface Props {
  children: React.ReactNode;
  /** 강조 효과 활성화 여부. 기본 true */
  active?: boolean;
  /** 자식 컴포넌트의 borderRadius와 맞춤. 기본 Radius.xl (HomeActionCard 기준) */
  borderRadius?: number;
  /** 테두리 색. 기본은 danger (빨강) */
  color?: string;
  /** 테두리 두께. 기본 4 */
  borderWidth?: number;
  /** 컨테이너에 적용할 외부 스타일 (예: flex: 1) */
  style?: StyleProp<ViewStyle>;
}

export const TutorialHighlight: React.FC<Props> = ({
  children,
  active = true,
  borderRadius = Radius.xl,
  color = Colors.semantic.danger,
  borderWidth = 4,
  style,
}) => {
  if (!active) {
    return <View style={style}>{children}</View>;
  }

  return (
    <View style={style}>
      {children}
      {/* 자식 위에 정확히 동일한 크기의 테두리 오버레이 — 정렬 어긋남 X */}
      <View
        pointerEvents="none"
        style={[
          styles.overlay,
          {
            borderRadius,
            borderWidth,
            borderColor: color,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
