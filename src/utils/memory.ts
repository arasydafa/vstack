/**
 * Memory helpers for realistic stack rendering.
 * Stack grows downward from BASE_RSP, 8 bytes per slot (x86-64).
 *
 * @module utils/memory
 */

/** Top of stack base address (high memory). Chosen to resemble Linux user stack. */
export const BASE_RSP = 0x7fffffffe000;

/** Address string for a stack index. */
export const addrForIndex = (index: number): string => {
  const addr = BASE_RSP - index * 8;
  return '0x' + addr.toString(16);
};

/** Current RSP address string for a given rsp index. */
export const rspAddr = (rsp: number): string => addrForIndex(rsp);

/** Short ASCII preview for a hex value or label. */
export const asciiPreview = (value: string, label?: string): string => {
  if (label && /bin\/sh/i.test(label)) return '/bin/sh';
  if (!/^0x[0-9a-fA-F]+$/.test(value)) return '·';
  try {
    const n = BigInt(value);
    const bytes: number[] = [];
    let tmp = n;
    for (let i = 0; i < 8; i++) {
      bytes.push(Number(tmp & 0xffn));
      tmp >>= 8n;
    }
    const chars = bytes
      .map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '·'))
      .join('');
    // Show little-endian bytes trimmed of padding dots for readability
    const trimmed = chars.replace(/·+$/g, '');
    return trimmed.length >= 2 ? trimmed : '·';
  } catch {
    return '·';
  }
};
