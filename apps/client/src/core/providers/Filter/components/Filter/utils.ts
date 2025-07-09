export function getFilterValueByNameFromURL(key: string, location: Location): string[] {
  const searchParams = new URLSearchParams(location.search);

  const filterValue = searchParams.get(key);
  if (!filterValue) {
    return [];
  }
  return filterValue.split(" ");
}
