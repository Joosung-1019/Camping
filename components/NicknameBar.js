"use client";

export default function NicknameBar({ nickname, onRequestNickname }) {
  return (
    <button
      onClick={onRequestNickname}
      className="rounded bg-zinc-200 px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-300"
    >
      {nickname ? `👤 ${nickname}` : "닉네임 설정"}
    </button>
  );
}
