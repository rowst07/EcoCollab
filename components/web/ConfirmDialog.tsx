
type Props = {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
};

export type ConfirmDialogProps = Props;

// Fallback nativo: ignora as props, mas tipa igual ao .web
export default function ConfirmDialogNativeFallback(_props: Props) {
  return null;
}
