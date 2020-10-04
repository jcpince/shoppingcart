import { APIGatewayTokenAuthorizerEvent, APIGatewayAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { decode, JwtHeader, verify } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
const jwksClient = require('jwks-rsa');

const client = jwksClient({
  cache: true, // Default Value
  cacheMaxEntries: 5, // Default value
  cacheMaxAge: 10000, // Defaults to 10s
  jwksUri: 'https://dev-sey0m6-p.eu.auth0.com/.well-known/jwks.json'
});

export interface JwtPayload {
  iss: string
  sub: string
  iat: number
  exp: number
}

export interface Jwt {
  header: JwtHeader
  payload: JwtPayload
}

async function verifySignature(id_token, done): Promise<JwtPayload> {

  const jwt: Jwt = decode(id_token.split(' ')[1], { complete: true }) as Jwt
  
  // console.log("id_token: " + JSON.stringify(id_token))
  // console.log("JwtHeader: " + JSON.stringify(jwt))
  // console.log("kid: " + jwt.header.kid)

  client.getSigningKey(jwt.header.kid, (err, key) => {
    if (err) {
      console.error(err)
    } else {
      var signingKey = key.publicKey || key.rsaPublicKey;
      verify(id_token, signingKey, function (err, userInfo) {
        if (done) done(err, userInfo);
      });
    }
  });
  return jwt.payload
 }

const logger = createLogger("Auth");

export const handler = async (
  event: APIGatewayTokenAuthorizerEvent
): Promise<APIGatewayAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  var effect : string = 'Deny'
  var principalId : string = 'user'
  try {
    const jwtPayload = await verifySignature(event.authorizationToken, null);
    logger.info('User authorized')
    effect = 'Allow'
    principalId = jwtPayload.sub
  } catch (e) {
    logger.error('User not authorized', { error: e.message })
  }
  return {
    principalId: principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: '*'
        }
      ]
    }
  }
}