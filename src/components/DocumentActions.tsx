import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, ScanLine, QrCode, X, FileText, Image } from 'lucide-react';
import { toast } from 'sonner';

export interface Attachment {
  id: string;
  name: string;
  type: string;
  dataUrl: string;
  addedAt: string;
  source: 'upload' | 'scan' | 'qr';
}

interface DocumentActionsProps {
  attachments: Attachment[];
  onAttachmentsChange: (attachments: Attachment[]) => void;
  disabled?: boolean;
}

const DocumentActions = ({ attachments, onAttachmentsChange, disabled }: DocumentActionsProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scanInputRef = useRef<HTMLInputElement>(null);
  const qrInputRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);

  const handleFileSelect = (files: FileList | null, source: 'upload' | 'scan' | 'qr') => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const attachment: Attachment = {
          id: Date.now().toString() + Math.random().toString(36).slice(2),
          name: file.name,
          type: file.type,
          dataUrl: reader.result as string,
          addedAt: new Date().toISOString(),
          source,
        };
        onAttachmentsChange([...attachments, attachment]);
        toast.success(`${source === 'qr' ? 'QR code image' : source === 'scan' ? 'Scanned document' : 'Document'} added: ${file.name}`);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (id: string) => {
    onAttachmentsChange(attachments.filter(a => a.id !== id));
    toast.info('Attachment removed');
  };

  const sourceLabel = (source: string) => {
    switch (source) {
      case 'upload': return 'Uploaded';
      case 'scan': return 'Scanned';
      case 'qr': return 'QR Code';
      default: return source;
    }
  };

  const sourceBadgeClass = (source: string) => {
    switch (source) {
      case 'upload': return 'bg-primary/10 text-primary';
      case 'scan': return 'bg-accent text-accent-foreground';
      case 'qr': return 'bg-secondary text-secondary-foreground';
      default: return '';
    }
  };

  const isImage = (type: string) => type.startsWith('image/');

  return (
    <div className="mt-4 border-t pt-4">
      <h4 className="mb-3 text-sm font-semibold text-foreground">Supporting Documents</h4>

      {/* Action Buttons */}
      {!disabled && (
        <div className="mb-3 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mr-1 h-4 w-4" /> Upload Document
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => scanInputRef.current?.click()}
          >
            <ScanLine className="mr-1 h-4 w-4" /> Scan Document
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => qrInputRef.current?.click()}
          >
            <QrCode className="mr-1 h-4 w-4" /> Scan QR Code
          </Button>

          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
            multiple
            onChange={e => handleFileSelect(e.target.files, 'upload')}
          />
          <input
            ref={scanInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            capture="environment"
            onChange={e => handleFileSelect(e.target.files, 'scan')}
          />
          <input
            ref={qrInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            capture="environment"
            onChange={e => handleFileSelect(e.target.files, 'qr')}
          />
        </div>
      )}

      {/* Attachments List */}
      {attachments.length > 0 ? (
        <div className="space-y-2">
          {attachments.map(att => (
            <div key={att.id} className="flex items-center gap-3 rounded-md border p-2">
              {isImage(att.type) ? (
                <img src={att.dataUrl} alt={att.name} className="h-10 w-10 rounded object-cover" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">{att.name}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`text-[10px] ${sourceBadgeClass(att.source)}`}>
                    {sourceLabel(att.source)}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(att.addedAt).toLocaleString()}
                  </span>
                </div>
              </div>
              {!disabled && (
                <Button variant="ghost" size="sm" onClick={() => removeAttachment(att.id)}>
                  <X className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No documents attached for this step.</p>
      )}
    </div>
  );
};

export default DocumentActions;
