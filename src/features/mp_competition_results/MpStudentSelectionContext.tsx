"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import type { MpStudent } from "./types";

interface MpStudentSelectionContextValue {
  selectedStudents: MpStudent[];
  addStudent: (student: MpStudent) => void;
  removeStudent: (studentId: string) => void;
  clearSelection: () => void;
  formatStudentForForm: (student: MpStudent) => string; // 「三村(3-1)」形式
  formatAllSelected: () => string; // 「三村(3-1), 友野(3-2)」形式
}

const MpStudentSelectionContext = createContext<MpStudentSelectionContextValue | null>(null);

export function MpStudentSelectionProvider({ children }: { children: ReactNode }) {
  const [selectedStudents, setSelectedStudents] = useState<MpStudent[]>([]);

  const addStudent = useCallback((student: MpStudent) => {
    setSelectedStudents((prev) => {
      if (prev.some((s) => s.id === student.id)) return prev;
      return [...prev, student];
    });
  }, []);

  const removeStudent = useCallback((studentId: string) => {
    setSelectedStudents((prev) => prev.filter((s) => s.id !== studentId));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedStudents([]);
  }, []);

  /**
   * 1人の生徒を「姓(grade_class_num)」形式にフォーマット
   * 例: 「三村(3LIA13)」
   */
  const formatStudentForForm = useCallback((student: MpStudent): string => {
    return `${student.last_name}(${student.grade_class_num})`;
  }, []);

  /**
   * 選択済み全員を「姓(grade_class_num)、姓(grade_class_num)」形式にフォーマット
   * 例: 「三村(3LIA13)、友野(2LIA5)」
   */
  const formatAllSelected = useCallback((): string => {
    return selectedStudents.map(formatStudentForForm).join("、");
  }, [selectedStudents, formatStudentForForm]);

  return (
    <MpStudentSelectionContext.Provider
      value={{
        selectedStudents,
        addStudent,
        removeStudent,
        clearSelection,
        formatStudentForForm,
        formatAllSelected,
      }}
    >
      {children}
    </MpStudentSelectionContext.Provider>
  );
}

export function useMpStudentSelection() {
  const context = useContext(MpStudentSelectionContext);
  if (!context) {
    throw new Error("useMpStudentSelection must be used within MpStudentSelectionProvider");
  }
  return context;
}
