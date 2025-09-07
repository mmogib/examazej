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
      // Separate fixed and regular questions
      const fixedQuestions = group.filter(q => q.fixed);
      const regularQuestions = group.filter(q => !q.fixed);
      
      // Shuffle only the regular questions within the group
      const shuffledRegularQuestions = rng.shuffle([...regularQuestions]);
      
      // Combine fixed and shuffled regular questions, maintaining original order for fixed ones
      const combinedQuestions = [...group].sort((a, b) => {
        // If both are fixed or both are regular, maintain original relative order
        if ((a.fixed && b.fixed) || (!a.fixed && !b.fixed)) {
          return group.indexOf(a) - group.indexOf(b);
        }
        // If one is fixed and one is regular, maintain the original order
        return group.indexOf(a) - group.indexOf(b);
      });
      
      // Replace regular questions with their shuffled versions
      let shuffledIndex = 0;
      const finalQuestions = combinedQuestions.map(q => {
        if (q.fixed) {
          return q;
        } else {
          return shuffledRegularQuestions[shuffledIndex++];
        }
      });
      
      finalQuestions.forEach((question, questionIndexInGroup) => {
        let shuffledChoices: any[];
        let newCorrectIndex: number;
        let permString: string;
        
        if (question.fixed) {
          // For fixed questions, don't shuffle options
          shuffledChoices = question.choices[0];
          newCorrectIndex = question.choices[1]; // Use the original correct index
          permString = 'ABCDE'; // No permutation for fixed questions
        } else {
          // Shuffle options for regular questions
          const optionIndices = [0, 1, 2, 3, 4];
          const shuffledIndices = rng.shuffle(optionIndices);
          shuffledChoices = shuffledIndices.map(index => question.choices[0][index]);
          newCorrectIndex = shuffledIndices.indexOf(0); // Find where the original correct answer ended up
          permString = shuffledIndices.map(i => String.fromCharCode(65 + i)).join('');
        }
        
        const versionQuestion: Question = {
          ...question,
          order: questionCounter,
          choices: [shuffledChoices, newCorrectIndex, null]
        };
        
        versionQuestions.push(versionQuestion);
        
        // Create mapping entry
        const masterQNo = masterQuestions.findIndex(mq => mq.text === question.text) + 1;
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