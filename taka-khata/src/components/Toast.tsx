interface ToastProps {
  message: string
  actionLabel?: string
  onAction?: () => void
  visible?: boolean
}

export default function Toast({
  message,
  actionLabel,
  onAction,
  visible = true,
}: ToastProps) {
  if (!visible) {
    return null
  }

  return (
    <div className="toast" role="status">
      <span className="toast__message">{message}</span>
      {actionLabel && onAction ? (
        <button type="button" className="toast__action" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  )
}
