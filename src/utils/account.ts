const { v2, auth } = require('osu-api-extended')
import {User} from "../db/models/user"


const genAuthLink = (id) => {
    const SCOPE_LIST = ['public', "identify", "friends.read"];
    
    const url = auth.build_url('23483', 'https://okio.su/auth/osu/callback', SCOPE_LIST, `${id}`);
    //LISEK mimo
    return {osu: url, lisek: `https://lisek.world/oauth2/authorize?client_id=5&redirect_uri=https://oki.nyako.tk/auth/lisek/callback&response_type=code&scope=openid+profile+email&state=${id}`};
};

const isAuthorized = async (id) => {
    const doc = await User.findOne({tgId: id})
    //console.log(doc)
    return doc ? true : false
};

export {genAuthLink, isAuthorized}
