"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Member {
  id: string;
  name: string;
  emoji: string;
  color: string; // tailwind gradient classes
}

const LS_KEY = "seoulmate_members";
const QUERY_KEY = ["members"];

const DEFAULT_MEMBERS: Member[] = [
  { id: "bryan", name: "Bryan", emoji: "🧑‍💻", color: "from-emerald-400 to-teal-500" },
  { id: "sarah", name: "Sarah", emoji: "👩‍🎨", color: "from-violet-400 to-purple-500" },
  { id: "mike",  name: "Mike",  emoji: "🧑‍🍳", color: "from-orange-400 to-amber-500" },
  { id: "priya", name: "Priya", emoji: "👩‍✈️", color: "from-rose-400 to-pink-500" },
];

const EMOJI_OPTIONS = ["😊","🧑‍💻","👩‍🎨","🧑‍🍳","👩‍✈️","🧑‍🎤","👩‍🔬","🧑‍🎓","👩‍💼","🧑‍🚀","🐼","🦊","🐸","🦄","🐯","🐻","🌸","⭐","🎯","🎸"];
const COLOR_OPTIONS = [
  "from-emerald-400 to-teal-500",
  "from-violet-400 to-purple-500",
  "from-orange-400 to-amber-500",
  "from-rose-400 to-pink-500",
  "from-sky-400 to-blue-500",
  "from-yellow-400 to-orange-400",
  "from-fuchsia-400 to-pink-500",
  "from-teal-400 to-cyan-500",
];

export { EMOJI_OPTIONS, COLOR_OPTIONS };

function loadMembers(): Member[] {
  if (typeof window === "undefined") return DEFAULT_MEMBERS;
  try {
    const stored = localStorage.getItem(LS_KEY);
    if (!stored) {
      localStorage.setItem(LS_KEY, JSON.stringify(DEFAULT_MEMBERS));
      return DEFAULT_MEMBERS;
    }
    return JSON.parse(stored);
  } catch {
    return DEFAULT_MEMBERS;
  }
}

function saveMembers(members: Member[]): void {
  localStorage.setItem(LS_KEY, JSON.stringify(members));
}

export function useMembers() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: loadMembers,
    staleTime: Infinity,
  });
}

export function useAddMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (member: Omit<Member, "id">) => {
      const members = loadMembers();
      const newMember: Member = {
        ...member,
        id: member.name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now(),
      };
      members.push(newMember);
      saveMembers(members);
      return newMember;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const members = loadMembers().filter((m) => m.id !== id);
      saveMembers(members);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function getMembersSync(): Member[] {
  return loadMembers();
}
