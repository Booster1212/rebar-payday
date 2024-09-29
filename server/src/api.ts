import { useApi } from '@Server/api/index.js';
import { getPaydayHistory, triggerManualPayday, updatePayday } from './functions.js';

export function usePaydayAPI() {
    const user = {
        triggerPayday: triggerManualPayday,
        getHistory: getPaydayHistory,
        updatePayday: updatePayday,
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
