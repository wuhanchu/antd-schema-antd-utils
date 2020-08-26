const ClientOAuth2 = require("client-oauth2")
const axios = require("axios")

export const OAuthToken = ClientOAuth2.Token
export default new ClientOAuth2({
    clientId: "web",
    accessTokenUri: "/auth/oauth2/token",
    authorizationUri: "/auth/oauth2/token?grant_type=refresh_token",
    scopes: "server",
})
