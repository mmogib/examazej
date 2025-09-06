// LaTeX template parser for the Exam Generator

import { ParsedLatexTemplate, ExamSettings, Question } from '../types';

export function parseLatexTemplate(content: string): ParsedLatexTemplate {
  console.log('Parsing LaTeX template, content length:', content.length);
  const lines = content.split('\n');
  const result: ParsedLatexTemplate = {
    questions: []
  };

  // Parse settings section
  const settingStart = lines.findIndex(line => line.trim() === '%{#setting}');
  const settingEnd = lines.findIndex(line => line.trim() === '%{/setting}');
  
  if (settingStart !== -1 && settingEnd !== -1) {
    const settingLines = lines.slice(settingStart + 1, settingEnd);
    const settings: Partial<ExamSettings> = {};
    
    for (const line of settingLines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('%') && trimmed.includes('=')) {
        const [key, ...valueParts] = trimmed.substring(1).split('=');
        const value = valueParts.join('=').trim();
        const cleanKey = key.trim();
        
        if (cleanKey === 'numberofvestions') {
          (settings as any)[cleanKey] = parseInt(value) || 1;
        } else {
          (settings as any)[cleanKey] = value;
        }
      }
    }
    
    result.settings = settings;
  }

  // Parse preamble section
  const preambleStart = lines.findIndex(line => line.trim() === '%{#preamble}');
  const preambleEnd = lines.findIndex(line => line.trim() === '%{/preamble}');
  
  if (preambleStart !== -1 && preambleEnd !== -1) {
    const preambleLines = lines.slice(preambleStart + 1, preambleEnd);
    result.preamble = preambleLines.join('\n');
  }

  // Parse questions with proper marker handling
  let currentQuestion: string | null = null;
  let currentOptions: string[] = [];
  let enumerateDepth = 0;
  let inQuestionEnumerate = false;
  let inQuestionBlock = false;
  let inOptionBlock = false;
  let currentOptionText = '';

  console.log('Starting question parsing with', lines.length, 'lines');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Track enumerate depth
    if (trimmed.includes('\\begin{enumerate}')) {
      enumerateDepth++;
      console.log('Found enumerate begin, depth:', enumerateDepth, 'at line:', i + 1);
      if (enumerateDepth === 1) {
        inQuestionEnumerate = true;
      }
      continue;
    }
    
    if (trimmed.includes('\\end{enumerate}')) {
      console.log('Found enumerate end, depth was:', enumerateDepth, 'at line:', i + 1);
      
      // Save question when ending options enumerate
      if (enumerateDepth === 2 && currentQuestion && currentOptions.length === 5) {
        console.log('Saving complete question:', currentQuestion);
        result.questions.push({
          text: currentQuestion,
          choices: [
            currentOptions.map(text => ({ text })),
            0,
            null
          ]
        });
        currentQuestion = null;
        currentOptions = [];
      }
      
      enumerateDepth--;
      
      if (enumerateDepth === 0) {
        inQuestionEnumerate = false;
      }
      continue;
    }
    
    // Only process within question enumerate
    if (!inQuestionEnumerate) continue;
    
    // Handle question start marker
    if (trimmed.includes('%{#q}')) {
      console.log('Found question start marker at line:', i + 1);
      
      // Save previous question if complete
      if (currentQuestion && currentOptions.length === 5) {
        console.log('Saving previous complete question:', currentQuestion);
        result.questions.push({
          text: currentQuestion,
          choices: [
            currentOptions.map(text => ({ text })),
            0,
            null
          ]
        });
        currentQuestion = null;
        currentOptions = [];
      }
      
      inQuestionBlock = true;
      
      // Check if question is on same line
      const sameLineMatch = trimmed.match(/%\{#q\}(.*?)%\{\/q\}/);
      if (sameLineMatch) {
        currentQuestion = sameLineMatch[1].trim();
        console.log('Found complete inline question:', currentQuestion);
        inQuestionBlock = false;
      } else {
        // Extract any text after the opening tag
        const afterTag = trimmed.replace('%{#q}', '').trim();
        currentQuestion = afterTag || '';
      }
      continue;
    }
    
    // Handle question end marker
    if (trimmed.includes('%{/q}') && inQuestionBlock) {
      console.log('Found question end marker at line:', i + 1);
      const beforeTag = trimmed.replace('%{/q}', '').trim();
      if (beforeTag) {
        currentQuestion = currentQuestion ? currentQuestion + ' ' + beforeTag : beforeTag;
      }
      console.log('Complete question text:', currentQuestion);
      inQuestionBlock = false;
      continue;
    }
    
    // Collect question text between markers
    if (inQuestionBlock && trimmed && !trimmed.startsWith('\\') && !trimmed.startsWith('%')) {
      currentQuestion = currentQuestion ? currentQuestion + ' ' + trimmed : trimmed;
      console.log('Collecting question text:', trimmed);
      continue;
    }
    
    // Handle option start marker
    if (currentQuestion && trimmed.includes('%{#o}')) {
      console.log('Found option start marker at line:', i + 1);
      inOptionBlock = true;
      
      // Check if option is on same line
      const sameLineMatch = trimmed.match(/%\{#o\}(.*?)%\{\/o\}/);
      if (sameLineMatch) {
        const optionText = sameLineMatch[1].trim();
        console.log('Found complete inline option:', optionText);
        currentOptions.push(optionText);
        inOptionBlock = false;
      } else {
        // Extract any text after the opening tag
        const afterTag = trimmed.replace('%{#o}', '').trim();
        currentOptionText = afterTag || '';
      }
      continue;
    }
    
    // Handle option end marker
    if (trimmed.includes('%{/o}') && inOptionBlock) {
      console.log('Found option end marker at line:', i + 1);
      const beforeTag = trimmed.replace('%{/o}', '').trim();
      if (beforeTag) {
        currentOptionText = currentOptionText ? currentOptionText + ' ' + beforeTag : beforeTag;
      }
      console.log('Complete option text:', currentOptionText);
      currentOptions.push(currentOptionText);
      currentOptionText = '';
      inOptionBlock = false;
      continue;
    }
    
    // Collect option text between markers
    if (inOptionBlock && trimmed && !trimmed.startsWith('\\') && !trimmed.startsWith('%')) {
      currentOptionText = currentOptionText ? currentOptionText + ' ' + trimmed : trimmed;
      console.log('Collecting option text:', trimmed);
      continue;
    }
  }
  
  // Save the last question if exists and complete
  if (currentQuestion && currentOptions.length === 5) {
    console.log('Saving final question:', currentQuestion);
    result.questions.push({
      text: currentQuestion,
      choices: [
        currentOptions.map(text => ({ text })),
        0,
        null
      ]
    });
  }

  console.log('Parsing complete. Found', result.questions.length, 'questions');
  return result;
}

export function validateParsedTemplate(parsed: ParsedLatexTemplate): string[] {
  const errors: string[] = [];
  
  if (parsed.questions.length === 0) {
    errors.push('No questions found in the template');
  }
  
  parsed.questions.forEach((question, index) => {
    if (!question.text.trim()) {
      errors.push(`Question ${index + 1} has empty text`);
    }
    
    if (question.choices[0].length !== 5) {
      errors.push(`Question ${index + 1} must have exactly 5 options, found ${question.choices[0].length}`);
    }
    
    question.choices[0].forEach((choice, choiceIndex) => {
      if (!choice.text.trim()) {
        errors.push(`Question ${index + 1}, option ${choiceIndex + 1} is empty`);
      }
    });
  });
  
  return errors;
}