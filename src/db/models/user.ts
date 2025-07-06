const mongoose = require("mongoose");

const User = mongoose.model(
    "User",
    new mongoose.Schema({
    tgId: Number,
    osuId: Number,
    /*lisekId: Number,
    lisekPrefer: Boolean,*/
    osuThings: {
        access_token: String,
        refresh_token: String
    },
    liked: {
        type: Array,
        default: []
    },
    isDonator: {
        type: Boolean,
        default: false
    },
    lastRenderedTime: {
        type: Number,
        default: 0
    },
    settings: {
        lang: {
            type: String,
            enum: ["ru", "en", "ua", "es"],
            default: "ru"
        },
        useLegacyCards: {
            type: Boolean,
            default: false
        },
        useLaser: {
            type: Boolean,
            default: false
        },
        userCardColor: {
            type: String,
            default: "default"
        },
        customBg: {
            type: String,
            default: ""
        },
        lastUpdatedPP: {
            type: Number,
            default: 0
        },
        rendering: {
            paralax: {
                type: Boolean,
                default: false
            },
            showPPCounter: {
                type: Boolean,
                default: true
            },
            showStoryboard: {
                type: Boolean,
                default: true
            },
            hiRes: {
                type: Boolean,
                default: false
            },
            skin: {
                type: String,
                default: "whitecatCK2.0"
            },
            donatorSkin: {
                type: String,
                default: ""
            },
            video: {
                type: Boolean,
                default: false
            },
            skipIntro: {
                type: Boolean,
                default: false
            },
            flashToTheBeat: {
                type: Boolean,
                default: false
            },
            scaleToTheBeat: {
                type: Boolean,
                default: false
            },
            

        }
    }
  }, { autoCreate: false })
);

export {User};
