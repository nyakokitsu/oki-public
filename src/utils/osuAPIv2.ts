const { v1, v2, auth } = require('osu-api-extended')
const axios = require("axios")


const fetchUserInfo = async (id) => {
    const user = await v2.user.details(id)
    return user
}

const fetchScore = async (user_id: String, beatmap: Number) => {
    const score = await v2.scores.user.beatmap(beatmap, user_id, {best_only: false})
    return score
}

const fetchBmByStarrate = async (starrate: String) => {
    const bm = await v2.beatmaps.search({
        query: starrate,
        mode: 'osu'
    })
    return bm.beatmapsets[0].id
}

const fetchScoreById = async (score_id, mode) => {
    const score = await v2.scores.details(score_id, mode)
    return score
}

const fetchRecentScore = async (user_id) => {
    const score = await v2.scores.user.category(user_id, "recent", {include_fails: true, limit: 1})
    return score
}

const fetchBestScore = async (user_id) => {
    const score = await v2.scores.user.category(user_id, "best", {include_fails: true, limit: 1})
    return score
}

const fetchBestScores = async (user_id) => {
    const score = await v2.scores.user.category(user_id, "best", {include_fails: false, limit: 5})
    return score
}

const fetchRecentScores = async (user_id) => {
    const score = await v2.scores.user.category(user_id, "recent", {include_fails: false, limit: 5})
    return score
}

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
  }

const fetchLazerUser = async (id) => {
    const token = await authClient()
    const { data } = await axios(`https://lazer.ppy.sh/api/v2/users/${id}`, {
    method: 'GET',
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token['access_token']
    }
  });
    return data
}


async function authClient () {
    return await auth.login('23483', 'TOKENREMOVED', ["public"])
}

async function main() {
    await authClient()
}
main()




export {fetchUserInfo, fetchScore, fetchScoreById, fetchBmByStarrate, fetchRecentScore, fetchBestScore, fetchBestScores, fetchRecentScores};

