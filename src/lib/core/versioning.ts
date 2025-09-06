import { DeterministicRNG } from './rng';
import type { Question, ExamData, VersionMapping, ExamSettings } from '../types';

export function generateVersionLabel(index: number, numbering: 'ALPHA' | 'NUMERIC' | 'ROMAN'): string {
  switch (numbering) {
    case 'ALPHA':
      return String.fromCharCode(65 + index); // A, B, C...
    case 'NUMERIC':
      return (index + 1).toString(); // 1, 2, 3...
    case 'ROMAN':
      const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
                            'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX',
                            'XXI', 'XXII', 'XXIII', 'XXIV', 'XXV', 'XXVI'];
      return romanNumerals[index] || (index + 1).toString();
    default:
      return String.fromCharCode(65 + index);
  }
}

export function partitionQuestions(questions: Question[], groupSizes: number[]): Question[][] {
  const groups: Question[][] = [];
  let startIndex = 0;
  
  for (const size of groupSizes) {
    const group = questions.slice(startIndex, startIndex + size).map((q, index) => ({
      ...q,
      group: groups.length + 1,
      order: index + 1
    }));
    groups.push(group);
    startIndex += size;
  }
  
  return groups;
}

export function generateExamVersions(
  masterQuestions: Question[],
  settings: ExamSettings,
  baseSeed: string
): { versions: ExamData[], mappings: VersionMapping[] } {
  const groupSizes = settings.groups.split(',').map(g => parseInt(g.trim()));
  const questionGroups = partitionQuestions(masterQuestions, groupSizes);
  const numVersions = settings.numberofvestions;
  
  const versions: ExamData[] = [];
  const mappings: VersionMapping[] = [];
  
  for (let versionIndex = 0; versionIndex < numVersions; versionIndex++) {
    const versionLabel = generateVersionLabel(versionIndex, settings.code_numbering);
    const versionSeed = `${baseSeed}#${versionLabel}`;
    const rng = new DeterministicRNG(versionSeed);
    
    const versionQuestions: Question[] = [];
    let questionCounter = 1;
    
    // Process each group
    questionGroups.forEach((group, groupIndex) => {
      // Shuffle questions within the group
      const shuffledGroup = rng.shuffle([...group]);
      
      shuffledGroup.forEach((question, questionIndexInGroup) => {
        // Shuffle options for this question
        const optionIndices = [0, 1, 2, 3, 4];
        const shuffledIndices = rng.shuffle(optionIndices);
        
        // Create new question with shuffled options
        const shuffledChoices = shuffledIndices.map(index => question.choices[0][index]);
        const newCorrectIndex = shuffledIndices.indexOf(0); // Find where the original correct answer (index 0) ended up
        
        const versionQuestion: Question = {
          ...question,
          order: questionCounter,
          choices: [shuffledChoices, newCorrectIndex, null]
        };
        
        versionQuestions.push(versionQuestion);
        
        // Create mapping entry
        const masterQNo = masterQuestions.findIndex(mq => mq.text === question.text) + 1;
        const permString = shuffledIndices.map(i => String.fromCharCode(65 + i)).join('');
        const correctLetter = String.fromCharCode(65 + newCorrectIndex);
        
        mappings.push({
          group: groupIndex + 1,
          masterQNo,
          version: versionLabel,
          versionQNo: questionCounter,
          perm: permString,
          correct: correctLetter,
          points: 1 // Default points
        });
        
        questionCounter++;
      });
    });
    
    const versionData: ExamData = {
      name: `version_${versionLabel}`,
      ordering: null,
      preamble: '',
      questions: versionQuestions,
      kept_in_one_page: []
    };
    
    versions.push(versionData);
  }
  
  return { versions, mappings };
}

export function generateCorrectnessSummary(
  masterQuestions: Question[],
  mappings: VersionMapping[]
): { questionNo: number; text: string; correctCounts: Record<string, number> }[] {
  return masterQuestions.map((question, index) => {
    const questionMappings = mappings.filter(m => m.masterQNo === index + 1);
    const correctCounts = { A: 0, B: 0, C: 0, D: 0, E: 0 };
    
    questionMappings.forEach(mapping => {
      correctCounts[mapping.correct]++;
    });
    
    return {
      questionNo: index + 1,
      text: question.text,
      correctCounts
    };
  });
}