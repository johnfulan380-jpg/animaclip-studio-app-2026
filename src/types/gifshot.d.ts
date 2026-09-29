declare module 'gifshot' {
  export interface GifshotOptions {
    images?: (string | HTMLCanvasElement | ImageData)[];
    video?: string[];
    gifWidth?: number;
    gifHeight?: number;
    interval?: number; // seconds per frame
    numFrames?: number;
    frameDuration?: number; // in 10ths of a second
    sampleInterval?: number;
    numWorkers?: number;
    fontSize?: string;
    fontColor?: string;
    fontWeight?: string;
    text?: string;
    watermark?: string;
    progressCallback?: (captureProgress: number) => void;
    completeCallback?: (obj: { error: boolean; errorCode: string; errorMsg: string; image: string }) => void;
  }

  export function createGIF(
    options: GifshotOptions,
    callback: (obj: { error: boolean; errorCode: string; errorMsg: string; image: string }) => void
  ): void;

  export function isSupported(): boolean;
}
