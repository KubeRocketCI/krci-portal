export const convertToNumber = (value: string): number => {
  const numericValue = parseFloat(value);

  if (value.match(/m$/)) {
    return numericValue / 1000;
  } else if (value.match(/Gi$/)) {
    return numericValue * 1024;
  } else if (value.match(/Mi$/)) {
    return numericValue;
  } else if (value.match(/Ki$/)) {
    return numericValue / 1024;
  } else if (value.match(/Ti$/)) {
    return numericValue * 1048576;
  } else {
    return numericValue;
  }
};
