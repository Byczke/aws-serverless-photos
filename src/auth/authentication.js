import {CognitoUserPool, CognitoUserAttribute, CognitoUser, AuthenticationDetails} from 'amazon-cognito-identity-js';
import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers";

export class Authentication {
    constructor(userPoolId, identityId, clientId, region) {
        this.userPool = new CognitoUserPool({
            UserPoolId: userPoolId,
            ClientId: clientId,
        })
        this.identityId = identityId;
        this.region = region;
        this.userPoolId = userPoolId;
    }

    register(registerRequest) {
        return new Promise((success, reject) => {
            this.userPool.signUp(registerRequest.email, registerRequest.password,
                [
                    new CognitoUserAttribute({
                        Name: 'website',
                        Value: registerRequest.website,
                    })
                ],
                null,
                (err, result) => {
                    if (err) {
                        reject(err);
                    }
                    
                    success(result);
                }
            )
        });
    }

    confirm(confirmRequest) {
        return new Promise((success, reject) => {
            const cognitoUser = new CognitoUser({
                Username: confirmRequest.email,
                Pool: this.userPool
            });
        
            cognitoUser.confirmRegistration(
                confirmRequest.code,
                true,
                (err, result) => {
                    if (err) {
                        reject(err);
                    }
                    success(result);
                }
            )
        })
    }

    login(loginRequest) {
        return new Promise((success, reject) => {
            const authDetails = new AuthenticationDetails({
                Username: loginRequest.email,
                Password: loginRequest.password,
            });
        
            const cognitoUser = new CognitoUser({
                Username: loginRequest.email,
                Pool: this.userPool
            });
            
            cognitoUser.authenticateUser(authDetails, {
                onSuccess: success,
                onFailure: reject
            })
        });
    }

    getCurrentUser() {
        return new Promise((success, reject) => {
            const cognitoUser = this.userPool.getCurrentUser();
            if (cognitoUser == null) {
                reject("there is no user authorized");
            }
    
            
            cognitoUser.getSession((err, session) => {
                if (err) {
                    reject("invalid session");
                }
    
                cognitoUser.getUserAttributes((err, attributes) => {
                    if (err) {
                        reject("invalid attributes");
                    }
    
                    success(attributes.reduce((profile, item) => {
                        return {...profile, [item.Name]: item.Value}
                    }, {}));
                })
            });
        });
    }

    getAccessToken() {
        return new Promise((success, reject) => {
            const cognitoUser = this.userPool.getCurrentUser();
            if (cognitoUser == null) {
                reject("there is no user authorized");
            }
    
            
            cognitoUser.getSession((err, session) => {
                if (err) {
                    reject("invalid session");
                }
    
                success(session.getIdToken().getJwtToken());
            });
            
        });
    }

    logout() {
        return new Promise((success, reject) => {
            const cognitoUser = this.userPool.getCurrentUser();
            if (cognitoUser == null) {
                success({});
            }

            cognitoUser.signOut();
            success({});
        });
    }

    async createCredentialsProvider() {
        const token = await this.getAccessToken();
        const loginKey = `cognito-idp.${this.region}.amazonaws.com/${this.userPoolId}`
        const params = {
            clientConfig: {region: this.region},
            identityPoolId: "eu-central-1:18e707e3-9a9c-46fe-94e8-69bafb759871",
            logins: {
                [loginKey]: token
            }
        };

        return fromCognitoIdentityPool(params);
    }
    
    async getCredentials() {
        return (await this.createCredentialsProvider())();
    }
}
