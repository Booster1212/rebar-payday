export interface PlayerPayday {
    _id?: string;
    username: string;
    lastPayday: Date;
    sender: string;
    amount: number;
    paydays: Payday[];
}

interface Payday {
    _id?: string;
    sender: string;
    amount: number;
    date: Date;
}
