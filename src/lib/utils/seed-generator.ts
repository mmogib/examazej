/**
 * Generates a dynamic seed based on current time and exam details
 */
export function generateDynamicSeed(examDetails?: {
  coursecode?: string;
  examname?: string;
  term?: string;
  examdate?: string;
}): string {
  const timestamp = Date.now().toString();
  const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  if (!examDetails) {
    return `exam_${dateStr}_${timestamp.slice(-6)}`;
  }
  
  const parts = [
    examDetails.coursecode?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'course',
    examDetails.examname?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'exam',
    examDetails.term?.toLowerCase().replace(/[^a-z0-9]/g, '') || dateStr.replace(/-/g, ''),
    timestamp.slice(-4) // Last 4 digits for uniqueness
  ];
  
  return parts.join('_');
}

/**
 * Checks if a seed appears to be a default/static seed that should be replaced
 */
export function isDefaultSeed(seed: string): boolean {
  const defaultSeeds = ['exam2024', '', 'default', 'seed'];
  return defaultSeeds.includes(seed.toLowerCase().trim());
}