"use client";

/**
 * 보상 뱃지 컴포넌트
 * 마일스톤 달성 여부를 작은 뱃지/칩 형태로 표시한다.
 * 해금 상태에 따라 색상과 아이콘이 달라진다.
 */

interface RewardBadgeProps {
  /** 마일스톤 일수 */
  milestone: number;
  /** 해금 여부 */
  isUnlocked: boolean;
  /** 마일스톤 라벨 */
  label: string;
}

export default function RewardBadge({
  milestone,
  isUnlocked,
  label,
}: RewardBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                  ${
                    isUnlocked
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
      aria-label={
        isUnlocked
          ? `${milestone}일 ${label} 마일스톤 달성 완료`
          : `${milestone}일 ${label} 마일스톤 미달성`
      }
    >
      <span aria-hidden="true">{isUnlocked ? "\u2713" : "\uD83D\uDD12"}</span>
      <span>{label}</span>
    </span>
  );
}
