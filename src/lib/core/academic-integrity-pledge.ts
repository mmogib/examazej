export const DEFAULT_ACADEMIC_INTEGRITY_PLEDGE =
  "I pledge that I do not possess any mobile phone, smartwatch, earphones, or any other communication or smart devices, nor any written or printed material within my reach during this examination. I understand that possession of such devices or material will result in disciplinary action as per university policy.";

export function normalizeAcademicIntegrityPledgeText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}
