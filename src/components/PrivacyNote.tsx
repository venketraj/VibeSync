type PrivacyNoteProps = {
  className?: string;
};

export function PrivacyNote({ className }: PrivacyNoteProps) {
  return (
    <p className={className ?? "text-sm text-slate-400"}>
      Metadata only. No audio files are uploaded in this MVP.
    </p>
  );
}
