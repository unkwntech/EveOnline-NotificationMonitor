import axios from "axios";
import { ESIToken } from "../models/user.model";

export default class ESIUtilities {
    public static GetStructureInfo = (id: string, token: ESIToken) =>
        ESIUtilities.AuthenticatedGetRequest(
            `universe/structures/${id}/`,
            token
        );
    public static GetCharInfo = (id: string) =>
        ESIUtilities.UnauthenicatedGetRequest(`characters/${id}/`);
    public static GetCorpInfo = (id: string) =>
        ESIUtilities.UnauthenicatedGetRequest(`corporations/${id}/`);
    public static GetAlliInfo = (id: string) =>
        ESIUtilities.UnauthenicatedGetRequest(`alliances/${id}/`);
    public static GetMoonInfo = (id: string) =>
        ESIUtilities.UnauthenicatedGetRequest(`universe/moons/${id}/`);
    public static GetPlanetInfo = (id: string) =>
        ESIUtilities.UnauthenicatedGetRequest(`universe/planets/${id}/`);
    public static GetSystemInfo = (id: string) =>
        ESIUtilities.UnauthenicatedGetRequest(`universe/systems/${id}/`);

    public static UnauthenicatedGetRequest = (endpoint: string) =>
        axios.get(`https://esi.evetech.net/latest/${endpoint}`);

    public static AuthenticatedGetRequest = (
        endpoint: string,
        token: ESIToken
    ) =>
        axios.get(`https://esi.evetech.net/latest/${endpoint}`, {
            headers: {
                Authorization: `Bearer ${token.accessToken}`,
            },
        });
}
