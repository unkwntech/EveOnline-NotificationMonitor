import { Utilities } from "../utilities/utilities";
import AuditFields from "./auditFields.model";
import Deletable from "./deletable.model";
import { Factory } from "./factory";
import { Identifiable } from "./identifiable";

export default class ESIToken
    extends AuditFields
    implements Deletable, Identifiable
{
    public id: string;

    public characterID: string;
    public characterName: string;
    public corporationName: string;
    public allianceName?: string;

    public accessToken: string;
    public refreshToken: string;

    public isMain: boolean;

    public lastPull: Date;
    public lastRefresh: Date;

    public etag: string = "";

    public isActive: boolean = true;

    //deletable
    public deleted: boolean = false;

    public constructor(json: any) {
        super(json);

        if (json.id === undefined) throw new Error("esiToken requires id");
        else this.id = json.id;

        if (json.characterID === undefined)
            throw new Error("esiToken requires characterID");
        else this.characterID = json.characterID;

        if (json.characterName === undefined)
            throw new Error("esiToken requires characterName");
        else this.characterName = json.characterName;

        if (json.corporationName === undefined)
            throw new Error("esiToken requires corporationName");
        else this.corporationName = json.corporationName;

        if (json.allianceName === undefined)
            throw new Error("esiToken requires allianceName");
        else this.allianceName = json.allianceName;

        if (json.accessToken === undefined)
            throw new Error("esiToken requires accessToken");
        else this.accessToken = json.accessToken;

        if (json.refreshToken === undefined)
            throw new Error("esiToken requires charrefreshTokencterID");
        else this.refreshToken = json.refreshToken;

        if (json.isMain === undefined)
            throw new Error("esiToken requires isMain");
        else this.isMain = json.isMain;

        if (json.lastPull === undefined)
            throw new Error("esiToken requires lastPull");
        else this.lastPull = json.lastPull;

        if (json.lastRefresh === undefined)
            throw new Error("esiToken requires lastRefresh");
        else this.lastRefresh = json.lastRefresh;

        if (json.etag !== undefined) this.etag = json.etag;
        this.isActive = json.isActive;
        this.deleted = json.deleted ?? false;

        this.createdOn = json.createdOn = new Date();
        if (json.createBy === undefined)
            throw new Error("esiToken requires createBy");
        else this.createdBy = json.createBy;

        this.updates = json.updates ?? [];
    }

    public static make(): ESIToken {
        return new ESIToken({
            id: Utilities.newGuid(),
        });
    }

    public static getFactory(): Factory<ESIToken> {
        return new (class implements Factory<ESIToken> {
            make(json: any): ESIToken {
                return new ESIToken(json);
            }
            getCollectionName(): string {
                return ESIToken.getCollectionName();
            }
            getURL(): string {
                return ESIToken.getURL();
            }
        })();
    }

    public static getCollectionName(): string {
        return "ESITokens";
    }
    public static getURL(id?: string): string {
        return "/esitoken" + (id ? `/${id}` : "");
    }
}
