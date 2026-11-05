let lastDragEndTime = 0;

export function wasDraggingRecently(): boolean {
  return Date.now() - lastDragEndTime < 300;
}

export function markDragEnded(): void {
  lastDragEndTime = Date.now();
}
