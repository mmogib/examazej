import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bold, Italic, List, ListOrdered, Undo, Redo, Underline as UnderlineIcon, Strikethrough, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

// Convert HTML to LaTeX format
const convertToLatex = (html: string): string => {
  return html
    .replace(/<strong>(.*?)<\/strong>/g, '\\textbf{$1}')
    .replace(/<em>(.*?)<\/em>/g, '\\textit{$1}')
    .replace(/<u>(.*?)<\/u>/g, '\\underline{$1}')
    .replace(/<s>(.*?)<\/s>/g, '\\sout{$1}')
    .replace(/<ol><li>(.*?)<\/li><\/ol>/gs, (match, content) => {
      const items = content.split('</li><li>').map((item: string) => `\\item ${item.replace(/<\/?[^>]+(>|$)/g, '')}`).join('\n    ');
      return `\\begin{enumerate}\n    \\begin{normalsize}\n        ${items}\n    \\end{normalsize}\n\\end{enumerate}`;
    })
    .replace(/<ul><li>(.*?)<\/li><\/ul>/gs, (match, content) => {
      const items = content.split('</li><li>').map((item: string) => `\\item ${item.replace(/<\/?[^>]+(>|$)/g, '')}`).join('\n    ');
      return `\\begin{itemize}\n    \\begin{normalsize}\n        ${items}\n    \\end{normalsize}\n\\end{itemize}`;
    })
    .replace(/<ol>(.*?)<\/ol>/gs, (match, content) => {
      const items = content.match(/<li>(.*?)<\/li>/g)?.map((item: string) => 
        `\\item ${item.replace(/<\/?li>/g, '').replace(/<\/?[^>]+(>|$)/g, '')}`
      ).join('\n        ') || '';
      return `\\begin{enumerate}\n    \\begin{normalsize}\n        ${items}\n    \\end{normalsize}\n\\end{enumerate}`;
    })
    .replace(/<ul>(.*?)<\/ul>/gs, (match, content) => {
      const items = content.match(/<li>(.*?)<\/li>/g)?.map((item: string) => 
        `\\item ${item.replace(/<\/?li>/g, '').replace(/<\/?[^>]+(>|$)/g, '')}`
      ).join('\n        ') || '';
      return `\\begin{itemize}\n    \\begin{normalsize}\n        ${items}\n    \\end{normalsize}\n\\end{itemize}`;
    })
    .replace(/<h1>(.*?)<\/h1>/g, '\\section{$1}')
    .replace(/<h2>(.*?)<\/h2>/g, '\\subsection{$1}')
    .replace(/<h3>(.*?)<\/h3>/g, '\\subsubsection{$1}')
    .replace(/<p style="text-align: center">(.*?)<\/p>/g, '\\begin{center}$1\\end{center}')
    .replace(/<p style="text-align: right">(.*?)<\/p>/g, '\\begin{flushright}$1\\end{flushright}')
    .replace(/<p>(.*?)<\/p>/g, '$1\n\n')
    .replace(/<br\s*\/?>/g, '\\\\\n')
    .replace(/<\/?[^>]+(>|$)/g, '') // Remove any remaining HTML tags
    .trim();
};

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[200px] p-4',
      },
    },
  });

  if (!editor) {
    return null;
  }

  const latexPreview = convertToLatex(editor.getHTML());

  return (
    <div className="border rounded-md">
      <Tabs defaultValue="editor" className="w-full">
        <div className="flex items-center justify-between border-b p-2">
          <div className="flex items-center gap-1 flex-wrap">
            {/* Text Formatting */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={cn(
                "h-8 w-8 p-0",
                editor.isActive('bold') && "bg-accent"
              )}
              title="Bold"
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={cn(
                "h-8 w-8 p-0",
                editor.isActive('italic') && "bg-accent"
              )}
              title="Italic"
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={cn(
                "h-8 w-8 p-0",
                editor.isActive('underline') && "bg-accent"
              )}
              title="Underline"
            >
              <UnderlineIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={cn(
                "h-8 w-8 p-0",
                editor.isActive('strike') && "bg-accent"
              )}
              title="Strikethrough"
            >
              <Strikethrough className="h-4 w-4" />
            </Button>
            
            <Separator orientation="vertical" className="h-6 mx-1" />
            
            {/* Lists */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={cn(
                "h-8 w-8 p-0",
                editor.isActive('bulletList') && "bg-accent"
              )}
              title="Bullet List"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={cn(
                "h-8 w-8 p-0",
                editor.isActive('orderedList') && "bg-accent"
              )}
              title="Numbered List"
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
            
            <Separator orientation="vertical" className="h-6 mx-1" />
            
            {/* Headings */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={cn(
                "h-8 w-8 p-0 text-xs font-bold",
                editor.isActive('heading', { level: 1 }) && "bg-accent"
              )}
              title="Heading 1"
            >
              H1
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={cn(
                "h-8 w-8 p-0 text-xs font-bold",
                editor.isActive('heading', { level: 2 }) && "bg-accent"
              )}
              title="Heading 2"
            >
              H2
            </Button>
            
            <Separator orientation="vertical" className="h-6 mx-1" />
            
            {/* Alignment */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              className={cn(
                "h-8 w-8 p-0",
                editor.isActive({ textAlign: 'left' }) && "bg-accent"
              )}
              title="Align Left"
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              className={cn(
                "h-8 w-8 p-0",
                editor.isActive({ textAlign: 'center' }) && "bg-accent"
              )}
              title="Align Center"
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              className={cn(
                "h-8 w-8 p-0",
                editor.isActive({ textAlign: 'right' }) && "bg-accent"
              )}
              title="Align Right"
            >
              <AlignRight className="h-4 w-4" />
            </Button>
            
            <Separator orientation="vertical" className="h-6 mx-1" />
            
            {/* Undo/Redo */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().chain().focus().undo().run()}
              className="h-8 w-8 p-0"
              title="Undo"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().chain().focus().redo().run()}
              className="h-8 w-8 p-0"
              title="Redo"
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>
          <TabsList className="grid w-32 grid-cols-2">
            <TabsTrigger value="editor">Edit</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="editor" className="m-0">
          <EditorContent 
            editor={editor} 
            className="min-h-[200px] focus-within:outline-none"
          />
          {!editor.getText() && placeholder && (
            <div className="absolute top-16 left-4 text-muted-foreground pointer-events-none">
              {placeholder}
            </div>
          )}
        </TabsContent>
        <TabsContent value="preview" className="m-0">
          <div className="p-4 min-h-[200px] bg-muted/20">
            <h4 className="text-sm font-medium mb-2 text-muted-foreground">LaTeX Output:</h4>
            <pre className="whitespace-pre-wrap font-mono text-sm bg-background p-3 rounded border">
              {latexPreview || 'No content to preview'}
            </pre>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}