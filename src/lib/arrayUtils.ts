/**
 * Group an array of objects by a specific key
 * @param array - Array to group
 * @param key - Property name to group by
 * @returns Object with keys as group identifiers and values as arrays of items
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

/**
 * Group an array of objects by a specific key, keeping only the first item per group
 * @param array - Array to group
 * @param key - Property name to group by
 * @returns Object with keys as group identifiers and values as the first item of each group
 */
export function groupByFirst<T>(array: T[], key: keyof T): Record<string, T> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = item;
    }
    return result;
  }, {} as Record<string, T>);
}

/**
 * Get the latest item by date for each group
 * @param array - Array to process
 * @param groupKey - Property name to group by
 * @param dateKey - Property name containing the date
 * @returns Object with keys as group identifiers and values as the latest item per group
 */
export function getLatestByGroup<T>(
  array: T[],
  groupKey: keyof T,
  dateKey: keyof T
): Record<string, T> {
  const grouped = groupBy(array, groupKey);
  const result: Record<string, T> = {};
  
  Object.keys(grouped).forEach(key => {
    const items = grouped[key];
    result[key] = items.reduce((latest, current) => {
      const latestDate = new Date(latest[dateKey] as any);
      const currentDate = new Date(current[dateKey] as any);
      return currentDate > latestDate ? current : latest;
    });
  });
  
  return result;
}
