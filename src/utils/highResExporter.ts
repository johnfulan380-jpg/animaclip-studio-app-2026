import JSZip from 'jszip';
import gifshot from 'gifshot';
import { AnimationProject, ExportSettings } from '../types/animation';
import { renderTransitionFrame } from './transitionRenderer';

export interface ExportProgress {
  percent: number;
  statusText: string;
}

/**
 * Checks if browser MediaRecorder natively supports MP4
 */
export function isBrowserMp4Supported(): boolean {
  if (typeof MediaRecorder === 'undefined') return false;
  const candidates = [
    'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
    'video/mp4;codecs=avc1',
    'video/mp4;codecs=h264',
    'video/mp4;codecs=vp9',
    'video/mp4',
  ];
  return candidates.some((mime) => MediaRecorder.isTypeSupported(mime));
}

/**
 * Resolves optimal mime type based on target format ('mp4' or 'webm')
 */
export function getOptimalVideoMimeType(targetFormat: 'mp4' | 'webm'): { mimeType: string; isNativeMp4: boolean } {
  if (typeof MediaRecorder === 'undefined') {
    return { mimeType: 'video/webm', isNativeMp4: false };
  }

  const mp4Candidates = [
    'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
    'video/mp4;codecs=avc1',
    'video/mp4;codecs=h264',
    'video/mp4;codecs=vp9',
    'video/mp4',
  ];

  const webmCandidates = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ];

  if (targetFormat === 'mp4') {
    for (const candidate of mp4Candidates) {
      if (MediaRecorder.isTypeSupported(candidate)) {
        return { mimeType: candidate, isNativeMp4: true };
      }
    }
    // Fallback if browser lacks MP4 encoder
    for (const candidate of webmCandidates) {
      if (MediaRecorder.isTypeSupported(candidate)) {
        return { mimeType: candidate, isNativeMp4: false };
      }
    }
    return { mimeType: 'video/mp4', isNativeMp4: true };
  } else {
    for (const candidate of webmCandidates) {
      if (MediaRecorder.isTypeSupported(candidate)) {
        return { mimeType: candidate, isNativeMp4: false };
      }
    }
    for (const candidate of mp4Candidates) {
      if (MediaRecorder.isTypeSupported(candidate)) {
        return { mimeType: candidate, isNativeMp4: true };
      }
    }
    return { mimeType: 'video/webm', isNativeMp4: false };
  }
}

/**
 * Loads an image from a dataURL or URL as an HTMLImageElement
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

/**
 * Composites a frame at a target resolution onto a destination canvas
 */
export async function compositeFrameToCanvas(
  project: AnimationProject,
  frameIndex: number,
  targetCanvas: HTMLCanvasElement,
  includeBackground: boolean = true,
  bgColor: string = '#ffffff',
  applyCamera3D: boolean = false
) {
  const targetCtx = targetCanvas.getContext('2d');
  if (!targetCtx) return;

  const w = targetCanvas.width;
  const h = targetCanvas.height;

  targetCtx.clearRect(0, 0, w, h);

  // Background
  if (includeBackground && !project.isTransparent) {
    targetCtx.fillStyle = bgColor || project.backgroundColor || '#ffffff';
    targetCtx.fillRect(0, 0, w, h);
  }

  const frame = project.frames[frameIndex];
  if (!frame) return;

  targetCtx.imageSmoothingEnabled = true;
  targetCtx.imageSmoothingQuality = 'high';

  const camera = project.camera3D;

  // Render visible layers from bottom to top
  for (const layer of project.layers) {
    if (!layer.visible) continue;

    const layerDataUrl = frame.layers[layer.id];
    if (!layerDataUrl) continue;

    try {
      const img = await loadImage(layerDataUrl);
      targetCtx.save();
      targetCtx.globalAlpha = layer.opacity;
      targetCtx.globalCompositeOperation = layer.blendMode || 'source-over';

      let posX = 0;
      let posY = 0;
      if (applyCamera3D && camera && camera.enabled && camera.enableParallax) {
        const depthFactor = (layer.depthZ || 0) / 400;
        posX = -camera.x * depthFactor * 0.5;
        posY = -camera.y * depthFactor * 0.5;
      }

      targetCtx.drawImage(img, posX, posY, w, h);
      targetCtx.restore();
    } catch (err) {
      console.error(`Failed to composite layer ${layer.name}:`, err);
    }
  }
}

/**
 * Exports animation to Video (MP4 or WebM) using browser MediaRecorder API
 */
export async function exportToVideo(
  project: AnimationProject,
  settings: ExportSettings,
  onProgress: (p: ExportProgress) => void
): Promise<{ blob: Blob; formatUsed: 'mp4' | 'webm'; isNativeMp4: boolean }> {
  const renderCanvas = document.createElement('canvas');
  renderCanvas.width = settings.width;
  renderCanvas.height = settings.height;
  const ctx = renderCanvas.getContext('2d')!;

  const fps = settings.fps || project.fps || 12;
  const frameIntervalMs = 1000 / fps;

  // Canvas capture stream
  const stream: MediaStream = renderCanvas.captureStream 
    ? renderCanvas.captureStream(0) 
    : (renderCanvas as any).mozCaptureStream(0);

  // Negotiate MP4 / WebM mime type
  const targetVideoType = settings.format === 'mp4' ? 'mp4' : 'webm';
  const { mimeType, isNativeMp4 } = getOptimalVideoMimeType(targetVideoType);

  // High Bitrates: 1080p = 18 Mbps, 4K = 35 Mbps
  const is4K = settings.width >= 3840 || settings.height >= 2160;
  const bitsPerSecond = is4K ? 35000000 : 18000000;

  const recorderOptions: MediaRecorderOptions = {
    videoBitsPerSecond: bitsPerSecond,
  };

  if (MediaRecorder.isTypeSupported(mimeType)) {
    recorderOptions.mimeType = mimeType;
  }

  const mediaRecorder = new MediaRecorder(stream, recorderOptions);
  const chunks: Blob[] = [];

  mediaRecorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  return new Promise(async (resolve, reject) => {
    mediaRecorder.onstop = () => {
      // Determine final blob type: if native MP4 was used or format was mp4, tag as video/mp4
      const outputMime = isNativeMp4 || settings.format === 'mp4' ? 'video/mp4' : 'video/webm';
      const blob = new Blob(chunks, { type: outputMime });
      resolve({
        blob,
        formatUsed: settings.format === 'mp4' ? 'mp4' : 'webm',
        isNativeMp4,
      });
    };

    mediaRecorder.onerror = (err) => reject(err);
    mediaRecorder.start();

    const totalFrames = project.frames.length;
    const loops = totalFrames <= 8 ? Math.max(2, settings.loopCount || 2) : Math.max(1, settings.loopCount || 1);

    for (let loop = 0; loop < loops; loop++) {
      for (let i = 0; i < totalFrames; i++) {
        const frameProgress = ((loop * totalFrames + i) / (loops * totalFrames)) * 90;
        const formatLabel = settings.format === 'mp4' ? 'MP4 (MediaRecorder)' : 'WebM (MediaRecorder)';

        onProgress({
          percent: Math.round(frameProgress),
          statusText: `Gravando vídeo ${formatLabel} - Quadro ${i + 1}/${totalFrames} (${settings.width}x${settings.height})...`,
        });

        await compositeFrameToCanvas(
          project,
          i,
          renderCanvas,
          settings.includeBackground,
          settings.backgroundColor,
          settings.applyCamera3D
        );

        // Tell stream to capture newly rendered frame
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack && (videoTrack as any).requestFrame) {
          (videoTrack as any).requestFrame();
        }

        // Account for frame hold duration
        const holdMultiplier = project.frames[i]?.holdFrames || 1;
        await new Promise((r) => setTimeout(r, frameIntervalMs * holdMultiplier));

        // Render transition to next frame if configured
        const currentFrame = project.frames[i];
        if (settings.renderTransitions && currentFrame.transition && currentFrame.transition.type !== 'none' && i < totalFrames - 1) {
          const nextIndex = i + 1;
          const trans = currentFrame.transition;
          const transSteps = trans.durationFrames || 4;

          const canvasA = document.createElement('canvas');
          canvasA.width = settings.width;
          canvasA.height = settings.height;
          await compositeFrameToCanvas(project, i, canvasA, settings.includeBackground, settings.backgroundColor, settings.applyCamera3D);

          const canvasB = document.createElement('canvas');
          canvasB.width = settings.width;
          canvasB.height = settings.height;
          await compositeFrameToCanvas(project, nextIndex, canvasB, settings.includeBackground, settings.backgroundColor, settings.applyCamera3D);

          for (let step = 1; step <= transSteps; step++) {
            const t = step / (transSteps + 1);
            renderTransitionFrame(ctx, canvasA, canvasB, trans.type, t, trans.easing, settings.backgroundColor);
            if (videoTrack && (videoTrack as any).requestFrame) {
              (videoTrack as any).requestFrame();
            }
            await new Promise((r) => setTimeout(r, frameIntervalMs));
          }
        }
      }
    }

    onProgress({ percent: 96, statusText: `Finalizando codificação ${settings.format.toUpperCase()} com MediaRecorder...` });
    await new Promise((r) => setTimeout(r, 250));
    mediaRecorder.stop();
  });
}

/**
 * Exports animation as High-Res Animated GIF
 */
export async function exportToGif(
  project: AnimationProject,
  settings: ExportSettings,
  onProgress: (p: ExportProgress) => void
): Promise<Blob> {
  const renderCanvas = document.createElement('canvas');
  const maxGifDim = 1280;
  let gifWidth = settings.width;
  let gifHeight = settings.height;

  if (gifWidth > maxGifDim || gifHeight > maxGifDim) {
    const scale = maxGifDim / Math.max(gifWidth, gifHeight);
    gifWidth = Math.round(gifWidth * scale);
    gifHeight = Math.round(gifHeight * scale);
  }

  renderCanvas.width = gifWidth;
  renderCanvas.height = gifHeight;

  const frameDataUrls: string[] = [];
  const totalFrames = project.frames.length;

  for (let i = 0; i < totalFrames; i++) {
    onProgress({
      percent: Math.round((i / totalFrames) * 60),
      statusText: `Compondo quadro ${i + 1} de ${totalFrames}...`,
    });

    await compositeFrameToCanvas(
      project,
      i,
      renderCanvas,
      settings.includeBackground,
      settings.backgroundColor,
      settings.applyCamera3D
    );

    frameDataUrls.push(renderCanvas.toDataURL('image/png'));
  }

  onProgress({ percent: 65, statusText: 'Codificando arquivo GIF animado...' });

  const fps = settings.fps || project.fps || 12;
  const interval = 1 / fps;

  return new Promise((resolve, reject) => {
    gifshot.createGIF(
      {
        images: frameDataUrls,
        gifWidth,
        gifHeight,
        interval,
        numWorkers: 4,
        sampleInterval: 8,
        progressCallback: (captureProgress: number) => {
          onProgress({
            percent: Math.round(65 + captureProgress * 30),
            statusText: `Codificando paleta de cores GIF (${Math.round(captureProgress * 100)}%)...`,
          });
        },
      },
      (obj) => {
        if (obj.error) {
          reject(new Error(obj.errorMsg || 'Erro ao gerar GIF'));
          return;
        }

        fetch(obj.image)
          .then((res) => res.blob())
          .then((blob) => {
            onProgress({ percent: 100, statusText: 'GIF gerado com sucesso!' });
            resolve(blob);
          })
          .catch(reject);
      }
    );
  });
}

/**
 * Exports animation as High-Res PNG Image Sequence inside a .ZIP file
 */
export async function exportToZipPngSequence(
  project: AnimationProject,
  settings: ExportSettings,
  onProgress: (p: ExportProgress) => void
): Promise<Blob> {
  const zip = new JSZip();
  const folder = zip.folder(`${project.title.replace(/\s+/g, '_')}_PNG_Sequence`)!;

  const renderCanvas = document.createElement('canvas');
  renderCanvas.width = settings.width;
  renderCanvas.height = settings.height;

  const totalFrames = project.frames.length;

  for (let i = 0; i < totalFrames; i++) {
    onProgress({
      percent: Math.round((i / totalFrames) * 85),
      statusText: `Exportando quadro PNG ${i + 1} de ${totalFrames} (${settings.width}x${settings.height})...`,
    });

    await compositeFrameToCanvas(
      project,
      i,
      renderCanvas,
      settings.includeBackground,
      settings.backgroundColor,
      settings.applyCamera3D
    );

    const dataUrl = renderCanvas.toDataURL('image/png');
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');

    const frameNumber = String(i + 1).padStart(4, '0');
    folder.file(`frame_${frameNumber}.png`, base64Data, { base64: true });
  }

  const metadata = {
    projectName: project.title,
    exportResolution: `${settings.width}x${settings.height}`,
    fps: settings.fps || project.fps,
    totalFrames,
    layersCount: project.layers.length,
    layers: project.layers.map((l) => ({ id: l.id, name: l.name, opacity: l.opacity })),
    exportedAt: new Date().toISOString(),
    generator: 'AnimaClip Studio Pro',
  };
  folder.file('project_metadata.json', JSON.stringify(metadata, null, 2));

  onProgress({ percent: 90, statusText: 'Compactando arquivo ZIP...' });

  const zipBlob = await zip.generateAsync(
    { type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } },
    (metadata) => {
      onProgress({
        percent: Math.round(90 + (metadata.percent / 100) * 10),
        statusText: `Compactando arquivo ZIP (${Math.round(metadata.percent)}%)...`,
      });
    }
  );

  return zipBlob;
}

/**
 * Triggers instant browser download of a blob
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
