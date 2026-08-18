"use client";

import { useRef, useState, type ChangeEvent } from "react";

import {
  compressWerewolfAvatarFile,
  CUSTOM_WEREWOLF_AVATAR_ID,
  getWerewolfAvatarDisplay,
  WEREWOLF_AVATAR_PRESETS,
  type WerewolfAvatarId,
} from "@/_lib/werewolf/avatars";
import WerewolfAvatarImage from "./WerewolfAvatarImage";

interface WerewolfAvatarPickerProps {
  value: WerewolfAvatarId;
  avatarUrl?: string | null;
  onChange: (value: WerewolfAvatarId, avatarUrl?: string | null) => void;
  label?: string;
}

export default function WerewolfAvatarPicker({
  value,
  avatarUrl = null,
  onChange,
  label = "Avatar",
}: WerewolfAvatarPickerProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const selected = getWerewolfAvatarDisplay(value, avatarUrl);
  const isCustomSelected = selected.isCustom;

  const pickFile = () => {
    setUploadError("");
    inputRef.current?.click();
  };

  const onFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploading(true);
    setUploadError("");
    try {
      const dataUrl = await compressWerewolfAvatarFile(file);
      onChange(CUSTOM_WEREWOLF_AVATAR_ID, dataUrl);
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "Không tải được ảnh."
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="ms-avatar-picker">
      <div className="ms-avatar-picker-head">
        <span className="ms-avatar-picker-label">{label}</span>
        <span className="ms-avatar-picker-current">
          <span className="ms-avatar-preview">
            <WerewolfAvatarImage
              src={selected.image}
              alt={selected.label}
              size={72}
              className="ms-avatar-img"
            />
          </span>
          {selected.label}
        </span>
      </div>

      <div className="ms-avatar-grid" role="radiogroup" aria-label={label}>
        <button
          type="button"
          role="radio"
          aria-checked={isCustomSelected}
          aria-label="Tải ảnh lên"
          title="Tải ảnh lên"
          className={`ms-avatar-option ms-avatar-upload ${
            isCustomSelected ? "is-selected" : ""
          }`}
          onClick={pickFile}
          disabled={uploading}
        >
          {isCustomSelected ? (
            <WerewolfAvatarImage
              src={selected.image}
              alt="Ảnh của bạn"
              size={96}
              className="ms-avatar-img"
            />
          ) : (
            <span className="ms-avatar-upload-inner">
              <span className="ms-avatar-upload-icon" aria-hidden>
                {uploading ? "…" : "+"}
              </span>
              <span className="ms-avatar-upload-text">
                {uploading ? "Đang nén" : "Tải ảnh"}
              </span>
            </span>
          )}
        </button>

        {WEREWOLF_AVATAR_PRESETS.map((avatar) => {
          const isSelected = !isCustomSelected && avatar.id === value;
          return (
            <button
              key={avatar.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={avatar.label}
              title={avatar.label}
              className={`ms-avatar-option ${isSelected ? "is-selected" : ""}`}
              onClick={() => onChange(avatar.id, null)}
            >
              <WerewolfAvatarImage
                src={avatar.image}
                alt=""
                size={96}
                className="ms-avatar-img"
              />
            </button>
          );
        })}
      </div>

      {uploadError ? <p className="ms-avatar-error">{uploadError}</p> : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="ms-avatar-file"
        onChange={onFileChange}
      />

      <style jsx>{`
        .ms-avatar-picker {
          margin-top: 0.9rem;
        }

        .ms-avatar-picker-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          margin-bottom: 0.55rem;
        }

        .ms-avatar-picker-label {
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 0.02em;
          color: var(--ms-mute);
        }

        .ms-avatar-picker-current {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--ms-ink);
        }

        .ms-avatar-preview {
          position: relative;
          display: block;
          flex-shrink: 0;
          overflow: hidden;
          width: 1.9rem;
          height: 1.9rem;
          border-radius: 999px;
          box-shadow: 0 0 0 1.5px var(--ms-pine);
          background: rgba(255, 255, 255, 0.55);
        }

        .ms-avatar-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          grid-auto-rows: auto;
          gap: 0.5rem;
          max-height: min(18rem, 42dvh);
          overflow-x: hidden;
          overflow-y: auto;
          padding: 0.45rem;
          border: 1.5px solid rgba(47, 74, 58, 0.14);
          border-radius: 0.85rem;
          background: rgba(255, 255, 255, 0.35);
          -webkit-overflow-scrolling: touch;
        }

        .ms-avatar-option {
          position: relative;
          display: block;
          box-sizing: border-box;
          width: 100%;
          height: 0;
          padding: 0 0 100%;
          min-width: 0;
          border: 1.5px solid rgba(47, 74, 58, 0.14);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.55);
          cursor: pointer;
          overflow: hidden;
          isolation: isolate;
        }

        .ms-avatar-option:disabled {
          cursor: wait;
          opacity: 0.7;
        }

        .ms-avatar-option.is-selected {
          border-color: var(--ms-ember);
          box-shadow: 0 0 0 2px rgba(181, 74, 50, 0.3);
        }

        .ms-avatar-upload:not(.is-selected) {
          border-style: dashed;
          border-color: rgba(47, 74, 58, 0.28);
          background: rgba(47, 74, 58, 0.06);
        }

        .ms-avatar-upload-inner {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.1rem;
          color: var(--ms-pine);
        }

        .ms-avatar-upload-icon {
          font-size: 1.15rem;
          font-weight: 700;
          line-height: 1;
        }

        .ms-avatar-upload-text {
          font-size: 0.55rem;
          font-weight: 700;
          letter-spacing: 0.01em;
          text-transform: uppercase;
        }

        .ms-avatar-option :global(.ms-avatar-img),
        .ms-avatar-preview :global(.ms-avatar-img) {
          position: absolute !important;
          inset: 0;
          display: block;
          width: 100% !important;
          height: 100% !important;
          max-width: none !important;
          object-fit: cover;
        }

        .ms-avatar-error {
          margin: 0.4rem 0 0;
          font-size: 0.75rem;
          color: var(--ms-ember-deep);
        }

        .ms-avatar-file {
          display: none;
        }

        :global(.ms-tone-night) .ms-avatar-grid {
          border-color: rgba(232, 235, 228, 0.16);
          background: rgba(255, 255, 255, 0.05);
        }

        :global(.ms-tone-night) .ms-avatar-option {
          border-color: rgba(232, 235, 228, 0.16);
          background: rgba(255, 255, 255, 0.06);
        }

        :global(.ms-tone-night) .ms-avatar-upload:not(.is-selected) {
          border-color: rgba(232, 235, 228, 0.28);
          background: rgba(255, 255, 255, 0.04);
          color: var(--ms-bone);
        }
      `}</style>
    </div>
  );
}
