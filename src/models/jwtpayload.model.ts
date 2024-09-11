export class JWTPayload {
    //JWT Registered Claims See: https://datatracker.ietf.org/doc/html/rfc7519#section-4.1
    //issuer
    public iss: string;
    //audience
    public aud: string;
    //subject
    public sub: string;
    //expiration
    public exp: number;
    //issued at
    public iat: number;

    //Private Claims

    public constructor(json: any) {
        this.sub = json.sub;
        this.exp = json.exp;
        this.iss = json.iss;
        this.aud = json.aud;
        this.iat = json.iat;
    }

    public static make(
        subject: string,
        audience: string,
        expiration: number
    ): JWTPayload {
        return new JWTPayload({
            iat: Math.floor(Date.now() / 1000),
            iss: process.env.JWT_ISSUER,
            sub: subject,
            aud: audience,
            exp: Math.floor(expiration),
        });
    }

    public toJSON(): string {
        return JSON.stringify(this);
    }
}
