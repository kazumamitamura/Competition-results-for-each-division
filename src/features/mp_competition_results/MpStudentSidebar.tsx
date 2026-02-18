"use client";

import { useEffect, useState, useCallback } from "react";
import { mpGetStudents } from "./actions";
import { mpDeleteStudent } from "./actions/mpStudentActions";
import { useMpStudentSelection } from "./MpStudentSelectionContext";
import { MpStudentModal } from "./MpStudentModal";
import type { MpStudent } from "./types";

interface MpStudentSidebarProps {
  clubOptions: string[];
  assignedClub: string;
}

export function MpStudentSidebar({ clubOptions, assignedClub }: MpStudentSidebarProps) {
  const [students, setStudents] = useState<MpStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingStudent, setEditingStudent] = useState<MpStudent | null>(null);
  const { selectedStudents, addStudent, removeStudent } = useMpStudentSelection();

  const loadStudents = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setModalMode("add");
    setModalOpen(true);
  };

  const handleOpenEdit = (e: React.MouseEvent, student: MpStudent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingStudent(student);
    setModalMode("edit");
    setModalOpen(true);
  };

  const handleDelete = async (e: React.MouseEvent, studentId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("この生徒を削除してもよろしいですか？")) return;
    const result = await mpDeleteStudent(studentId);
    if (result.error) {
      setError(result.error);
      return;
    }
    removeStudent(studentId);
    loadStudents();
  };

  const isSelected = (studentId: string) =>
    selectedStudents.some((s) => s.id === studentId);

  return (
    <div className="mp-app-container mp-student-sidebar">
      <div className="mp-student-sidebar-header">
        <h2 className="mp-student-sidebar-title">生徒リスト</h2>
        <div className="mp-student-sidebar-header-actions">
          {selectedStudents.length > 0 && (
            <span className="mp-student-sidebar-count">
              {selectedStudents.length}名選択中
            </span>
          )}
          <button
            type="button"
            onClick={handleOpenAdd}
            className="mp-student-sidebar-add-button"
          >
            ＋ 追加
          </button>
        </div>
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
          部員データがありません。「＋ 追加」から登録してください。
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
                  <span className="mp-student-sidebar-name-block">
                    <span className="mp-student-sidebar-name">
                      <span className="mp-student-sidebar-grade">
                        ({student.grade_class_num})
                      </span>{" "}
                      {student.last_name} {student.first_name}
                    </span>
                    {(student.club_name || student.club_name_2) && (
                      <span className="mp-student-sidebar-clubs">
                        所属: {[student.club_name, student.club_name_2].filter(Boolean).join(" / ")}
                      </span>
                    )}
                  </span>
                  <span className="mp-student-sidebar-actions">
                    <button
                      type="button"
                      onClick={(e) => handleOpenEdit(e, student)}
                      className="mp-student-sidebar-icon-button"
                      title="編集"
                      aria-label="編集"
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, student.id)}
                      className="mp-student-sidebar-icon-button mp-student-sidebar-icon-button-delete"
                      title="削除"
                      aria-label="削除"
                    >
                      ×
                    </button>
                    {selected && <span className="mp-student-sidebar-check">✓</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <MpStudentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        mode={modalMode}
        initialData={editingStudent}
        clubOptions={clubOptions}
        assignedClub={assignedClub}
        onSuccess={loadStudents}
      />
    </div>
  );
}
