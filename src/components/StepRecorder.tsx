import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, Square, Loader2, Trash2, Play, Pause } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { AudioRecording } from '@/lib/store';

interface Props {
  step: number;
  recordings: AudioRecording[];
  onChange: (recs: AudioRecording[]) => void;
  disabled?: boolean;
}

const StepRecorder = ({ step, recordings, onChange, disabled }: Props) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stepRecordings = recordings.filter(r => r.step === step);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' });
        const durationSec = Math.round((Date.now() - startedAtRef.current) / 1000);
        await processBlob(blob, durationSec);
      };
      mr.start();
      mediaRecorderRef.current = mr;
      startedAtRef.current = Date.now();
      setElapsed(0);
      setIsRecording(true);
      timerRef.current = window.setInterval(() => {
        setElapsed(Math.round((Date.now() - startedAtRef.current) / 1000));
      }, 500);
    } catch (e) {
      toast.error('Microphone access denied');
    }
  };

  const stop = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const processBlob = async (blob: Blob, durationSec: number) => {
    setIsTranscribing(true);
    const dataUrl = await new Promise<string>(res => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.readAsDataURL(blob);
    });
    const base64 = dataUrl.split(',')[1];

    let transcript = '';
    try {
      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: { audioBase64: base64, mimeType: blob.type },
      });
      if (error) throw error;
      transcript = data?.transcript ?? '';
      if (transcript) toast.success('Audio transcribed');
      else toast.warning('Recording saved (transcription unavailable)');
    } catch (e) {
      toast.warning('Recording saved (transcription failed)');
    }

    const rec: AudioRecording = {
      id: Date.now().toString(),
      step,
      durationSec,
      transcript,
      createdAt: new Date().toISOString(),
      // store audio for playback
      // @ts-ignore — extend at runtime
      dataUrl,
    } as any;
    onChange([...recordings, rec]);
    setIsTranscribing(false);
  };

  const remove = (id: string) => {
    onChange(recordings.filter(r => r.id !== id));
    if (playingId === id) { audioRef.current?.pause(); setPlayingId(null); }
  };

  const togglePlay = (rec: AudioRecording & { dataUrl?: string }) => {
    if (!rec.dataUrl) { toast.error('Audio data not available'); return; }
    if (playingId === rec.id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      audioRef.current?.pause();
      const a = new Audio(rec.dataUrl);
      a.onended = () => setPlayingId(null);
      a.play();
      audioRef.current = a;
      setPlayingId(rec.id);
    }
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="rounded-md border bg-muted/20 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mic className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Audio Recordings</span>
          {stepRecordings.length > 0 && <Badge variant="secondary">{stepRecordings.length}</Badge>}
        </div>
        {!disabled && (
          isRecording ? (
            <Button size="sm" variant="destructive" onClick={stop}>
              <Square className="mr-1 h-4 w-4" /> Stop ({fmt(elapsed)})
            </Button>
          ) : isTranscribing ? (
            <Button size="sm" disabled><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Transcribing…</Button>
          ) : (
            <Button size="sm" onClick={start}><Mic className="mr-1 h-4 w-4" /> Record</Button>
          )
        )}
      </div>

      {stepRecordings.length === 0 && !isRecording && (
        <p className="text-xs text-muted-foreground">No recordings yet for this step. Record audit questions and answers in person — they will be transcribed automatically.</p>
      )}

      {stepRecordings.map(rec => {
        const r = rec as AudioRecording & { dataUrl?: string };
        return (
          <div key={rec.id} className="rounded border bg-card p-2 space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{new Date(rec.createdAt).toLocaleTimeString()}</span>
                <span>•</span>
                <span>{fmt(rec.durationSec)}</span>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => togglePlay(r)}>
                  {playingId === rec.id ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                </Button>
                {!disabled && (
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => remove(rec.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                )}
              </div>
            </div>
            {rec.transcript ? (
              <p className="text-xs whitespace-pre-wrap">{rec.transcript}</p>
            ) : (
              <p className="text-xs italic text-muted-foreground">No transcript available.</p>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StepRecorder;
