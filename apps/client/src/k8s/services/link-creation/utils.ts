export const createURLObjectFromURLOrigin = (urlOrigin: string) => {
  try {
    const _urlOrigin = urlOrigin.trim();

    return new URL(_urlOrigin);
  } catch (error) {
    throw new Error(`Error while creating URL object: ${error}`);
  }
};
