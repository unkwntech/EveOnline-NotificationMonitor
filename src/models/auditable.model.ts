export interface Auditable {
    updates: RecordUpdates[];
}

export class RecordUpdates {
    public timestamp: Date;
    public actor: string;
    public sourceIP: string;
    public action: string;

    public constructor(json: any) {
        if (!json.timestamp)
            throw new Error("timestamp is required for RecordUpdates");
        else this.timestamp = json.timestamp;

        if (!json.actor) throw new Error("actor is required for RecordUpdates");
        else this.actor = json.actor;

        if (!json.sourceIP)
            throw new Error("sourceIP is required for RecordUpdates");
        else this.sourceIP = json.sourceIP;

        if (!json.action)
            throw new Error("action is required for RecordUpdates");
        else this.action = json.action;
    }
}
