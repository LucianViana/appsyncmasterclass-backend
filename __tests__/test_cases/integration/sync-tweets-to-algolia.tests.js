const given = require('../../steps/given')
const when = require('../../steps/when')
const then = require('../../steps/then')
const chance = require('chance').Chance()

describe('When syncTweetsToAlgolia runs', () => {
  beforeAll(async () => {
    const event = require('../../data/tweets_to_algolia.json')
    await when.we_tweets_to_algolia(event)
  }, 30000)          
  it("The syncTweetsToAlgolia send data", async () => {
    // const { name, email } = given.a_random_user()
    // const username = chance.guid()

    // await when.we_tweets_to_algolia()

    // const ddbUser = await then.user_exists_in_UsersTable(username)
    // expect(ddbUser).toMatchObject({
    //   id: username,
    //   name,
    //   createdAt: expect.stringMatching(/\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d(?:\.\d+)?Z?/g),
    //   followersCount: 0,
    //   followingCount: 0,
    //   tweetsCount: 0,
    //   likesCounts: 0
    })

    // const [firstName, lastName] = name.split(' ')
    // expect(ddbUser.screenName).toContain(firstName)
    // expect(ddbUser.screenName).toContain(lastName)
//  })
})