const _ = require('lodash')

const {
  DynamoDBDocument
} = require('@aws-sdk/lib-dynamodb');

const {
  DynamoDB
} = require('@aws-sdk/client-dynamodb');

const DocumentClient = DynamoDBDocument.from(new DynamoDB())

const { USERS_TABLE } = process.env

const getUserByScreenName = async (screenName) => {
  const resp = await DocumentClient.query({
    TableName: USERS_TABLE,
    KeyConditionExpression: 'screenName = :screenName',
    ExpressionAttributeValues: {
      ':screenName': screenName
    },
    IndexName: 'byScreenName',
    Limit: 1
  })

  return _.get(resp, 'Items.0')
}

module.exports = {
  getUserByScreenName
}
