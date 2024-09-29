import * as alt from 'alt-server';
import { PaydayConfig, PaydayEvents } from '../../shared/config.js';
import { useDatabase } from '@Server/database/index.js';
import { PlayerPayday } from '../../shared/interface.js';
import { useRebar } from '@Server/index.js';

const Database = useDatabase();
const Rebar = useRebar();

/**
 * Initializes the payday system by creating the database collection if it doesn't exist.
 */
export async function initPaydaySystem() {
    await Database.createCollection(PaydayConfig.General.dbCollection);

    debugPayday('Payday system initialized.');
}

/**
 * Initializes the payday document for a player if it doesn't already exist.
 * @param player - The player to initialize the payday document for.
 */
export async function initializePayday(player: alt.Player) {
    const characterDocument = Rebar.document.character.useCharacter(player).get();

    if (!characterDocument) {
        debugPayday(`Character document not found for player ${player.name}. Skipping payday initialization.`);
        return;
    }

    const dbEntryExists = await Database.get<PlayerPayday>(
        { username: characterDocument.name },
        PaydayConfig.General.dbCollection,
    );

    if (dbEntryExists) {
        debugPayday(`Payday document already exists for ${player.name}.`);
        return;
    }

    const document: PlayerPayday = {
        lastPayday: new Date(),
        amount: PaydayConfig.Payments.unemployedAmount,
        paydays: [],
        username: characterDocument.name,
        sender: PaydayConfig.Payments.defaultSender,
    };

    await Database.create(document, PaydayConfig.General.dbCollection);

    debugPayday(`Creating new payday document for ${player.name}`);
}

/**
 * Processes the payday for a player, adding the appropriate amount of currency to their account.
 * @param player - The player to process the payday for.
 * @param manual - Whether the payday is being triggered manually (true) or automatically (false). Default: false
 */
async function processPayday(player: alt.Player, manual = false) {
    if (!player?.valid) {
        return;
    }

    const CurrencyAPI = await Rebar.useApi().getAsync('currency-api');
    if (!CurrencyAPI) return;

    const payday = await getPaymentData(player);
    if (!payday) return;

    let amountToPay = 0;
    let missedPaydayPeriods = 0;

    if (!manual) {
        const now = Date.now();
        const timeSinceLastPayday = payday.lastPayday ? now - payday.lastPayday.getTime() : 0;
        missedPaydayPeriods = Math.floor(timeSinceLastPayday / PaydayConfig.Payments.interval);

        amountToPay = missedPaydayPeriods * PaydayConfig.Payments.unemployedAmount;
    }

    if (payday.sender === PaydayConfig.Payments.defaultSender) {
        amountToPay += PaydayConfig.Payments.unemployedAmount;
    } else {
        amountToPay += payday.amount;
    }

    CurrencyAPI.useCurrency(player, 'Character').add('bank', amountToPay);

    if (PaydayConfig.Plugins.AscendedNotify) {
        const NotificationsAPI = await Rebar.useApi().getAsync('ascended-notification-api');
        if (NotificationsAPI) {
            NotificationsAPI.general.send(player, {
                icon: '💰',
                title: 'Payday',
                message: `You've received $${amountToPay} from ${payday.sender}!`,
                duration: 5000,
            });
        } else {
            debugPayday('Ascended Notify API not found. Cannot send payday notification.');
        }
    }

    logPaymentTransaction(player, amountToPay, missedPaydayPeriods);
}

/**
 * Logs a payment transaction for a player.
 * @param player - The player to log the payment transaction for.
 * @param amount - The amount paid.
 * @param missedPeriods - The number of missed payday periods.
 */
function logPaymentTransaction(player: alt.Player, amount: number, missedPeriods: number = 0) {
    updatePayday(player, 'GENERAL', amount, missedPeriods);
}

/**
 * Updates the payday document for a player.
 * @param player - The player to update the payday document for.
 * @param source - The source of the payday.
 * @param amount - The amount paid.
 * @param missedPeriods - The number of missed payday periods.
 */
export async function updatePayday(player: alt.Player, source: string, amount: number, missedPeriods: number = 0) {
    const document = await getPaymentData(player);
    if (!document) return;

    document.paydays.push({
        amount: amount,
        sender: source,
        date: new Date(),
    });

    document.lastPayday = new Date();

    await Database.update(document, PaydayConfig.General.dbCollection);
}

/**
 * Resets the payday data to unemployed payment again for a player.
 * @param player - The player to reset the payday data for.
 */
export async function resetPaydayDefault(player: alt.Player) {
    const characterDocument = Rebar.document.character.useCharacter(player).get();
    if (!characterDocument) return;

    const document: PlayerPayday = {
        lastPayday: new Date(),
        amount: PaydayConfig.Payments.unemployedAmount,
        paydays: [],
        username: characterDocument.name,
        sender: PaydayConfig.Payments.defaultSender,
    };

    await Database.update(document, PaydayConfig.General.dbCollection);
}

/**
 * Gets the payday data for a player.
 * @param player - The player to get the payday data for.
 * @returns The payday data for the player, or null if not found.
 */
async function getPaymentData(player: alt.Player): Promise<PlayerPayday | null> {
    if (!player?.valid) return null;

    const characterDocument = Rebar.document.character.useCharacter(player).get();
    if (!characterDocument) return null;

    const paymentDocument = await Database.get<PlayerPayday>(
        { username: characterDocument.name },
        PaydayConfig.General.dbCollection,
    );

    if (paymentDocument && typeof paymentDocument.lastPayday === 'string') {
        paymentDocument.lastPayday = new Date(paymentDocument.lastPayday);
    }

    return paymentDocument;
}

/**
 * Debugs a message to the console if debugging is enabled.
 * @param message - The message to debug.
 * @param context - The context of the debug message.
 */
function debugPayday(message: string | object, context: string = 'GENERAL'): void {
    if (!PaydayConfig.General.debug) return;

    const timestamp = new Date().toLocaleTimeString();
    const prefix = `\x1b[35m[PAYDAY] =>\x1b[0m`;
    const contextFormatted = `\x1b[36m[${context.toUpperCase()}]\x1b[0m`;
    const timeFormatted = `\x1b[33m[${timestamp}]\x1b[0m`;

    let formattedMessage: string;

    if (typeof message === 'object') {
        try {
            formattedMessage = JSON.stringify(message, null, 2);
            formattedMessage = formattedMessage.replace(/^/gm, '  ');
            formattedMessage = `\x1b[32m${formattedMessage}\x1b[0m`;
        } catch (error) {
            formattedMessage = `\x1b[31m[Error stringifying object: ${error}]\x1b[0m`;
        }
    } else {
        formattedMessage = `\x1b[37m${message}\x1b[0m`;
    }

    const debugMessage = `${prefix} ${contextFormatted} ${timeFormatted} ${formattedMessage}`;

    alt.log(debugMessage);
}

const PAYDAY_EVENT_INTERVAL = PaydayConfig.Payments.interval;

alt.setInterval(() => {
    alt.emit(PaydayEvents.Process);
}, PAYDAY_EVENT_INTERVAL);

alt.on(PaydayEvents.Process, () => {
    for (const player of alt.Player.all) {
        processPayday(player);
    }
});

/**
 * Triggers a manual payday for a specific player.
 * @param player - The player to give a payday to.
 */
export function triggerManualPayday(player: alt.Player) {
    processPayday(player, true);
}

/**
 * Gets the payday history for a player.
 * @param player - The player to get the payday history for.
 * @returns An array of payday transactions, or null if no history is found.
 */
export async function getPaydayHistory(player: alt.Player): Promise<PlayerPayday['paydays'] | null> {
    const paydayData = await getPaymentData(player);
    return paydayData ? paydayData.paydays : null;
}

alt.on('rebar:playerCharacterBound', async (player: alt.Player) => {
    await initializePayday(player);
});
