import { TranscribeButton } from "sopsi";

export function Padrao() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <TranscribeButton onTranscript={() => {}} />
    </div>
  );
}

export function Tamanhos() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <TranscribeButton
        onTranscript={() => {}}
        label="Ditar anamnese"
        size="sm"
      />
      <TranscribeButton
        onTranscript={() => {}}
        label="Ditar anamnese"
        size="md"
      />
    </div>
  );
}
