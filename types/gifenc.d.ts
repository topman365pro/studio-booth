declare module "gifenc" {
  interface GIFFrameOptions {
    palette: number[] | Uint8Array;
    delay?: number;
    repeat?: number;
    transparent?: boolean;
    transparentIndex?: number;
    dispose?: number;
  }

  interface Encoder {
    writeFrame(index: Uint8Array, width: number, height: number, options: GIFFrameOptions): void;
    finish(): void;
    bytes(): Uint8Array;
  }

  export function GIFEncoder(options?: { auto?: boolean }): Encoder;
  export function quantize(rgba: Uint8ClampedArray, maxColors: number): number[];
  export function applyPalette(rgba: Uint8ClampedArray, palette: number[]): Uint8Array;
}
