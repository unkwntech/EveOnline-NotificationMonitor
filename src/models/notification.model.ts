import * as yaml from "yaml";
import AuditFields from "./auditFields.model";
import Deletable from "./deletable.model";
import { Factory } from "./factory";
import { Identifiable } from "./identifiable";

export default class Notification
    extends AuditFields
    implements Identifiable, Deletable
{
    id: string;
    timestamp: Date;
    type: NotificationType;
    sender: NotificationSender;

    text: string = "";
    read?: boolean;

    notificationSent?: Date;
    notificationSource: NotificationSource;

    deleted: boolean = false;

    constructor(json: any) {
        super(json);

        if (json.id === undefined) throw new Error("Notification requires id");
        else this.id = json.id;

        if (json.text === undefined)
            throw new Error("Notification requries text");
        else this.text = json.text;

        if (json.timestamp === undefined)
            throw new Error("Notification requires timestamp");
        else this.timestamp = json.timestamp;

        //todo catch invalid type???
        if (json.type === undefined)
            throw new Error("Notification requires type");
        else this.type = json.type;

        if (json.read === undefined)
            throw new Error("Notification requires read");
        else this.read = json.read;

        if (json.sender === undefined)
            throw new Error("Notification requires sender");
        else this.sender = json.sender;

        this.notificationSent = json.notificationSent;
        this.notificationSource = json.notificationSource ?? 0;

        this.deleted = json.deleted ?? false;
    }

    public format(template: string) {
        return template
            .replaceAll("%timestamp%", this.timestamp.toUTCString())
            .replaceAll("%type%", this.type)
            .replaceAll("%sender_type%", this.sender.type)
            .replaceAll("%sender_id%", this.sender.id)
            .replaceAll("%text%", this.text ?? "");
    }

    public static make(
        id: string,
        sender: NotificationSender,
        type: NotificationType,
        source: NotificationSource,
        timestamp: string,
        text: string = "",
        read: boolean = false
    ): Notification {
        return new Notification({
            id,
            sender,
            type,
            source,
            timestamp: new Date(timestamp),
            text,
            read,
            createdBy: -1,
            createdOn: Date.now(),
            updates: [],
        });
    }

    public static getFactory(): Factory<Notification> {
        return new (class implements Factory<Notification> {
            make = (json: any): Notification => new Notification(json);
            collectionName = "Notifications";
            getURL = (id?: string): string => Notification.getURL(id);
        })();
    }

    public static getURL(id?: string) {
        return "/notification/" + (id ? `/${id}` : "");
    }

    public toEmbed(data?: any) {
        switch (this.type) {
            case "StructureUnderAttack":
                const text = yaml.parse(this.text);

                const shieldPer = text.shieldPercentage;
                const armourPer = text.armorPercentage;
                const hullPer = text.hullPercentage;
                const attackCorp = text.corpName;
                let attackAlli = "";
                if (text.allianceName) attackAlli = text.allianceName;

                return {
                    content: "@everyone",
                    tts: false,
                    embeds: [
                        {
                            title: "Structure Attacked",
                            color: 13223722,
                            fields: [
                                {
                                    name: "Shield Attacked",
                                    value: data.structureName ?? "UNKNOWN",
                                    inline: true,
                                },
                                {
                                    name: "Owner",
                                    value: `[${
                                        data.ownerName ?? "UNKWNOWN"
                                    }](https://zkillboard.com/corporation/${
                                        data.ownerID ?? ""
                                    }/)`,
                                    inline: true,
                                },
                                {
                                    name: " ",
                                    value: " ",
                                    inline: true,
                                },
                                {
                                    name: "Attacker Alliance",
                                    value: `[${attackAlli}](https://zkillboard.com/alliance/${text.allianceLinkData[2]}/)`,
                                    inline: true,
                                },
                                {
                                    name: "Attacker Corp",
                                    value: `[${attackCorp}](https://zkillboard.com/corporation/${text.corpLinkData[2]}/)`,
                                    inline: true,
                                },
                                {
                                    name: "Attacker",
                                    value: `[${
                                        data.attackerName ?? "UNKWNOWN"
                                    }](https://zkillboard.com/character/${
                                        text.charID
                                    }/)`,
                                    inline: true,
                                },
                                {
                                    name: "Shield Status",
                                    value: `${Math.floor(shieldPer)}%`,
                                    inline: true,
                                },
                                {
                                    name: "Armour Status",
                                    value: `${Math.floor(armourPer)}%`,
                                    inline: true,
                                },
                                {
                                    name: "Hull Status",
                                    value: `${Math.floor(hullPer)}%`,
                                    inline: true,
                                },
                            ],
                            timestamp: this.timestamp,
                            thumbnail: {
                                url: `https://images.evetech.net/types/${text.structureShowInfoData[1]}/render?size=128`,
                            },
                        },
                    ],
                };
                break;
        }
    }
}

export interface NotificationSender {
    id: string;
    type: string;
}

export interface NotificationSource {
    userID: string;
    characterID: string;
}

export type NotificationType =
    | "FacWarLPPayoutEvent"
    | "NPCStandingsLost"
    | "FacWarLPPayoutKill"
    | "StructureAnchoring"
    | "CorpAllBillMsg"
    | "KillRightAvailable"
    | "CorpTaxChangeMsg"
    | "FWCharRankGainMsg"
    | "CharAppWithdrawMsg"
    | "CorpAppNewMsg"
    | "KillReportFinalBlow"
    | "CloneActivationMsg2"
    | "TowerAlertMsg"
    | "CharAppAcceptMsg"
    | "BillPaidCorpAllMsg"
    | "InsurancePayoutMsg"
    | "KillReportVictim"
    | "StructureUnderAttack"
    | "CorpWarSurrenderMsg"
    | "FWCharRankLossMsg"
    | "ContactAdd"
    | "FacWarLPDisqualifiedEvent"
    | "WarRetractedByConcord"
    | "KillRightEarned"
    | "CorporationGoalCompleted"
    | "AllyJoinedWarAllyMsg"
    | "OfferedToAlly"
    | "KillRightAvailableOpen"
    | "AcceptedSurrender"
    | "WarSurrenderOfferMsg"
    | "FacWarLPDisqualifiedKill"
    | "WarInvalid"
    | "WarInherited"
    | "StructureItemsMovedToSafety"
    | "StructureDestroyed"
    | "StructureWentLowPower"
    | "CorporationGoalCreated"
    | "StructureLostShields"
    | "GameTimeAdded"
    | "GiftReceived"
    | "TowerResourceAlertMsg"
    | "WarDeclared"
    | "DeclareWar"
    | "StructurePaintPurchased"
    | "MoonminingExtractionStarted"
    | "MoonminingLaserFired"
    | "MoonminingExtractionFinished"
    | "CharLeftCorpMsg"
    | "FWCorpLeaveMsg"
    | "FacWarCorpLeaveRequestMsg"
    | "BillOutOfMoneyMsg"
    | "CharAppRejectMsg"
    | "WarHQRemovedFromSpace"
    | "AllyJoinedWarDefenderMsg"
    | "AcceptedAlly"
    | "MercOfferedNegotiationMsg"
    | "OfferedSurrender"
    | "StructureImpendingAbandonmentAssetsAtRisk"
    | "AllyJoinedWarAggressorMsg"
    | "SovStructureDestroyed"
    | "SovCommandNodeEventStarted"
    | "SovStructureReinforced"
    | "EntosisCaptureStarted"
    | "OwnershipTransferred"
    | "StructureFuelAlert"
    | "LocateCharMsg"
    | "JumpCloneDeletedMsg2"
    | "StoryLineMissionAvailableMsg"
    | "KillRightUsed"
    | "StructureItemsDelivered"
    | "JumpCloneDeletedMsg1"
    | "CorpNoLongerWarEligible"
    | "CorpAppAcceptMsg"
    | "CorpLiquidationMsg"
    | "CorpAppInvitedMsg"
    | "CorpVoteMsg"
    | "CorpNewCEOMsg"
    | "CorpKicked"
    | "AllWarRetractedMsg"
    | "CorpAppRejectMsg"
    | "MissionOfferExpirationMsg"
    | "StructureWentHighPower"
    | "StructureOnline"
    | "MoonminingAutomaticFracture"
    | "SeasonalChallengeCompleted"
    | "RaffleFinished"
    | "StructuresReinforcementChanged"
    | "ExpertSystemExpired"
    | "RaffleExpired";
