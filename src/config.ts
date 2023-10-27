import { log } from '@utils';

export const config = {
    api_base_url: process.env.NEXT_MODE !== 'dev' ? '/constellation/api/v1' : '/api/v1',
    results_base_url: process.env.NEXT_MODE !== 'dev' ? '/constellation/_results' : '/_results',
    auth_base_url: process.env.NEXT_MODE !== 'dev' ? '/auth' : '/auth',
    pricing_base_url: process.env.NEXT_MODE !== 'dev' ? '/pricing' : '/pricing',
};

log('process.env.NEXT_MODE ->', process.env.NEXT_MODE);
log('process.env.ENV ->', process.env.ENV);
log('process.env.URL ->', process.env.URL);
log('config', JSON.stringify(config));

export default config;
