var axios = require("axios")

async function getBuffer(url) {
    const archive = await axios({
          method: 'get',
          url: url,
          responseType: 'buffer'
      })
          .then(async (res : any) => {
        return res.data
      })
      return archive
  }

export {getBuffer}