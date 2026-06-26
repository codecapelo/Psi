import { ConfirmDialog } from "sopsi";

export function ExcluirDocumentoAssinado() {
  return (
    <ConfirmDialog
      open={true}
      onClose={() => {}}
      onConfirm={() => {}}
      title="Excluir documento assinado?"
      message={
        <>
          O laudo <strong>“Avaliação psiquiátrica admissional”</strong> será
          removido do prontuário. Esta ação não pode ser desfeita e ficará
          registrada na auditoria.
        </>
      }
      confirmLabel="Excluir laudo"
      danger
    />
  );
}
