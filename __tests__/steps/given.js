require('dotenv').config()
const AWS = require('aws-sdk')
require('aws-sdk/lib/maintenance_mode_message').suppress = true;
const crypto = require('crypto');
const clientSecret = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
const DocumentClient = new AWS.DynamoDB.DocumentClient()
const chance = require('chance').Chance()
const velocityUtil = require('amplify-appsync-simulator/lib/velocity/util')

const { RELATIONSHIPS_TABLE } = process.env

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
 //  const password  = "aardvark"     
 //  const name   = "2a6fa7bf-ac3a-4afe-b44e-b15e98414063"
 //  const email  = "luciano.souzaviana2@gmail.com" //given.a_random_user()

  const cognito = new AWS.CognitoIdentityServiceProvider()

  const userPoolId = process.env.COGNITO_USER_POOL_ID
  const clientId = process.env.WEB_COGNITO_USER_POOL_CLIENT_ID

  // const signUpResp = await cognito.signUp({
  //   ClientId: clientId,
  //   Username: email,
  //   Password: password,
  //   UserAttributes: [
  //     { Name: 'name', Value: name }
  //   ]
  // }).promise()

   const params = {
     UserPoolId: userPoolId,
     Username: email,
     UserAttributes: [{
         Name: 'email',
         Value: email
       },
       {
         Name: 'email_verified',
         Value: 'true'
       }
     ],
     MessageAction: 'SUPPRESS'
   }

  //const response = await cognito.adminCreateUser(params).promise();
  const signUpResp = await cognito.adminCreateUser(params).promise();

  //const username = signUpResp.UserSub
  const user = signUpResp.User
  const username = user.Username
  console.log(`[${email}] - user has signed up [${username}]`)

  // await cognito.adminConfirmSignUp({
  //   UserPoolId: userPoolId,
  //   Username: username
  // }).promise()

  // const paramsForSetPass = {
  //   Password: password,
  //   UserPoolId: userPoolId,
  //   Username: email,
  //   Permanent: true
  // };

  // const responseSetUserPassword = await cognito.adminSetUserPassword(paramsForSetPass).promise()


  // console.log(`[${email}] - confirmed set user password`)
  // console.log(`[${email}] - confirmed sign up`)

  // const auth = await cognito.initiateAuth({
  //   AuthFlow: 'USER_PASSWORD_AUTH',
  //   ClientId: clientId,
  //   AuthParameters: {
  //     USERNAME: username,
  //     PASSWORD: password
  //   }
  // }).promise()
	try {
  const responseSetUserPassword = await cognito.adminSetUserPassword({
    UserPoolId: userPoolId,
    Username: username,
    Password: password,
    Permanent: true
  }).promise();

  const payload = { 
    UserPoolId: userPoolId,
    ClientId: clientId,
    AuthFlow: "ADMIN_NO_SRP_AUTH",
    AuthParameters: {
      USERNAME: username,
      PASSWORD: password,
      SECRET_HASH:  crypto.createHmac('sha256', clientSecret).update(username + clientId).digest('base64')
    }
  }
  const auth = await cognito.adminInitiateAuth(payload).promise();

  // const paramsAdminAuth = {
  //   AuthFlow: "ADMIN_NO_SRP_AUTH",
  //   UserPoolId: userPoolId,
  //   ClientId: clientId,
  //   AuthParameters: {
  //     USERNAME: email,
  //     PASSWORD: password
  //   }
  // }
  // const responseInitiateAuth = await cognito.adminInitiateAuth(paramsAdminAuth).promise();

  // console.log(`[${email}] - signed in`)
  }
	catch (err) {
		 console.log(err);
		if (err.code == 'UsernameExistsException') {

		} else if (err.code == 'InvalidPasswordException') {

		} else {

		}
	}
  return {
    username,
    name,
    email,
    idToken: auth.AuthenticationResult.IdToken,
    accessToken: auth.AuthenticationResult.AccessToken
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