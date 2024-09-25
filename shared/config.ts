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
        interval: 15000,
        defaultSender: 'GOVERNMENT',
        unemployedAmount: 25,
    },
};

export const PaydayEvents = {
    Process: 'payday:process',
};
