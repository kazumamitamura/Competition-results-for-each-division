"use client";

import { useState, useEffect, useCallback } from "react";
import {
  mpGetAllStudentsForAssignment,
  mpAssignStudentsToClub,
  mpRemoveStudentsFromClub,
  mpChangeStudentsClub,
} from "./actions/mpStudentActions";
import { mpGetStudents } from "./actions";
import type { MpStudent } from "./types";

const PAGE_SIZE = 50;

interface StudentAssignmentModalProps {
  open: boolean;
  onClose: () => void;
  clubOptions: string[];
  assignedClub: string | null;
  onSuccess: () => void;
}

type TabId = "add" | "manage";

export function StudentAssignmentModal({
  open,
  onClose,
  clubOptions,
  assignedClub,
  onSuccess,
}: StudentAssignmentModalProps) {
  const [tab, setTab] = useState<TabId>("add");
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Tab A: 全校生徒
  const [searchGrade, setSearchGrade] = useState("");
  const [searchName, setSearchName] = useState("");
  const [allStudents, setAllStudents] = useState<MpStudent[]>([]);
  const [totalAll, setTotalAll] = useState(0);
  const [page, setPage] = useState(1);
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [loadingAll, setLoadingAll] = useState(false);
  const [selectedForAdd, setSelectedForAdd] = useState<Set<string>>(new Set());
  const [assignTargetClub, setAssignTargetClub] = useState(assignedClub ?? "");
  const [assigning, setAssigning] = useState(false);

  // Tab B: 担当部活の生徒
  const [clubStudents, setClubStudents] = useState<MpStudent[]>([]);
  const [loadingClub, setLoadingClub] = useState(false);
  const [selectedForManage, setSelectedForManage] = useState<Set<string>>(new Set());
  const [changeToClub, setChangeToClub] = useState("");
  const [removing, setRemoving] = useState(false);
  const [changing, setChanging] = useState(false);

  const loadAllStudents = useCallback(async () => {
    if (!open) return;
    setLoadingAll(true);
    const res = await mpGetAllStudentsForAssignment({
      grade_class_num: searchGrade || undefined,
      name: searchName || undefined,
      page,
      pageSize: PAGE_SIZE,
    });
    setAllStudents(res.data);
    setTotalAll(res.total);
    setLoadingAll(false);
  }, [open, searchGrade, searchName, page]);

  const loadClubStudents = useCallback(async () => {
    if (!open || !assignedClub) return;
    setLoadingClub(true);
    const list = await mpGetStudents();
    setClubStudents(list);
    setLoadingClub(false);
  }, [open, assignedClub]);

  useEffect(() => {
    if (!open) return;
    if (tab === "add") loadAllStudents();
    else loadClubStudents();
  }, [open, tab, searchTrigger, loadAllStudents, loadClubStudents]);

  useEffect(() => {
    if (open && assignedClub) setAssignTargetClub(assignedClub);
  }, [open, assignedClub]);

  const showMsg = (type: "ok" | "err", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleAssign = async () => {
    const ids = Array.from(selectedForAdd);
    if (!ids.length) {
      showMsg("err", "生徒を選択してください");
      return;
    }
    const club = assignTargetClub.trim();
    if (!club) {
      showMsg("err", "部活を選択してください");
      return;
    }
    setAssigning(true);
    const result = await mpAssignStudentsToClub(ids, club);
    setAssigning(false);
    if (result.error) {
      showMsg("err", result.error);
      return;
    }
    showMsg("ok", `${result.assigned ?? 0}件を追加しました${result.skipped ? `（${result.skipped}件スキップ）` : ""}`);
    setSelectedForAdd(new Set());
    loadAllStudents();
    onSuccess();
  };

  const handleRemove = async () => {
    const ids = Array.from(selectedForManage);
    if (!ids.length || !assignedClub) return;
    if (!confirm("選択した生徒をこの部活から削除しますか？")) return;
    setRemoving(true);
    const result = await mpRemoveStudentsFromClub(ids, assignedClub);
    setRemoving(false);
    if (result.error) {
      showMsg("err", result.error);
      return;
    }
    showMsg("ok", `${result.removed ?? 0}件から削除しました`);
    setSelectedForManage(new Set());
    loadClubStudents();
    onSuccess();
  };

  const handleChange = async () => {
    const ids = Array.from(selectedForManage);
    const toClub = changeToClub.trim();
    if (!ids.length || !assignedClub || !toClub) {
      showMsg("err", "生徒を選択し、変更先の部活を選んでください");
      return;
    }
    setChanging(true);
    const result = await mpChangeStudentsClub(ids, assignedClub, toClub);
    setChanging(false);
    if (result.error) {
      showMsg("err", result.error);
      return;
    }
    showMsg("ok", `${result.updated ?? 0}件を変更しました`);
    setSelectedForManage(new Set());
    setChangeToClub("");
    loadClubStudents();
    onSuccess();
  };

  const toggleAdd = (id: string) => {
    setSelectedForAdd((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleManage = (id: string) => {
    setSelectedForManage((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!open) return null;

  const totalPages = Math.max(1, Math.ceil(totalAll / PAGE_SIZE));

  return (
    <div
      className="mp-assign-modal-overlay"
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="mp-assign-modal">
        <div className="mp-assign-modal-header">
          <h2 className="mp-assign-modal-title">生徒の部活割り当て</h2>
          <button type="button" onClick={onClose} className="mp-assign-modal-close">
            ×
          </button>
        </div>

        <div className="mp-assign-modal-tabs">
          <button
            type="button"
            onClick={() => setTab("add")}
            className={tab === "add" ? "mp-assign-modal-tab mp-assign-modal-tab-active" : "mp-assign-modal-tab"}
          >
            部活動の追加
          </button>
          <button
            type="button"
            onClick={() => setTab("manage")}
            className={tab === "manage" ? "mp-assign-modal-tab mp-assign-modal-tab-active" : "mp-assign-modal-tab"}
          >
            部活動の変更・削除
          </button>
        </div>

        {message && (
          <div
            className={message.type === "ok" ? "mp-assign-modal-msg mp-assign-modal-msg-ok" : "mp-assign-modal-msg mp-assign-modal-msg-err"}
            role="alert"
          >
            {message.text}
          </div>
        )}

        {tab === "add" && (
          <div className="mp-assign-modal-body">
            <div className="mp-assign-modal-filters">
              <input
                type="text"
                placeholder="学年クラス"
                value={searchGrade}
                onChange={(e) => setSearchGrade(e.target.value)}
                className="mp-assign-modal-input"
              />
              <input
                type="text"
                placeholder="氏名"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="mp-assign-modal-input"
              />
              <button
                type="button"
                onClick={() => { setPage(1); setSearchTrigger((s) => s + 1); }}
                className="mp-assign-modal-btn"
              >
                検索
              </button>
            </div>

            <div className="mp-assign-modal-actions">
              {assignedClub ? (
                <button
                  type="button"
                  onClick={handleAssign}
                  disabled={assigning || selectedForAdd.size === 0}
                  className="mp-assign-modal-btn mp-assign-modal-btn-primary"
                >
                  {assignedClub} に追加 {selectedForAdd.size ? `(${selectedForAdd.size}名)` : ""}
                </button>
              ) : (
                <>
                  <select
                    value={assignTargetClub}
                    onChange={(e) => setAssignTargetClub(e.target.value)}
                    className="mp-assign-modal-input mp-assign-modal-select"
                  >
                    <option value="">部活動を選択</option>
                    {clubOptions.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAssign}
                    disabled={assigning || selectedForAdd.size === 0 || !assignTargetClub.trim()}
                    className="mp-assign-modal-btn mp-assign-modal-btn-primary"
                  >
                    追加
                  </button>
                </>
              )}
            </div>

            <div className="mp-assign-modal-list-wrap">
              {loadingAll ? (
                <div className="mp-assign-modal-loading">読み込み中...</div>
              ) : (
                <>
                  <ul className="mp-assign-modal-list">
                    {allStudents.map((s) => (
                      <li key={s.id} className="mp-assign-modal-list-item">
                        <label className="mp-assign-modal-check-label">
                          <input
                            type="checkbox"
                            checked={selectedForAdd.has(s.id)}
                            onChange={() => toggleAdd(s.id)}
                            className="mp-assign-modal-checkbox"
                          />
                          <span className="mp-assign-modal-list-name">
                            {s.grade_class_num} {s.last_name} {s.first_name}
                          </span>
                          <span className="mp-assign-modal-list-clubs">
                            {[s.club_name, s.club_name_2].filter(Boolean).join(" / ") || "—"}
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                  {totalPages > 1 && (
                    <div className="mp-assign-modal-pagination">
                      <button
                        type="button"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        className="mp-assign-modal-btn"
                      >
                        前へ
                      </button>
                      <span className="mp-assign-modal-page-num">
                        {page} / {totalPages}（全{totalAll}件）
                      </span>
                      <button
                        type="button"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                        className="mp-assign-modal-btn"
                      >
                        次へ
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {tab === "manage" && (
          <div className="mp-assign-modal-body">
            {!assignedClub ? (
              <p className="mp-assign-modal-empty">担当部活が未設定です。ホームで設定してください。</p>
            ) : (
              <>
                <div className="mp-assign-modal-actions mp-assign-modal-actions-row">
                  <button
                    type="button"
                    onClick={handleRemove}
                    disabled={removing || selectedForManage.size === 0}
                    className="mp-assign-modal-btn mp-assign-modal-btn-danger"
                  >
                    部活から削除 {selectedForManage.size ? `(${selectedForManage.size}名)` : ""}
                  </button>
                  <span className="mp-assign-modal-change-row">
                    <select
                      value={changeToClub}
                      onChange={(e) => setChangeToClub(e.target.value)}
                      className="mp-assign-modal-input mp-assign-modal-select"
                    >
                      <option value="">部活を変更先で選択</option>
                      {clubOptions.filter((c) => c !== assignedClub).map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleChange}
                      disabled={changing || selectedForManage.size === 0 || !changeToClub.trim()}
                      className="mp-assign-modal-btn mp-assign-modal-btn-primary"
                    >
                      部活を変更
                    </button>
                  </span>
                </div>

                <div className="mp-assign-modal-list-wrap">
                  {loadingClub ? (
                    <div className="mp-assign-modal-loading">読み込み中...</div>
                  ) : clubStudents.length === 0 ? (
                    <div className="mp-assign-modal-empty">この部活に所属する生徒はいません。</div>
                  ) : (
                    <ul className="mp-assign-modal-list">
                      {clubStudents.map((s) => (
                        <li key={s.id} className="mp-assign-modal-list-item">
                          <label className="mp-assign-modal-check-label">
                            <input
                              type="checkbox"
                              checked={selectedForManage.has(s.id)}
                              onChange={() => toggleManage(s.id)}
                              className="mp-assign-modal-checkbox"
                            />
                            <span className="mp-assign-modal-list-name">
                              {s.grade_class_num} {s.last_name} {s.first_name}
                            </span>
                            <span className="mp-assign-modal-list-clubs">
                              {[s.club_name, s.club_name_2].filter(Boolean).join(" / ")}
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
