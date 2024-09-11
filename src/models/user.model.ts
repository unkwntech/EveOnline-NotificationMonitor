import AuditFields from "./auditFields.model";
import Deletable from "./deletable.model";
import ESIToken from "./esiToken.model";
import { Factory } from "./factory";
import { Identifiable } from "./identifiable";
import Interest from "./interests.model";

export default class User
    extends AuditFields
    implements Identifiable, Deletable
{
    public id: string;
    public tokens: ESIToken[];
    public interests: Interest[];

    public deleted: boolean;

    public constructor(json: any) {
        super(json);
        this.id = json.id;
        this.tokens = json.tokens;
        this.interests = json.interests;
        this.deleted = json.deleted;
    }

    public static make(): User {
        return new User({});
    }

    public static getFactory(): Factory<User> {
        return new (class implements Factory<User> {
            make(json: any): User {
                return new User(json);
            }
            getCollectionName(): string {
                return "Users";
            }
            getURL(id?: string): string {
                return User.getURL(id);
            }
        })();
    }

    public static getURL(id?: string) {
        return "/users/" + (id ? `/${id}` : "");
    }
}
