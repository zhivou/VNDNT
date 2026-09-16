import type { APIResponse } from '@playwright/test';

// A record as the API lists it: every resource has a numeric id, and the other fields depend on the resource.
export type ListedRecord = { id: number } & Record<string, unknown>;

export const readRecords = async (response: APIResponse): Promise<ListedRecord[]> =>
  (await response.json()) as ListedRecord[];

export const idsOf = (records: ListedRecord[]): number[] => records.map(({ id }) => id);

// Sorts a copy by a text field the way the API does: a stable sort comparing with < and >, so ties keep their order.
export const sortedByText = (records: ListedRecord[], field: string, order: 'asc' | 'desc'): ListedRecord[] => {
  const direction = order === 'asc' ? 1 : -1;
  return [...records].sort((a, b) => {
    const [x, y] = [a[field] as string, b[field] as string];
    return (x < y ? -1 : x > y ? 1 : 0) * direction;
  });
};
