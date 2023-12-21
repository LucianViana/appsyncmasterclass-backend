const middy = require('@middy/core')
const ssm = require('@middy/ssm')
const { initTweetsIndex } = require('../lib/algolia')
const { TweetTypes } = require('../lib/constants')

const { STAGE } = process.env
const { unmarshall } = require("@aws-sdk/util-dynamodb");
module.exports.handler = middy(async (event, context) => {
  try {  
    const index = await initTweetsIndex(
      context.ALGOLIA_APP_ID, context.ALGOLIA_WRITE_KEY, STAGE)

    for (const record of event.Records) {
      if (record.eventName === 'INSERT' || record.eventName === 'MODIFY') {
        const tweet = unmarshall(record.dynamodb.NewImage)

        if (tweet.__typename === TweetTypes.RETWEET) {
          continue
        }
        
        tweet.objectID = tweet.id

        await index.saveObjects([tweet])
      } else if (record.eventName === 'REMOVE') {
        const tweet = unmarshall(record.dynamodb.OldImage)

        if (tweet.__typename === TweetTypes.RETWEET) {
          continue
        }

        await index.deleteObjects([tweet.id])
      }
    }
  }
  catch (err) {
    console.log(err);
  }    
}).use(ssm({
  cache: true,
  cacheExpiryInMillis: 5 * 60 * 1000, // 5 mins
  names: {
    ALGOLIA_APP_ID: `/${STAGE}/algolia-app-id`,
    ALGOLIA_WRITE_KEY: `/${STAGE}/algolia-admin-key`
  },
  setToContext: true,
  throwOnFailedCall: true
}))
