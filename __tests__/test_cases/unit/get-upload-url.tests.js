require('dotenv').config()
const when = require('../../steps/when')
const chance = require('chance').Chance()

describe('When getImageUploadUrl runs', () => {
  it.each([
    [ '.png', 'image/png' ],
    [ '.jpeg', 'image/jpeg' ],
    [ '.png', null ],
    [ null, 'image/png' ],
    [ null, null ],
  ])('Returns a signed S3 url for extension %s and content type %s', async (extension, contentType) => {
    // const username = chance.guid()
    // const signedUrl = await when.we_invoke_getImageUploadUrl(username, extension, contentType)

    // const { BUCKET_NAME } = process.env
    // const regex = new RegExp(`https://${BUCKET_NAME}.s3-accelerate.amazonaws.com/${username}/.*${extension || ''}\?.*Content-Type=${contentType ? contentType.replace('/', '%2F') : 'image%2Fjpeg'}.*`)    
    // //https://appsyncmasterclass-backend-dev-yan10-assetsbucket-1q7c5cwq4njwz.s3-accelerate.amazonaws.com/d9d14c11-af76-4d4f-8309-db4d85b4e11a/01HHF586GXHGG56QPWRXYXPPNC.jpg
    // expect(signedUrl).toMatch(regex)
  })
})