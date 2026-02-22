import { create } from 'zustand'

export const useModelStore = create((set) => ({
  currentModelIndex: 0,
  scrollProgress: 0,
  isFloating: true,
  scannerEnterCount: 0,
  scannerLeaveCount: 0,

  setCurrentModelIndex: (index) => set({ currentModelIndex: index }),
  setScrollProgress: (progress) => set({ scrollProgress: progress }),
  setIsFloating: (val) => set({ isFloating: val }),
  triggerScannerEnter: () => set((s) => ({ scannerEnterCount: s.scannerEnterCount + 1 })),
  triggerScannerLeave: () => set((s) => ({ scannerLeaveCount: s.scannerLeaveCount + 1 })),
}))
