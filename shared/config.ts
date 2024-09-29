export const PaydayConfig = {
    General: {
        dbCollection: 'payday',
        debug: true,
    },
    Plugins: {
        CurrencyAPI: true,
        AscendedNotify: true,
        AscendedFactions: false,
    },
    Payments: {
        interval: 60000 * 60,
        defaultSender: 'GOVERNMENT',
        unemployedAmount: 25,
    },
};

export const PaydayEvents = {
    Process: 'payday:process',
};
