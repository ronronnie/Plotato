type ToastProps = {
  message: string;
  visible: boolean;
};

export function Toast({ message, visible }: ToastProps) {
  if (!visible) return null;

  return (
    <div className="toast" role="status">
      {message}
    </div>
  );
}
