export const sumEven = (nums: number[]) =>
  nums.reduce((tot, cur) => (cur % 2 === 0 ? tot + cur : tot));
