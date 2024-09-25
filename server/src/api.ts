import { useApi } from '@Server/api/index.js';
import { getPaydayHistory, triggerManualPayday } from './functions.js';

export function usePaydayAPI() {
    const user = {
        triggerPayday: triggerManualPayday,
        getHistory: getPaydayHistory,
    };

    // const faction = {
    //     Not yet.
    // };

    return {
        user,
    };
}

declare global {
    export interface ServerPlugin {
        ['rebar-payday-api']: ReturnType<typeof usePaydayAPI>;
    }
}

useApi().register('rebar-payday-api', usePaydayAPI());
