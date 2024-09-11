export default class AuditFields {
    public createdOn: Date;
    public createdBy: number;
    public updates: { timestamp: Date; source: string; actor: number }[];

    public constructor(json?: any) {
        if (json.createdOn === undefined) this.createdOn = new Date();
        else this.createdOn = json.createdOn;

        if (json.createdBy === undefined)
            throw new Error("AuditFields requires createdBy");
        else this.createdBy = json.createdBy;

        this.updates = json.updates ?? [];
    }
}
