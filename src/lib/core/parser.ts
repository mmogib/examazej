// LaTeX template parser for the Exam Generator

import { ParsedLatexTemplate, ExamSettings, Question } from '../types';

export function parseLatexTemplate(content: string): ParsedLatexTemplate {
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

  // Parse questions
  let currentQuestion: string | null = null;
  let currentOptions: string[] = [];
  let insideEnumerate = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.includes('\\begin{enumerate}')) {
      insideEnumerate = true;
      continue;
    }
    
    if (line.includes('\\end{enumerate}')) {
      // If we have a current question, save it
      if (currentQuestion && currentOptions.length === 5) {
        result.questions.push({
          text: currentQuestion,
          choices: [
            currentOptions.map(text => ({ text })),
            0, // Master correct index is always 0
            null
          ]
        });
      }
      insideEnumerate = false;
      currentQuestion = null;
      currentOptions = [];
      continue;
    }
    
    if (!insideEnumerate) continue;
    
    // Parse question
    const questionMatch = line.match(/%\{#q\}(.*?)%\{\/q\}/);
    if (questionMatch) {
      // Save previous question if exists
      if (currentQuestion && currentOptions.length === 5) {
        result.questions.push({
          text: currentQuestion,
          choices: [
            currentOptions.map(text => ({ text })),
            0,
            null
          ]
        });
      }
      
      currentQuestion = questionMatch[1].trim();
      currentOptions = [];
      continue;
    }
    
    // Parse option
    const optionMatch = line.match(/%\{#o\}(.*?)%\{\/o\}/);
    if (optionMatch && currentQuestion) {
      currentOptions.push(optionMatch[1].trim());
      continue;
    }
    
    // Handle item markers
    if (line.includes('\\item') && !line.includes('%{#')) {
      // This might be the start of a new question without explicit markers
      if (currentQuestion && currentOptions.length === 5) {
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
    }
  }
  
  // Save the last question if exists
  if (currentQuestion && currentOptions.length === 5) {
    result.questions.push({
      text: currentQuestion,
      choices: [
        currentOptions.map(text => ({ text })),
        0,
        null
      ]
    });
  }

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