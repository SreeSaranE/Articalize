declare module 'react-native-share-menu' {
  export type ShareData = {
    mimeType: string;
    data: string;
    extraData?: Record<string, any>;
  };

  export function getInitialShare(
    callback: (data: ShareData | null) => void
  ): void;

  export function addNewShareListener(
    callback: (data: ShareData | null) => void
  ): () => void;

  export function clearNewShareListeners(): void;

  const _default: {
    getInitialShare: typeof getInitialShare;
    addNewShareListener: typeof addNewShareListener;
    clearNewShareListeners: typeof clearNewShareListeners;
  };
}
