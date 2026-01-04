import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Sparkles, Calendar as CalendarIcon, Clock, Wand2 } from 'lucide-react';
import { Priority, CreateTaskPayload } from '../../../types';
import { useCreateTask, useTags } from '../../../hooks/useTasks';
import { toast } from 'sonner';

interface AICreateTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AICreateTaskModal({ open, onOpenChange }: AICreateTaskModalProps) {
  const [step, setStep] = useState<'input' | 'confirm'>('input');
  const [naturalInput, setNaturalInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [aiSuggestedTags, setAiSuggestedTags] = useState<string[]>([]); // AI 推荐的标签
  
  const createTaskMutation = useCreateTask();
  const { data: availableTags = [] } = useTags();

  const resetForm = () => {
    setStep('input');
    setNaturalInput('');
    setTitle('');
    setDescription('');
    setPriority('MEDIUM');
    setSelectedDate('');
    setSelectedTime('');
    setSelectedTags([]);
    setAiSuggestedTags([]);
  };

  const parseWithAI = async () => {
    if (!naturalInput.trim()) {
      toast.error('Please enter task description');
      return;
    }

    setIsParsing(true);
    try {
      // 解析任务
      const parseResponse = await fetch('http://localhost:8001/api/parse-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: naturalInput.trim() }),
      });

      const parseResult = await parseResponse.json();

      if (!parseResult.success || !parseResult.data) {
        throw new Error(parseResult.error || 'Parse failed');
      }

      const parsed = parseResult.data;
      setTitle(parsed.title);
      setDescription(parsed.description || '');
      setPriority(parsed.priority || 'MEDIUM');

      if (parsed.due_at) {
        const date = new Date(parsed.due_at);
        setSelectedDate(date.toISOString().split('T')[0]);
        setSelectedTime(date.toTimeString().slice(0, 5));
      }

      // 获取 AI 标签建议
      try {
        const tagsResponse = await fetch('http://localhost:8001/api/suggest-tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            title: parsed.title,
            description: parsed.description 
          }),
        });

        const tagsResult = await tagsResponse.json();
        
        if (tagsResult.success && tagsResult.tags && tagsResult.tags.length > 0) {
          setAiSuggestedTags(tagsResult.tags);
          // 自动选中 AI 推荐的标签（忽略大小写匹配）
          const validTags = availableTags.filter((availableTag: string) => 
            tagsResult.tags.some((aiTag: string) => 
              aiTag.toLowerCase() === availableTag.toLowerCase()
            )
          );
          setSelectedTags(validTags);
        }
      } catch (tagError) {
        console.warn('Tag suggestion failed:', tagError);
        // 标签建议失败不影响主流程
      }

      setStep('confirm');
      toast.success('Task parsed successfully!');
    } catch (error) {
      console.error('Parse error:', error);
      toast.error(`Parse failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsParsing(false);
    }
  };

  const handleCreate = () => {
    if (!title.trim()) return;

    let dueAt: string | undefined;
    if (selectedDate) {
      const timeStr = selectedTime || '23:59';
      dueAt = new Date(`${selectedDate}T${timeStr}:00`).toISOString();
    }

    const payload: CreateTaskPayload = {
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      tags: selectedTags,
      status: 'PENDING',
      dueAt,
    };

    createTaskMutation.mutate(payload, {
      onSuccess: () => {
        onOpenChange(false);
        resetForm();
      },
    });
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetForm();
    }}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-500" />
            {step === 'input' ? 'Create Task with AI' : 'Confirm Task Details'}
          </DialogTitle>
          <DialogDescription>
            {step === 'input' 
              ? 'Describe your task in natural language' 
              : 'Review and edit the parsed task details'}
          </DialogDescription>
        </DialogHeader>

        {step === 'input' && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="natural-input">Task Description</Label>
              <Textarea 
                id="natural-input"
                placeholder="Remind me to buy groceries tomorrow at 3 PM&#10;Finish backend pagination by Friday&#10;High priority: Complete quarterly report"
                className="min-h-[140px] resize-none"
                value={naturalInput}
                onChange={(e) => setNaturalInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    parseWithAI();
                  }
                }}
                autoFocus
              />
              <p className="text-xs text-slate-500">
                Supports Chinese, English, or mixed. Press Cmd/Ctrl+Enter to parse.
              </p>
            </div>
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
              <Input 
                id="title"
                placeholder="Task title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description"
                placeholder="Add description..."
                className="min-h-[80px] resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Due Date</Label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <Input 
                    id="date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <Input 
                    id="time"
                    type="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(val: Priority) => setPriority(val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Tags
                {aiSuggestedTags.length > 0 && (
                  <span className="text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    AI suggested in purple
                  </span>
                )}
              </Label>
              <div className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800 min-h-[48px]">
                {availableTags.length === 0 ? (
                  <span className="text-sm text-slate-400">No tags available</span>
                ) : (
                  availableTags.map(tag => {
                    const isSelected = selectedTags.includes(tag);
                    // 忽略大小写匹配 AI 推荐的标签
                    const isAISuggested = aiSuggestedTags.some(
                      aiTag => aiTag.toLowerCase() === tag.toLowerCase()
                    );
                    
                    return (
                      <Badge
                        key={tag}
                        variant={isSelected ? "default" : "outline"}
                        className={`cursor-pointer hover:opacity-80 transition-all ${
                          isAISuggested
                            ? isSelected
                              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border-indigo-600 text-white shadow-sm'
                              : 'border-indigo-400 text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-950/50'
                            : ''
                        }`}
                        onClick={() => toggleTag(tag)}
                      >
                        {isAISuggested && <Sparkles className="h-3 w-3 mr-1" />}
                        {tag}
                      </Badge>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 'input' ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button 
                onClick={parseWithAI} 
                disabled={!naturalInput.trim() || isParsing}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Wand2 className="h-4 w-4 mr-2" />
                {isParsing ? 'Parsing...' : 'Parse with AI'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep('input')}>Back</Button>
              <Button 
                onClick={handleCreate} 
                disabled={!title.trim() || createTaskMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {createTaskMutation.isPending ? 'Creating...' : 'Create Task'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
