export interface ChartNode {
    id: string;
    name?: string;
    group: 'internal' | 'internalVM' | 'external';
}
