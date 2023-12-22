const AWS = require('aws-sdk')

const {
  DynamoDBDocument,
} = require('@aws-sdk/lib-dynamodb');

const {
  DynamoDB,
} = require('@aws-sdk/client-dynamodb');

// JS SDK v3 does not support global configuration.
// Codemod has attempted to pass values to each service client in this file.
// You may need to update clients outside of this file, if they use global config.
AWS.config.region = 'eu-west-1'
const DynamoDB = DynamoDBDocument.from(new DynamoDB())

const { resolve } = require('path')
require('dotenv').config({
  path: resolve(__dirname, '../.env'),
})

const run = async () => {
  const loop = async (exclusiveStartKey) => {
    const resp = await DynamoDB.scan({
      TableName: process.env.TWEETS_TABLE,
      ExclusiveStartKey: exclusiveStartKey,
      Limit: 100
    })

    const promises = resp.Items.map(async x => {
      await DynamoDB.update({
        TableName: process.env.TWEETS_TABLE,
        Key: {
          id: x.id
        },
        UpdateExpression: "SET lastUpdated = :now",
        ExpressionAttributeValues: {
          ":now": new Date().toJSON()
        }
      })
    })
    await Promise.all(promises)

    if (resp.LastEvaluatedKey) {
      return await loop(resp.LastEvaluatedKey)
    }
  }

  await loop()
}

run().then(x => console.log('all done'))
