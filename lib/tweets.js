const {
  DynamoDBDocument
} = require('@aws-sdk/lib-dynamodb');

const {
  DynamoDB
} = require('@aws-sdk/client-dynamodb');

const DocumentClient = DynamoDBDocument.from(new DynamoDB())
const { TweetTypes } = require('../lib/constants')

const { TWEETS_TABLE } = process.env

const getTweetById = async (tweetId) => {
  const resp = await DocumentClient.get({
    TableName: TWEETS_TABLE,
    Key: {
      id: tweetId
    }
  })

  return resp.Item
}

module.exports = {
  getTweetById
}