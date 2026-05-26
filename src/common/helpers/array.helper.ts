export const isEmptyArray = (arr: unknown): arr is any[] => {
  return Array.isArray(arr) && arr.length === 0;
};
