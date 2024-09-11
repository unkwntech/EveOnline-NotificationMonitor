import { NotificationType } from "./notification.model";

export default interface Interest {
    notificationType: NotificationType;
    targetWebhook: string;
    template: string;
}
