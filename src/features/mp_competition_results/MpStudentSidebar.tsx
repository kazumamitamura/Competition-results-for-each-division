"use client";

import { useEffect, useState } from "react";
import { mpGetStudents } from "./actions";
import { useMpStudentSelection } from "./MpStudentSelectionContext";
import type { MpStudent } from "./types";

export function MpStudentSidebar() {
  const [students, setStudents] = useState<MpStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { selectedStudents, addStudent, removeStudent, formatStudentForForm } =
    useMpStudentSelection();

  useEffect(() => {
    async function loadStudents() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await mpGetStudents();
        setStudents(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "部員の取得に失敗しました");
      } finally {
        setIsLoading(false);
      }
    }
    loadStudents();
  }, []);

  const isSelected = (studentId: string) =>
    selectedStudents.some((s) => s.id === studentId);

  return (
    <div className="mp-app-container mp-student-sidebar">
      <div className="mp-student-sidebar-header">
        <h2 className="mp-student-sidebar-title">部員名簿</h2>
        {selectedStudents.length > 0 && (
          <span className="mp-student-sidebar-count">
            {selectedStudents.length}名選択中
          </span>
        )}
      </div>

      {isLoading && (
        <div className="mp-student-sidebar-loading">読み込み中...</div>
      )}

      {error && (
        <div className="mp-student-sidebar-error" role="alert">
          {error}
        </div>
      )}

      {!isLoading && !error && students.length === 0 && (
        <div className="mp-student-sidebar-empty">
          部員データがありません。CSVからインポートしてください。
        </div>
      )}

      {!isLoading && !error && students.length > 0 && (
        <ul className="mp-student-sidebar-list">
          {students.map((student) => {
            const selected = isSelected(student.id);
            return (
              <li key={student.id} className="mp-student-sidebar-item">
                <button
                  type="button"
                  onClick={() =>
                    selected ? removeStudent(student.id) : addStudent(student)
                  }
                  className={`mp-student-sidebar-button ${
                    selected ? "mp-student-sidebar-button-selected" : ""
                  }`}
                >
                  <span className="mp-student-sidebar-name">
                    <span className="mp-student-sidebar-grade">
                      ({student.grade_class_num})
                    </span>{" "}
                    {student.last_name} {student.first_name}
                  </span>
                  {selected && (
                    <span className="mp-student-sidebar-check">✓</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
