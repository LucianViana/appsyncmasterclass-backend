require('dotenv').config()
/******NAO FUNCIONA COM CODIGO AWS-SDK V3 ESTUDAR******/
const AWS = require('aws-sdk')
require('aws-sdk/lib/maintenance_mode_message').suppress = true;
const DocumentClient = new AWS.DynamoDB.DocumentClient()
const chance = require('chance').Chance()
const velocityUtil = require('amplify-appsync-simulator/lib/velocity/util')

const { RELATIONSHIPS_TABLE } = process.env
const when = require('./when');
const then = require('./then');

const a_random_user = () => {
  const firstName = chance.first({ nationality: 'en' })
  const lastName = chance.first({ nationality: 'en' })
  const suffix = chance.string({ length: 4, pool: 'abcdefghijklmnopqrstuvwxyz' })
  const name = `${firstName} ${lastName} ${suffix}`
  const password = chance.string({ length: 8 })
  const email = `${firstName}-${lastName}-${suffix}@appsyncmasterclass.com`

  return {
    name,
    password,
    email
  }
}

const an_appsync_context = (identity, args, result, source, info, prev) => {
  const util = velocityUtil.create([], new Date(), Object())
  const context = {
    identity,
    args,
    arguments: args,
    result,
    source,
    info,
    prev
  }
  return {
    context,
    ctx: context,
    util,
    utils: util
  }
}

const an_authenticated_user = async () => {
  const { name, email, password } = a_random_user()
  const cognito = new AWS.CognitoIdentityServiceProvider()
  const userPoolId = process.env.COGNITO_USER_POOL_ID
  const clientId = process.env.WEB_COGNITO_USER_POOL_CLIENT_ID
	try {
      const params = {
        UserPoolId: userPoolId,
        Username: email,
        MessageAction: 'SUPPRESS',
        UserAttributes: [
          {
            Name: 'name',
            Value: name,
          },
          {
            Name: 'email',
            Value: email
          },
          {
            Name: 'email_verified',
            Value: 'true'
          }
        ],
        ClientMetadata: {
          ClientId: clientId,
        },
        TemporaryPassword: 'Password-1Password-1'
      }

      const signUpResp = await cognito.adminCreateUser(params).promise();
      const user = signUpResp.User
      const username = user.Username
      console.log(`[${email}] - user has signed up [${username}]`)
      const payload = { 
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: clientId,    
        AuthParameters: {
          USERNAME: username,
          PASSWORD: 'Password-1Password-1'
        }
      }
      const auth = await cognito.initiateAuth(payload).promise();

      const challengeResp = await cognito
            .respondToAuthChallenge({
              ChallengeName: 'NEW_PASSWORD_REQUIRED',
              Session: auth.Session,
              ChallengeResponses: {
                USERNAME: username,
                NEW_PASSWORD: password,
              },
              ClientId: clientId,          
            })
            .promise()

      console.log( challengeResp + `challengeResp - user has signed up [${username}]`)

      const insertUsersTable =  await when.we_invoke_confirmUserSignup(username, name, email);
      const ddbUser = await then.user_exists_in_UsersTable(username);
       console.log( ddbUser + `insertUsersTable - user has signed up [${username}]`)
            
    return {
      username,
      name,
      email,
      idToken: challengeResp.AuthenticationResult.IdToken,
      accessToken: challengeResp.AuthenticationResult.AccessToken
    }
  }
  catch (err) {
    console.log(err);
    if (err.code == 'UsernameExistsException') {

    } else if (err.code == 'InvalidPasswordException') {

    } else {

    }
  }  
}

const a_user_follows_another = async (userId, otherUserId) => {
  await DocumentClient.put({
    TableName: RELATIONSHIPS_TABLE,
    Item: {
      userId,
      sk: `FOLLOWS_${otherUserId}`,
      otherUserId,
      createdAt: new Date().toJSON()
    }
  }).promise()
}

module.exports = {
  a_random_user,
  an_appsync_context,
  an_authenticated_user,
  a_user_follows_another,
}