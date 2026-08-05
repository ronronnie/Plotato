"use client";

import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { StickerChip } from "@/components/ui/StickerChip";
import { LANGUAGES, REGIONS, STREAMING_SERVICES, VIEWING_DURATIONS } from "@/lib/shared/constants";
import type { UserPreferences, ViewingDuration } from "@/lib/shared/types";

type PreferencesSheetProps = {
  open: boolean;
  preferences: UserPreferences;
  onChange: (preferences: UserPreferences) => void;
  onSave: () => void;
  onSkip: () => void;
};

function toggleValue(value: string, values: string[]) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

export function PreferencesSheet({ open, preferences, onChange, onSave, onSkip }: PreferencesSheetProps) {
  return (
    <Sheet
      description="Keep it quick. These preferences stay on this device and can be changed later."
      footer={
        <>
          <Button onClick={onSave} size="lg" variant="primary">
            Save setup
          </Button>
          <Button onClick={onSkip} size="lg" variant="ghost">
            Skip for now
          </Button>
        </>
      }
      onClose={onSkip}
      open={open}
      title="Set the table."
    >
      <label className="form-field">
        <span>Region</span>
        <select
          value={preferences.region}
          onChange={(event) => onChange({ ...preferences, region: event.target.value })}
        >
          {REGIONS.map((region) => (
            <option key={region.value} value={region.value}>
              {region.label}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="form-field">
        <legend>Streaming services</legend>
        <div className="chip-grid">
          {STREAMING_SERVICES.map((service) => (
            <StickerChip
              key={service}
              onClick={() =>
                onChange({
                  ...preferences,
                  streamingServices: toggleValue(service, preferences.streamingServices),
                })
              }
              selected={preferences.streamingServices.includes(service)}
            >
              {service}
            </StickerChip>
          ))}
        </div>
      </fieldset>

      <fieldset className="form-field">
        <legend>Languages</legend>
        <div className="chip-grid">
          {LANGUAGES.map((language) => (
            <StickerChip
              key={language}
              onClick={() =>
                onChange({
                  ...preferences,
                  languages: toggleValue(language, preferences.languages),
                })
              }
              selected={preferences.languages.includes(language)}
            >
              {language}
            </StickerChip>
          ))}
        </div>
      </fieldset>

      <fieldset className="form-field">
        <legend>Viewing duration</legend>
        <div className="duration-options">
          {VIEWING_DURATIONS.map((duration) => (
            <button
              aria-pressed={preferences.viewingDuration === duration.value}
              className={`duration-option ${preferences.viewingDuration === duration.value ? "duration-option-selected" : ""}`}
              key={duration.value}
              onClick={() =>
                onChange({
                  ...preferences,
                  viewingDuration: duration.value as ViewingDuration,
                })
              }
              type="button"
            >
              <strong>{duration.label}</strong>
              <span>{duration.detail}</span>
            </button>
          ))}
        </div>
      </fieldset>
    </Sheet>
  );
}
