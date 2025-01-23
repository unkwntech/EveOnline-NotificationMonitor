import { Utilities } from "../utilities/utilities";
import { Auditable, RecordUpdates } from "./auditable.model";
import Deletable from "./deletable.model";
import { Factory } from "./factory";
import { Identifiable } from "./identifiable";
import Interest from "./interests.model";

export default class User implements Identifiable, Deletable, Auditable {
    public id: string;
    public interests: Interest[];

    public characters: Character[];

    public updates: RecordUpdates[];
    public deleted: boolean;

    public isSuperAdmin: boolean;

    public constructor(json: any) {
        if (json.id === undefined) throw new Error("id is required for User");
        else this.id = json.id;

        this.interests = json.interests ?? [];

        if (
            json.characters === undefined ||
            json.characters < 1 ||
            !Array.isArray(json.characters)
        )
            throw new Error("characters must be an array on User");
        else this.characters = json.characters;

        this.deleted = json.deleted;
        this.updates = json.updates;

        if (json.isSuperAdmin === undefined) this.isSuperAdmin = false;
        else this.isSuperAdmin = json.isSuperAdmin;
    }

    public static make(
        mainCharacter: Partial<Character>,
        ipAddress: string
    ): User {
        return new User({
            id: Utilities.newGuid(),
            characters: [{ ...mainCharacter, isMain: true }],
            deleted: false,
            updates: [
                {
                    timestamp: new Date(),
                    actor: mainCharacter.id,
                    sourceIP: ipAddress,
                    action: "CREATE USER " + JSON.stringify(mainCharacter),
                },
            ],
        });
    }

    public static getFactory(): Factory<User> {
        return new (class implements Factory<User> {
            make = (json: any): User => new User(json);
            collectionName = "Users";
            getURL = (id?: string): string => User.getURL(id);
        })();
    }

    public static getURL(id?: string) {
        return "/users/" + (id ? `/${id}` : "");
    }
}

export interface Character {
    id: string;
    name: string;
    isMain: boolean;
    token: ESIToken;
    corporation: Corporation;
}

export interface Corporation {
    id: string;
    name: string;
    alliance?: Alliance;
}

export interface Alliance {
    id: string;
    name: string;
}

export interface ESIToken {
    accessToken: string;
    refreshToken: string;
    lastUsed: Date;
    etag?: string;
    isActive: boolean;
}
