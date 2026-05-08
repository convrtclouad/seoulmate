"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, X, Save, ImagePlus, ChevronLeft, ChevronRight, Pencil, Trash2, Download } from "lucide-react";
import {
  useJournalPosts, useJournalDates, useUpsertJournalPost,
  useInsertJournalPost, useUpdateJournalPost, useDeleteJournalPost,
} from "@/lib/hooks/useSupabaseJournal";
import { useMembers } from "@/lib/hooks/useSupabaseMembers";
import { compressImage } from "@/lib/utils/imageCompress";
import { format, addDays, differenceInDays } from "date-fns";
import { zhCN } from "date-fns/locale";
import { tap, success, warn } from "@/lib/utils/haptics";

const TRIP_START = new Date("2026-05-07");
const TRIP_END   = new Date("2026-05-15");
const TRIP_DAYS  = Array.from(
  { length: differenceInDays(TRIP_END, TRIP_START) + 1 },
  (_, i) => addDays(TRIP_START, i),
);
const MOODS = ["😊","🥰","😄","😎","😌","😴","🤩","😋","🥵","🌧️"];

/* ── Photo grid inside a post card ── */
function PhotoGrid({ photos }: { photos: string[] }) {
  const [idx, setIdx] = useState(0);
  if (!photos.length) return null;

  function downloadPhoto(src: string) {
    const a = document.createElement("a");
    a.href = src;
    a.download = "seoulmate-photo.jpg";
    a.click();
  }

  if (photos.length === 1) {
    return (
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photos[0]} alt="photo" className="w-full aspect-[4/3] object-cover" />
        <button
          onClick={() => downloadPhoto(photos[0])}
          className="absolute bottom-2 right-2 h-7 w-7 rounded-full bg-black/50 flex items-center justify-center">
          <Download className="h-3.5 w-3.5 text-white" />
        </button>
      </div>
    );
  }

  if (photos.length === 2) {
    return (
      <div className="flex gap-0.5">
        {photos.map((p, i) => (
          <div key={i} className="relative flex-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p} alt="" className="w-full aspect-square object-cover" />
            <button
              onClick={() => downloadPhoto(p)}
              className="absolute bottom-1 right-1 h-6 w-6 rounded-full bg-black/50 flex items-center justify-center">
              <Download className="h-3 w-3 text-white" />
            </button>
          </div>
        ))}
      </div>
    );
  }

  // 3+ photos: swipeable carousel
  return (
    <div className="relative aspect-[4/3] overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photos[idx]} alt="" className="w-full h-full object-cover" />
      {photos.length > 1 && (
        <>
          {idx > 0 && (
            <button onClick={() => setIdx((i) => i - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 flex items-center justify-center">
              <ChevronLeft className="h-4 w-4 text-white" />
            </button>
          )}
          {idx < photos.length - 1 && (
            <button onClick={() => setIdx((i) => i + 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 flex items-center justify-center">
              <ChevronRight className="h-4 w-4 text-white" />
            </button>
          )}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {photos.map((_, i) => (
              <div key={i} className={`rounded-full transition-all ${i === idx ? "w-4 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50"}`} />
            ))}
          </div>
          <div className="absolute top-2 right-2 bg-black/45 rounded-full px-2 py-0.5">
            <span className="text-[10px] text-white font-bold">{idx + 1}/{photos.length}</span>
          </div>
        </>
      )}
      {/* Download current photo */}
      <button
        onClick={() => {
          const a = document.createElement("a");
          a.href = photos[idx];
          a.download = "seoulmate-photo.jpg";
          a.click();
        }}
        className="absolute bottom-2 right-2 h-7 w-7 rounded-full bg-black/50 flex items-center justify-center">
        <Download className="h-3.5 w-3.5 text-white" />
      </button>
    </div>
  );
}

/* ── Single post card ── */
function PostCard({
  post,
  isMe,
  onEdit,
  onDelete,
}: {
  post: import("@/lib/hooks/useSupabaseJournal").JournalPost;
  isMe: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const time = format(new Date(post.updated_at), "HH:mm");

  return (
    <div className="rounded-3xl bg-surface overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
      {/* Photos — full bleed, no padding */}
      {post.photos?.length > 0 && (
        <PhotoGrid photos={post.photos} />
      )}

      {/* Content */}
      <div className="p-4">
        {/* Author row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-lavender-100 flex items-center justify-center text-lg shrink-0">
              {post.member_emoji}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-black text-ink">{post.member_name}</p>
                <span className="text-base">{post.mood}</span>
              </div>
              <p className="text-[10px] text-ink-faint">{time} 更新</p>
            </div>
          </div>

          {/* My post actions */}
          {isMe && (
            <div className="flex items-center gap-1.5">
              {confirmDelete ? (
                <>
                  <button onClick={() => { warn(); onDelete(); setConfirmDelete(false); }}
                    className="text-[10px] font-bold bg-petal-100 text-petal-400 rounded-xl px-2.5 py-1.5">
                    确认删除
                  </button>
                  <button onClick={() => { tap(); setConfirmDelete(false); }}
                    className="text-[10px] font-bold bg-black/5 text-ink-muted rounded-xl px-2.5 py-1.5">
                    取消
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => { tap(); onEdit(); }}
                    className="h-8 w-8 rounded-2xl bg-lavender-100 flex items-center justify-center">
                    <Pencil className="h-3.5 w-3.5 text-lavender" />
                  </button>
                  <button onClick={() => { tap(); setConfirmDelete(true); }}
                    className="h-8 w-8 rounded-2xl bg-black/5 flex items-center justify-center">
                    <Trash2 className="h-3.5 w-3.5 text-ink-faint" />
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Text */}
        {post.text ? (
          <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">{post.text}</p>
        ) : (
          <p className="text-xs text-ink-faint italic">（仅照片）</p>
        )}
      </div>
    </div>
  );
}

/* ── Write / Edit sheet ── */
function WriteSheet({
  date,
  memberId,
  memberName,
  memberEmoji,
  postId,
  existing,
  onClose,
}: {
  date: string;
  memberId: string;
  memberName: string;
  memberEmoji: string;
  postId?: string;
  existing: import("@/lib/hooks/useSupabaseJournal").JournalPost | null;
  onClose: () => void;
}) {
  const insertPost = useInsertJournalPost();
  const updatePost = useUpdateJournalPost();
  // Keep upsert available for backward compat but don't use for new posts
  const _upsert = useUpsertJournalPost();
  const fileRef = useRef<HTMLInputElement>(null);

  const isEditing = !!postId;

  const [mood,    setMood]    = useState(existing?.mood ?? "😊");
  const [text,    setText]    = useState(existing?.text ?? "");
  const [photos,  setPhotos]  = useState<string[]>(existing?.photos ?? []);
  const [saving,  setSaving]  = useState(false);
  const [compressing, setCompressing] = useState(false);

  async function handlePhotoAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    e.target.value = "";
    setCompressing(true);
    try {
      const compressed = await Promise.all(files.map((f) => compressImage(f, 700, 0.60)));
      setPhotos((prev) => [...prev, ...compressed]);
    } finally { setCompressing(false); }
  }

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    try {
      if (isEditing && postId) {
        await updatePost.mutateAsync({ id: postId, date, mood, text, photos });
      } else {
        await insertPost.mutateAsync({
          date, member_id: memberId, member_name: memberName,
          member_emoji: memberEmoji, mood, text, photos,
        });
      }
      success();
      onClose();
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end"
         style={{ background: "rgba(0,0,0,0.4)" }}
         onClick={onClose}>
      <div className="bg-cream rounded-t-4xl animate-slide-up flex flex-col"
           style={{ maxHeight: "92dvh" }}
           onClick={(e) => e.stopPropagation()}>
        {/* Handle + header */}
        <div className="px-5 pt-5 pb-3 shrink-0">
          <div className="w-10 h-1 rounded-full bg-ink-faint mx-auto mb-4" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{memberEmoji}</span>
              <div>
                <p className="text-sm font-black text-ink">{memberName}</p>
                <p className="text-xs text-ink-muted">
                  {format(new Date(date + "T00:00:00"), "M月d日 EEEE", { locale: zhCN })}
                </p>
              </div>
            </div>
            <button onClick={onClose}>
              <X className="h-5 w-5 text-ink-muted" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-10 space-y-4">
          {/* Mood */}
          <div>
            <label className="label">今天的心情</label>
            <div className="flex gap-2 flex-wrap">
              {MOODS.map((m) => (
                <button key={m} onClick={() => { tap(); setMood(m); }}
                  className={`text-2xl p-2 rounded-2xl transition-all ${mood === m ? "bg-lavender-100 scale-110" : "hover:bg-black/5"}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Photos */}
          <div>
            <label className="label">照片（选填）</label>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {photos.map((src, idx) => (
                <div key={idx} className="relative shrink-0 h-24 w-24 rounded-2xl overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-full w-full object-cover" />
                  <button onClick={() => { tap(); setPhotos((p) => p.filter((_, i) => i !== idx)); }}
                    className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 flex items-center justify-center">
                    <X className="h-3 w-3 text-white" />
                  </button>
                </div>
              ))}
              <button onClick={() => { tap(); fileRef.current?.click(); }}
                disabled={compressing}
                className="shrink-0 h-24 w-24 rounded-2xl border-2 border-dashed border-lavender/30 bg-lavender-50 flex flex-col items-center justify-center gap-1 active:scale-95 transition-all">
                {compressing ? (
                  <div className="h-5 w-5 rounded-full border-2 border-lavender/30 border-t-lavender animate-spin" />
                ) : (
                  <>
                    <ImagePlus className="h-6 w-6 text-lavender/50" />
                    <span className="text-[10px] text-lavender/60 font-semibold">添加照片</span>
                  </>
                )}
              </button>
            </div>
            {/* Bug 3 fix: removed capture="environment" to allow gallery selection */}
            <input ref={fileRef} type="file" accept="image/*" multiple
              className="hidden" onChange={handlePhotoAdd} />
          </div>

          {/* Text */}
          <div>
            <label className="label">今天的故事</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`${format(new Date(date + "T00:00:00"), "M月d日")} 的旅程…`}
              rows={7}
              className="input resize-none text-sm leading-relaxed"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="btn-secondary flex-1">取消</button>
            <button onClick={handleSave} disabled={saving}
              className="btn-primary flex-1 disabled:opacity-40">
              {saving ? "保存中…" : <><Save className="h-4 w-4" /> {isEditing ? "更新" : "发布"}</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main page ── */
export default function JournalPage() {
  const { data: members = [] }               = useMembers();
  const { data: datesWithPosts = [] }        = useJournalDates();
  const [selected,   setSelected]            = useState(format(TRIP_DAYS[0], "yyyy-MM-dd"));
  const [currentId,  setCurrentId]           = useState("");
  const [showWrite,  setShowWrite]           = useState(false);
  const [editingPost, setEditingPost]        = useState<import("@/lib/hooks/useSupabaseJournal").JournalPost | null>(null);
  const { data: posts = [], isLoading }      = useJournalPosts(selected);
  const deletePost                           = useDeleteJournalPost();

  useEffect(() => {
    setCurrentId(localStorage.getItem("seoulmate_user") ?? "");
  }, []);

  const me = members.find((m) => m.id === currentId);

  // Sort all posts by created_at ascending
  const sortedPosts = [...posts].sort((a, b) => a.created_at.localeCompare(b.created_at));

  return (
    <div className="flex flex-col min-h-dvh bg-cream">
      {/* Header */}
      <div className="px-5 pt-safe pt-4 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-ink tracking-tight">旅游日志</h1>
            <p className="text-xs text-ink-muted mt-0.5">记录每天的美好回忆 ✨</p>
          </div>
          <div className="flex -space-x-2">
            {members.slice(0, 4).map((m) => (
              <div key={m.id} className={`h-8 w-8 rounded-full bg-gradient-to-br ${m.color} flex items-center justify-center text-sm ring-2 ring-cream`}>
                {m.emoji}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Day tabs */}
      <div className="px-4 pt-3 pb-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {TRIP_DAYS.map((day, i) => {
            const key      = format(day, "yyyy-MM-dd");
            const isActive = key === selected;
            const hasPost  = datesWithPosts.includes(key);
            return (
              <button key={i}
                onClick={() => { tap(); setSelected(key); }}
                className="flex flex-col items-center shrink-0 rounded-2xl px-3 py-2.5 transition-all duration-200"
                style={{
                  background:  isActive ? "#8B7AB8" : "#FFFFFF",
                  boxShadow:   isActive ? "0 4px 16px rgba(139,122,184,0.35)" : "var(--shadow-card)",
                  minWidth:    52,
                }}>
                <span className={`text-[9px] font-bold uppercase tracking-wider ${isActive ? "text-white/70" : "text-ink-faint"}`}>
                  DAY{i + 1}
                </span>
                <span className={`text-lg font-black ${isActive ? "text-white" : "text-ink"}`}>
                  {format(day, "d")}
                </span>
                <span className={`text-[9px] ${isActive ? "text-white/60" : "text-ink-faint"}`}>
                  {format(day, "EEE", { locale: zhCN })}
                </span>
                {hasPost && !isActive && (
                  <div className="h-1.5 w-1.5 rounded-full bg-lavender-300 mt-1" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Date heading */}
      <div className="px-5 mb-3">
        <p className="text-xs font-bold text-ink-muted">
          {format(new Date(selected + "T00:00:00"), "M月d日 · EEEE", { locale: zhCN })}
          {posts.length > 0 && <span className="ml-2 text-lavender">{posts.length} 篇日志</span>}
        </p>
      </div>

      {/* Posts feed — all posts sorted by created_at */}
      <div className="flex-1 px-4 pb-32 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 rounded-full border-2 border-lavender/30 border-t-lavender animate-spin" />
          </div>
        ) : sortedPosts.length === 0 ? (
          <div className="rounded-3xl bg-surface p-8 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="text-5xl mb-3">📖</div>
            <p className="font-bold text-ink text-sm">
              {format(new Date(selected + "T00:00:00"), "M月d日")} 还没有日志
            </p>
            <p className="text-xs text-ink-muted mt-1">成为第一个记录今天的人 ✨</p>
            <button onClick={() => { tap(); setShowWrite(true); }} className="btn-primary mt-5 mx-auto">
              <Plus className="h-4 w-4" /> 写日志
            </button>
          </div>
        ) : (
          <>
            {sortedPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                isMe={post.member_id === currentId}
                onEdit={() => { tap(); setEditingPost(post); }}
                onDelete={() => deletePost.mutate({ id: post.id, date: selected })}
              />
            ))}
          </>
        )}
      </div>

      {/* FAB — always creates a NEW post */}
      <button onClick={() => { tap(); setShowWrite(true); }}
        className="fixed bottom-32 right-5 h-14 w-14 rounded-full text-white flex items-center justify-center z-30"
        style={{ background: "#8B7AB8", boxShadow: "0 6px 24px rgba(139,122,184,0.35)" }}>
        <Plus className="h-6 w-6" />
      </button>

      {/* Write sheet — new post */}
      {showWrite && me && (
        <WriteSheet
          date={selected}
          memberId={me.id}
          memberName={me.name}
          memberEmoji={me.emoji}
          existing={null}
          onClose={() => setShowWrite(false)}
        />
      )}

      {/* Edit sheet — existing post */}
      {editingPost && me && (
        <WriteSheet
          date={selected}
          memberId={me.id}
          memberName={me.name}
          memberEmoji={me.emoji}
          postId={editingPost.id}
          existing={editingPost}
          onClose={() => setEditingPost(null)}
        />
      )}

      {(showWrite || editingPost) && !me && (
        <div className="fixed inset-0 z-50 flex items-end" style={{ background: "rgba(0,0,0,0.35)" }}>
          <div className="w-full bg-cream rounded-t-4xl p-6 pb-10">
            <p className="font-bold text-ink text-center mb-4">请先在成员页面选择你的身份</p>
            <button onClick={() => { setShowWrite(false); setEditingPost(null); }} className="btn-secondary w-full">关闭</button>
          </div>
        </div>
      )}
    </div>
  );
}
