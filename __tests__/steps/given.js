require('dotenv').config()
const AWS = require('aws-sdk')
require('aws-sdk/lib/maintenance_mode_message').suppress = true;
const DocumentClient = new AWS.DynamoDB.DocumentClient()
const chance = require('chance').Chance()
const velocityUtil = require('amplify-appsync-simulator/lib/velocity/util')

const { RELATIONSHIPS_TABLE } = process.env
const when = require('./when');

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

      console.log(challengeResp + `incluir - user has signed up [${username}]`)

            // it("should save in DB the user's profile", async () => {
            //   const { name, email } = given.a_random_user();
            //   const username = chance.guid();
        
      insertUsersTable =  await when.we_invoke_confirmUserSignup(username, name, email);
      
      console.log(insertUsersTable + `incluir - user has signed up [${username}]`)
              // const ddbUser = await then.user_exists_in_UsersTable(username);
        
              // expect(ddbUser).toMatchObject({
              //   id: username,
              //   name,
              //   createdAt: expect.stringMatching(/\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d(?:\.\d+)?Z?/g),
              //   followersCount: 0,
              //   followingCount: 0,
              //   tweetsCount: 0
              //   //TODO : NAO FUNCIONA COM 1 E COM ZERO OLHAR.
              //   //likesCount: 0
              // });
        
              // const [firstName, lastName] = name.split(' ');
              // expect(ddbUser.screenName).toContain(firstName);
              // expect(ddbUser.screenName).toContain(lastName);
            // })

            
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