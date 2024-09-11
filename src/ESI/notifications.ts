namespace ESI {
    export class Character extends ESI.Base {
        public id: number;
        //...

        public constructor(json: any) {
            super(json);
            this.id = json.id;
        }

        public static async getNotifications() {
            return ESI.Base.authenticatedESIReqeust("bar");
        }
    }
}
