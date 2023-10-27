import axios, { AxiosInstance } from 'axios';
import { config } from '../config';
import { handleRequest } from './http-helpers';

export class CloudPricing {
    static axios: AxiosInstance = axios.create({
        baseURL: config.pricing_base_url,
        withCredentials: false,
    });

    /**
     * Akasia move group pricing calculation
     *
     * @param {String} mgId Move Group ID
     * @param {String} userId User ID
     * @param {String} orgId Organization ID
     * @param {String} projectId Project ID
     * @return {Promise<string | null>} will resolve to Person
     */
    static getAkasiaPricingUrl(mgId: string, userId: string, orgId: string, projectId: string, akasiaInsecure = false): Promise<string | null> {
        return handleRequest<string | null>(
            CloudPricing.axios.post('/aim/move-group/' + mgId, { userId, orgId, projectId, akasiaInsecure }),
            data => data && data.url ? data.url : null
        );
    }
}
