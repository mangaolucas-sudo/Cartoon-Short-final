/** Largura estimada (em "em") de um texto em Inter Black, propositalmente um pouco acima do real,
 *  para nunca subestimar: se não couber, o texto é comprimido até a largura máxima (textLength). */
export const em = (txt: string) => {
  let w = 0;
  for (const ch of String(txt)) {
    if ('.,:;!|'.includes(ch)) w += 0.32;
    else if (ch === ' ') w += 0.28;
    else if ('0123456789$'.includes(ch)) w += 0.68;
    else if ('MWÇ'.includes(ch)) w += 0.92;
    else if (ch === 'I' || ch === 'l' || ch === 'i') w += 0.34;
    else if (/[A-ZÀ-Ý]/.test(ch)) w += 0.76;
    else if (/[a-zà-ý]/.test(ch)) w += 0.62;
    else w += 0.7;
  }
  return w;
};
/** props para <text>: força caber em `max` px */
export const fitProps = (txt: React.ReactNode, size: number, max?: number) => {
  if (!max || typeof txt !== 'string' && typeof txt !== 'number') return {};
  const w = em(String(txt)) * size;
  return w > max ? {textLength: max, lengthAdjust: 'spacingAndGlyphs' as const} : {};
};
/** tamanho de fonte que cabe em `max` px */
export const fitSize = (txt: string, size: number, max: number) => Math.min(size, max / Math.max(0.1, em(txt)));
