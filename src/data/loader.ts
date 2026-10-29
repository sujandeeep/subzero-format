import rawDataset from '../../jeeves-last-100-formatter-inputs-cleaned-20261028.jsonl?raw';

export interface JeevesRawItem {
  number: number;
  message: string;
}

export function loadJeeves100Dataset(): JeevesRawItem[] {
  return rawDataset
    .trim()
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line, idx) => {
      try {
        return JSON.parse(line) as JeevesRawItem;
      } catch {
        return { number: idx + 1, message: line };
      }
    });
}

export const JEEVES_100_ITEMS: JeevesRawItem[] = loadJeeves100Dataset();
