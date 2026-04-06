export const AllocationLevel = {
  Overview: { id: 'overview', order: 0, name: 'Overview' },
  Category: { id: 'category', order: 1, name: 'Category' },
  Detail: { id: 'detail', order: 2, name: 'Detail' },
  Assets: { id: 'assets', order: 3, name: 'Assets' },
} as const;

export type AllocationLevel = (typeof AllocationLevel)[keyof typeof AllocationLevel];

export interface AllocationEntry {
  readonly label: string;
  readonly emoji: string;
  readonly color: string;
  readonly cents: number;
  readonly percentage: number;
}

export type Allocations = Record<AllocationLevel['id'], readonly AllocationEntry[]>;
