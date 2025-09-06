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

  // Parse questions - improved logic to handle the new template format
  let currentQuestion: string | null = null;
  let currentOptions: string[] = [];
  let enumerateDepth = 0;
  let inQuestionEnumerate = false;
  let collectingQuestion = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.includes('\\begin{enumerate}')) {
      enumerateDepth++;
      console.log('Enumerate depth increased to', enumerateDepth, 'at line', i);
      if (enumerateDepth === 1) {
        inQuestionEnumerate = true;
      }
      continue;
    }
    
    if (line.includes('\\end{enumerate}')) {
      console.log('Enumerate depth decreased from', enumerateDepth, 'at line', i);
      enumerateDepth--;
      
      // If we're ending an inner enumerate (options list) and have a complete question
      if (enumerateDepth === 1 && currentQuestion && currentOptions.length === 5) {
        console.log('Saving question after inner enumerate end:', currentQuestion);
        result.questions.push({
          text: currentQuestion,
          choices: [
            currentOptions.map(text => ({ text })),
            0, // Master correct index is always 0
            null
          ]
        });
        currentQuestion = null;
        currentOptions = [];
      }
      
      // If we're ending the outer enumerate, we're done with questions
      if (enumerateDepth === 0) {
        inQuestionEnumerate = false;
      }
      continue;
    }
    
    if (!inQuestionEnumerate) continue;
    
    // Handle question markers - can be inline or on separate lines
    if (line.includes('%{#q}')) {
      collectingQuestion = true;
      const inlineMatch = line.match(/%\{#q\}(.*?)%\{\/q\}/);
      if (inlineMatch) {
        // Inline question format
        console.log('Found inline question:', inlineMatch[1]);
        
        // Save previous question if exists and complete
        if (currentQuestion && currentOptions.length === 5) {
          console.log('Saving previous question before new one:', currentQuestion);
          result.questions.push({
            text: currentQuestion,
            choices: [
              currentOptions.map(text => ({ text })),
              0,
              null
            ]
          });
        }
        
        currentQuestion = inlineMatch[1].trim();
        currentOptions = [];
        collectingQuestion = false;
      } else {
        // Start collecting multi-line question
        currentQuestion = line.replace('%{#q}', '').trim();
      }
      continue;
    }
    
    // Handle end of question marker
    if (line.includes('%{/q}') && collectingQuestion) {
      const questionPart = line.replace('%{/q}', '').trim();
      if (questionPart) {
        currentQuestion += (currentQuestion ? ' ' : '') + questionPart;
      }
      console.log('Completed multi-line question:', currentQuestion);
      collectingQuestion = false;
      continue;
    }
    
    // Collect question text when in collection mode
    if (collectingQuestion && line && !line.includes('\\') && !line.includes('%{')) {
      currentQuestion += (currentQuestion ? ' ' : '') + line;
      continue;
    }
    
    // Handle option markers - can be inline or on separate lines
    if (line.includes('%{#o}') && currentQuestion && enumerateDepth === 2) {
      const inlineMatch = line.match(/%\{#o\}(.*?)%\{\/o\}/);
      if (inlineMatch) {
        console.log('Found inline option:', inlineMatch[1]);
        currentOptions.push(inlineMatch[1].trim());
      }
      continue;
    }
    
    // Handle multi-line options (though most should be inline in the new format)
    if (line.includes('%{/o}') && currentQuestion && enumerateDepth === 2) {
      const optionPart = line.replace('%{/o}', '').trim();
      if (optionPart && currentOptions.length < 5) {
        // This handles cases where option text might span lines
        if (currentOptions.length > 0) {
          currentOptions[currentOptions.length - 1] += ' ' + optionPart;
        }
      }
      continue;
    }
    
    // Handle \item markers for questions (backup parsing)
    if (line.includes('\\item') && !line.includes('%{#') && enumerateDepth === 1) {
      // Look ahead to find question text
      let questionText = '';
      for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
        const nextLine = lines[j].trim();
        if (nextLine.includes('%{#q}')) {
          break; // Found explicit question marker
        }
        if (nextLine.includes('\\begin{enumerate}') || nextLine.includes('\\item') || nextLine.includes('\\bodyoptionseparator')) {
          break; // Found next structure
        }
        if (nextLine && !nextLine.includes('%{') && !nextLine.includes('\\')) {
          questionText += (questionText ? ' ' : '') + nextLine;
        }
      }
      
      if (questionText.trim()) {
        console.log('Found implicit question from \\item:', questionText);
        if (currentQuestion && currentOptions.length === 5) {
          console.log('Saving previous question before implicit one:', currentQuestion);
          result.questions.push({
            text: currentQuestion,
            choices: [
              currentOptions.map(text => ({ text })),
              0,
              null
            ]
          });
        }
        currentQuestion = questionText.trim();
        currentOptions = [];
      }
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