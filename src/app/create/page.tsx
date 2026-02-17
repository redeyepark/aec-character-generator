"use client";

/**
 * 캐릭터 생성 위자드 페이지
 * 4단계 위자드를 통해 베이스 캐릭터(얼굴, 헤어, 수염, 안경)를 설정한다.
 * 실시간 미리보기를 제공한다. 기존 캐릭터가 있으면 무드 페이지로 리다이렉트한다.
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import AuthGuard from "@/app/components/AuthGuard";
import OnboardingSlides from "@/app/components/OnboardingSlides";
import WizardStep from "@/app/components/WizardStep";
import AssetPicker from "@/app/components/AssetPicker";
import CharacterCanvas from "@/app/components/CharacterCanvas";
import BirthInfoForm from "@/app/components/BirthInfoForm";
import { useCharacter } from "@/app/hooks/useCharacter";
import { useAuth } from "@/app/hooks/useAuth";
import { useBirthInfo } from "@/app/hooks/useBirthInfo";
import type { BirthInfo } from "@/app/lib/fortune/types";
import {
  getFaceSvgAssets,
  getHairAssets,
  getCompatibleMustaches,
  getGlassesAssets,
} from "@/app/lib/assetManager";
import { compositeCharacter } from "@/app/lib/imageCompositor";
import SkinTonePicker from "@/app/components/SkinTonePicker";
import type { WizardState, FaceShape, CharacterCombination, SkinTone } from "@/app/lib/types";
import { SVG_FACE_FILENAME_TO_SHAPE, DEFAULT_SKIN_TONE } from "@/app/lib/types";

// 위자드 스텝 정보
const WIZARD_STEPS = [
  { title: "얼굴 선택", description: "캐릭터의 얼굴형을 선택하세요." },
  { title: "헤어 선택", description: "캐릭터의 헤어스타일을 선택하세요." },
  { title: "수염 선택", description: "수염을 선택하세요. (선택 사항)" },
  { title: "안경 선택", description: "안경을 선택하세요. (선택 사항)" },
  { title: "사주 정보", description: "운세와 행운 색상을 받으려면 생년월일을 입력하세요. (선택 사항)" },
];

function CreatePageContent() {
  const { isAdmin } = useAuth();
  const { character, loading: charLoading, fetchCharacter, createCharacter, updateCharacter } = useCharacter();
  const { saveBirthInfo } = useBirthInfo();

  // 위자드 상태
  const [wizard, setWizard] = useState<WizardState>({
    step: 1,
    face: null,
    hair: null,
    mustache: null,
    glasses: null,
    skinTone: DEFAULT_SKIN_TONE,
  });

  // 미리보기 캔버스
  const [previewCanvas, setPreviewCanvas] = useState<HTMLCanvasElement | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // 온보딩 슬라이드 상태
  const [showOnboarding, setShowOnboarding] = useState(false);

  // 온보딩 완료 핸들러
  const handleOnboardingComplete = useCallback(() => {
    try { localStorage.setItem('aec_onboarding_done', 'true'); } catch { /* localStorage 사용 불가 */ }
    setShowOnboarding(false);
  }, []);

  // 관리자 편집 모드: 관리자이면서 기존 캐릭터가 있는 경우
  const isEditMode = isAdmin && character !== null;

  // 초기 로드: 기존 캐릭터가 있으면 무드 페이지로 리다이렉트 (관리자 제외)
  useEffect(() => {
    fetchCharacter().then((existing) => {
      if (existing && !isAdmin) {
        // 일반 사용자: 이미 캐릭터가 있으면 무드 페이지로 이동
        window.location.href = "/mood/";
      } else if (existing && isAdmin) {
        // 관리자: 기존 캐릭터 데이터를 위자드 상태에 로드 (편집 모드)
        setWizard({
          step: 1,
          face: existing.face,
          hair: existing.hair,
          mustache: existing.mustache,
          glasses: existing.glasses,
          skinTone: (existing.skinTone as SkinTone) ?? DEFAULT_SKIN_TONE,
        });
      } else if (!existing && !isAdmin) {
        // 신규 사용자: 온보딩 슬라이드 표시 (한 번만)
        try {
          if (!localStorage.getItem('aec_onboarding_done')) {
            setShowOnboarding(true);
          }
        } catch { /* localStorage 사용 불가 */ }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 에셋 목록
  const faceAssets = useMemo(() => getFaceSvgAssets(), []);
  const hairAssets = useMemo(() => getHairAssets(), []);
  const glassesAssets = useMemo(() => getGlassesAssets(), []);

  // 선택된 얼굴에 호환되는 수염 목록
  const mustacheAssets = useMemo(() => {
    if (!wizard.face) return [];
    const faceShape: FaceShape = SVG_FACE_FILENAME_TO_SHAPE[wizard.face] ?? "oval";
    return getCompatibleMustaches(faceShape);
  }, [wizard.face]);

  // 미리보기 업데이트
  useEffect(() => {
    // 최소 얼굴이 선택되어야 미리보기 생성
    if (!wizard.face) {
      setPreviewCanvas(null);
      return;
    }

    // 미리보기용 더미 조합 (선택되지 않은 레이어는 기본값 사용)
    const previewCombination: CharacterCombination = {
      body: "casual_1.png", // 미리보기용 기본 의상
      face: wizard.face,
      expression: "1_1.png", // 미리보기용 기본 표정
      mustache: wizard.mustache,
      hair: wizard.hair ?? "hair_1.png",
      glasses: wizard.glasses,
      skinTone: wizard.skinTone,
    };

    // 헤어가 아직 선택되지 않았으면 미리보기 건너뜀 (스텝 1에서는 얼굴만)
    if (!wizard.hair) {
      // 헤어 없이 간단 미리보기
      const simpleCombination: CharacterCombination = {
        body: "casual_1.png",
        face: wizard.face,
        expression: "1_1.png",
        mustache: null,
        hair: "hair_1.png",
        glasses: null,
        skinTone: wizard.skinTone,
      };

      setIsPreviewLoading(true);
      compositeCharacter(simpleCombination)
        .then(setPreviewCanvas)
        .catch(() => setPreviewCanvas(null))
        .finally(() => setIsPreviewLoading(false));
      return;
    }

    setIsPreviewLoading(true);
    compositeCharacter(previewCombination)
      .then(setPreviewCanvas)
      .catch(() => setPreviewCanvas(null))
      .finally(() => setIsPreviewLoading(false));
  }, [wizard.face, wizard.hair, wizard.mustache, wizard.glasses, wizard.skinTone]);

  // 스텝 이동 핸들러
  const goToStep = useCallback((step: 1 | 2 | 3 | 4 | 5) => {
    setWizard((prev) => ({ ...prev, step }));
  }, []);

  // 저장 핸들러 (편집 모드: updateCharacter, 생성 모드: createCharacter)
  // birthInfoParam이 있으면 캐릭터 저장 후 사주 정보도 함께 저장한다.
  const handleSave = useCallback(async (birthInfoParam?: BirthInfo) => {
    if (!wizard.face || !wizard.hair) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const data = {
        face: wizard.face,
        hair: wizard.hair,
        mustache: wizard.mustache,
        glasses: wizard.glasses,
        skinTone: wizard.skinTone,
      };

      let result;
      if (isEditMode && character) {
        // 관리자 편집 모드: 기존 캐릭터 수정
        result = await updateCharacter(character.id, data);
      } else {
        // 신규 생성 모드
        result = await createCharacter(data);
      }

      // 저장 실패 시 에러 메시지 표시
      if (!result) {
        setSaveError("캐릭터 저장에 실패했습니다. 다시 시도해주세요.");
        return;
      }

      // 사주 정보가 있으면 함께 저장
      if (birthInfoParam) {
        await saveBirthInfo(birthInfoParam);
      }

      // 성공 시 무드 페이지로 이동 (반드시 await 후에 navigate)
      window.location.href = "/mood/";
    } catch (err) {
      const message = err instanceof Error ? err.message : "캐릭터 저장에 실패했습니다. 다시 시도해주세요.";
      setSaveError(message);
      console.error("[캐릭터 저장 실패]", err);
    } finally {
      setIsSaving(false);
    }
  }, [wizard, createCharacter, updateCharacter, isEditMode, character, saveBirthInfo]);

  // 로딩 중
  if (charLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"
            aria-hidden="true"
          />
          <span className="text-sm text-gray-500">캐릭터 정보 로딩 중...</span>
        </div>
      </div>
    );
  }

  // 온보딩 슬라이드 표시
  if (showOnboarding) {
    return <OnboardingSlides onComplete={handleOnboardingComplete} />;
  }

  return (
    <main className="min-h-screen p-4 md:p-8">
      {/* 헤더 */}
      <header className="text-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          {isEditMode ? "캐릭터 수정" : "캐릭터 생성"}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {isEditMode
            ? "캐릭터의 외형을 수정할 수 있습니다"
            : "나만의 베이스 캐릭터를 만들어보세요"}
        </p>
        {isEditMode && (
          <span className="inline-block mt-2 px-3 py-1 text-xs font-medium text-amber-700 bg-amber-100 rounded-full">
            관리자 편집 모드
          </span>
        )}
      </header>

      {/* 메인 콘텐츠: 2열 (데스크톱) / 1열 (모바일) */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {/* 왼쪽: 위자드 */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
          {/* 스텝 1: 얼굴 */}
          {wizard.step === 1 && (
            <WizardStep
              currentStep={1}
              totalSteps={5}
              title={WIZARD_STEPS[0].title}
              description={WIZARD_STEPS[0].description}
              nextDisabled={!wizard.face}
              onNext={() => goToStep(2)}
            >
              <AssetPicker
                assets={faceAssets}
                layerType="face"
                selected={wizard.face}
                onSelect={(filename) =>
                  setWizard((prev) => ({
                    ...prev,
                    face: filename,
                    // 얼굴 변경 시 호환되지 않는 수염 초기화
                    mustache: null,
                  }))
                }
              />
              {/* 피부색 선택 */}
              <SkinTonePicker
                selected={wizard.skinTone}
                onSelect={(tone: SkinTone) =>
                  setWizard((prev) => ({ ...prev, skinTone: tone }))
                }
              />
            </WizardStep>
          )}

          {/* 스텝 2: 헤어 */}
          {wizard.step === 2 && (
            <WizardStep
              currentStep={2}
              totalSteps={5}
              title={WIZARD_STEPS[1].title}
              description={WIZARD_STEPS[1].description}
              nextDisabled={!wizard.hair}
              onPrev={() => goToStep(1)}
              onNext={() => goToStep(3)}
            >
              <AssetPicker
                assets={hairAssets}
                layerType="hair"
                selected={wizard.hair}
                onSelect={(filename) =>
                  setWizard((prev) => ({ ...prev, hair: filename }))
                }
              />
            </WizardStep>
          )}

          {/* 스텝 3: 수염 (선택 사항) */}
          {wizard.step === 3 && (
            <WizardStep
              currentStep={3}
              totalSteps={5}
              title={WIZARD_STEPS[2].title}
              description={WIZARD_STEPS[2].description}
              canSkip
              onPrev={() => goToStep(2)}
              onNext={() => goToStep(4)}
              onSkip={() => {
                setWizard((prev) => ({ ...prev, mustache: null, step: 4 }));
              }}
            >
              <AssetPicker
                assets={mustacheAssets}
                layerType="mustache"
                selected={wizard.mustache}
                onSelect={(filename) =>
                  setWizard((prev) => ({ ...prev, mustache: filename }))
                }
                optional
              />
            </WizardStep>
          )}

          {/* 스텝 4: 안경 (선택 사항) */}
          {wizard.step === 4 && (
            <WizardStep
              currentStep={4}
              totalSteps={5}
              title={WIZARD_STEPS[3].title}
              description={WIZARD_STEPS[3].description}
              canSkip
              onPrev={() => goToStep(3)}
              onNext={() => goToStep(5)}
              onSkip={() => {
                setWizard((prev) => ({ ...prev, glasses: null, step: 5 }));
              }}
            >
              <AssetPicker
                assets={glassesAssets}
                layerType="glasses"
                selected={wizard.glasses}
                onSelect={(filename) =>
                  setWizard((prev) => ({ ...prev, glasses: filename }))
                }
                optional
              />
            </WizardStep>
          )}

          {/* 스텝 5: 사주 정보 (선택 사항) */}
          {wizard.step === 5 && (
            <WizardStep
              currentStep={5}
              totalSteps={5}
              title={WIZARD_STEPS[4].title}
              description={WIZARD_STEPS[4].description}
              canSkip
              isLastStep
              isSaving={isSaving}
              onPrev={() => goToStep(4)}
              onNext={() => handleSave()}
              onSkip={() => handleSave()}
            >
              <BirthInfoForm
                onSave={async (info: BirthInfo) => {
                  await handleSave(info);
                  return true;
                }}
              />
            </WizardStep>
          )}

          {/* 저장 에러 메시지 */}
          {saveError && (
            <div
              role="alert"
              className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"
            >
              {saveError}
            </div>
          )}
        </div>

        {/* 오른쪽: 미리보기 */}
        <div className="flex flex-col items-center">
          <h3 className="text-sm font-medium text-gray-500 mb-3">미리보기</h3>
          <CharacterCanvas
            composited={previewCanvas}
            isLoading={isPreviewLoading}
          />
        </div>
      </div>
    </main>
  );
}

// AuthGuard로 래핑
export default function CreatePage() {
  return (
    <AuthGuard>
      <CreatePageContent />
    </AuthGuard>
  );
}
