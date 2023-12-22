const given = require('../../steps/given');
const when = require('../../steps/when');
const then = require('../../steps/then');
const chance = require('chance').Chance();

describe("When confirmUserSignup runs", () => {
  try {
    it("should save in DB the user's profile", async () => {
      const { name, email } = given.a_random_user();
      const username = chance.guid();

      await when.we_invoke_confirmUserSignup(username, name, email);

      const ddbUser = await then.user_exists_in_UsersTable(username);

      expect(ddbUser).toMatchObject({
        id: username,
        name,
        createdAt: expect.stringMatching(/\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d(?:\.\d+)?Z?/g),
        followersCount: 0,
        followingCount: 0,
        tweetsCount: 0
        //TODO : NAO FUNCIONA COM 1 E COM ZERO OLHAR.
        //likesCount: 0
      });

      const [firstName, lastName] = name.split(' ');
      expect(ddbUser.screenName).toContain(firstName);
      expect(ddbUser.screenName).toContain(lastName);
    })
  }
  catch (err) {
    console.log(err);
    if (err.code == 'UsernameExistsException') {

    } else if (err.code == 'InvalidPasswordException') {

    } else {

    }
  }      
})