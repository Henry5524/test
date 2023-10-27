import { ChartLinkService } from './chart-link-service';

export interface ChartLink {
    source: string;
    target: string;
    services: ChartLinkService[];
}
