import type { HandTrace } from './palmGeometry';
import type { QualityResult } from './quality';
import type { PhotoRole, Profile } from './report';

export type PhotoSlot =
  | { status: 'empty' }
  | { status: 'checking'; upload?: string }
  | { status: 'ready'; upload: string; result: QualityResult; confirmed: boolean; trace?: HandTrace | null }
  | { status: 'rejected'; upload: string; result: QualityResult; trace?: HandTrace | null };

export type PhotoSlots = Partial<Record<PhotoRole, PhotoSlot>>;

export const requiredRoles = (profile: Profile): PhotoRole[] =>
  profile.handChoice === 'both' ? ['left', 'right'] : [profile.handChoice];

/** A photo may only be analyzed when it passed quality checks and warnings were accepted. */
export const slotUsable = (slot?: PhotoSlot): slot is Extract<PhotoSlot, { status: 'ready' }> =>
  slot?.status === 'ready' && (slot.result.warnings.length === 0 || slot.confirmed);

export const allSlotsUsable = (profile: Profile, slots: PhotoSlots): boolean =>
  requiredRoles(profile).every((role) => slotUsable(slots[role]));
