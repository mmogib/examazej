import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowRight, ArrowLeft, Settings, Users, Hash, Shuffle, FileText, RefreshCw } from 'lucide-react';
import type { ExamJSON, ExamSettings } from '@/lib/types';
import { InstructionsDialog } from '@/components/ui/instructions-dialog';
import { generateDynamicSeed, isDefaultSeed } from '@/lib/utils/seed-generator';

interface DetailsPageProps {
  examData: ExamJSON;
  onDataUpdated: (data: ExamJSON) => void;
  onBack: () => void;
  onContinue: (seed: string) => void;
}

export function DetailsPage({ examData, onDataUpdated, onBack, onContinue }: DetailsPageProps) {
  const [settings, setSettings] = useState<ExamSettings>(examData.setting);
  const [groupPartition, setGroupPartition] = useState<string>(
    examData.setting.groups || `${examData.exam.questions.length}`
  );
  const [versions, setVersions] = useState<number>(examData.setting.numberofvestions || 8);
  const [seed, setSeed] = useState<string>(() => {
    const currentSeed = examData.setting.seed || 'exam2024';
    // Generate fresh seed if current is default/empty
    if (isDefaultSeed(currentSeed)) {
      return generateDynamicSeed({
        coursecode: examData.setting.coursecode,
        examname: examData.setting.examname,
        term: examData.setting.term,
        examdate: examData.setting.examdate
      });
    }
    return currentSeed;
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const validateSettings = () => {
    const errors: string[] = [];
    
    // Validate group partition
    const groups = groupPartition.split(',').map(g => parseInt(g.trim())).filter(n => !isNaN(n));
    const totalQuestions = examData.exam.questions.length;
    const groupSum = groups.reduce((sum, g) => sum + g, 0);
    
    if (groupSum !== totalQuestions) {
      errors.push(`Group partition must sum to ${totalQuestions} questions (currently sums to ${groupSum})`);
    }
    
    if (groups.some(g => g <= 0)) {
      errors.push('All group sizes must be positive numbers');
    }
    
    // Validate versions
    if (versions < 1 || versions > 26) {
      errors.push('Number of versions must be between 1 and 26');
    }
    
    // Validate required fields
    if (!settings.university.trim()) errors.push('University is required');
    if (!settings.department.trim()) errors.push('Department is required');
    if (!settings.coursecode.trim()) errors.push('Course code is required');
    if (!settings.examname.trim()) errors.push('Exam name is required');
    if (!seed.trim()) errors.push('Seed is required for deterministic generation');
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  useEffect(() => {
    validateSettings();
  }, [settings, groupPartition, versions, seed]);

  const handleSettingChange = (key: keyof ExamSettings, value: string | number | boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleContinue = () => {
    if (!validateSettings()) return;
    
    const updatedData: ExamJSON = {
      ...examData,
      setting: {
        ...settings,
        numberofvestions: versions,
        groups: groupPartition,
        seed: seed // Save the seed in settings
      }
    };
    
    onDataUpdated(updatedData);
    onContinue(seed);
  };

  const groupSizes = groupPartition.split(',').map(g => parseInt(g.trim())).filter(n => !isNaN(n));
  const isValid = validationErrors.length === 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center gap-3 mb-6">
        <Button 
          onClick={onBack} 
          variant="ghost" 
          size="sm"
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            Exam Configuration
          </h1>
          <p className="text-muted-foreground">
            Configure exam details and question grouping
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Exam Information
              </CardTitle>
              <CardDescription>
                Basic details that will appear on the exam cover
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="university">University</Label>
                  <Input
                    id="university"
                    value={settings.university}
                    onChange={(e) => handleSettingChange('university', e.target.value)}
                    placeholder="Your University"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={settings.department}
                    onChange={(e) => handleSettingChange('department', e.target.value)}
                    placeholder="Department of Mathematics"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coursecode">Course Code</Label>
                  <Input
                    id="coursecode"
                    value={settings.coursecode}
                    onChange={(e) => handleSettingChange('coursecode', e.target.value)}
                    placeholder="MATH101"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="term">Term</Label>
                  <Input
                    id="term"
                    value={settings.term}
                    onChange={(e) => handleSettingChange('term', e.target.value)}
                    placeholder="Fall 2024"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="examname">Exam Name</Label>
                  <Input
                    id="examname"
                    value={settings.examname}
                    onChange={(e) => handleSettingChange('examname', e.target.value)}
                    placeholder="Midterm Examination"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="examdate">Exam Date</Label>
                  <Input
                    id="examdate"
                    value={settings.examdate}
                    onChange={(e) => handleSettingChange('examdate', e.target.value)}
                    placeholder="November 15, 2024"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeallowed">Time Allowed</Label>
                  <Input
                    id="timeallowed"
                    value={settings.timeallowed}
                    onChange={(e) => handleSettingChange('timeallowed', e.target.value)}
                    placeholder="2 hours"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="examtype">Exam Type</Label>
                  <Select value={settings.examtype} onValueChange={(value) => handleSettingChange('examtype', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MAJOR">Major Exam</SelectItem>
                      <SelectItem value="MIDTERM">Midterm</SelectItem>
                      <SelectItem value="FINAL">Final Exam</SelectItem>
                      <SelectItem value="QUIZ">Quiz</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="includeCoverPage">Include Cover Pages</Label>
                    <p className="text-sm text-muted-foreground">
                      Add individual cover pages for each exam version with student information fields
                    </p>
                  </div>
                  <Switch
                    id="includeCoverPage"
                    checked={settings.includeCoverPage}
                    onCheckedChange={(checked) => handleSettingChange('includeCoverPage', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Question Groups
              </CardTitle>
              <CardDescription>
                Organize questions into groups that maintain their relative order
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="groups">Group Partition (comma-separated sizes)</Label>
                <Input
                  id="groups"
                  value={groupPartition}
                  onChange={(e) => setGroupPartition(e.target.value)}
                  placeholder="5,10,5"
                  className="font-mono"
                />
                <p className="text-sm text-muted-foreground">
                  Total questions: {examData.exam.questions.length}
                </p>
              </div>
              
              {groupSizes.length > 0 && (
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div className="flex flex-wrap gap-2">
                    {groupSizes.map((size, index) => (
                      <Badge key={index} variant="outline" className="font-mono">
                        Group {index + 1}: {size} questions
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shuffle className="h-5 w-5" />
                Randomization
              </CardTitle>
              <CardDescription>
                Control how exam versions are generated
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="versions">Number of Versions</Label>
                  <Input
                    id="versions"
                    type="number"
                    min="1"
                    max="26"
                    value={versions}
                    onChange={(e) => setVersions(parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code_name">Version Label</Label>
                  <Select 
                    value={settings.code_name} 
                    onValueChange={(value) => handleSettingChange('code_name', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VERSION">VERSION</SelectItem>
                      <SelectItem value="CODE">CODE</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    value={settings.code_name}
                    onChange={(e) => handleSettingChange('code_name', e.target.value)}
                    placeholder="Enter custom label"
                    className="mt-2"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code_numbering">Numbering Style</Label>
                  <Select 
                    value={settings.code_numbering} 
                    onValueChange={(value: 'ALPHA' | 'NUMERIC' | 'ROMAN') => handleSettingChange('code_numbering', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALPHA">Alphabetic (A, B, C...)</SelectItem>
                      <SelectItem value="NUMERIC">Numeric (1, 2, 3...)</SelectItem>
                      <SelectItem value="ROMAN">Roman (I, II, III...)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="seed">Randomization Seed</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSeed(generateDynamicSeed({
                      coursecode: settings.coursecode,
                      examname: settings.examname,
                      term: settings.term,
                      examdate: settings.examdate
                    }))}
                    className="h-6 w-6 p-0"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                </div>
                <Input
                  id="seed"
                  value={seed}
                  onChange={(e) => setSeed(e.target.value)}
                  placeholder="Enter seed for deterministic randomization"
                  className="font-mono"
                />
                <p className="text-sm text-muted-foreground">
                  Same seed produces identical randomization across generations. Click refresh for a new dynamic seed.
                </p>
              </div>

            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Instructions
              </CardTitle>
              <CardDescription>
                Customize the instructions that appear on each exam version
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InstructionsDialog
                instructions={settings.instructions}
                onInstructionsChange={(instructions) => handleSettingChange('instructions', instructions)}
              />
              <p className="text-sm text-muted-foreground mt-2">
                Instructions will be formatted and included on each exam version cover page
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Validation Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Validation Status</CardTitle>
            </CardHeader>
            <CardContent>
              {validationErrors.length === 0 ? (
                <div className="text-sm text-green-600 dark:text-green-400">
                  ✓ All settings are valid
                </div>
              ) : (
                <div className="space-y-2">
                  {validationErrors.map((error, index) => (
                    <div key={index} className="text-sm text-destructive">
                      • {error}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">
                <div className="font-medium">Questions</div>
                <div className="text-muted-foreground">{examData.exam.questions.length} total</div>
              </div>
              <div className="text-sm">
                <div className="font-medium">Groups</div>
                <div className="text-muted-foreground">{groupSizes.length} groups</div>
              </div>
              <div className="text-sm">
                <div className="font-medium">Versions</div>
                <div className="text-muted-foreground">{versions} variations</div>
              </div>
              <div className="text-sm">
                <div className="font-medium">Output</div>
                <div className="text-muted-foreground">Single LaTeX file</div>
              </div>
            </CardContent>
          </Card>

          {/* Continue Button */}
          <Button 
            onClick={handleContinue}
            disabled={!isValid}
            variant="hero"
            size="lg"
            className="w-full"
          >
            Generate Exam Versions
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}