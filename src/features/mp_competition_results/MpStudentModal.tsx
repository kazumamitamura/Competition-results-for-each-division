"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type { MpStudent, MpStudentFormData } from "./types";
import { mpCreateStudent, mpUpdateStudent } from "./actions/mpStudentActions";

interface MpStudentModalProps {
  open: boolean;
  onClose: () => void;
  mode: "add" | "edit";
  initialData?: MpStudent | null;
  clubOptions: string[];
  assignedClub: string;
  onSuccess: () => void;
}

const defaultValues: MpStudentFormData = {
  grade_class_num: "",
  last_name: "",
  first_name: "",
  last_kana: "",
  first_kana: "",
  club_name: "",
  club_name_2: "",
};

export function MpStudentModal({
  open,
  onClose,
  mode,
  initialData,
  clubOptions,
  assignedClub,
  onSuccess,
}: MpStudentModalProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MpStudentFormData>({
    defaultValues,
  });

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && initialData) {
      reset({
        grade_class_num: initialData.grade_class_num,
        last_name: initialData.last_name,
        first_name: initialData.first_name,
        last_kana: initialData.last_kana ?? "",
        first_kana: initialData.first_kana ?? "",
        club_name: initialData.club_name,
        club_name_2: initialData.club_name_2 ?? "",
      });
    } else {
      reset({
        ...defaultValues,
        club_name: assignedClub,
        club_name_2: "",
      });
    }
  }, [open, mode, initialData, assignedClub, reset]);

  async function onSubmit(data: MpStudentFormData) {
    setSubmitError(null);
    if (mode === "add") {
      const result = await mpCreateStudent(data);
      if (result.error) {
        setSubmitError(result.error);
        return;
      }
    } else if (initialData) {
      const result = await mpUpdateStudent(initialData.id, data);
      if (result.error) {
        setSubmitError(result.error);
        return;
      }
    }
    onSuccess();
    onClose();
  }

  if (!open) return null;

  return (
    <div
      className="mp-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mp-student-modal-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="mp-modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 id="mp-student-modal-title" className="mp-modal-title">
          {mode === "add" ? "生徒を追加" : "生徒を編集"}
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="mp-modal-form">
          {submitError && (
            <div className="mp-modal-error-banner" role="alert">
              {submitError}
            </div>
          )}
          <div className="mp-modal-field">
            <label className="mp-modal-label">学年クラス番号</label>
            <input
              type="text"
              className="mp-modal-input"
              placeholder="例: 2-1-15"
              {...register("grade_class_num", { required: "入力してください" })}
            />
            {errors.grade_class_num && (
              <span className="mp-modal-error">{errors.grade_class_num.message}</span>
            )}
          </div>
          <div className="mp-modal-row">
            <div className="mp-modal-field">
              <label className="mp-modal-label">姓</label>
              <input
                type="text"
                className="mp-modal-input"
                {...register("last_name", { required: "入力してください" })}
              />
              {errors.last_name && (
                <span className="mp-modal-error">{errors.last_name.message}</span>
              )}
            </div>
            <div className="mp-modal-field">
              <label className="mp-modal-label">名</label>
              <input
                type="text"
                className="mp-modal-input"
                {...register("first_name", { required: "入力してください" })}
              />
              {errors.first_name && (
                <span className="mp-modal-error">{errors.first_name.message}</span>
              )}
            </div>
          </div>
          <div className="mp-modal-row">
            <div className="mp-modal-field">
              <label className="mp-modal-label">せい（かな）</label>
              <input type="text" className="mp-modal-input" {...register("last_kana")} />
            </div>
            <div className="mp-modal-field">
              <label className="mp-modal-label">めい（かな）</label>
              <input type="text" className="mp-modal-input" {...register("first_kana")} />
            </div>
          </div>
          <div className="mp-modal-field">
            <label className="mp-modal-label">所属部活 1</label>
            <select
              className="mp-modal-input"
              {...register("club_name", { required: "選択してください" })}
            >
              <option value="">選択してください</option>
              {clubOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            {errors.club_name && (
              <span className="mp-modal-error">{errors.club_name.message}</span>
            )}
          </div>
          <div className="mp-modal-field">
            <label className="mp-modal-label">所属部活 2（兼部）</label>
            <select className="mp-modal-input" {...register("club_name_2")}>
              <option value="">なし</option>
              {clubOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div className="mp-modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="mp-modal-button mp-modal-button-secondary"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="mp-modal-button mp-modal-button-primary"
            >
              {isSubmitting ? "保存中..." : "保存"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
